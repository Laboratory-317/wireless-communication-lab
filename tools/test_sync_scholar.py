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
        paper = sync.parse_profile(PROFILE, "author")[0]
        updated, count = sync.merge_document(ARCHIVE, [paper, paper])
        self.assertEqual(count, 1)
        self.assertLess(updated.index('### 2026'), updated.index('### 2025'))
        self.assertIn('- **Existing.** Author. 2025.', updated)
        again, count = sync.merge_document(updated, [paper])
        self.assertEqual((again, count), (updated, 0))

    def test_remote_markup_escaped(self):
        paper = sync.parse_profile(PROFILE, "author")[0]
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
                with patch.object(sync, 'fetch', side_effect=['User-agent: *\nAllow: /', page]):
                    sync.run(root)
                for name in files:
                    text = (root / name).read_text(encoding='utf-8')
                    self.assertEqual(text.count('A &amp; B: test'), expected)


if __name__ == '__main__':
    unittest.main()
