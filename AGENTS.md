# Deployment Guide

## Manual Deploy (Cloudflare Pages)

When GitHub integration is not configured, deploy manually:

```bash
# 1. Build the project
bun run build

# 2. Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name md2slides
```

Or use the combined command:

```bash
bun run deploy
```

## CI/CD Setup (GitHub Actions)

For automatic deploys on push to `main`, create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Build
        run: bun run build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: md2slides
          directory: dist
```

Required secrets in GitHub repo settings:
- `CLOUDFLARE_API_TOKEN` — Create at dash.cloudflare.com → Profile → API Tokens
- `CLOUDFLARE_ACCOUNT_ID` — Found in Cloudflare dashboard URL or Overview page

## GitHub Integration (Dashboard)

For auto-deploy via GitHub connection:

1. Go to **dash.cloudflare.com** → **Pages** → **md2slides**
2. Click **Set up a project** or **Settings** → **Builds & deployments**
3. Under **Source**, click **Connect to Git**
4. Authorize Cloudflare access to GitHub
5. Select repository and `main` branch

This requires the Cloudflare Pages GitHub App to be installed on the repository.
