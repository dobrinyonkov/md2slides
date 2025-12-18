# md2slides - Simple Version

A simplified version of md2slides without auth or database. Uses localStorage for auto-save and GitHub Gists for cloud backup.

## Features

- ✨ **No Auth Required** - Start creating immediately
- 💾 **Auto-save** - Content saved to localStorage automatically
- ☁️ **GitHub Gist Backup** - Save and load presentations from private gists
- 🎨 **Beautiful Slides** - Same great presentation experience
- ⚡ **Fast** - Powered by Bun

## Setup

1. Install dependencies:
```bash
bun install
```

2. (Optional) Configure GitHub token for Gist features:
```bash
cp .env.example .env
# Edit .env and add your GitHub Personal Access Token
```

To create a GitHub token:
- Go to https://github.com/settings/tokens/new
- Select scope: `gist`
- Copy the token and paste it in `.env`

3. Run the dev server:
```bash
bun dev
```

4. Open http://localhost:3000

## Usage

### Without GitHub Token
- Create and edit presentations
- Auto-saves to localStorage
- Present mode works
- Cannot save/load from Gist

### With GitHub Token
- All above features
- Save presentations to private GitHub Gists
- Load presentations from Gist URLs
- Share presentations via Gist links

## Architecture

- **Frontend**: React with TypeScript
- **Server**: Bun static server with API routes
- **Editor**: Monaco Editor
- **Markdown**: Marked + Highlight.js
- **Storage**: localStorage + GitHub Gists API

## Development

Built with Bun's native features:
- `Bun.serve()` for HTTP server with routes
- Hot module reloading (HMR)
- Native TypeScript support
- Fast bundling

## Differences from SaaS Version

**Removed:**
- Authentication system
- Convex database
- User accounts
- Pricing/billing
- CRUD operations on presentations

**Added:**
- GitHub Gist integration
- Token-based API access
- Simplified routing

**Kept:**
- Landing page with demo
- Editor with split view
- Presentation mode
- All UI components
