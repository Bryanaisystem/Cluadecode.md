# Lead Finder Machine — Pipeline

1. **Business discovery**
   - LinkedIn Sales Navigator: filter by industry, company size, geography, job title, business type
   - Scrape Ninja: pull public LinkedIn/website data
   - Home-services signal to target: currently operating, no easy online booking, ~3–7 new reviews/month (active demand + likely slow-response problem)
   - n8n + Google Places API workflow: paginated search → dedupe (Google Sheets `=COUNTIF(B:B,B1)>1` conditional formatting, or n8n Aggregate/Split nodes) → structured rows

2. **Person-finding** (per business)
   - Brave Search + Gemini to identify the actual decision-maker (owner/manager)
   - Hunter.io for email discovery/pattern matching
   - **Real implementation note:** the live `My_workflow.json` (Role/Title Verification)
     does not call Brave Search at all — it uses Gemini via Vertex AI with the built-in
     `googleSearch` grounding tool for the whole search-and-verify step, no separate
     search-API node. This is the Gemini-only alternative the course also teaches;
     there's no Brave/SerpAPI fallback chain currently built anywhere in the real
     pipeline. See `infra/infra-notes.md` for the full real-vs-documented breakdown.

3. **Email verification**
   - Run the full list through a verification tool before any send (Standard/Ultra/Legacy mode trade-off: speed/cost vs. thoroughness)
   - Output columns typically include: email, domain, organization, headcount, country/state/city, confidence score, pattern, first name
   - This step is non-negotiable — protects sender reputation and deliverability

4. **Role verification** (ongoing, not just at intake)
   - Gemini + Google Search grounding to confirm someone still holds the title before outreach — prevents messaging former employees or wrong titles
   - Split "extraction" and "classification" into two separate AI steps for reliability; return `NA` (not `null`) when no reliable match is found

5. **Output** → structured lead data into Airtable / a CRM / n8n, ready for the outreach engine (see email-framework.md and cadence-and-scripts.md)
