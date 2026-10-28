import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from urllib.error import HTTPError

from publication_sources import MetadataHTML, SourceClient, SourceError, metadata_records, verified_html, resolve_sources
from test_sync_scholar import sync, ARCHIVE

CANDIDATE = {'title': 'Проверка метаданных', 'authors': 'ИП Иванов, ПП Петров, ...',
             'year': '2026', 'venue': 'Научный журнал 20 (8), 18-26, 2026'}
CARD = '''<html><head>
<meta name="citation_title" content="Проверка метаданных">
<meta name="citation_author" content="Иван Петрович Иванов">
<meta name="citation_author" content="Пётр Петрович Петров">
<meta name="citation_author" content="Анна Андреевна Сидорова">
<meta name="citation_journal_title" content="Научный журнал">
<meta name="citation_publication_date" content="2026/08/01">
<meta name="citation_volume" content="20"><meta name="citation_issue" content="8">
<meta name="citation_firstpage" content="18"><meta name="citation_lastpage" content="26">
</head></html>'''
URL = 'https://journal.example/article/1'
ELIBRARY = 'https://elibrary.ru/item.asp?id=123456'


class FakeClient:
    def __init__(self, pages):
        self.pages = pages

    def allowed(self, url):
        return url.startswith(('https://journal.example/', 'https://elibrary.ru/'))

    def get(self, url):
        result = self.pages[url]
        if isinstance(result, Exception):
            raise result
        return result


