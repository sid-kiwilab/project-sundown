"""Repo-local paths for LinkedIn email-hook assets (regeneratable)."""
from pathlib import Path

ASSETS = Path(__file__).resolve().parent
HOOK = ASSETS / "hook"
FONTS = ASSETS

ORIGINAL = HOOK / "original-gmail-header.png"
ORIGINAL_CROPPED = HOOK / "original-gmail-header-cropped.png"
ALARM_OPENAI = HOOK / "alarm-header-openai.png"
ALARM_TIGHT = HOOK / "alarm-header-openai-tight.png"
COMPOSITE = HOOK / "linkedin-hook-composite.png"