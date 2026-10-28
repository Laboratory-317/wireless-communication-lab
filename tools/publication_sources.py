"""Read public publisher/eLIBRARY metadata. Never infer bibliography from snippets."""
import html
from html.parser import HTMLParser
import json
import re
import time
import unicodedata
from urllib.error import HTTPError
from urllib.parse import urlsplit, urljoin, quote, parse_qs
from urllib.request import Request, urlopen, build_opener, HTTPRedirectHandler

AGENT = "Lab317PublicationSync/1.0 (+https://github.com/Laboratory-317/wireless-communication-lab)"


def norm(value):
    return ''.join(c for c in unicodedata.normalize('NFKC', value).casefold() if c.isalnum())


class SourceError(ValueError):
    pass


class MetadataHTML(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.meta, self.localized, self.links, self.schemas = {}, {}, [], []
        self.anchor = None
        self.schema = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'meta':
            key = (a.get('name') or a.get('property') or '').lower()
            if key and a.get('content'):
                self.meta.setdefault(key, []).append(a['content'].strip())
                language = (a.get('xml:lang') or a.get('lang') or '').lower()
                self.localized.setdefault(language, {}).setdefault(key, []).append(a['content'].strip())
        elif tag == 'a' and a.get('href'):
            self.anchor = [a['href'], []]
        elif tag == 'script' and a.get('type', '').lower() == 'application/ld+json':
            self.schema = []

    def handle_data(self, data):
        if self.anchor is not None:
            self.anchor[1].append(data)
        if self.schema is not None:
            self.schema.append(data)

    def handle_endtag(self, tag):
        if tag == 'a' and self.anchor is not None:
            self.links.append((self.anchor[0], ' '.join(''.join(self.anchor[1]).split())))
            self.anchor = None
        elif tag == 'script' and self.schema is not None:
            try:
                self.schemas.append(json.loads(''.join(self.schema)))
            except (ValueError, TypeError):
                pass
            self.schema = None


def clean(value):
    return ' '.join(html.unescape(re.sub(r'<[^>]*>', '', str(value))).split())


def metadata_records(document, url):
    """Keep independent metadata schemas separate; never splice conflicting authors."""
    parser = MetadataHTML()
    parser.feed(document)
    records = []
    for language, localized in parser.localized.items():
        if language and not any(k in localized for k in ('citation_title', 'prism.title')):
            continue
        # Neutral metadata are defaults, not a second language's author list.
        m = {**parser.localized.get('', {}), **localized}
        def first(*names):
            return next((clean(m[k][0]) for k in names if m.get(k)), '')
        first_page, last_page = first('citation_firstpage', 'prism.startingpage'), first('citation_lastpage', 'prism.endingpage')
        pages = first('citation_pages', 'prism.pagerange') or (first_page + ('–' + last_page if last_page and last_page != first_page else ''))
        records.append({
            'title': first('citation_title', 'prism.title'),
            'author_list': [clean(a) for a in m.get('citation_author', [])],
            'year': first('citation_publication_date', 'citation_date', 'prism.publicationdate'),
            'venue': first('citation_journal_title', 'citation_conference_title', 'prism.publicationname'),
            'volume': first('citation_volume', 'prism.volume'),
            'issue': first('citation_issue', 'prism.number'), 'pages': pages,
            'article_number': first('citation_article_number', 'citation_elocation_id'),
            'doi': first('citation_doi', 'prism.doi'), 'source_url': url,
        })
    def visit(node):
        if isinstance(node, list):
            for child in node:
                visit(child)
        elif isinstance(node, dict):
            types = node.get('@type', [])
            if isinstance(types, str):
                types = [types]
            if set(types) & {'ScholarlyArticle', 'Article'}:
                authors = node.get('author', [])
                if isinstance(authors, (dict, str)):
                    authors = [authors]
                authors = [clean(a.get('name', '')) if isinstance(a, dict) else clean(a) for a in authors]
                venue, volume, issue = '', '', ''
                parent = node.get('isPartOf', {})
                for _ in range(4):
                    if not isinstance(parent, dict):
                        break
                    if parent.get('@type') == 'PublicationIssue':
                        issue = str(parent.get('issueNumber', ''))
                    elif parent.get('@type') == 'PublicationVolume':
                        volume = str(parent.get('volumeNumber', ''))
                    elif parent.get('@type') in ('Periodical', 'Publication', 'Book'):
                        venue = clean(parent.get('name', ''))
                    parent = parent.get('isPartOf', {})
                start, end = str(node.get('pageStart', '')), str(node.get('pageEnd', ''))
                records.append({'title': clean(node.get('headline') or node.get('name', '')),
                                'author_list': authors, 'year': str(node.get('datePublished', '')),
                                'venue': venue, 'volume': volume, 'issue': issue,
                                'pages': str(node.get('pagination', '')) or start + ('–' + end if end and end != start else ''),
                                'article_number': str(node.get('articleNumber', '')), 'doi': '', 'source_url': url})
            # Only follow schema graphs, not cited articles/references.
            if '@graph' in node:
                visit(node['@graph'])
    for schema in parser.schemas:
        visit(schema)
    return records, parser.links


def verified_html(paper, document, url):
    records, _ = metadata_records(document, url)
    valid = []
    for record in records:
        if norm(record['title']) != norm(paper['title']):
            continue
        year = re.match(r'^(\d{4})(?:\D|$)', record['year'])
        if not year or year[1] != str(paper['year']):
            continue
        authors = record.pop('author_list')
        if not authors or any(not a or re.search(r'\.\.\.|…|\bet\s+al\b|и\s+др\b', a, re.I) for a in authors):
            continue
        # Require every visible Scholar author to occur, preserving order. Initials
        # can differ in spacing, but surnames must agree; no transliteration guesses.
        visible = [a.strip() for a in paper['authors'].split(',') if a.strip() and not re.fullmatch(r'[.\s…]+', a)]
        if len(authors) < len(visible):
            continue
        def compatible(a, b):
            tokens = [norm(t) for t in re.findall(r'[^\W\d_]+', a, re.U) if len(norm(t)) > 2]
            return bool(tokens) and any(t in norm(b) for t in tokens)
        if any(not compatible(a, b) for a, b in zip(visible, authors)):
            continue
        # HTML fallback needs a locator, so an abstract or journal homepage cannot
        # become a complete article solely by having a matching title.
        if not record['venue'] or not (record['pages'] or record['article_number']):
            continue
        if paper.get('venue') and norm(record['venue']) not in norm(paper['venue']):
            continue
        doi = re.sub(r'^(?:https?://(?:dx\.)?doi\.org/|doi:\s*)', '', record['doi'], flags=re.I).strip().lower()
        if doi and not re.fullmatch(r'10\.\d{4,9}/[^\s<>]+', doi):
            continue
        record.update(year=year[1], authors=', '.join(authors), doi=doi)
        valid.append(record)
    # Conflicting schemas are not resolved by arbitrarily taking the first one.
    signatures = {json.dumps({k: v for k, v in r.items() if k != 'source_url'}, sort_keys=True): r for r in valid}
    if len(signatures) > 1:
        raise SourceError('Conflicting bibliographic metadata on article page')
    return next(iter(signatures.values())) if signatures else None


class SourceClient:
    def __init__(self, hosts, robots_allowed, max_requests=20):
        self.hosts = set(hosts) | {'elibrary.ru', 'www.elibrary.ru'}
        self.robots_allowed = robots_allowed
        self.cache, self.robots, self.last = {}, {}, {}
        self.remaining = max_requests

    def allowed(self, url):
        p = urlsplit(url)
        return p.scheme == 'https' and p.hostname in self.hosts and p.port in (None, 443) and not p.username and not p.password

    def raw(self, url):
        if not self.allowed(url):
            raise SourceError('Source host is not configured or URL is not HTTPS')
        if self.remaining <= 0:
            raise SourceError('Source request budget exhausted')
        self.remaining -= 1
        host = urlsplit(url).hostname
        time.sleep(max(0, self.last.get(host, 0) + 2 - time.monotonic()))
        self.last[host] = time.monotonic()
        # Do not follow redirects to unconfigured hosts or login/challenge pages.
        client = self
        class Redirects(HTTPRedirectHandler):
            def redirect_request(self, req, fp, code, msg, headers, newurl):
                if not client.allowed(newurl):
                    raise SourceError('Redirect to an unconfigured host')
                if urlsplit(newurl).netloc != urlsplit(url).netloc:
                    raise SourceError('Cross-host redirect requires a separately configured URL')
                if not client.robots_allowed(client.robots.get(host, 'User-agent: *\nDisallow: /'), newurl):
                    raise SourceError('Redirect disallowed by robots.txt')
                return super().redirect_request(req, fp, code, msg, headers, newurl)
        request = Request(url, headers={'User-Agent': AGENT, 'Accept': 'text/html,text/plain'})
        with build_opener(Redirects()).open(request, timeout=15) as response:
            payload = response.read(2_000_001)
            if len(payload) > 2_000_000:
                raise SourceError('Source response exceeds size limit')
            charset = response.headers.get_content_charset()
            if not charset:
                match = re.search(br'charset\s*=\s*["\x27]?([\w-]+)', payload[:4096], re.I)
                charset = match[1].decode('ascii') if match else 'utf-8'
            return payload.decode(charset)

    def get(self, url):
        if url in self.cache:
            result = self.cache[url]
            if isinstance(result, Exception):
                raise SourceError(str(result))
            return result
        try:
            if not self.allowed(url):
                raise SourceError('Source host is not configured or URL is not HTTPS')
            p = urlsplit(url)
            if p.hostname not in self.robots:
                try:
                    rules = self.raw(f'https://{p.netloc}/robots.txt')
                    if re.search(r'<(?:html|title|form)\b', rules, re.I):
                        raise SourceError('robots.txt returned HTML instead of crawl rules')
                    self.robots[p.hostname] = rules
                except HTTPError as error:
                    if error.code != 404:
                        raise
                    self.robots[p.hostname] = 'User-agent: *\nAllow: /'
            if not self.robots_allowed(self.robots[p.hostname], url):
                raise SourceError('Source page disallowed by robots.txt')
            document = self.raw(url)
            if re.search(r'<(?:title|h1)[^>]*>[^<]*(?:captcha|access denied|проверка доступа|доступ ограничен)', document, re.I):
                raise SourceError('Source returned a challenge/access-denied page')
            self.cache[url] = document
            return document
        except (OSError, ValueError, LookupError) as error:
            self.cache[url] = error
            raise SourceError(str(error)) from error


def resolve_sources(paper, config, client, known_urls=()):
    """Publisher searches discover links; only article pages verify bibliography."""
    attempts, urls = [], list(paper.get('source_urls', [])) + list(known_urls)
    for entry in config.get('articles', []):
        if norm(entry['title']) == norm(paper['title']):
            urls.extend(entry['urls'])
    for search in config.get('publisher_searches', []):
        if norm(search['venue']) not in norm(paper.get('venue', '')):
            continue
        search_url = search['url'].replace('{query}', quote(paper['title'], safe=''))
        try:
            document = client.get(search_url)
            _, links = metadata_records(document, search_url)
            for href, title in links:
                target = urljoin(search_url, href)
                if norm(title) == norm(paper['title']) and client.allowed(target):
                    urls.append(target)
            attempts.append({'url': search_url, 'status': 'searched'})
        except SourceError as error:
            attempts.append({'url': search_url, 'status': 'unavailable', 'reason': str(error)})
    # Publisher pages first, then eLIBRARY cards found in article references.
    queue = sorted(set(urls), key=lambda u: 'elibrary.ru' in (urlsplit(u).hostname or ''))
    seen, accepted = set(), []
    while queue and len(seen) < 10:
        url = queue.pop(0)
        if url in seen:
            continue
        seen.add(url)
        try:
            if urlsplit(url).hostname in ('elibrary.ru', 'www.elibrary.ru'):
                p = urlsplit(url)
                item_id = p.path.lower() == '/item.asp' and re.fullmatch(r'\d+', parse_qs(p.query).get('id', [''])[0])
                edn = re.fullmatch(r'/[A-Za-z]{6}', p.path)
                if not item_id and not edn:
                    raise SourceError('Expected an eLIBRARY article card ID or EDN URL')
            document = client.get(url)
            metadata = verified_html(paper, document, url)
            attempts.append({'url': url, 'status': 'verified' if metadata else 'metadata_incomplete_or_mismatched'})
            if metadata:
                accepted.append(metadata)
            _, links = metadata_records(document, url)
            for href, _ in links:
                target = urljoin(url, href)
                if urlsplit(target).hostname in ('elibrary.ru', 'www.elibrary.ru') and client.allowed(target):
                    queue.append(target)
        except SourceError as error:
            attempts.append({'url': url, 'status': 'unavailable', 'reason': str(error)})
    if not accepted:
        return None, attempts
    # Different links can describe the same work, but conflicting authors/locators
    # or DOI must stay pending rather than silently selecting one source.
    keys = ('title', 'authors', 'venue', 'year', 'volume', 'issue', 'pages', 'article_number')
    signatures = {tuple(norm(str(r.get(k, ''))) for k in keys) for r in accepted}
    dois = {r['doi'] for r in accepted if r['doi']}
    if len(signatures) > 1 or len(dois) > 1:
        return None, attempts + [{'status': 'conflicting_sources'}]
    return next((record for record in accepted if record['doi']), accepted[0]), attempts
