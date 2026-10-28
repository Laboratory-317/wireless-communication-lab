import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("sync_scholar", Path(__file__).with_name("sync-scholar.py"))
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)

PROFILE = '''<div id="gsc_prf_in">Researcher</div><table><tr class="gsc_a_tr">
<td><a class="gsc_a_at" href="/citations?user=author&amp;citation_for_view=author:paper">A &amp; B: test</a>
<div class="gs_gray">A Author, B Author</div><div class="gs_gray">Journal 5 (2), 1-8</div></td>
<td class="gsc_a_y"><span>2026</span></td></tr></table>'''
ARCHIVE = '# Publications\n\n## All publications\n\n### 2025\n\n- **Existing.** Author. 2025.\n'
METADATA = {'title': ['A & B: test'], 'type': 'journal-article', 'DOI': '10.1234/test',
            'published': {'date-parts': [[2026]]}, 'container-title': ['Journal'],
            'author': [{'given': 'A', 'family': 'Author'}, {'given': 'B', 'family': 'Author'}],
            'volume': '5', 'issue': '2', 'page': '1-8'}


def paper_metadata():
    return sync.verified_metadata(sync.parse_profile(PROFILE, 'author')[0], [METADATA])


class SyncTests(unittest.TestCase):
    def test_parse_entities_and_reject_other_profile(self):
        paper = sync.parse_profile(PROFILE, "author")[0]
        self.assertEqual(paper["title"], "A & B: test")
        self.assertEqual(paper["year"], "2026")
        with self.assertRaises(ValueError):
            sync.parse_profile(PROFILE, "other")

    def test_captcha_and_changed_markup_fail_closed(self):
        for page in ['<html>CAPTCHA</html>', '<div id="gsc_prf_in">Researcher</div>']:
            with self.assertRaises(ValueError):
                sync.parse_profile(page, "author")

    def test_idempotent_merge_shared_article_and_year_order(self):
        paper = paper_metadata()
        updated, count = sync.merge_document(ARCHIVE, [paper, paper])
        self.assertEqual(count, 1)
        self.assertLess(updated.index('### 2026'), updated.index('### 2025'))
        self.assertIn('- **Existing.** Author. 2025.', updated)
        again, count = sync.merge_document(updated, [paper])
        self.assertEqual((again, count), (updated, 0))

    def test_remote_markup_escaped(self):
        paper = paper_metadata()
        paper['title'] = '<script> [link](bad) **test**'
        updated, _ = sync.merge_document(ARCHIVE, [paper])
        self.assertNotIn('<script>', updated)
        self.assertIn(r'\[link\]', updated)
        self.assertEqual(sync.merge_document(updated, [paper]), (updated, 0))

    def test_robots_longest_match_and_pagination(self):
        robots = 'User-agent: *\nDisallow: /citations?\nAllow: /citations?user=\nDisallow: /citations?*cstart=\n'
        self.assertTrue(sync.robots_allowed(robots, sync.ORIGIN + '/citations?user=author&pagesize=100'))
        self.assertFalse(sync.robots_allowed(robots, sync.ORIGIN + '/citations?user=author&cstart=100'))
        self.assertFalse(sync.robots_allowed(robots, sync.ORIGIN + '/citations?view_op=view_citation'))

    def test_second_profile_failure_preserves_all_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'tools').mkdir()
            config = {'min_year': 2026, 'profiles': [{'name': 'A', 'id': 'author'}, {'name': 'B', 'id': 'other'}],
                      'publication_files': ['ru.md', 'en.md']}
            (root / 'tools/scholar-profiles.json').write_text(json.dumps(config))
            for name in config['publication_files']:
                (root / name).write_bytes(ARCHIVE.encode())
            with patch.object(sync, 'fetch', side_effect=['User-agent: *\nAllow: /', PROFILE, RuntimeError('403')]), patch.object(sync.time, 'sleep'):
                with self.assertRaises(RuntimeError):
                    sync.run(root)
            for name in config['publication_files']:
                self.assertEqual((root / name).read_bytes(), ARCHIVE.encode())

    def test_success_updates_four_archives_once_and_respects_min_year(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'tools').mkdir()
            files = ['ru.md', 'en.md', 'ru.qmd', 'en.qmd']
            config = {'min_year': 2026, 'profiles': [{'name': 'A', 'id': 'author'}],
                      'publication_files': files}
            (root / 'tools/scholar-profiles.json').write_text(json.dumps(config))
            for name in files:
                (root / name).write_text(ARCHIVE, encoding='utf-8')
            for year, expected in [('2025', 0), ('2026', 1), ('2026', 1)]:
                page = PROFILE.replace('2026', year)
                with patch.object(sync, 'fetch', side_effect=['User-agent: *\nAllow: /', page]), patch.object(sync, 'crossref_lookup', return_value=[METADATA]):
                    sync.run(root)
                for name in files:
                    text = (root / name).read_text(encoding='utf-8')
                    self.assertEqual(text.count('A &amp; B: test'), expected)

    def test_site_bibliography_format_and_article_number(self):
        paper = paper_metadata()
        self.assertEqual(sync.render_publication(paper),
                         '- **A &amp; B: test.** A Author, B Author. *Journal*, vol. 5, no. 2, pp. 1–8. 2026. [DOI](https://doi.org/10.1234/test)\n')
        paper['article_number'] = 'e70606'
        paper['title'] = 'Why?'
        line = sync.render_publication(paper)
        self.assertIn('**Why?**', line)
        self.assertIn('no. 2, e70606.', line)
        self.assertNotIn('pp.', line)
        paper['authors'] = 'A Author, ...'
        with self.assertRaises(ValueError):
            sync.render_publication(paper)

    def test_wrong_or_ambiguous_metadata_is_not_accepted(self):
        candidate = sync.parse_profile(PROFILE, 'author')[0]
        for change in [{'title': ['Different title']}, {'author': [{'given': 'X', 'family': 'Other'}]},
                       {'author': [{'family': 'Author'}]}, {'DOI': ''},
                       {'published': {'date-parts': [[2025]]}}]:
            self.assertIsNone(sync.verified_metadata(candidate, [{**METADATA, **change}]))
        self.assertIsNone(sync.verified_metadata(candidate, [METADATA, {**METADATA, 'DOI': '10.1234/other'}]))

    def test_unverified_raw_import_goes_to_pending_without_public_addition(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'tools').mkdir()
            candidate = sync.parse_profile(PROFILE, 'author')[0]
            raw = '- **A & B: test.** A Author, .... *Journal 5 (2), 1-8, 2026*. 2026. [Google Scholar](' + candidate['link'] + ')\n'
            document = ARCHIVE + raw
            (root / 'en.md').write_text(document, encoding='utf-8')
            config = {'min_year': 2026, 'profiles': [{'name': 'A', 'id': 'author'}], 'publication_files': ['en.md']}
            (root / 'tools/scholar-profiles.json').write_text(json.dumps(config))
            with patch.object(sync, 'fetch', side_effect=['User-agent: *\nAllow: /', PROFILE]), patch.object(sync, 'crossref_lookup', return_value=[]):
                sync.run(root)
            self.assertEqual((root / 'en.md').read_text(encoding='utf-8'), ARCHIVE)
            pending = json.loads((root / 'data/scholar-pending.json').read_text(encoding='utf-8'))
            self.assertEqual(pending[0]['title'], candidate['title'])

    def test_crossref_failure_after_one_verified_candidate_writes_nothing(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'tools').mkdir()
            config = {'min_year': 2026, 'profiles': [{'name': 'A', 'id': 'author'}], 'publication_files': ['en.md']}
            (root / 'tools/scholar-profiles.json').write_text(json.dumps(config))
            (root / 'en.md').write_bytes(ARCHIVE.encode())
            second = PROFILE.replace('A &amp; B: test', 'Another title').replace('author:paper', 'author:paper2')
            with patch.object(sync, 'fetch', side_effect=['User-agent: *\nAllow: /', PROFILE + second]), patch.object(sync, 'crossref_lookup', side_effect=[[METADATA], RuntimeError('Crossref unavailable')]):
                with self.assertRaises(RuntimeError):
                    sync.run(root)
            self.assertEqual((root / 'en.md').read_bytes(), ARCHIVE.encode())
            self.assertFalse((root / 'data/scholar-pending.json').exists())


if __name__ == '__main__':
    unittest.main()
