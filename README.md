# Brightwheel Onboarding Triage

AI-powered message triage tool for Brightwheel's Onboarding team.

## Deploy to Vercel (2 minutes)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. In **Environment Variables**, add:
   - `VITE_ANTHROPIC_API_KEY` = your Anthropic API key
4. Click Deploy

That's it. Vercel will build and host it automatically.

## Run Locally

```bash
npm install
```

Create a `.env` file:
```
VITE_ANTHROPIC_API_KEY=your_key_here
```

```bash
npm run dev
```

## What It Does

Paste any inbound message from a school administrator, director, or teacher. The tool outputs:

- **Category** — e.g., "Urgent - Parent Access", "Billing - Invoice Request"
- **Priority** — P1 Critical / P2 High / P3 Normal
- **Routing** — who should handle it
- **Flags** — ESCALATE_IMMEDIATELY, DATA_BREACH_RISK, NEEDS_CLARIFICATION, etc.
- **Draft reply** — ready to copy and send
- **Confidence level** — High / Medium / Low with explanation when uncertain

## Tech

- React + Vite
- Anthropic Claude claude-sonnet-4-20250514 API
- No backend required — API key lives in Vercel env vars
