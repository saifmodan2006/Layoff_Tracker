from __future__ import annotations

import re
from typing import Iterable

INDUSTRY_KEYWORDS = {
    'finance': 'Finance',
    'bank': 'Finance',
    'retail': 'Retail',
    'media': 'Media',
    'health': 'Healthcare',
    'bio': 'Healthcare',
    'auto': 'Automotive',
    'vehicle': 'Automotive',
}


def normalize_record(record: dict) -> dict:
    company = (record.get('company') or '').strip()
    notes = (record.get('notes') or '').strip()
    blob = f'{company} {notes}'.lower()
    industry = next((value for key, value in INDUSTRY_KEYWORDS.items() if key in blob), 'Tech')
    count = record.get('count') or 0
    percent = record.get('percent_of_workforce')

    if not count:
                match = re.search(r'(\d[\d,]*)', notes)
                if match:
                        count = int(match.group(1).replace(',', ''))

    return {
        'id': record.get('id'),
        'company': company,
        'industry': industry,
        'location': record.get('location') or {'city': '', 'country': '', 'region': 'Other'},
        'date': record.get('date') or '',
        'count': int(count),
        'percent_of_workforce': percent,
        'stage': record.get('stage') or 'Other',
        'status': record.get('status') or 'Rumored',
        'source_url': record.get('source_url') or '',
        'notes': notes,
    }


def normalize_all(records: Iterable[dict]) -> list[dict]:
    return [normalize_record(record) for record in records if record.get('company')]
