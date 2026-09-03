# AI Automation & Sales Business — Context Index

Read this first. Detail lives in the linked files below, pulled in automatically.

## Quick orientation
Bryan (+ partner Jon) is building an AI automation business selling complete operational
systems to service businesses. Core offer: "Never Miss a Lead" — 24/7 AI call answering,
missed-call recovery, instant booking, CRM automation, follow-up sequences. Position as
revenue-recovery infrastructure, never as "buy an AI chatbot." Primary niche: home services
(HVAC, plumbing, electrical, roofing). Pre-revenue, in a full restart as of Aug 2026 — using
existing frameworks rather than redesigning them. Bryan is a sales beginner with a
business/automation background (not traditional coding) — default to no-code/low-code
(n8n, Make.com, Airtable) unless asked for custom code.

## Context files
@./context/restart-plan.md
@./context/offer-blueprint.md
@./context/email-framework.md
@./context/cadence-and-scripts.md
@./context/decision-call.md
@./context/lead-machine.md
@./context/website-approach.md
@./infra/infra-notes.md

## Where things live
- `n8n/code-nodes/` — individual Code node scripts, in pipeline order, fully documented
- `n8n/lead-machine-gotchas.md` — API rate limits, OAuth traps, deployment gotchas
- `n8n/workflows/` — exported full workflow JSON
- `infra/` — GCP VM setup script + screenshot API service
- `templates/` — ready-to-fill email templates

## Voice rules for anything written to a prospect
Short, human, concise, lightly humorous where it fits, low-pressure, specific to the niche,
not overly polished, never sounds AI-generated. No hype words. One friction per email. If
you can't explain the consequence without inventing a number, the friction wasn't
understood well enough — don't force it.

## Never do
Never commit real lead data (names/emails/phone numbers), API keys, service account JSON,
or `.env` files to this repo. Leads live in Airtable/Google Sheets; secrets live in n8n
credentials or a secrets manager. See `.gitignore`.
