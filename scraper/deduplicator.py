from __future__ import annotations

from collections import defaultdict
from datetime import datetime


def deduplicate(records: list[dict]) -> list[dict]:
    buckets: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for record in records:
        month = (record.get('date') or '')[:7]
        buckets[(record.get('company', '').lower(), month)].append(record)

    merged: list[dict] = []
    for group in buckets.values():
        group.sort(key=lambda item: (item.get('count') or 0, len(item.get('notes') or ''), len(item.get('source_url') or '')), reverse=True)
        primary = dict(group[0])
        for duplicate in group[1:]:
            if primary.get('count') and duplicate.get('count'):
                difference = abs(primary['count'] - duplicate['count']) / max(primary['count'], duplicate['count'])
                if difference <= 0.1:
                    primary['notes'] = f"{primary.get('notes', '')} | merged with duplicate"
        merged.append(primary)

    return sorted(merged, key=lambda item: item.get('date') or '', reverse=True)
