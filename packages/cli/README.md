# sundown-cli

Expiry-date audit for a repo — models, APIs, packages, runtimes, SaaS.

**0.1.0** — useful now for pinned npm/PyPI, runtime EOL, and Docker tags we map. Model sunset rows need `OPENROUTER_API_KEY` / `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`. GitHub Actions stay unchecked without `GITHUB_TOKEN`.

```bash
npx sundown-cli .
npx sundown-cli . --json
npx sundown-cli . --fail-on-days=30
```

Demo: [project-sundown-nine.vercel.app](https://project-sundown-nine.vercel.app/) · Source: [sid-venkatesh/project-sundown](https://github.com/sid-venkatesh/project-sundown)
