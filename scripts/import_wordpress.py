#!/usr/bin/env python3
"""One-time migration: pull posts/pages from the WordPress public API,
strip Gutenberg cruft, and emit clean JSON into content/.

Usage: python3 scripts/import_wordpress.py
"""
import html
import json
import os
import re
import urllib.request
from html.parser import HTMLParser

SITE = "jafardabbagh.wordpress.com"
API = f"https://public-api.wordpress.com/wp/v2/sites/{SITE}"
OUT = os.path.join(os.path.dirname(__file__), "..", "content")

FIELD_NOTES_CAT = 49705

KEEP_TAGS = {
    "p", "h1", "h2", "h3", "h4", "blockquote", "ul", "ol", "li",
    "strong", "em", "b", "i", "a", "sup", "sub", "br", "hr", "figure", "img",
}
# tags whose entire subtree is dropped (WP widgets, share buttons, etc.)
DROP_TAGS = {"script", "style", "iframe", "form", "button", "time"}


class Cleaner(HTMLParser):
    """Rebuild WP HTML keeping only semantic tags, no classes/styles."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out = []
        self.drop_depth = 0

    def handle_starttag(self, tag, attrs):
        if self.drop_depth:
            if tag in DROP_TAGS:
                self.drop_depth += 1
            return
        if tag in DROP_TAGS:
            self.drop_depth = 1
            return
        attrs = dict(attrs)
        # drop WP "latest posts" embeds and nav UL widgets
        cls = attrs.get("class", "")
        if tag == "ul" and "wp-block-latest-posts" in cls:
            self.drop_depth = 1
            return
        if tag not in KEEP_TAGS:
            return
        if tag == "a":
            href = attrs.get("href", "")
            # internal WP links -> relative
            href = re.sub(r"https?://(jafardabbagh\.(com|wordpress\.com))", "", href)
            self.out.append(f'<a href="{html.escape(href, quote=True)}">')
        elif tag == "img":
            src = attrs.get("src", "")
            alt = attrs.get("alt", "")
            if src:
                self.out.append(
                    f'<img src="{html.escape(src, quote=True)}" alt="{html.escape(alt, quote=True)}" loading="lazy" />'
                )
        elif tag in ("br", "hr"):
            self.out.append(f"<{tag} />")
        else:
            self.out.append(f"<{tag}>")

    def handle_endtag(self, tag):
        if self.drop_depth:
            if tag in DROP_TAGS or tag == "ul":
                self.drop_depth -= 1
            return
        if tag in KEEP_TAGS and tag not in ("br", "hr", "img"):
            self.out.append(f"</{tag}>")

    def handle_data(self, data):
        if not self.drop_depth:
            self.out.append(html.escape(data))


def clean(raw: str) -> str:
    # remove gutenberg comments
    raw = re.sub(r"<!--.*?-->", "", raw, flags=re.S)
    c = Cleaner()
    c.feed(raw)
    out = "".join(c.out)
    # collapse empty paragraphs / whitespace
    out = re.sub(r"<p>(\s|&nbsp;|<br\s*/>)*</p>", "", out)
    out = re.sub(r"<(h\d|figure)>(\s|&nbsp;)*</\1>", "", out)
    out = re.sub(r"\n{3,}", "\n\n", out)
    return out.strip()


def text_of(raw: str) -> str:
    txt = re.sub(r"<[^>]+>", " ", raw)
    txt = html.unescape(txt)
    return re.sub(r"\s+", " ", txt).strip()


def fetch(path: str):
    with urllib.request.urlopen(f"{API}/{path}") as r:
        return json.load(r)


def words(raw: str) -> int:
    return len(text_of(raw).split())


def main():
    os.makedirs(OUT, exist_ok=True)
    posts = fetch("posts?per_page=50&_fields=id,date,slug,title,excerpt,content,categories")

    essays, notes = [], []
    for p in posts:
        body = clean(p["content"]["rendered"])
        item = {
            "slug": p["slug"],
            "title": html.unescape(re.sub(r"&nbsp;", " ", p["title"]["rendered"])),
            "date": p["date"][:10],
            "excerpt": text_of(p["excerpt"]["rendered"]).removesuffix("…").strip(),
            "words": words(p["content"]["rendered"]),
            "html": body,
        }
        if FIELD_NOTES_CAT in p.get("categories", []):
            notes.append(item)
        else:
            essays.append(item)

    pages = fetch("pages?per_page=20&_fields=id,slug,title,content")
    about = next((p for p in pages if p["slug"] == "about"), None)
    if about:
        with open(os.path.join(OUT, "about.json"), "w") as f:
            json.dump({"title": "About", "html": clean(about["content"]["rendered"])}, f, indent=2, ensure_ascii=False)

    with open(os.path.join(OUT, "essays.json"), "w") as f:
        json.dump(essays, f, indent=2, ensure_ascii=False)
    with open(os.path.join(OUT, "field-notes.json"), "w") as f:
        json.dump(notes, f, indent=2, ensure_ascii=False)

    print(f"{len(essays)} essays, {len(notes)} field notes, about={'yes' if about else 'no'}")


if __name__ == "__main__":
    main()
