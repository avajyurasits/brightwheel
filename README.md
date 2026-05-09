# Brightwheel Onboarding Triage

AI-powered message triage tool for Brightwheel's Onboarding team.

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
- Vercel for serverless deployment
- Anthropic Claude claude-sonnet-4-20250514 API
- No backend required — API key lives in Vercel env vars
