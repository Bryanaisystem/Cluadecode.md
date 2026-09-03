// Purpose: Builds a strict JSON-only Gemini prompt that reads the sitemap XML, decides
// sitemap-index vs. page-level sitemap, and picks the 3 most useful page URLs
// (homepage, main offer page, trust/differentiation page).
// Where it goes: after the sitemap fetch, on the status===1 branch.
// References an upstream node literally named "HTTP Request" — rename to match, or edit
// the $('HTTP Request') reference below.

const raw = $('HTTP Request').first().json.data ?? '';
const xml = String(raw);

const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());

const sitemap_blob = [
  locs.join(', '),
  '---',
  xml.replace(/\s+/g, ' ').trim()
].join('\n');

const prompt =
  "You are a technical research analyst processing XML sitemap data for a business website.\n" +
  "You are given the raw response body retrieved from requesting /sitemap.xml.\n" +
  "Use ONLY the provided sitemap data.\n" +
  "Do NOT use prior knowledge, assumptions, or external information.\n" +
  "If required information cannot be determined from the sitemap data, return null.\n\n" +
  "Business Website data: " + sitemap_blob + "\n\n" +
  "Instructions:\n" +
  "Analyze the provided sitemap response.\n" +
  "First, determine whether the response represents:\n" +
  "- a sitemap index (containing links to other sitemaps),\n" +
  "- a page-level sitemap (containing page URLs),\n" +
  "- or a non-sitemap response (HTML page, blocked response, or invalid content).\n\n" +
  "Decision Rules:\n" +
  "1) If the response is a sitemap index:\n" +
  "   - Select ONE best page-level sitemap URL (prefer page-sitemap.xml or similar; avoid post/category/tag if possible).\n" +
  "   - Output MUST be this exact JSON shape (all keys required):\n" +
  "   {\"sitemap_index\":\"<page sitemap url>\",\"mode\":2,\"url_1\":null,\"url_2\":null,\"url_3\":null}\n\n" +
  "2) If the response is already a page-level sitemap:\n" +
  "   - Select EXACTLY three URLs from the provided URLs only:\n" +
  "     url_1 = homepage (root URL / canonical homepage)\n" +
  "     url_2 = primary offer/service page\n" +
  "     url_3 = trust/differentiation page (about/contact/faq/how-it-works/suppliers)\n" +
  "   - Output MUST be this exact JSON shape (all keys required):\n" +
  "   {\"sitemap_index\":null,\"mode\":1,\"url_1\":\"<url>\",\"url_2\":\"<url>\",\"url_3\":\"<url>\"}\n\n" +
  "3) If invalid/non-sitemap:\n" +
  "   - Output MUST be this exact JSON shape (all keys required):\n" +
  "   {\"sitemap_index\":null,\"mode\":0,\"url_1\":null,\"url_2\":null,\"url_3\":null}\n\n" +
  "Output Requirements (STRICT):\n" +
  "- Output MUST be valid JSON.\n" +
  "- Output MUST be ONE JSON object ONLY.\n" +
  "- Do NOT include markdown, code fences, or extra text.\n" +
  "- Do NOT include arrays.\n" +
  "- Use null exactly as shown.\n" +
  "- All keys MUST be present exactly: sitemap_index, mode, url_1, url_2, url_3\n";

const escapedPrompt = prompt
  .replace(/\\/g, '\\\\')
  .replace(/"/g, '\\"')
  .replace(/\r?\n/g, '\\\\n');

return [
  {
    json: {
      prompt: escapedPrompt
    }
  }
];
