from __future__ import annotations

import json
from pathlib import Path

from deduplicator import deduplicate
from normalizer import normalize_all
from sources.layoffs_fyi import scrape as scrape_layoffs_fyi
from sources.rss_feeds import scrape as scrape_rss

OUTPUT = Path(__file__).with_name('layoffs.normalized.json')


def run_once() -> list[dict]:
    raw_records = []
    raw_records.extend(scrape_layoffs_fyi())
    raw_records.extend(scrape_rss())
    normalized = normalize_all(raw_records)
    deduped = deduplicate(normalized)
    OUTPUT.write_text(json.dumps(deduped, indent=2), encoding='utf-8')
    return deduped


if __name__ == '__main__':
    results = run_once()
    print(json.dumps({'count': len(results), 'output': str(OUTPUT)}, indent=2))
