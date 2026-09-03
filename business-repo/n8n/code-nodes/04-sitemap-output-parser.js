// Purpose: Takes Gemini's raw API response (possibly chunked across multiple candidate
// parts) and stitches it into one clean JSON object: sitemap_index, mode, url_1, url_2, url_3.
// Where it goes: immediately after the Gemini API call node from 03-sitemap-prompt-builder.js
// Downstream: branch on `mode` — 2 = re-fetch sitemap_index and loop back through steps
// 02-04; 1 = you have your 3 URLs, proceed to screenshotting/vision review; 0 = no usable
// sitemap, skip Written Path for this lead or fall back to another method.

const items = $input.all();

let text = '';
for (const it of items) {
  const parts = it.json?.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    if (typeof p.text === 'string') text += p.text;
  }
}

text = text.trim();
text = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();

const m = text.match(/\{[\s\S]*\}/);
if (!m) {
  return [{
    json: {
      sitemap_index: null,
      mode: null,
      url_1: null,
      url_2: null,
      url_3: null,
      _raw: text
    }
  }];
}

let jsonStr = m[0].trim();

let obj;
try {
  obj = JSON.parse(jsonStr);
} catch (e) {
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
  obj = JSON.parse(jsonStr);
}

const sitemap_index = typeof obj.sitemap_index === 'string' ? obj.sitemap_index : null;
const mode = typeof obj.mode === 'number' ? obj.mode : null;
const url_1 = typeof obj.url_1 === 'string' ? obj.url_1 : null;
const url_2 = typeof obj.url_2 === 'string' ? obj.url_2 : null;
const url_3 = typeof obj.url_3 === 'string' ? obj.url_3 : null;

return [{
  json: { sitemap_index, mode, url_1, url_2, url_3 }
}];
