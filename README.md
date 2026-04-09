# ES Outreach Generator

Expressway Studio BD outreach sequence generator. Built with plain HTML/JS (no build step), hosted on GitHub Pages, with a Cloudflare Worker as a secure API relay to Anthropic and Notion.

---

## Files

```
index.html   — the generator app (GitHub Pages)
worker.js    — Cloudflare Worker (API relay)
README.md    — this file
```

---

## Setup — Step by Step

### Step 1 — Create GitHub repo

1. Go to github.com → New repository
2. Name it `es-outreach-generator` (or anything you like)
3. Set to **Private** (recommended) or Public
4. Upload both `index.html` and `worker.js`
5. Go to **Settings → Pages → Source** → set to `main` branch, `/ (root)`
6. Your app will be live at `https://yourusername.github.io/es-outreach-generator`

---

### Step 2 — Deploy the Cloudflare Worker

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages → Create
2. Choose **Create Worker**
3. Name it `es-outreach` → Deploy
4. Click **Edit code** → paste in the full contents of `worker.js` → Save & Deploy
5. Note your worker URL: `https://es-outreach.YOUR-SUBDOMAIN.workers.dev`

**Set environment variables** (Settings → Variables):

| Variable              | Value                                      |
|-----------------------|--------------------------------------------|
| `ANTHROPIC_API_KEY`   | Your Anthropic API key (console.anthropic.com) |
| `NOTION_API_KEY`      | Your Notion integration token (see Step 3) |
| `NOTION_DATABASE_ID`  | `5f04a0d639394031b9ad7fab6f4a6de9`         |
| `ALLOWED_ORIGIN`      | `https://yourusername.github.io`           |

---

### Step 3 — Create Notion Integration

1. Go to [notion.so/my-integrations](https://notion.so/my-integrations) → New integration
2. Name it `ES Outreach Generator`
3. Set capabilities: **Read content**, **Update content**, **Insert content**
4. Copy the **Internal Integration Token** — this is your `NOTION_API_KEY`
5. Go to your **Leads & Outreach Tracker** database in Notion
6. Click `...` (top right) → **Connections** → connect `ES Outreach Generator`

---

### Step 4 — Update index.html with your Worker URL

In `index.html`, find this line near the bottom:

```js
const WORKER_URL = 'https://es-outreach.YOUR-SUBDOMAIN.workers.dev';
```

Replace with your actual worker URL, then commit/push the change.

---

### Step 5 — Test it

1. Open your GitHub Pages URL
2. Fill in a test lead, hit **Generate sequence + log to Notion**
3. Check your Leads & Outreach Tracker database in Notion — you should see a new row

---

## Notion Database

Database ID: `5f04a0d639394031b9ad7fab6f4a6de9`
Located under: Claude Projects → BD Outreach Engine — Creative Studio

---

## Sharing

- Share the GitHub Pages URL with anyone who should use the generator
- If you want to restrict access, GitHub Pages supports no built-in auth — the simplest option is to keep the repo private (pages still work) and only share the URL internally
- For proper password protection later, consider Cloudflare Access (free tier) in front of the Pages URL
