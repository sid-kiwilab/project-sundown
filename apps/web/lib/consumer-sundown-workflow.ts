/** Drop into YOUR repo as `.github/workflows/sundown.yml` (not this demo site). */
export const CONSUMER_SUNDOWN_WORKFLOW = `# Paste into .github/workflows/sundown.yml in the repo you want to watch.
name: Sundown weekly

on:
  schedule:
    - cron: "0 9 * * 1"
  workflow_dispatch:

permissions:
  contents: read
  issues: write

jobs:
  sundown:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: sid-kiwilab/project-sundown/.github/actions/sundown@main
        with:
          openrouter-api-key: \${{ secrets.OPENROUTER_API_KEY }}
`;