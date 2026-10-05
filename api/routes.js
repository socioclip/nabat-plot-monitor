// Flights Waypoint: route search over the open airline-route-data dataset
// (github.com/Jonty/airline-route-data, updated weekly). No API key needed.
//   GET /api/routes?q=dub          -> airport suggestions
//   GET /api/routes?from=DXB&to=JFK -> direct, one-stop and two-stop options

const DATA_URL = 'https://raw.githubusercontent.com/Jonty/airline-route-data/main/airline_routes.json';
const LAYOVER_MIN = 90; // assumed connection time per stop
let cache = null, loading = null;

async function load() {
  if (cache && Date.now() - cache.at < 6 * 3600e3) return cache;
  if (loading) return loading;
  loading = (async () => {
    const r = await fetch(DATA_URL);
    if (!r.ok) throw new Error('dataset ' + r.status);
    const raw = await r.json();
    const ap = {}, out = {};
    for (const [code, a] of Object.entries(raw)) {
      if (!a || !a.iata) continue;
      ap[code] = { iata: code, name: a.name, city: a.city_name || '', country: a.country || '', cc: a.country_code || '', lat: +a.latitude, lon: +a.longitude, n: (a.routes || []).length };
      const m = new Map();
      for (const rt of a.routes || []) m.set(rt.iata, { min: rt.min || null, km: rt.km || null, carriers: (rt.carriers || []).map(c => c.name).filter(Boolean) });
      out[code] = m;
    }
    cache = { at: Date.now(), ap, out };
    loading = null;
    return cache;
  })().catch(e => { loading = null; throw e; });
  return loading;
}

const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function suggest(db, q) {
  const n = norm(q).trim();
  if (!n) return [];
  const res = [];
  for (const a of Object.values(db.ap)) {
    if (!a.n || /station|railway|bus terminal|heliport/i.test(a.name)) continue;
    let score = 0;
    const code = a.iata.toLowerCase(), city = norm(a.city), name = norm(a.name), ctry = norm(a.country);
    if (code === n) score = 100;
    else if (city === n) score = 80;
    else if (city.startsWith(n)) score = 60;
    else if (code.startsWith(n)) score = 50;
    else if (name.includes(n)) score = 30;
    else if (ctry.startsWith(n) && n.length > 3) score = 10;
    if (score) res.push([score + Math.min(a.n, 300) / 30, a]);
  }
  return res.sort((x, y) => y[0] - x[0]).slice(0, 8).map(([, a]) => pick(a));
}

const pick = a => ({ iata: a.iata, name: a.name, city: a.city, country: a.country, lat: a.lat, lon: a.lon });

function haversine(a, b) {
  const R = 6371, t = Math.PI / 180;
  const dLat = (b.lat - a.lat) * t, dLon = (b.lon - a.lon) * t;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

function leg(db, f, t) {
  const r = db.out[f] && db.out[f].get(t);
  if (!r) return null;
  const km = r.km || haversine(db.ap[f], db.ap[t]);
  return { from: f, to: t, min: r.min || Math.round(km / 13 + 30), km, carriers: r.carriers };
}

function option(db, legs) {
  const flying = legs.reduce((s, l) => s + l.min, 0);
  const total = flying + LAYOVER_MIN * (legs.length - 1);
  const km = legs.reduce((s, l) => s + l.km, 0);
  // an airline that flies every leg = can usually be booked as one ticket
  let same = new Set(legs[0].carriers);
  for (const l of legs.slice(1)) same = new Set(l.carriers.filter(c => same.has(c)));
  return { stops: legs.length - 1, via: legs.slice(0, -1).map(l => pick(db.ap[l.to])), legs, flyingMin: flying, totalMin: total, km, sameAirline: [...same] };
}

function search(db, from, to) {
  const A = db.ap[from], B = db.ap[to];
  const straight = haversine(A, B);
  const direct = leg(db, from, to);
  const one = [];
  for (const [h] of db.out[from] || []) {
    if (h === to || !db.ap[h]) continue;
    const l2 = leg(db, h, to);
    if (!l2) continue;
    const o = option(db, [leg(db, from, h), l2]);
    if (o.km > straight * 2.2 + 800) continue; // skip absurd detours
    one.push(o);
  }
  one.sort((x, y) => x.totalMin - y.totalMin || y.sameAirline.length - x.sameAirline.length);
  let two = [];
  if (!direct && one.length < 3) {
    // look for two-stop journeys through each origin hub's network
    const toIn = new Set(Object.keys(db.out).filter(k => db.out[k].has(to)));
    for (const [h1] of db.out[from] || []) {
      if (h1 === to || !db.out[h1]) continue;
      for (const [h2] of db.out[h1]) {
        if (h2 === from || h2 === to || h2 === h1 || !toIn.has(h2)) continue;
        const o = option(db, [leg(db, from, h1), leg(db, h1, h2), leg(db, h2, to)]);
        if (o.km > straight * 2.5 + 1500) continue;
        two.push(o);
      }
    }
    two.sort((x, y) => x.totalMin - y.totalMin);
    const seen = new Set();
    two = two.filter(o => { const k = o.via.map(v => v.iata).join('-'); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 10);
  }
  return {
    from: pick(A), to: pick(B), straightKm: straight,
    direct: direct ? option(db, [direct]) : null,
    oneStop: { count: one.length, options: one.slice(0, 12) },
    twoStop: { count: two.length, options: two },
    dataset: { name: 'airline-route-data (open data, updated weekly)', url: 'https://github.com/Jonty/airline-route-data', loadedAt: new Date(db.at).toISOString() }
  };
}

module.exports = async (req, res) => {
  const q = req.query || {};
  try {
    const db = await load();
    if (q.q !== undefined) {
      res.setHeader('cache-control', 'public, s-maxage=86400, stale-while-revalidate=604800');
      return res.status(200).json({ results: suggest(db, String(q.q).slice(0, 60)) });
    }
    const from = String(q.from || '').toUpperCase().trim(), to = String(q.to || '').toUpperCase().trim();
    if (!/^[A-Z0-9]{3}$/.test(from) || !/^[A-Z0-9]{3}$/.test(to)) return res.status(400).json({ error: 'Pick an origin and a destination airport.' });
    if (from === to) return res.status(400).json({ error: 'Origin and destination are the same airport.' });
    if (!db.ap[from]) return res.status(404).json({ error: `We don't have airport ${from} in the route data.` });
    if (!db.ap[to]) return res.status(404).json({ error: `We don't have airport ${to} in the route data.` });
    res.setHeader('cache-control', 'public, s-maxage=43200, stale-while-revalidate=604800');
    return res.status(200).json(search(db, from, to));
  } catch (e) {
    return res.status(502).json({ error: 'Could not load the open route data right now. Try again in a minute.' });
  }
};
