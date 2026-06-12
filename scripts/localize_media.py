#!/usr/bin/env python3
"""Rewrite remote WordPress media URLs in migrated content to local copies.

The files in public/images/inline were downloaded from the same uploads;
this keeps essay bodies byte-identical except for src/href swaps, so the
writing stays unadulterated while surviving any future WordPress shutdown.
Run after scripts/import_wordpress.py.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAP = {
    "2025/11/3-steps.png": "/images/inline/three-ways-strip.jpg",
    "2025/11/screenshot-2025-11-04-at-16.51.41.png": "/images/inline/life-as-curriculum.jpg",
    "2025/11/muscle.png": "/images/inline/tear-repair-remodel.jpg",
    "2025/11/image.png": "/images/inline/anatomy-test-image.jpg",
}

def localize(html: str) -> str:
    def swap(m: re.Match) -> str:
        url = m.group(0)
        for key, local in MAP.items():
            if key in url:
                return local
        return url
    return re.sub(
        r"https://jafardabbagh\.wordpress\.com/wp-content/uploads/[^\"'\s)]+",
        swap,
        html,
    )

for name in ("essays.json", "field-notes.json", "about.json"):
    path = ROOT / "content" / name
    data = json.loads(path.read_text())
    items = data if isinstance(data, list) else [data]
    changed = 0
    for item in items:
        new = localize(item["html"])
        if new != item["html"]:
            item["html"] = new
            changed += 1
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    print(f"{name}: {changed} item(s) localized")
