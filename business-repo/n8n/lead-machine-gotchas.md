# Lead Finder Machine — API gotchas and rate limits

Specific, non-obvious facts pulled from the full build tutorial (not general n8n
knowledge — these are the traps that actually cost debugging time in this course).

## Google Places API
- Unsigned requests are capped at **25,000/day**.
- Pagination: when following a `next_page_token`, the follow-up request only needs the
  **API key + the token** — do NOT resend the original query/location/radius params.
- Google's response structure for this API **changes over time** — if field paths break,
  check whether Google altered the schema before assuming your workflow is wrong.
- Use a boolean tracking column (e.g. `Person Searched?`) on each row so re-running the
  workflow doesn't re-spend API calls on businesses already processed.

## Google Cloud OAuth consent screen — real trap
Even if you created the project and own the API key, if the OAuth consent screen is in
**"Testing" publishing status**, only explicitly-listed test users can authenticate.
**You must add your own Google account email under "Add users"** on the consent screen
config, or your own auth will fail with no obvious explanation.

## Gemini API
- Free tier: **5 requests per minute (RPM)** on gemini-2.5-flash — batch calls (e.g. 5
  items, then a `Wait` node) or you'll hit 429 rate-limit errors on any real-volume run.
- Native Gemini node output nests the JSON deeper than an AI Agent node does — parse from
  `content.parts[0].text`, strip markdown code fences, then `JSON.parse()`.
- OpenAI's node nests output differently again — `output[0].content[0].text`. **Different
  providers need different parsing code** even with an identical prompt.

## Brave Search
- Free tier: **1 request/second, 2,000 requests/month total** (shared across all keys on
  the account).
- Not a built-in n8n node — requires installing it as a **community node** first
  (Settings → Community nodes).

## SerpAPI (fallback option)
- Free tier: **250 searches/month, non-commercial use only**.

## OpenRouter (model aggregator, optional)
- 400+ models across 70+ providers behind one API. Pay-as-you-go tier charges a
  **5.5% platform fee** on top of usage.

## Recommended provider fallback order
Gemini (free, most generous) → Brave Search → SerpAPI → OpenAI (paid, but simplest —
no rate-limit juggling, worth it if reliability matters more than cost).

## Google Sheets — data-corruption trap
Values written into cells that start with certain characters (e.g. `=`) can be
**misread by Google Sheets as a formula** rather than plain text. Watch for this when
writing AI-generated or scraped text into sheet cells — sanitize/prefix if needed.

## Hunter.io Bulk/Domain Search
- Set Department filters to **Executive Management + Management** to bias results
  toward actual decision-makers instead of generic staff.
- When a domain returns **zero emails**, still mark that row's tracking column as
  searched (e.g. `Hunter Search = true`) — otherwise the workflow will keep re-querying
  it (and burning API credits) on every future run.
- One business can return multiple contacts — split into one row per contact in a
  *separate* results sheet rather than trying to force multiple people into one business
  row.

## Vercel deployment (from the website-prototype build)
**Real gotcha:** Vercel can silently reject a new deployment if the git commit
author/email isn't recognized as having access to that Vercel project — common on the
free tier after cloning/switching machines. **Fix:**
```
git config user.name "your-github-username"
git config user.email "your-github-email"
```
Then make any small commit — it should now deploy correctly. Check Vercel → Deployments
to confirm.

## Final QC step before any send
Run the finished contact list through a bulk email-verification tool (CSV upload,
choose the email column, Standard/Ultra/Legacy mode) before outreach — filters
undeliverable addresses and protects sender reputation. This is the same verification
step referenced in `context/lead-machine.md`.
