"""Generate alarm email hook via OpenAI gpt-image-2.5-sunburst (not composited)."""
import base64
import os
import sys
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

ASSETS = Path(__file__).resolve().parent
if str(ASSETS) not in sys.path:
    sys.path.insert(0, str(ASSETS))

from hook_paths import ALARM_OPENAI, ORIGINAL

root = ASSETS.parents[1]
load_dotenv(root / ".env")

prompt = """
Recreate this Gmail opened-email header screenshot. Match the reference EXACTLY: one subject line only (same font size and weight as reference subject), then sender row directly under with the same tight gap as reference.

Subject must be ONE single horizontal line like the reference — NOT two lines. Reading left to right on that one line:
1) Red all-caps: OPEN THIS ONE OR YOU'RE FINISHED
2) Small gap, then red rounded Gmail label pill with white text: CRITICAL
3) Small gap, then continue the SAME line in normal gray #5f6368 sentence case (same size as reference subject text): gpt-image-2 shutdown 10 February 2027

No line break between red, CRITICAL, and gray parts. One continuous subject row like "Deprecation notice: gpt-image-2 will be shutdown on February 10, 2027" in the reference.

Do NOT use Inbox tag. No second subject/preview line under the subject. Canvas: header in top ~120px, rest pure white. Keep OpenAI logo, OpenAI verified, noreply, Unsubscribe, to me unchanged from reference. No bullet icon. Photorealistic Gmail screenshot.
"""


def main() -> None:
    if not ORIGINAL.exists():
        raise SystemExit(f"Missing {ORIGINAL}")

    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    with open(ORIGINAL, "rb") as f:
        result = client.images.edit(
            model="gpt-image-2.5-sunburst",
            image=[f],
            prompt=prompt,
            quality="medium",
            size="1536x512",
            output_format="png",
            n=1,
        )

    b64 = result.data[0].b64_json
    if not b64:
        url = getattr(result.data[0], "url", None)
        raise SystemExit(f"No b64_json in response. url={url}")

    ALARM_OPENAI.parent.mkdir(parents=True, exist_ok=True)
    ALARM_OPENAI.write_bytes(base64.b64decode(b64))
    print(f"saved {ALARM_OPENAI}")

    spec = spec_from_file_location(
        "recrop_alarm_hook", ASSETS / "recrop-alarm-hook.py"
    )
    mod = module_from_spec(spec)
    spec.loader.exec_module(mod)
    mod.main()


if __name__ == "__main__":
    main()