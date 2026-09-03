// Purpose: After an HTTP Request node fetches <website_clean>sitemap.xml, checks whether
// the response is a usable sitemap vs. an HTML error page / redirect / oversized response.
// Where it goes: right after the sitemap-fetch HTTP Request node. Reads $json.data.
// Output: { status: 1 } valid sitemap, or { status: 2 } not usable. Wire into an If/Switch.

const body = $json.data || '';
const sizeBytes = Buffer.byteLength(body, 'utf8');
const MAX_SIZE = 1.5 * 1024 * 1024; // 1.5 MB hard cutoff

const text = body.slice(0, 5000).toLowerCase();

const looksLikeHtml =
  text.includes('<!doctype html') ||
  text.includes('<html') ||
  text.includes('<head') ||
  text.includes('<body');

if (sizeBytes > MAX_SIZE || looksLikeHtml) {
  return [{ status: 2 }];
}

const looksLikeSitemap =
  text.includes('<?xml') &&
  (text.includes('<sitemapindex') ||
   text.includes('<urlset') ||
   text.includes('<url><loc>'));

if (looksLikeSitemap) {
  return [{ status: 1 }];
}

return [{ status: 2 }];
