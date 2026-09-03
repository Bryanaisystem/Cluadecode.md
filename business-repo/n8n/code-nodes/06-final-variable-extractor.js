// Purpose: Parses the Gemini response from 05-vision-outreach-prompt-builder.js into the
// final clean set of outreach variables used to fill email templates.
// Where it goes: immediately after that Gemini API call node.

const raw =
  $input.first().json?.candidates?.[0]?.content?.parts?.[0]?.text ??
  $input.first().json?.text ??
  '';

let text = String(raw).trim();

text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

const match = text.match(/\{[\s\S]*\}/);
if (!match) {
  return [{ json: { error: 'No JSON object found', raw_text: text } }];
}

let obj;
try {
  obj = JSON.parse(match[0].trim());
} catch (e) {
  const fixedStr = match[0].trim().replace(/,\s*([}\]])/g, '$1');
  obj = JSON.parse(fixedStr);
}

return [{
  json: {
    page: obj.page ?? null,
    website_problem: obj.website_problem ?? null,
    recognizable_reason: obj.recognizable_reason ?? null,
    consequence_mechanics: obj.consequence_mechanics ?? null,
    preview_asset_exists: typeof obj.preview_asset_exists === 'boolean' ? obj.preview_asset_exists : null,
    review_time: Number.isFinite(obj.review_time) ? obj.review_time : null,
    micro_yes: obj.micro_yes ?? null,
    subject_label: obj.subject_label ?? null,
    sources: $input.first().json?.groundingMetadata?.webSearchQueries ?? []
  }
}];
