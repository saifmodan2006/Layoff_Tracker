# Scraper

Python ingestion pipeline for layoffs data.

Includes:
- `sources/layoffs_fyi.py` for the CSV feed
- `sources/rss_feeds.py` for TechCrunch and Google News RSS
- `normalizer.py` for unified schema mapping
- `deduplicator.py` for merge logic
- `scheduler.py` for a 6-hour polling loop
- `notifier.py` for email alerts

Run locally:

```bash
cd scraper
python main.py
```
