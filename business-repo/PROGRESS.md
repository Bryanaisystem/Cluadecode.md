# PROGRESS — Restart Plan Tracker

**Current Status:** Step 1 — Infrastructure Audit. In progress (just started; see Step 1 checklist below).

This file is the single source of truth for where the restart stands (superseding the
"Current decision point" note in `context/restart-plan.md`). Update it — check boxes,
add sub-tasks, edit the Current Status line — every time a task finishes or a decision
gets made. Don't wait to be asked.

---

## Step 1 — Audit existing infrastructure rather than rebuild

Goal: confirm what already works before touching anything, so the restart reuses
infra instead of quietly rebuilding it.

- [ ] Confirm GCP project `cwv-lessons` is still accessible (billing active, IAM access
      intact) — `infra/infra-notes.md`
- [ ] Confirm the GCP VM (us-east1-b) boots and is reachable via SSH
- [ ] Check whether the VM's external IP has changed since last use — if the `sslip.io`
      domain routing is broken, either repoint it or reserve a static external IP
      (documented as a known gotcha in `infra/infra-notes.md`)
- [ ] Confirm Coolify is running on the VM and reachable via its dashboard
- [ ] Confirm the n8n instance (self-hosted via Coolify) is reachable and login works
- [ ] Verify none of the protected Docker volumes were lost (`coolify-db`,
      `coolify-redis`, n8n data, PostgreSQL, Redis) — workflows/credentials/execution
      history live only in these, per `infra/infra-notes.md`
- [ ] Check current disk usage on the VM; if no GCP Monitoring alert exists at ~70%
      usage, create one now (Console → Monitoring → Alerting → Create Policy)
- [ ] Confirm the screenshot API is still running under PM2
      (`infra/screenshot-api/app.py` + `ecosystem.config.cjs`) and responds on port 3333
      — test with the curl command in `infra/setup-vm.sh` step 7
- [ ] Confirm GCS bucket `n8n-outreach-invfewq` is still reachable and the service
      account has `cloud-platform` scope (silent-failure gotcha in `infra/infra-notes.md`)
- [ ] Confirm the firewall rule `allow-screenshot-api-3333` still exists and is scoped
      sensibly (setup script opens `0.0.0.0/0` — decide whether to restrict
      `--source-ranges` now that this is a real restart, not a course exercise)
- [ ] Re-verify Gmail OAuth2 credential in n8n still authenticates (tokens can expire)
      — re-run the OAuth setup in `infra/infra-notes.md` if not
- [ ] Re-confirm "Append n8n Attribution" is still disabled on the Gmail send node
      (silently re-enables on credential/node resets — check, don't assume)
- [ ] Re-confirm the OAuth consent screen still has the right test users listed if still
      in "Testing" publishing status (`n8n/lead-machine-gotchas.md`)
- [ ] Check Instantly.ai account status and warm-up settings still match the recommended
      values (per-day increase 4, daily limit 50, reply rate 30–40%) if this account is
      still the sending account
- [ ] Individually test each of the 8 pipeline code nodes (`n8n/code-nodes/01` through
      `08`) against one sample lead row end-to-end — Google's API response shapes are
      known to drift over time (`n8n/lead-machine-gotchas.md`), and stale node names
      (e.g. `01-website-parser.js` expects to be literally named "Code in JavaScript1",
      `03-sitemap-prompt-builder.js` expects an upstream node literally named
      "HTTP Request") may have broken if the workflow was renamed since last use
- [ ] Confirm `n8n/workflows/` is genuinely empty because no full workflow was ever
      exported (per README.md) — if a working version exists only inside the n8n UI and
      was never exported, export it now as the first real backup
- [ ] Confirm the lead-tracking Google Sheet still exists and its columns exactly match
      the schema in `infra/infra-notes.md` — automation code references column names
      literally, including required lowercase (`website`)
- [ ] Check remaining quota/credits on every API in the pipeline before relying on them:
      Google Places (25,000/day unsigned cap), Gemini free tier (5 RPM on
      gemini-2.5-flash), Brave Search (2,000/month total, community node install),
      SerpAPI (250/month, non-commercial only), Hunter.io balance, and the bulk
      email-verification tool balance — all documented in `n8n/lead-machine-gotchas.md`
- [ ] Create a `.gitignore` for this repo — `CLAUDE.md` and `README.md` both instruct
      "never commit real lead data / API keys / service account JSON / `.env` files —
      see `.gitignore`," but no `.gitignore` currently exists in the repo (verified via
      `git ls-files`); this is a real gap, not just documentation drift
- [ ] Confirm this repo is actually set to **private** on GitHub (`README.md` rule)
- [ ] Write up a short infra audit summary in **Decisions & Notes** below: what's
      healthy, what's broken, what needs fixing before Step 2 starts

## Step 2 — Lock one sub-niche and metro area

