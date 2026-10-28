"""Append recent public Scholar publications; no API, cookies or CAPTCHA bypass."""
import argparse
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import time
import unicodedata
from urllib.parse import urlencode, urlsplit, parse_qs, quote, unquote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://scholar.google.com"
AGENT = "Lab317PublicationSync/1.0 (+https://github.com/Laboratory-317/wireless-communication-lab)"
VOID = {"br", "img", "input", "meta", "link", "hr", "wbr", "source"}


def normalized(value):
    return "".join(c for c in unicodedata.normalize("NFKC", value).casefold() if c.isalnum())


class ProfileParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.row = None
        self.rows = []
        self.profile = []
        self.gray = 0

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = attrs.get("class", "").split()
        field = None
        if tag == "tr" and "gsc_a_tr" in classes:
            self.row = {"title": [], "authors": [], "venue": [], "year": [], "link": ""}
            self.gray = 0
        if attrs.get("id") == "gsc_prf_in":
            field = "profile"
        if self.row is not None:
            if tag == "a" and "gsc_a_at" in classes:
                field = "title"
                self.row["link"] = attrs.get("href", "")
            elif tag == "div" and "gs_gray" in classes:
                field = "authors" if self.gray == 0 else "venue"
                self.gray += 1
            elif tag == "td" and "gsc_a_y" in classes:
                field = "year"
        if tag not in VOID:
            self.stack.append((tag, field))

    def handle_endtag(self, tag):
        if tag == "tr" and self.row is not None:
            self.rows.append({k: " ".join("".join(v).split()) if isinstance(v, list) else v
                              for k, v in self.row.items()})
            self.row = None
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        for _, field in reversed(self.stack):
            if field == "profile":
                self.profile.append(data)
                break
            if field and self.row is not None:
                self.row[field].append(data)
                break


def parse_profile(document, author_id):
    parser = ProfileParser()
    parser.feed(document)
    if not "".join(parser.profile).strip() or not parser.rows:
        raise ValueError("No public profile/publications found (possible CAPTCHA or changed markup)")
    papers = []
    for row in parser.rows:
        if not row["title"] or not row["authors"]:
            raise ValueError("Incomplete publication row; refusing to update")
        citation = parse_qs(urlsplit(row["link"]).query).get("citation_for_view", [""])[0]
        if not citation.startswith(author_id + ":"):
            raise ValueError("Publication link does not belong to requested profile")
        if not re.fullmatch(r"\d{4}", row["year"]):
            print(f"Skipping undated publication: {row['title']}")
            continue
        row["link"] = ORIGIN + "/citations?" + urlencode({"view_op": "view_citation", "citation_for_view": citation})
        papers.append(row)
    if not papers:
        raise ValueError("No dated publications; refusing to update")
    return papers


def robots_allowed(robots, url):
    """Google's wildcard rules use the longest matching path, Allow wins ties."""
    groups, agents, rules = [], [], []
    for raw in robots.splitlines() + ["User-agent: __end__"]:
        line = raw.split("#", 1)[0].strip()
        if ":" not in line:
            continue
        key, value = (part.strip() for part in line.split(":", 1))
        if key.lower() == "user-agent":
            if rules:
                groups.append((agents, rules))
                agents, rules = [], []
            agents.append(value.lower())
        elif key.lower() in ("allow", "disallow") and value:
            rules.append((key.lower() == "allow", value))
    specific = [(a, r) for a, r in groups if any(x != "*" and x in AGENT.lower() for x in a)]
    selected = specific or [(a, r) for a, r in groups if "*" in a]
    target = urlsplit(url).path + "?" + urlsplit(url).query
    matches = []
    for _, rules in selected:
        for allow, pattern in rules:
            expression = re.escape(pattern).replace(r"\*", ".*")
            if expression.endswith(r"\$"):
                expression = expression[:-2] + "$"
            if re.match(expression, target):
                matches.append((len(pattern.replace("*", "").rstrip("$")), allow))
    return max(matches)[1] if matches else True


def fetch(url):
    request = Request(url, headers={"User-Agent": AGENT, "Accept-Language": "en"})
    with urlopen(request, timeout=25) as response:
        if urlsplit(response.url).hostname != "scholar.google.com":
            raise ValueError("Unexpected redirect; refusing to update")
        payload = response.read(5_000_001)
        if len(payload) > 5_000_000:
            raise ValueError("Response exceeds size limit")
        return payload.decode(response.headers.get_content_charset() or "utf-8")


