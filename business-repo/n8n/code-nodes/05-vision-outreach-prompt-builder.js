// Purpose: Combines the vision/screenshot-review output (issues found per page) with
// live web research about the company into a prompt asking Gemini to pick ONE outreach
// angle and generate the cold-email variables.
// Where it goes: after a vision-review step (screenshots the 3 sitemap URLs via the
// Screenshot API, then an AI model reviews them). Expects that output in
// $input.first().json.candidates[0].content.parts[0].text as a JSON string with a
// `pages` array. Also references "Code in JavaScript1" (must output website_domain —
// this is 01-website-parser.js, rename to match) and "Get row(s) in sheet" (must output
// name, first_name, last_name).
//
// Real-implementation note: in the live `Variables workflow.json`, this prompt is sent
// via Vertex AI using **gemini-3.1-pro-preview** — a different, newer model than the
// gemini-2.5-pro used earlier in the same workflow for sitemap parsing and vision
// review. Confirm whether running the newest preview model only on this
// highest-value step is intentional. Auth is the same JWT service-account flow as the
// rest of the pipeline (see infra/infra-notes.md).

const rawText = $input.first().json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
let s = String(rawText).trim();

s = s.replace(/```json/gi, '').replace(/```/g, '').trim();

const m = s.match(/\{[\s\S]*\}/);
if (!m) return [{ json: { prompt: "No vision JSON found." } }];

let parsed = JSON.parse(m[0].trim());
const pages = Array.isArray(parsed.pages) ? parsed.pages : [];

const cleanPages = pages.map(p => ({
  url: p.url ?? null,
  verdict: p.verdict ?? null,
  issues: Array.isArray(p.issues) ? p.issues.slice(0, 5) : [],
  quick_wins: Array.isArray(p.quick_wins) ? p.quick_wins.slice(0, 5) : []
}));

const pagesJson = JSON.stringify(cleanPages);

const prompt =
  "You are a research analyst generating short outreach variables for cold email.\n" +
  "You are given VERIFIED website page issues from a vision review. Those issues are the ONLY allowed website problems.\n" +
  "Use live web search to research the COMPANY (what it is, what it offers, locations, credibility signals). Prefer third-party sources.\n" +
  "Do NOT invent new website problems. Only use the vision issues provided.\n" +
  "If something cannot be verified via web sources, use null.\n\n" +
  "COMPANY:\n" +
  "- Domain: " + $('Code in JavaScript1').first().json.website_domain + "\n" +
  "- Company Name: " + $('Get row(s) in sheet').first().json.name + "\n" +
  "- Lead Name: " + $('Get row(s) in sheet').first().json.first_name + " " + $('Get row(s) in sheet').first().json.last_name + "\n\n" +
  "VISION_PAGES_JSON:\n" +
  pagesJson +
  "\n\n" +
  "TASK:\n" +
  "1) Pick ONE best page to anchor outreach.\n" +
  "2) If issues exist: Pick ONE best website_problem directly from the vision issues list.\n" +
  "3) If website is 'fine' (no issues): Use web search to find a business gap (e.g., weak reviews, missing social proof, or outdated info). Use this as the website_problem to show how they can improve.\n" +
  "4) Do quick web research (third-party preferred) to support outreach context.\n\n" +
  "OUTPUT REQUIREMENTS (STRICT):\n" +
  "- Output MUST be valid JSON only. No markdown. No code fences. No extra keys.\n" +
  "- Return exactly these keys: page, website_problem, recognizable_reason, consequence_mechanics, preview_asset_exists, review_time, micro_yes, subject_label\n" +
  "- page = short page name (Home/Menu/About etc)\n" +
  "- website_problem = one line (technical bug from vision OR business gap from search)\n" +
  "- recognizable_reason = why a visitor notices this gap\n" +
  "- consequence_mechanics = how this specific gap hurts revenue or bookings\n" +
  "- preview_asset_exists = true/false/null based on web research\n" +
  "- review_time = integer minutes or null\n" +
  "- micro_yes = <= 10 words\n" +
  "- subject_label = 2-5 words\n";

const escapedPrompt = prompt
  .replace(/\\/g, '\\\\')
  .replace(/"/g, '\\"')
  .replace(/\r?\n/g, '\\\\n');

return [{ json: { prompt: escapedPrompt } }];
