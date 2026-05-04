from __future__ import annotations

import csv
import io
import json
import urllib.request
from dataclasses import dataclass
from uuid import uuid4

LAYOFFS_FYI_URL = 'https://docs.google.com/spreadsheets/d/1dFIasbe_TZ5fdGFVOpkRxKL5iGUXCaX5TlZIj1bFCZE/gviz/tq?tqx=out:csv'


@dataclass
class RawLayoff:
    company: str
    date: str
    count: int
    percent: float | None
    stage: str
    source_url: str


def fetch_csv(url: str = LAYOFFS_FYI_URL) -> str:
    with urllib.request.urlopen(url, timeout=30) as response:
        return response.read().decode('utf-8', errors='replace')


def parse_rows(csv_text: str) -> list[RawLayoff]:
    reader = csv.DictReader(io.StringIO(csv_text))
    rows: list[RawLayoff] = []
    for row in reader:
        company = (row.get('company') or row.get('Company') or '').strip()
        if not company:
            continue
        date = (row.get('date') or row.get('Date') or '').strip()
        count_text = (row.get('count') or row.get('Laid Off') or '0').replace(',', '').strip()
        percent_text = (row.get('%') or row.get('percent') or '').replace('%', '').strip()
        source_url = (row.get('source') or row.get('Source') or '').strip()
        rows.append(
            RawLayoff(
                company=company,
                date=date,
                count=int(float(count_text or 0)),
                percent=float(percent_text) if percent_text else None,
                stage=(row.get('stage') or row.get('Stage') or 'Other').strip(),
                source_url=source_url,
            )
        )
    return rows


def scrape() -> list[dict]:
    csv_text = fetch_csv()
    records = []
    for row in parse_rows(csv_text):
        records.append(
            {
                'id': str(uuid4()),
                'company': row.company,
                'industry': 'Tech',
                'location': {'city': '', 'country': '', 'region': 'Other'},
                'date': row.date,
                'count': row.count,
                'percent_of_workforce': row.percent,
                'stage': row.stage,
                'status': 'Confirmed',
                'source_url': row.source_url or LAYOFFS_FYI_URL,
                'notes': 'Imported from layoffs.fyi CSV feed',
            }
        )
    return records


if __name__ == '__main__':
    print(json.dumps(scrape()[:5], indent=2))
