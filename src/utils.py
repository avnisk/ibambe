"""
utils.py — Shared utility helpers for VoltGuard.

Kept intentionally lightweight; heavy logic lives in simulate.py / predict.py.
"""

import datetime
import random


def utc_timestamp() -> str:
    """Return current local time as HH:MM:SS string."""
    return datetime.datetime.now().strftime("%H:%M:%S")


def gaussian_jitter(value: float, pct: float = 0.02) -> float:
    """Return value +/- Gaussian noise of pct magnitude."""
    return value * (1 + random.gauss(0, pct))


def clamp(value: float, lo: float, hi: float) -> float:
    """Clamp value to [lo, hi]."""
    return max(lo, min(hi, value))


def pct_change(new_val: float, baseline: float) -> float:
    """Percentage change from baseline (positive = increase)."""
    if baseline == 0:
        return 0.0
    return round((new_val - baseline) / baseline * 100, 2)
