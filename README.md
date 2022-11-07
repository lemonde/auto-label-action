# Auto label action

Automatically add labels on pull-request based on commits.

## Setup

Add `.github/auto-label.json`:

```json
{
  "types": {
    "🐛 bug": "^fix",
    "⭐️ feature": "^feat",
    "🛠 chore": "^chore",
    "📝 docs": "^docs",
    "♻️ refactor": "^refactor",
    "🔍 test": "^test",
    "🌈 style": "^style"
  }
}
```

Add `.github/workflows/auto-label.yml`:

```yml
name: Auto label

on:
  pull_request:
    types: [opened, edited, synchronize]

jobs:
  put-labels:
    name: "Put labels on PR"
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: lemonde/auto-label-action@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```
