# Infrastructure Notes

- GCP project (VM/GCS/screenshot infra): `cwv-lessons`
- GCS bucket: `n8n-outreach-invfewq` (`n8n-outreach` was already taken)
- Stack: Google Cloud VM (us-east1-b) + Coolify + Docker + PostgreSQL + Redis + Traefik + FastAPI screenshot service + PM2
- n8n self-hosted via Coolify on the VM

## Real system reference (from the 3 live n8n workflow exports in `n8n/workflows/`)

This section documents what the actual, currently-built workflows do — as opposed to the
generic/theoretical version described in `context/lead-machine.md` and `n8n/code-nodes/`.
The course this business is built on teaches multiple valid alternatives at several
points; this is which alternative was actually picked, verified node-by-node from the
exported JSON.

**Gemini access method — standardized:** all three real workflows call Gemini through
**Vertex AI** (`aiplatform.googleapis.com`), authenticated via a **JWT service-account
flow** (n8n JWT node signs a claims object → exchanges it for a bearer token at
`oauth2.googleapis.com/token` → that token authorizes the Vertex `generateContent` call).
This is a deliberate, consistent choice — **not** a raw Gemini API key, and (with one
exception below) **not** the GCE VM metadata-server token endpoint either.

**⚠️ Two different GCP projects/service accounts are in use, and this needs your
decision:**
| Workflow | project_id | client_email |
|---|---|---|
| `My_workflow.json` (Role/Title Verification) | `sharp-kayak-452021-i2` | `n8n-outreach@sharp-kayak-452021-i2.iam.gserviceaccount.com` |
| `Variables workflow.json` (sitemap/vision/variable pipeline) | `project-95cd3570-f388-4183-9ec` | `n8n-automation@project-95cd3570-f388-4183-9ec.iam.gserviceaccount.com` |

Neither matches the `cwv-lessons` project documented above — `cwv-lessons` appears to be
solely the VM/GCS/screenshot-API project, separate from whichever project(s) actually
host the Vertex AI billing/service accounts. **Both workflows' JWT nodes point at the
same shared n8n credential, "JWT Auth account" (id `HAyFxiTyNsG7gBTW`)**, while each
workflow overrides the `iss` (issuer) claim in its `claimsJson` to a different service
account email. A JWT's signature only validates against the private key belonging to
the service account actually loaded into that credential — so **at most one of these
two project/service-account pairs can currently be authenticating successfully**; the
other is almost certainly failing silently at the token-exchange step. Check which
service account's key is actually loaded into "JWT Auth account" in n8n, and either
point both workflows at the same project/service account, or give each workflow its own
named JWT credential so they stop colliding.

**Mixed auth method inside `Variables workflow.json` itself:** most Gemini/Vertex calls
authorize using the JWT-derived token (from the node named `HTTP Request1`), but the
`mode: 2` sitemap-index fallback branch's Gemini call (`HTTP Request4`) instead
authorizes using the **VM metadata-server token endpoint**
(`http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token`,
node `HTTP Request9`) — the other course-taught alternative to the JWT flow, used
nowhere else in either workflow. Confirm whether this was intentional (e.g. the VM's
attached service account has the needed Vertex AI permissions and this branch was
patched in later) or a leftover from an earlier build pass.

**Two different Gemini model versions in `Variables workflow.json`:** sitemap parsing
and the vision/screenshot review both call `gemini-2.5-pro`; the final
outreach-variable-generation call (the "Upgraded Prompt Builder" step, `HTTP Request11`
/ `HTTP Request12`) calls **`gemini-3.1-pro-preview`** instead. `My_workflow.json`'s
role-verification call uses `gemini-2.5-flash`. Confirm whether running the newest
preview model only on the highest-value step is intentional, or an artifact of testing
that never got rolled back/forward consistently.

**Role verification uses Gemini's built-in search grounding, not Brave Search:**
`My_workflow.json`'s Vertex call includes `"tools": [{"googleSearch": {}}]` directly in
the request body — the real system relies entirely on Gemini's native Google Search
grounding tool for both role verification and company research. There is no Brave
Search or SerpAPI node anywhere in any of the three real workflows, despite
`context/lead-machine.md` describing "Brave Search + Gemini" as the person-finding
method. The real system chose the Gemini-only path from the course's alternatives, with
no fallback chain currently built.

**Screenshot API — two different IPs referenced, one is likely stale:**
`Variables workflow.json` calls the screenshot API at two different IPs depending on
branch: `http://35.211.112.200:3333/screenshot` on the direct sitemap-parse path
(`HTTP Request5`), and `http://35.223.4.220:3333/screenshot` on the sitemap-index
fallback path (`HTTP Request7`). Per the VM-IP-changes-on-restart gotcha below, at
least one of these is almost certainly left over from before a VM restart. Confirm the
VM's current external IP and update whichever branch is stale — or reserve a static IP
so this stops silently breaking on every restart.

**Gmail send target is currently hardcoded to a test inbox:** every `sendTo` field
across all 80 Gmail nodes in `Outreach System.json` (52 of them literal `sendTo` values)
is hardcoded to `bryandalmeida1000@gmail.com` — none reference the lead's actual email
dynamically. This is consistent with the restart plan's "validate manually before
automating" principle (Step 8), but it means the exported workflow, run as-is, sends
everything to Bryan's own inbox, not to prospects. Before this goes live, `sendTo` needs
to point at the lead's real email column (`Email Adress` — see the column-name note
below) on every send/reply node.

**Real lead-tracking sheet columns differ from the schema previously documented below.**
Verified directly from the three workflows' Google Sheets nodes (all pointing at the
same sheet: `1iF0Hi3oukHaW8Osp7JeHEsYy1nu-PE4VyYbvIkm-PHQ`, tab "Hunter.io 3/2",
gid `635214534`):
- `Email Adress` — not `email_address` (typo carried through the whole system; the
  automation code must reference it literally as spelled)
- `Done-Research` — hyphenated, not `Done_Research` as listed below
- `Title`, `Title catagory` (typo for "category"), `Confidence` — written by
  `My_workflow.json`, not in the schema list below at all
- `Unfit?`, `Stop-30` — filter/kill-switch columns used by `Variables workflow.json`
  and `Outreach System.json` respectively (`Stop-30` gates the initial send: if it
  equals `"yes"`, that lead is skipped) — neither is in the schema list below
- `subject_line` — not `subject_label`; `review_asset_exists` — not
  `preview_asset_exists` (that name is only the in-code variable, mapped to this column
  on write); `recogonizable_reason` — typo, missing the second "i," not
  `recognizable_reason`

Treat the schema list further down this file as aspirational/original-design, and this
list as what the sheet actually has today. Reconcile them deliberately rather than
guessing which is current when writing new automation against this sheet.

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
