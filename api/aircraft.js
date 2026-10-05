// Flights Waypoint: live aircraft check via AeroDataBox (RapidAPI).
// Needs the AERODATABOX_KEY environment variable (a RapidAPI key subscribed to AeroDataBox).
//   GET /api/aircraft?from=DXB&to=JFK -> departures from DXB to JFK in the next ~24h with aircraft model

const HOST = 'aerodatabox.p.rapidapi.com';

async function departures(key, from, offset) {
  const qs = new URLSearchParams({ offsetMinutes: String(offset), durationMinutes: '720', direction: 'Departure', withLeg: 'false', withCancelled: 'false', withCodeshared: 'false', withCargo: 'false', withPrivate: 'false', withLocation: 'false' });
  const r = await fetch('https://' + HOST + '/flights/airports/iata/' + from + '?' + qs, { headers: { 'x-rapidapi-key': key, 'x-rapidapi-host': HOST } });
  if (r.status === 204) return [];
  if (!r.ok) { const e = new Error('AeroDataBox ' + r.status); e.status = r.status; throw e; }
  const d = await r.json();
  return d.departures || [];
}

module.exports = async (req, res) => {
  const key = process.env.AERODATABOX_KEY;
  if (!key) return res.status(503).json({ configured: false, error: 'Live aircraft check is not set up yet.' });
  const from = String((req.query || {}).from || '').toUpperCase(), to = String((req.query || {}).to || '').toUpperCase();
  if (!/^[A-Z0-9]{3}$/.test(from) || !/^[A-Z0-9]{3}$/.test(to)) return res.status(400).json({ error: 'Pick two airports.' });
  try {
    let list = (await departures(key, from, -60)).filter(f => f.movement && f.movement.airport && f.movement.airport.iata === to);
    if (!list.length) list = (await departures(key, from, 660)).filter(f => f.movement && f.movement.airport && f.movement.airport.iata === to);
    const flights = list.map(f => ({
      number: f.number || '',
      airline: (f.airline && f.airline.name) || '',
      aircraft: (f.aircraft && f.aircraft.model) || '',
      departs: (f.movement.scheduledTime && (f.movement.scheduledTime.local || f.movement.scheduledTime.utc)) || (f.movement.scheduledTimeLocal || '')
    })).slice(0, 20);
    res.setHeader('cache-control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    return res.status(200).json({ configured: true, from, to, flights, window: 'next 24 hours', source: 'AeroDataBox' });
  } catch (e) {
    const busy = e.status === 429;
    return res.status(busy ? 429 : 502).json({ configured: true, error: busy ? 'Live lookups are used up for now. Try again later.' : (e.status === 401 || e.status === 403) ? 'The live aircraft key was rejected. Check AERODATABOX_KEY in Vercel.' : 'The live flight service did not answer. Try again.' });
  }
};
