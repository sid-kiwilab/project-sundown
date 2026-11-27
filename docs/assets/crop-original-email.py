"""Top-align original Gmail crop to match alarm header padding."""
import sys
from pathlib import Path

from PIL import Image

ASSETS = Path(__file__).resolve().parent
sys.path.insert(0, str(ASSETS))
from hook_paths import ORIGINAL, ORIGINAL_CROPPED

TOP_TRIM = 4


def main() -> None:
    if not ORIGINAL.exists():
        raise SystemExit(f"Missing {ORIGINAL}")

    im = Image.open(ORIGINAL).convert("RGB")
    w, h = im.size
    cropped = im.crop((0, TOP_TRIM, w, h))
    ORIGINAL_CROPPED.parent.mkdir(parents=True, exist_ok=True)
    cropped.save(ORIGINAL_CROPPED)
    print(f"saved {ORIGINAL_CROPPED} size={cropped.size} (trimmed {TOP_TRIM}px top)")


if __name__ == "__main__":
    main()