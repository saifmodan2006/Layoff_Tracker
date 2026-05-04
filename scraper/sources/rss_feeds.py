from __future__ import annotations

import json
import urllib.request
from datetime import datetime
from uuid import uuid4
from xml.etree import ElementTree as ET

RSS_URLS = [
    'https://techcrunch.com/tag/layoffs/feed/',
    'https://news.google.com/rss/search?q=company+layoffs',
]


def fetch_xml(url: str) -> str:
    with urllib.request.urlopen(url, timeout=30) as response:
        return response.read().decode('utf-8', errors='replace')


def parse_rss(xml_text: str, source_url: str) -> list[dict]:
    root = ET.fromstring(xml_text)
    records: list[dict] = []
    for item in root.findall('.//item'):
        title = (item.findtext('title') or '').strip()
        link = (item.findtext('link') or source_url).strip()
        pub_date = (item.findtext('pubDate') or '').strip()
        date = ''
        if pub_date:
            try:
                date = datetime.strptime(pub_date[:25], '%a, %d %b %Y %H:%M:%S').date().isoformat()
            except ValueError:
                date = pub_date[:10]

        if not title:
            continue

        records.append(
            {
                'id': str(uuid4()),
                'company': title.split(' layoffs')[0].split(' cuts')[0].split(' to ')[0][:80],
                'industry': 'Tech',
                'location': {'city': '', 'country': '', 'region': 'Other'},
                'date': date,
                'count': 0,
                'percent_of_workforce': None,
                'stage': 'Other',
                'status': 'Rumored',
                'source_url': link,
                'notes': title,
            }
        )
    return records


def scrape() -> list[dict]:
    records: list[dict] = []
    for url in RSS_URLS:
        try:
            records.extend(parse_rss(fetch_xml(url), url))
        except Exception:
            continue
    return records


if __name__ == '__main__':
    print(json.dumps(scrape()[:5], indent=2))
