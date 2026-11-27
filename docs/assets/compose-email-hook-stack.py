"""Minimal hook composite: labels + full-width emails, no chrome."""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ASSETS = Path(__file__).resolve().parent
sys.path.insert(0, str(ASSETS))
from hook_paths import ALARM_TIGHT, COMPOSITE, FONTS, ORIGINAL_CROPPED

WIDTH = 1200
PAD_X = 32
TOP_PAD = 28
BOTTOM_PAD = 28
LABEL_EMAIL_GAP = 12
SECTION_GAP = 32
LABEL_SIZE = 30


def scale_to_width(img: Image.Image, width: int) -> Image.Image:
    h = int(img.height * width / img.width)
    return img.resize((width, h), Image.Resampling.LANCZOS)


def label_block_height(font: ImageFont.FreeTypeFont) -> tuple[int, int]:
    probe = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    bb = probe.textbbox((0, 0), "What I needed", font=font)
    ink_h = bb[3] - bb[1]
    top_bearing = max(0, -bb[1])
    return ink_h, top_bearing


def draw_label(
    draw: ImageDraw.ImageDraw,
    x: int,
    y: int,
    text: str,
    font: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int],
) -> int:
    bb = draw.textbbox((0, 0), text, font=font)
    draw.text((x, y - bb[1]), text, font=font, fill=fill)
    return bb[3] - bb[1]


def main() -> None:
    if not ORIGINAL_CROPPED.exists():
        raise SystemExit("Missing cropped original; run crop-original-email.py first.")
    if not ALARM_TIGHT.exists():
        raise SystemExit("Missing alarm tight; run recrop-alarm-hook.py first.")

    inner_w = WIDTH - 2 * PAD_X
    real = scale_to_width(Image.open(ORIGINAL_CROPPED).convert("RGB"), inner_w)
    alarm = scale_to_width(Image.open(ALARM_TIGHT).convert("RGB"), inner_w)

    bold = str(FONTS / "Roboto-Bold.ttf")
    got = ImageFont.truetype(bold, LABEL_SIZE)
    need = ImageFont.truetype(bold, LABEL_SIZE)

    lh_got, _ = label_block_height(got)
    lh_need, _ = label_block_height(need)

    height = (
        TOP_PAD
        + lh_got
        + LABEL_EMAIL_GAP
        + real.height
        + SECTION_GAP
        + lh_need
        + LABEL_EMAIL_GAP
        + alarm.height
        + BOTTOM_PAD
    )

    canvas = Image.new("RGB", (WIDTH, height), (255, 255, 255))
    draw = ImageDraw.Draw(canvas)
    x = PAD_X

    y = TOP_PAD
    h = draw_label(draw, x, y, "What I got", got, (95, 99, 104))
    y += h + LABEL_EMAIL_GAP
    canvas.paste(real, (x, y))

    y += real.height + SECTION_GAP
    h = draw_label(draw, x, y, "What I needed", need, (197, 34, 31))
    y += h + LABEL_EMAIL_GAP
    canvas.paste(alarm, (x, y))

    if y + alarm.height > height:
        raise SystemExit("Layout overflow; increase pads")

    COMPOSITE.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(COMPOSITE, optimize=True)
    print(f"saved {COMPOSITE} ({WIDTH}x{height})")


if __name__ == "__main__":
    main()