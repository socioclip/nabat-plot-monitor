// Flights Waypoint: recent fares from the Travelpayouts (Aviasales) Data API.
// Needs the TRAVELPAYOUTS_TOKEN environment variable.
// Prices are cached fares other travellers found recently, not live quotes.

const API = 'https://api.travelpayouts.com/aviasales/v3/prices_for_dates';
const IATA = /^[A-Z]{3}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

const AIRLINES = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat';
const EXTRA = { GF: 'Gulf Air', EK: 'Emirates', EY: 'Etihad Airways', QR: 'Qatar Airways', AI: 'Air India', SV: 'Saudia', G9: 'Air Arabia', FZ: 'flydubai', IX: 'Air India Express', '6E': 'IndiGo', QP: 'Akasa Air', XY: 'flynas', J9: 'Jazeera Airways', OV: 'SalamAir', WY: 'Oman Air', UL: 'SriLankan Airlines' };
let names = null;
async function airlineNames() {
  if (names) return names;
  const m = { };
  try {
    const txt = await (await fetch(AIRLINES)).text();
    for (const line of txt.split('\n')) {
      const c = (line.match(/("([^"]|"")*"|[^,]*)(,|$)/g) || []).map(x => x.replace(/,$/, '').replace(/^"|"$/g, ''));
      const code = c[3], name = c[1], active = c[7] === 'Y';
      if (!/^[A-Z0-9]{2}$/.test(code || '') || !name) continue;
      if (!m[code] || active) m[code] = name;
    }
  } catch (e) { /* fall back to codes */ }
  names = Object.assign(m, EXTRA);
  return names;
}

async function query(token, p) {
  const qs = new URLSearchParams({ sorting: 'price', limit: '30', unique: 'false', ...p });
  const r = await fetch(API + '?' + qs, { headers: { 'X-Access-Token': token, 'Accept-Encoding': 'gzip, deflate' } });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.success === false) {
    const err = new Error(data.error || data.message || 'HTTP ' + r.status);
    err.status = r.status;
    throw err;
  }
  return Array.isArray(data.data) ? data.data : [];
}

module.exports = async (req, res) => {
  const token = process.env.TRAVELPAYOUTS_TOKEN;
  if (!token) return res.status(503).json({ configured: false, error: 'Fare data is not connected (TRAVELPAYOUTS_TOKEN is not set).' });

  const q = req.query || {};
  const from = String(q.from || '').toUpperCase();
  const to = String(q.to || '').toUpperCase();
  const d1 = String(q.d1 || '');
  const d2 = String(q.d2 || '');
  const cur = /^[a-z]{3}$/i.test(q.cur || '') ? String(q.cur).toLowerCase() : 'aed';
  if (!IATA.test(from) || !IATA.test(to) || from === to) return res.status(400).json({ error: 'Use two different 3-letter airport codes.' });
  if (!DAY.test(d1) || (d2 && !DAY.test(d2))) return res.status(400).json({ error: 'Dates must look like 2026-11-25.' });
  const ret = !!d2;

  const base = { origin: from, destination: to, currency: cur, one_way: String(!ret) };
  try {
    // Exact dates first, then the whole month if nobody searched those days.
    let fares = await query(token, { ...base, departure_at: d1, ...(ret ? { return_at: d2 } : {}) });
    let match = 'exact';
    if (!fares.length) {
      fares = await query(token, { ...base, departure_at: d1.slice(0, 7), ...(ret ? { return_at: d2.slice(0, 7) } : {}) });
      match = 'month';
    }
    const an = await airlineNames();
    res.setHeader('cache-control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({
      configured: true,
      match: fares.length ? match : 'none',
      currency: cur.toUpperCase(),
      fares: fares.slice(0, 6).map(f => ({
        price: f.price,
        airline: f.airline,
        airlineName: an[f.airline] || f.airline,
        flight: f.flight_number,
        stops: f.transfers,
        returnStops: f.return_transfers,
        departs: f.departure_at,
        returns: f.return_at || null,
        minutes: f.duration_to || f.duration || null,
        minutesBack: f.duration_back || null,
        from: f.origin_airport || f.origin,
        to: f.destination_airport || f.destination
      }))
    });
  } catch (e) {
    const bad = e.status === 401 || e.status === 403;
    res.setHeader('cache-control', 'no-store');
    res.status(bad ? 503 : 502).json({ configured: !bad, error: bad ? 'The fare data token was rejected.' : 'Could not load fares right now.', detail: String(e.message).slice(0, 200) });
  }
};