- [ ] Compare HVAC, plumbing, electrical, and roofing against the 4 pain lanes (time,
      money, risk, reputation) in `context/offer-blueprint.md` — pick the sub-niche with
      the clearest, most quantifiable pain, not the broadest one
- [ ] Cross-check the chosen sub-niche against the demand signal from
      `context/lead-machine.md` step 1: currently operating, no easy online booking,
      ~3–7 new reviews/month
- [ ] Pick one metro area — factor in population/business density (enough volume for a
      50–100 lead pull), competitive saturation, and whether Google Places coverage is
      solid there
- [ ] Sanity-check the pick against the framing guidance in
      `context/website-approach.md` (messy/broken sites → lead with pain; polished
      brands → lead with outcome) — confirm the niche/metro combo will actually produce
      enough messy-site targets for the Written Path outreach to work
- [ ] Record the final sub-niche + metro area, and the reasoning, in **Decisions & Notes**

## Step 3 — Pull a small, targeted prospect list (50–100 leads)

- [ ] Business discovery: run LinkedIn Sales Navigator filtered by the locked
      industry/geography/company size/job title (`context/lead-machine.md` step 1)
- [ ] Business discovery (parallel/backup path): run the n8n + Google Places API
      workflow — paginated search, remembering the pagination gotcha (follow-up
      requests need only the API key + `next_page_token`, not the original query params)
      per `n8n/lead-machine-gotchas.md`
- [ ] Dedupe results (Google Sheets `=COUNTIF(B:B,B1)>1` conditional formatting, or n8n
      Aggregate/Split nodes) per `context/lead-machine.md`
- [ ] Add a boolean "already searched" tracking column before running Person-finding, so
      re-runs don't re-spend API calls on the same businesses
      (`n8n/lead-machine-gotchas.md`)
- [ ] Person-finding: Brave Search + Gemini to identify the actual owner/manager per
      business (remember: Brave needs installing as a community node first; watch the
      1 req/sec, 2,000/month cap)
- [ ] Email discovery: Hunter.io Domain/Bulk Search, Department filter set to
      **Executive Management + Management** to bias toward real decision-makers
      (`n8n/lead-machine-gotchas.md`) — mark zero-result domains as searched too, so
      they aren't re-queried
- [ ] Role verification: Gemini + Google Search grounding pass to confirm the person
      still holds that title before outreach; split extraction and classification into
      two separate AI steps, return `NA` (not `null`) on no reliable match
      (`context/lead-machine.md` step 4)
- [ ] Run the completed list through full email verification (Standard/Ultra/Legacy
      trade-off) before any send — non-negotiable per `context/lead-machine.md` and
      `n8n/lead-machine-gotchas.md`
- [ ] Load final structured rows into the Google Sheet using the exact column schema in
      `infra/infra-notes.md`
- [ ] Confirm final verified count lands in the 50–100 range; if short, go back to
      business discovery rather than lowering verification standards

## Step 4 — Execute the existing email framework without redesigning it

- [ ] For each lead, run the Written Path pipeline to generate Variable Y fields:
      `01-website-parser.js` → sitemap fetch → `02-sitemap-check.js` →
      `03-sitemap-prompt-builder.js` → Gemini call → `04-sitemap-output-parser.js` →
      (branch on `mode`) → screenshot API + vision review →
      `05-vision-outreach-prompt-builder.js` → Gemini call →
      `06-final-variable-extractor.js`
- [ ] For leads where `mode: 0` comes back (no usable sitemap), decide per lead: skip
      the Written Path or fall back to another discovery method
      (`04-sitemap-output-parser.js` comment)
