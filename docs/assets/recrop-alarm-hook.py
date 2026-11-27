"""Crop OpenAI header PNG to full subject + sender + to me (no clipping)."""
import sys
from pathlib import Path

from PIL import Image

ASSETS = Path(__file__).resolve().parent
sys.path.insert(0, str(ASSETS))
from hook_paths import ALARM_OPENAI, ALARM_TIGHT


def dark_enough(rgb: tuple[int, int, int], threshold: int = 245) -> bool:
    return min(rgb) < threshold


def content_bounds(im: Image.Image) -> tuple[int, int, int, int]:
    w, h = im.size
    y_min, y_max = h, 0
    x_min, x_max = w, 0

    for y in range(h):
        row = False
        for x in range(0, w, 3):
            if dark_enough(im.getpixel((x, y))):
                row = True
                x_min = min(x_min, x)
                x_max = max(x_max, x)
        if row:
            y_min = min(y_min, y)
            y_max = max(y_max, y)

    if y_max <= y_min:
        raise SystemExit("No content detected in source image")

    for y in range(y_min, y_max + 1):
        for x in range(0, w, 2):
            if dark_enough(im.getpixel((x, y))):
                x_min = min(x_min, x)
                x_max = max(x_max, x)

    return x_min, y_min, x_max, y_max


def main() -> None:
    if not ALARM_OPENAI.exists():
        raise SystemExit(f"Missing {ALARM_OPENAI}; run gen-alarm-hook-openai.py first.")

    im = Image.open(ALARM_OPENAI).convert("RGB")
    x0, y0, x1, y1 = content_bounds(im)

    pad_l, pad_t, pad_r, pad_b = 16, 12, 24, 28
    w, h = im.size
    crop = im.crop(
        (
            max(0, x0 - pad_l),
            max(0, y0 - pad_t),
            min(w, x1 + pad_r),
            min(h, y1 + pad_b),
        )
    )
    ALARM_TIGHT.parent.mkdir(parents=True, exist_ok=True)
    crop.save(ALARM_TIGHT, optimize=True)
    print(f"bounds raw=({x0},{y0})-({x1},{y1})")
    print(f"saved {ALARM_TIGHT} size={crop.size}")


if __name__ == "__main__":
    main()