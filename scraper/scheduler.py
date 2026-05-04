from __future__ import annotations

import time

from main import run_once


def run_forever(interval_hours: int = 6) -> None:
    while True:
        run_once()
        time.sleep(interval_hours * 60 * 60)


if __name__ == '__main__':
    run_forever()
