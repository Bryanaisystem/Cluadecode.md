# Infrastructure Notes

- GCP project: `cwv-lessons`
- GCS bucket: `n8n-outreach-invfewq` (`n8n-outreach` was already taken)
- Stack: Google Cloud VM (us-east1-b) + Coolify + Docker + PostgreSQL + Redis + Traefik + FastAPI screenshot service + PM2
- n8n self-hosted via Coolify on the VM

## Instantly.ai warm-up settings (recommended starting values)
- Increase per day: 4
- Daily warmup limit: 50
- Disable slow warmup: leave enabled (per course default)
- Reply rate: ~30–40%

## Gmail → n8n OAuth2 setup (for the reply-checker / send workflows)
1. Google Cloud Console → APIs & Services → Credentials → Create Credentials → OAuth
   Client ID → Application type = Web application.
2. Fill in Authorized JavaScript origins and Authorized redirect URIs — the redirect
   URI is required, not optional (it ends in `/rest/oauth2-credential/callback`).
3. In n8n, open the Gmail node's OAuth2 credential dialog, copy its generated OAuth
   Redirect URL, and paste that exact value into Google Cloud's "Authorized redirect
   URIs" field. Save in Google Cloud — this generates a Client ID and Client Secret.
4. Paste the Client ID and Client Secret back into the n8n Gmail credential. Connect
   using = OAuth2 (recommended), not Service Account. Allowed HTTP Request Domains = "All".
5. Test with a simple workflow: manual trigger → Gmail node → "Send a message" action.

**Deliverability setting — turn this off:** on the Gmail "Send a message" node, under
Options/"Add Field", find **"Append n8n Attribution" and disable it.** Left on, it adds
a visible "This email was sent automatically with n8n" footer to every outreach email —
turning it off keeps outbound mail looking personally sent.

**Testing technique:** to test the reply-classifier realistically, turn on Gmail's real
**Settings → Vacation Responder** on a test inbox to trigger a genuine auto-reply (more
realistic than hand-writing a fake one), then manually reply in your own words to test
the real-human-reply path. Remember to turn the vacation responder back off after testing.

## Lead-tracking Google Sheet — column schema (must match exactly)
Lead source data: `name`, `formatted_address`, `formatted_phone_number`, `website`
(must stay lowercase — automation code references it literally).
Contact data: `first_name`, `last_name`, `position`, `email_address`.
AI/automation-generated: `page`, `website_problem`, `recognizable_reason`,
`consequence_mechanics`, `preview_post_reply`, `review_time`, `micro_yes`,
`subject_label`, `Pitch`, `Follow-up 1`, `Follow-up 2`, `Follow-up 3`, `Issues`,
`ThreadID`, `MessageID`, `Date-Research`, `Done_Research`, `Checked`, `Reply`.

## Known gotchas
- **Service account keys blocked:** post-May-2024 GCP accounts block service account JSON key creation via org policy. Use Application Default Credentials (ADC) or the VM metadata server token endpoint instead.
- **Always add `--scopes=cloud-platform`** when creating/updating the VM's service account, or Cloud Storage calls will silently fail.
- **VM IP changes on restart:** if the `sslip.io` domain routing breaks after a restart, check whether the domain still points to the old external IP. Fix: update routing to the current IP. Long-term fix: reserve a static external IP.
- **Never delete these Docker volumes during cleanup:** `coolify-db`, `coolify-redis`, n8n data volumes, PostgreSQL, Redis. Workflows/credentials/execution history live in persistent volumes, not disposable container layers. Set a Google Cloud Monitoring alert at ~70% disk usage (Console → Monitoring → Alerting → Create Policy) instead of reactive cleanup.
