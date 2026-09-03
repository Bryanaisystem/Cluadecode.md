# Business Repo — AI Automation & Sales System

This repo is the working context + automation code for the "Never Miss a Lead" home-services
AI automation business. Connect this repo to Claude Code on the web (claude.ai/code) to work
against it directly.

## Structure

- `CLAUDE.md` — auto-loaded context index. Start here every session.
- `context/` — business logic: pain-point framework, email framework, cadence/scripts,
  the full Decision Call sales-call framework, lead-machine pipeline, website approach,
  current restart plan.
- `n8n/code-nodes/` — individual, documented Code node scripts for the Written Path
  outreach workflow, in pipeline order (01 → 08).
- `n8n/lead-machine-gotchas.md` — API rate limits, OAuth traps, and deployment gotchas
  pulled from the full build tutorial — hard-won specifics, not generic n8n knowledge.
- `n8n/workflows/` — full exported n8n workflow JSON (export from n8n: workflow menu →
  Download). Empty until you export your first working version.
- `infra/` — GCP VM setup script, the FastAPI screenshot service, and infra gotchas.
- `templates/` — fillable email templates matching the Email X / Variable Y framework.

## Rules
- Never commit real lead data, API keys, service account JSON, or `.env` files — see
  `.gitignore`. Leads live in Airtable/Google Sheets; secrets live in n8n credentials
  or a secrets manager.
- Keep this repo **private** on GitHub — it contains business strategy and infra details.
- Update `context/restart-plan.md` as steps get completed — that's the single source of
  truth for "where are we right now."
