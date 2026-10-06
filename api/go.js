// Flights Waypoint: send a traveller to a booking site through a Travelpayouts partner link.
// Uses the Travelpayouts Partner Links API with TRAVELPAYOUTS_TOKEN.
// If the brand program is not approved yet (or the API fails), it falls back to the plain link,
// so the button always works. Only known booking sites are allowed (no open redirect).

const MARKER = process.env.TP_MARKER || '786107';   // public partner ID
const TRS = process.env.TP_TRS || '581979';         // Travelpayouts project ID (Sarfaraz27)
const ALLOWED = [/(^|\.)trip\.com$/, /(^|\.)booking\.com$/, /(^|\.)almosafer\.com$/, /(^|\.)makemytrip\.com$/];
const cache = new Map();

async function convert(url, subId) {
  const key = url + '|' + subId;
  if (cache.has(key)) return cache.get(key);
  const token = process.env.TRAVELPAYOUTS_TOKEN;
  if (!token) return { url, code: 'no-token' };
  try {
    const r = await fetch('https://api.travelpayouts.com/links/v1/create', {
      method: 'POST',
      headers: { 'X-Access-Token': token, 'content-type': 'application/json' },
      body: JSON.stringify({ trs: Number(TRS), marker: Number(MARKER), shorten: false, links: [{ url, sub_id: subId }] })
    });
    const data = await r.json().catch(() => ({}));
    const link = data?.result?.links?.[0] || {};
    const out = link.code === 'success' && link.partner_url ? { url: link.partner_url, code: 'success' } : { url, code: link.code || 'http-' + r.status, message: link.message || data?.error || '' };
    if (out.code === 'success') { if (cache.size > 500) cache.clear(); cache.set(key, out); }
    return out;
  } catch (e) {
    return { url, code: 'error' };
  }
}

module.exports = async (req, res) => {
  const q = req.query || {};
  let target;
  try { target = new URL(String(q.u || '')); } catch { return res.status(400).json({ error: 'Missing or invalid link.' }); }
  if (target.protocol !== 'https:' || !ALLOWED.some(rx => rx.test(target.hostname))) return res.status(400).json({ error: 'That site is not supported.' });
  const subId = String(q.s || 'flights-waypoint').replace(/[^\w-]/g, '').slice(0, 40);
  const out = await convert(target.href, subId);
  res.setHeader('cache-control', 'no-store');
  if (q.debug) return res.status(200).json({ affiliate: out.code === 'success', code: out.code, message: out.message || '' });
  res.statusCode = 302;
  res.setHeader('Location', out.url);
  res.end();
};
