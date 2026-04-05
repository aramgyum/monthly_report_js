# WeTrials Monthly Report — Deployment Guide

## Quick Deploy to Vercel

1. Push this repo to GitHub
2. Import the repo into Vercel
3. Set **Root Directory** to `monthly-report`
4. Add these Environment Variables in Vercel → Settings → Environment Variables:

| Variable       | Value                          |
|----------------|-------------------------------|
| GITHUB_TOKEN   | Your GitHub personal access token (needs `repo` scope) |
| GITHUB_OWNER   | Your GitHub username           |
| GITHUB_REPO    | Your repo name (e.g. `monthly_report_js`) |
| GITHUB_BRANCH  | `main`                         |

5. Deploy → your data saves to `monthly-report/data/report.json` in the repo

## Local Development

```bash
cd monthly-report
cp .env.example .env.local
# Edit .env.local with your values
npm install
npm run dev
```

## How it works

- **Save**: Writes JSON to `monthly-report/data/report.json` in your GitHub repo via the Contents API
- **Load**: Reads from that same file on every page load (no browser cache)
- **Password**: Default edit password is `wtproduct2026` — change `PASSWORD` in `lib/data.js`
- **First month**: Defaults to March 2025 when no data exists
- **Auto-preview**: After hitting Save, the dashboard switches to read-only mode automatically
