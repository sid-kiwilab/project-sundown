# LinkedIn email hook (post image)

**Shipped artifact:** [`linkedin-hook-composite.png`](./linkedin-hook-composite.png) — real OpenAI deprecation mail vs “what it should look like.”

## Regenerate (from repo root)

Requires `OPENAI_API_KEY` in `.env` only for the alarm header (OpenAI Images API).

```powershell
cd docs/assets
python crop-original-email.py
python gen-alarm-hook-openai.py
python compose-email-hook-stack.py
```

Outputs stay under this folder (`original-gmail-header*.png`, `alarm-header-openai*.png`, `linkedin-hook-composite.png`).

Fonts: `docs/assets/Roboto-Bold.ttf` (and Regular/Medium if present).