def md(value):
    # Plain remote text must never introduce HTML, Markdown links or Quarto directives.
    value = html.escape(value, quote=False)
    return re.sub(r"([\\`*_{}\[\]()#!|~])", r"\\\1", value)


def text_only(value):
    return html.unescape(re.sub(r"<[^>]+>", "", value)).strip()


def crossref_lookup(paper):
    query = urlencode({"query.bibliographic": paper["title"], "rows": 5})
    request = Request("https://api.crossref.org/works?" + query,
                      headers={"User-Agent": AGENT, "Accept": "application/json"})
    with urlopen(request, timeout=25) as response:
        data = json.load(response)
    return data["message"]["items"]


def verified_metadata(paper, matches):
    """Require exact normalized title, year, lead author and complete metadata."""
    accepted = {}
    for item in matches:
        titles = [text_only(t) for t in item.get("title", [])]
        matching_title = next((t for t in titles if normalized(t) == normalized(paper["title"])), None)
        if not matching_title:
            continue
        if item.get("type") not in ("journal-article", "proceedings-article"):
            continue
        dates = [item.get(key, {}).get("date-parts", [[]])[0]
                 for key in ("published", "published-online", "published-print")]
        if not any(d and str(d[0]) == paper["year"] for d in dates):
            continue
        authors = item.get("author", [])
        if not authors or any(not a.get("family") or not a.get("given") for a in authors):
            continue
        if normalized(authors[0]["family"]) not in normalized(paper["authors"].split(",", 1)[0]):
            continue
        journal = item.get("container-title", [])
        doi = item.get("DOI", "").lower().strip()
        if not journal or not re.fullmatch(r"10\.\d{4,9}/[^\s<>]+", doi):
            continue
        # A journal record with no pages/article number and no volume/issue may
        # be online-first. Do not invent any of those optional fields.
        accepted[doi] = {
            "title": matching_title, "year": paper["year"], "doi": doi,
            "authors": ", ".join(text_only(a["given"] + " " + a["family"]) for a in authors),
            "venue": text_only(journal[0]), "volume": item.get("volume", ""),
            "issue": item.get("issue", ""), "pages": item.get("page", ""),
            "article_number": item.get("article-number", ""),
        }
    return next(iter(accepted.values())) if len(accepted) == 1 else None


def render_publication(paper):
    if any(not paper.get(key) for key in ("title", "authors", "venue", "year", "doi")):
        raise ValueError("Publication lacks verified bibliographic fields")
    if re.search(r"\.\.\.|…|\bet\s+al\b", paper["authors"], re.I):
        raise ValueError("Truncated author list must not enter the bibliography")
    title = paper["title"].rstrip(".")
    if not title.endswith(("?", "!")):
        title += "."
    fields = [f"*{md(paper['venue'])}*"]
    if paper.get("volume"):
        fields.append("vol. " + md(str(paper["volume"])))
    if paper.get("issue"):
        fields.append("no. " + md(str(paper["issue"])))
    if paper.get("article_number"):
        fields.append(md(str(paper["article_number"])))
    elif paper.get("pages"):
        pages = re.sub(r"(?<=\d)[-–—]+(?=\d)", "–", str(paper["pages"]))
        fields.append("pp. " + md(pages))
    return (f"- **{md(title)}** {md(paper['authors'].rstrip('.'))}. "
            + ", ".join(fields) + f". {paper['year']}. [DOI](https://doi.org/{quote(paper['doi'], safe='/')})\n")