class SourcesTests(unittest.TestCase):
    def test_publisher_and_elibrary_metadata_without_doi(self):
        for url in (URL, ELIBRARY):
            record = verified_html(CANDIDATE, CARD, url)
            self.assertEqual(record['pages'], '18–26')
            self.assertEqual(record['doi'], '')
            ru = sync.render_publication(record, 'ru')
            en = sync.render_publication(record, 'en')
            self.assertIn(f'[Источник]({url})', ru)
            self.assertIn(f'[Source]({url})', en)
            self.assertIn('*Научный журнал*, vol. 20, no. 8, pp. 18–26. 2026.', ru)
            self.assertNotIn('[DOI]', ru)
            updated, count = sync.merge_document(ARCHIVE, [record, record])
            self.assertEqual(count, 1)
            self.assertEqual(sync.merge_document(updated, [record]), (updated, 0))

    def test_partial_or_wrong_metadata_is_rejected(self):
        for bad in (CARD.replace('2026/08/01', '2025/08/01'),
                    CARD.replace('Проверка метаданных', 'Другая статья'),
                    CARD.replace('Иван Петрович Иванов', 'Другой Автор'),
                    CARD.replace('Анна Андреевна Сидорова', 'и др.'),
                    CARD.replace('citation_firstpage', 'unknown').replace('citation_lastpage', 'unknown'),
                    CARD.replace('Научный журнал', 'Другой журнал')):
            self.assertIsNone(verified_html(CANDIDATE, bad, URL))
        self.assertIsNone(verified_html(CANDIDATE, '<title>CAPTCHA</title>', ELIBRARY))

    def test_doi_normalization_and_no_fake_article_number(self):
        page = CARD.replace('</head>', '<meta name="citation_doi" content="https://doi.org/10.1234/ABC"></head>')
        record = verified_html(CANDIDATE, page, URL)
        self.assertEqual(record['doi'], '10.1234/abc')
        self.assertEqual(record['article_number'], '')
        self.assertIn('[DOI](https://doi.org/10.1234/abc)', sync.render_publication(record))

    def test_publisher_search_then_elibrary_link(self):
        search = 'https://journal.example/search?q=%D0%9F%D1%80%D0%BE%D0%B2%D0%B5%D1%80%D0%BA%D0%B0%20%D0%BC%D0%B5%D1%82%D0%B0%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D1%85'
        config = {'publisher_searches': [{'venue': 'Научный журнал', 'url': 'https://journal.example/search?q={query}'}]}
        client = FakeClient({search: '<a href="/article/1">Проверка метаданных</a>',
                             URL: f'<a href="{ELIBRARY}">eLIBRARY</a>', ELIBRARY: CARD})
        record, attempts = resolve_sources(CANDIDATE, config, client)
        self.assertEqual(record['source_url'], ELIBRARY)
        self.assertEqual(attempts[-1]['status'], 'verified')

    def test_source_error_preserved_and_other_source_still_works(self):
        client = FakeClient({URL: CARD, ELIBRARY: SourceError('HTTP 403')})
        record, attempts = resolve_sources(CANDIDATE, {}, client, [ELIBRARY, URL])
        self.assertEqual(record['source_url'], URL)
        self.assertTrue(any(a.get('reason') == 'HTTP 403' for a in attempts))

    def test_conflicting_sources_are_queued(self):
        other = CARD.replace('content="26"', 'content="27"')
        record, attempts = resolve_sources(CANDIDATE, {}, FakeClient({URL: CARD, ELIBRARY: other}), [URL, ELIBRARY])
        self.assertIsNone(record)
        self.assertEqual(attempts[-1]['status'], 'conflicting_sources')

    def test_agreeing_sources_prefer_available_doi(self):
        with_doi = CARD.replace('</head>', '<meta name="citation_doi" content="10.1234/test"></head>')
        record, _ = resolve_sources(CANDIDATE, {}, FakeClient({URL: CARD, ELIBRARY: with_doi}), [URL, ELIBRARY])
        self.assertEqual(record['doi'], '10.1234/test')

    def test_unconfigured_private_and_non_https_sources_rejected(self):
        client = SourceClient(['journal.example'], sync.robots_allowed)
        for url in ('http://journal.example/article/1', 'https://127.0.0.1/a', 'https://other.example/a', 'https://user:pass@journal.example/a'):
            with self.assertRaises(SourceError):
                client.get(url)

    def test_robots_block_and_failed_requests_are_cached(self):
        client = SourceClient(['journal.example'], sync.robots_allowed)
        with patch.object(client, 'raw', return_value='User-agent: *\nDisallow: /article') as raw:
            for _ in range(2):
                with self.assertRaises(SourceError):
                    client.get(URL)
            self.assertEqual(raw.call_count, 1)
        client = SourceClient(['journal.example'], sync.robots_allowed)
        with patch.object(client, 'raw', side_effect=OSError('unavailable')) as raw:
            for _ in range(2):
                with self.assertRaises(SourceError):
                    client.get(URL)
            self.assertEqual(raw.call_count, 1)

    def test_jsonld_scholarly_article_without_doi(self):
        schema = {'@type': 'ScholarlyArticle', 'headline': CANDIDATE['title'], 'datePublished': '2026-08-01',
                  'author': [{'name': a} for a in ['Иван Петрович Иванов', 'Пётр Петрович Петров', 'Анна Сидорова']],
                  'pagination': '18-26', 'isPartOf': {'@type': 'Periodical', 'name': 'Научный журнал'}}
        page = '<script type="application/ld+json">' + json.dumps(schema) + '</script>'
        self.assertEqual(verified_html(CANDIDATE, page, URL)['venue'], 'Научный журнал')

    def test_full_sync_uses_source_when_crossref_is_unavailable(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'tools').mkdir()
            config = {'min_year': 2026, 'profiles': [{'name': 'A', 'id': 'author'}],
                      'publication_files': ['ru.md', 'en.md']}
            (root / 'tools/scholar-profiles.json').write_text(json.dumps(config))
            sources = {'articles': [{'title': CANDIDATE['title'], 'urls': [ELIBRARY]}]}
            (root / 'tools/publication-sources.json').write_text(json.dumps(sources))
            (root / 'ru.md').write_text(ARCHIVE.replace('All publications', 'Все публикации'), encoding='utf-8')
            (root / 'en.md').write_text(ARCHIVE, encoding='utf-8')
            with patch.object(sync, 'fetch', side_effect=['User-agent: *\nAllow: /', 'profile']), patch.object(sync, 'parse_profile', return_value=[CANDIDATE]), patch.object(sync, 'crossref_lookup', side_effect=OSError('503')), patch.object(sync, 'SourceClient', return_value=FakeClient({ELIBRARY: CARD})):
                sync.run(root)
            self.assertIn('[Источник]', (root / 'ru.md').read_text(encoding='utf-8'))
            self.assertIn('[Source]', (root / 'en.md').read_text(encoding='utf-8'))
            self.assertEqual(json.loads((root / 'data/scholar-pending.json').read_text()), [])

    def test_multilingual_author_tags_are_not_combined(self):
        translated = '''<meta name="citation_title" content="English title" xml:lang="en-US">
<meta name="citation_author" content="Ivan Ivanov" xml:lang="en-US">
<meta name="citation_author" content="Petr Petrov" xml:lang="en-US">
<meta name="citation_author" content="Anna Sidorova" xml:lang="en-US">'''
        page = CARD.replace('<meta name="citation_title"', '<meta xml:lang="ru-RU" name="citation_title"')
        page = page.replace('<meta name="citation_author"', '<meta xml:lang="ru-RU" name="citation_author"') + translated
        record = verified_html(CANDIDATE, page, URL)
        self.assertEqual(record['authors'].count(','), 2)
        self.assertNotIn('Ivan Ivanov', record['authors'])


if __name__ == '__main__':
    unittest.main()
