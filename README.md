# ClipCompass

A free, instant YouTube SEO audit tool. Paste a video URL and a target keyword, and ClipCompass
pulls real data straight from the YouTube Data API to score the video against a plain-language
optimization checklist — title, description, tags, and thumbnail. Every result is labeled as either
verified API data or a clearly-marked estimate; nothing is invented.

The free audit doubles as a lead magnet: running an audit captures the visitor's email so you can
follow up with your own products or services.

## Stack

- Next.js 14 (App Router) + TypeScript
- Prisma + SQLite (swap `DATABASE_URL` for Postgres in production — see `.env.example`)
- YouTube Data API v3 for verified video stats
- YouTube's public autocomplete endpoint for keyword suggestions (labeled as estimates)

## Getting started

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and add your `YOUTUBE_API_KEY` (free from
   [Google Cloud Console](https://console.cloud.google.com) — enable "YouTube Data API v3").
3. Create the database:
   ```
   npx prisma migrate dev --name init
   ```
4. Run the dev server:
   ```
   npm run dev
   ```
5. Visit `http://localhost:3000` and run an audit.

## Project layout

```
app/
  layout.tsx        Root layout + page metadata
  page.tsx           Landing page: audit form + results
  globals.css         Styling
  api/
    audit/route.ts    POST — runs a video audit, saves it, captures the lead
    keywords/route.ts POST — YouTube autocomplete keyword suggestions
lib/
  db.ts               Prisma client singleton
  youtube.ts          All YouTube API calls + the scoring checklist logic
  prompts.js          AI prompt templates (not wired to a live model yet)
prisma/
  schema.prisma       User, Lead, VideoAudit, KeywordSearch, FavoriteItem, RankCheck
```

## What's live vs. what's next

**Live in this MVP:**
- Free video audit (title/description/tags/thumbnail checklist + score)
- Keyword suggestion lookup
- Email capture on every audit run

**Not wired up yet (scaffolding is in place):**
- AI-generated title/description/tag rewrites — prompt template lives in `lib/prompts.js`; wire it
  to `ANTHROPIC_API_KEY` when ready
- Stripe billing / paid tiers — `planTier` already exists on `User`, `STRIPE_SECRET_KEY` is in
  `.env.example`
- "Connect your channel" OAuth for automatic rank tracking — `RankCheck` model is ready, OAuth env
  vars are in `.env.example`

## Environment variables

See `.env.example` for the full list and where to get each key. Only `YOUTUBE_API_KEY` and
`DATABASE_URL` are required to run the MVP.