def merge_document(document, papers, discovered=()):
    document = document.replace("\r\n", "\n")
    # Migrate only the raw Scholar records produced by the old importer.
    # Unconfirmed records stay in the pending JSON instead of public pages.
    discovered_titles = {normalized(p["title"]) for p in discovered}
    document = "".join(line for line in document.splitlines(keepends=True)
                       if not ("[Google Scholar](https://scholar.google.com/citations?" in line
                               and (m := re.match(r"^- \*\*(.*?)\*\*", line))
                               and normalized(html.unescape(m[1]).replace("\\", "")) in discovered_titles))
    heading = re.search(r"^## (?:Все публикации|All publications)\s*$", document, re.M)
    if not heading:
        raise ValueError("Publication archive heading missing")
    seen = {normalized(html.unescape(t).replace("\\", "").rstrip("."))
            for t in re.findall(r"^- \*\*(.*?)\*\*", document, re.M)}
    seen_dois = {unquote(doi).lower().rstrip(".,") for doi in re.findall(r"https://doi.org/([^\s)]+)", document)}
    added = 0
    for paper in sorted(papers, key=lambda p: (-int(p["year"]), p["title"])):
        key = normalized(paper["title"])
        if key in seen or paper["doi"].lower() in seen_dois:
            continue
        seen.add(key)
        seen_dois.add(paper["doi"].lower())
        year = paper["year"]
        line = render_publication(paper)
        # Only archive years after the main heading; featured records stay untouched.
        years = list(re.finditer(r"^### (\d{4})\s*\n", document[heading.end():], re.M))
        matching = next((m for m in years if m[1] == year), None)
        if matching:
            position = heading.end() + matching.end()
            document = document[:position] + line + document[position:]
        else:
            later = next((m for m in years if int(m[1]) < int(year)), None)
            position = heading.end() + later.start() if later else len(document)
            document = document[:position].rstrip() + f"\n\n### {year}\n\n" + line + "\n" + document[position:].lstrip()
        added += 1
    return document, added


def run(root, dry_run=False):
    config = json.loads((root / "tools/scholar-profiles.json").read_text(encoding="utf-8"))
    targets = [root / relative for relative in config["publication_files"]]
    originals = {target: target.read_text(encoding="utf-8") for target in targets}
    pending_path = root / "data/scholar-pending.json"
    previous = json.loads(pending_path.read_text(encoding="utf-8")) if pending_path.exists() else []
    robots = fetch(ORIGIN + "/robots.txt")
    papers = []
    for index, profile in enumerate(config["profiles"]):
        url = ORIGIN + "/citations?" + urlencode({"user": profile["id"], "hl": "en", "sortby": "pubdate", "pagesize": 100})
        if not robots_allowed(robots, url):
            raise ValueError("robots.txt disallows this profile URL")
        if index:
            time.sleep(5)
        items = parse_profile(fetch(url), profile["id"])
        print(f"{profile['name']}: {len(items)} dated recent publications")
        for item in items:
            if int(item["year"]) < config["min_year"]:
                continue
            if "…" in item["title"] or "..." in item["title"] or "учредители" in item["title"].casefold():
                print(f"Skipping suspicious/truncated title: {item['title']}")
                continue
            papers.append(item)
    # Scholar discovers candidates. Only complete, unambiguous Crossref records
    # are allowed into the public bibliography; never guess missing metadata.
    papers.extend(previous)
    verified, pending, processed = [], [], set()
    title_sets = [{normalized(html.unescape(title).replace("\\", ""))
                   for line in original.splitlines() if "[Google Scholar]" not in line
                   for title in re.findall(r"^- \*\*(.*?)\*\*", line)} for original in originals.values()]
    existing_titles = set.intersection(*title_sets)
    for paper in papers:
        key = normalized(paper["title"])
        if key in processed or key in existing_titles:
            continue
        processed.add(key)
        metadata = verified_metadata(paper, crossref_lookup(paper))
        if metadata:
            render_publication(metadata)  # Validate before any files are written.
            verified.append(metadata)
        else:
            pending.append({**paper, "reason": "No unique verified Crossref record with full author metadata"})
            print(f"Pending metadata verification: {paper['title']}")
    # Fetch and validate every profile and every document before touching any file.
    changes = {target: merge_document(original, verified, papers) for target, original in originals.items()}
    for target, (updated, count) in changes.items():
        print(f"{target.relative_to(root)}: {count} additions{' (dry run)' if dry_run else ''}")
        if updated != originals[target] and not dry_run:
            temporary = target.with_suffix(target.suffix + ".tmp")
            temporary.write_text(updated, encoding="utf-8")
            temporary.replace(target)
    if not dry_run:
        pending_path.parent.mkdir(parents=True, exist_ok=True)
        # Retain previously unresolved candidates even after they leave the first
        # 100 results. Verified/existing papers no longer need pending entries.
        resolved = existing_titles | {normalized(p["title"]) for p in verified}
        outstanding = {normalized(p["title"]): p for p in previous + pending
                       if normalized(p["title"]) not in resolved}
        pending_path.write_text(json.dumps(sorted(outstanding.values(), key=lambda p: p["title"]),
                                           ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--dry-run", action="store_true")
    args = cli.parse_args()
    run(ROOT, args.dry_run)