- [ ] Fill the Email X skeleton in `templates/email-templates.md` (Outreach #1) with the
      generated Variable Y fields for each lead
- [ ] Run every generated email through the pre-send 10-second checklist in
      `context/email-framework.md` before it goes out — if it fails, fix the variables,
      not the structure; if no real friction exists, don't force one
- [ ] **Gap to resolve:** `templates/email-templates.md` only has templates for
      Outreach #1, Follow-up #2, and Follow-up #4 — there is no Follow-up #3 template,
      but `context/cadence-and-scripts.md` runs a Day 1/3/5/7 cadence (4 touches) and
      `context/email-framework.md` describes Follow-up #3 rules ("the last useful
      nudge") without a template. Draft a Follow-up #3 template following those rules
      before Step 4 is actually usable end-to-end, and add it to
      `templates/email-templates.md`
- [ ] Confirm whoever is sending understands subject line rules and the Yes Flow
      (classify permission-yes / curious-yes / call-yes, respond fast, one instruction,
      one qualifying question) from `context/email-framework.md` before the first send

## Step 5 — Send the first cadence manually if needed

- [ ] Send Day 1 (Outreach #1) manually to the verified list
- [ ] Enforce the Anti-Spam Law manually: one touch per prospect per day, hard ceiling
      of 4 touches across days 1–7, no pathway-mixing in week one
      (`context/cadence-and-scripts.md`)
- [ ] Send Day 3 (Follow-up #2), Day 5 (Follow-up #3 — once drafted per Step 4 gap
      above), Day 7 (Follow-up #4) to anyone who hasn't replied
- [ ] Classify any response using the "what counts as engaged" definition in
      `context/cadence-and-scripts.md` (an objection or a real timeline counts; a read
      receipt or generic "thanks" doesn't)
- [ ] Branch immediately on reply: soft interest → booking micro-cadence; not
      interested → one polite close line, then stop
- [ ] Log send dates/times and outcomes manually (feeds Step 7 metrics)

## Step 6 — Handle replies using the existing call script

- [ ] Classify each reply's type before responding: real human reply, no reply, or
      auto-reply (out-of-office etc.) — this is exactly what `08-reply-checker.js`
      automates; run its logic manually/mentally for now per the "manual first"
      principle
- [ ] For a genuine "yes," classify which kind (permission-yes / curious-yes /
      call-yes) and respond per the Yes Flow rules in `context/email-framework.md`
      (fast, no extra selling, one clean view-only link, one qualifying question)
- [ ] Run the actual sales call using the full 13-step flow in
      `context/decision-call.md`: Call Control → Diagnose (5-layer discovery) →
      Quantify → Confirm → Qualify (priority/ability/timeline) → Decision Map →
      Value Frame → Challenge Skill (as needed) → Objection Prevention → Objection
      Handling (as needed) → Commitment Engineering → Proposal Discipline (only if
      necessary) → Post-Call Follow-Through → Exit Rules (if disqualifying)
- [ ] Apply the Pricing Gravity system from `context/decision-call.md`: real operating
      cost × 3 = floor, never go below it; use the worked roofing-website pricing
      example in `context/offer-blueprint.md` as the reusable pattern, recalculated for
      whatever is actually being delivered to this niche
- [ ] Send the Post-Call recap (trigger, diagnosed problem, quantified cost, outcome +
      timeframe, next step with date/time, ownership list) within the same day
- [ ] Log every call outcome (booked next step vs. exited) — feeds Step 7 metrics

## Step 7 — Track only core metrics in Airtable

- [ ] Stand up an Airtable base with only the core pipeline metrics: leads contacted →
      opens/replies → engaged (per the engaged definition) → calls booked → calls
      held → deals closed → revenue — deliberately minimal, not a mirror of every
      column in the Google Sheet
- [ ] Decide which existing Google Sheet columns (`infra/infra-notes.md` schema) map
      into Airtable vs. stay lead-generation-only detail that doesn't need tracking
      at the metrics layer
- [ ] Resist adding vanity metrics — if a number doesn't map to leads → prototype →
      outreach → sales → payment → delivery/retention (the core discipline chain in
      `context/cadence-and-scripts.md`), leave it out
- [ ] Record the final metric set and why, in **Decisions & Notes**

## Step 8 — Only automate in n8n after validating steps manually 3–5 times

- [ ] Track manual repetitions per step (list-pull, send cadence, reply-handling) —
      don't automate any one of them before it's been run manually 3–5 times
- [ ] Once validated, assemble the full n8n workflow wiring code nodes `01`–`08` in
      pipeline order, plus the screenshot API and Gemini/Gmail nodes between them
- [ ] Automate the Day 1/3/5/7 send cadence using Wait nodes fed by
      `07-randomizer.js`'s 3–7 delay output, so follow-ups don't look robotically timed
- [ ] Wire `08-reply-checker.js` into a Switch node right after the Gmail "Get Thread"
      node: real reply → stop sequence/alert operator; no reply → continue; auto-reply
      → treat as no reply, optionally suppress notifications
- [ ] Automate the metrics sync into the Airtable base from Step 7
- [ ] Export the finished, tested workflow JSON into `n8n/workflows/` (currently empty)
      so it's version-controlled, not just living in the n8n UI
- [ ] QA the automated pipeline against the same leads used in manual validation and
      confirm the outputs match before trusting it on a live batch

---

## Decisions & Notes

Log every real decision here as it's made — sub-niche/metro pick and why, pricing
floor chosen, anything that deviates from the frameworks above, and infra audit
findings. Keep entries dated.

- **2026-09-03** — Repo audit for `PROGRESS.md` creation surfaced two concrete gaps to
  fix during Step 1 / Step 4: (1) no `.gitignore` exists despite `CLAUDE.md`/`README.md`
  both referencing one for keeping lead data and secrets out of git; (2) the outreach
  cadence needs a Follow-up #3 email but `templates/email-templates.md` only has
  templates for Outreach #1, Follow-up #2, and Follow-up #4.
- **2026-09-03** — Restarting at Step 1 (infrastructure audit) rather than Step 2
  (niche/metro lock), per explicit direction — auditing what already exists before
  picking where to point it.
