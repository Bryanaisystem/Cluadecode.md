// Purpose: Cleans a raw `website` value from the leads sheet (stray whitespace, invisible
// unicode, extra text) and extracts a normalized domain + clean root URL.
// Where it goes: first Code node after "Get row(s) in sheet". Expects item.json.website
// and item.json.row_number on each input item.

return items.map(item => {
  let raw = String(item.json.website || '');

  raw = raw
    .replace(/\u00A0/g, ' ') // nbsp
    .replace(/\u200B/g, '') // zero-width space
    .replace(/\u200C/g, '') // zero-width non-joiner
    .replace(/\u200D/g, '') // zero-width joiner
    .replace(/\uFEFF/g, '') // BOM
    .trim();

  const tokenMatch = raw.match(/https?:\/\/[^\s]+|[a-z0-9.-]+\.[a-z]{2,}(\/[^\s]*)?/i);
  const token = (tokenMatch ? tokenMatch[0] : raw).trim();

  let host = '';
  const m1 = token.match(/^https?:\/\/([^\/?#\s]+)/i);
  if (m1 && m1[1]) {
    host = m1[1];
  } else {
    const m2 = token.match(/^([a-z0-9.-]+\.[a-z]{2,})(?:[\/?#]|$)/i);
    if (m2 && m2[1]) host = m2[1];
  }

  const website_domain = host.replace(/^www\./i, '').toLowerCase();
  const website_clean = website_domain ? `https://${website_domain}/` : '';

  return {
    json: {
      row_number: item.json.row_number,
      website_clean,
      website_domain
    }
  };
});
