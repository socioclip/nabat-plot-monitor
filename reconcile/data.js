// Reconcile Desk: fictional hotel-distribution data, generated in the browser into SQLite (sql.js).
// Every number is reproducible: one seed, one "as of" moment. The answer key of planted errors lives
// in JS only (window.RECON.planted), never in the database, so the checks cannot peek at it.
(function () {
  'use strict';
  const NOW = '2026-11-10 10:00:00';
  const TODAY = '2026-11-10';

  function rng(seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const R = rng(20261110);
  const pick = a => a[Math.floor(R() * a.length)];
  const int = (lo, hi) => lo + Math.floor(R() * (hi - lo + 1));
  const r2 = x => Math.round(x * 100) / 100;

  const FX = { AED: 1, USD: 3.6725, EUR: 4.02, GBP: 4.71, SAR: 0.979 };

  const CHAINS = [
    { chain: 'Corniche Hotels', hotels: [['Corniche Marina', 'Dubai'], ['Corniche Downtown', 'Dubai'], ['Corniche Saadiyat', 'Abu Dhabi'], ['Corniche Jeddah Bay', 'Jeddah']] },
    { chain: 'Saffron Resorts', hotels: [['Saffron Palm Resort', 'Dubai'], ['Saffron Hatta Lodge', 'Hatta'], ['Saffron Al Ula Camp', 'AlUla'], ['Saffron Muscat Shores', 'Muscat']] },
    { chain: 'Atlas & Vine', hotels: [['Atlas & Vine Creek', 'Dubai'], ['Atlas & Vine Riyadh', 'Riyadh'], ['Atlas & Vine Doha', 'Doha'], ['Atlas & Vine Cairo', 'Cairo']] },
    { chain: 'Marlowe Collection', hotels: [['The Marlowe JBR', 'Dubai'], ['The Marlowe Yas', 'Abu Dhabi'], ['The Marlowe Red Sea', 'Red Sea'], ['The Marlowe Istanbul', 'Istanbul']] },
    { chain: 'Qamar Hotels', hotels: [['Qamar Deira', 'Dubai'], ['Qamar Al Khobar', 'Al Khobar'], ['Qamar Makkah Gate', 'Makkah'], ['Qamar Sharjah', 'Sharjah']] },
    { chain: 'Northpeak Inns', hotels: [['Northpeak Business Bay', 'Dubai'], ['Northpeak Airport', 'Dubai'], ['Northpeak Olaya', 'Riyadh'], ['Northpeak Bahrain', 'Manama']] }
  ];
  const BUYERS = [
    ['B01', 'Wayfarer Tours', 'Tour operator', 'UK', 'GBP'],
    ['B02', 'Sunvale Holidays', 'Tour operator', 'Germany', 'EUR'],
    ['B03', 'Oasis Trips', 'Online agency', 'Saudi Arabia', 'SAR'],
    ['B04', 'Bluehaven Travel', 'Online agency', 'USA', 'USD'],
    ['B05', 'Dunes DMC', 'DMC', 'UAE', 'AED'],
    ['B06', 'Lumiere Voyages', 'Tour operator', 'France', 'EUR'],
    ['B07', 'Kestrel Trips', 'Online agency', 'India', 'USD'],
    ['B08', 'Palmyra Online', 'Online agency', 'Egypt', 'USD']
  ];
  const ROOMS = ['Standard King', 'Standard Twin', 'Deluxe King', 'Deluxe Twin', 'Junior Suite', 'Family Room'];
  const FIRST = ['Aisha', 'Omar', 'Lena', 'James', 'Priya', 'Mateo', 'Sara', 'Yusuf', 'Hannah', 'Karim', 'Mei', 'Lucas', 'Fatima', 'Noah', 'Elif', 'Ravi', 'Chloe', 'Hassan', 'Ines', 'Daniel', 'Nour', 'Arjun', 'Emma', 'Tariq', 'Sofia', 'Zain', 'Grace', 'Malik', 'Julia', 'Amir'];
  const LAST = ['Rahman', 'Schmidt', 'Okafor', 'Patel', 'Dubois', 'Haddad', 'Novak', 'Garcia', 'Khan', 'Rossi', 'Tanaka', 'Mansour', 'Fischer', 'Silva', 'Nasser', 'Iyer', 'Moreau', 'Aziz', 'Larsen', 'Costa', 'Farouk', 'Weber', 'Mehta', 'Bauer'];

  const pad = n => String(n).padStart(2, '0');
  const fmt = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
  const day = d => fmt(d).slice(0, 10);
  const T = s => new Date(s.replace(' ', 'T') + 'Z');
  const addMin = (s, m) => fmt(new Date(T(s).getTime() + m * 60000));
  const addDays = (s, n) => day(new Date(T(s.length === 10 ? s + ' 00:00:00' : s).getTime() + n * 86400000));
  const nowT = T(NOW).getTime();

  function build(SQL) {
    const db = new SQL.Database();
    db.run(`
      CREATE TABLE fx (currency TEXT PRIMARY KEY, aed_rate REAL NOT NULL);
      CREATE TABLE buyers (buyer_id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT, country TEXT, currency TEXT NOT NULL REFERENCES fx(currency));
      CREATE TABLE hotels (hotel_id TEXT PRIMARY KEY, name TEXT NOT NULL, chain TEXT NOT NULL, city TEXT);
      CREATE TABLE bookings (
        booking_ref TEXT PRIMARY KEY, buyer_id TEXT NOT NULL REFERENCES buyers(buyer_id), hotel_id TEXT NOT NULL REFERENCES hotels(hotel_id),
        guest_name TEXT NOT NULL, room_type TEXT NOT NULL, check_in TEXT NOT NULL, check_out TEXT NOT NULL, nights INTEGER NOT NULL CHECK (nights > 0),
        net_amount REAL NOT NULL CHECK (net_amount > 0), currency TEXT NOT NULL REFERENCES fx(currency),
        status TEXT NOT NULL CHECK (status IN ('confirmed','cancelled')), group_ref TEXT, created_at TEXT NOT NULL, cancelled_at TEXT,
        CHECK (check_out > check_in));
      CREATE TABLE hotel_confirmations (
        conf_no TEXT PRIMARY KEY, booking_ref TEXT NOT NULL UNIQUE REFERENCES bookings(booking_ref), hotel_id TEXT NOT NULL REFERENCES hotels(hotel_id),
        amount REAL NOT NULL, currency TEXT NOT NULL, status TEXT NOT NULL CHECK (status IN ('confirmed','cancelled')), confirmed_at TEXT NOT NULL);
      CREATE TABLE payments (
        payment_ref TEXT PRIMARY KEY, booking_ref TEXT NOT NULL REFERENCES bookings(booking_ref), amount REAL NOT NULL, currency TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('captured','refunded')), captured_at TEXT NOT NULL, refunded_at TEXT);
      CREATE TABLE api_log (
        log_id INTEGER PRIMARY KEY, booking_ref TEXT NOT NULL, hotel_id TEXT NOT NULL, call TEXT NOT NULL CHECK (call IN ('book','cancel')),
        http_status INTEGER NOT NULL, latency_ms INTEGER NOT NULL, at TEXT NOT NULL);
      CREATE TABLE contracts (hotel_id TEXT NOT NULL REFERENCES hotels(hotel_id), valid_from TEXT NOT NULL, valid_to TEXT NOT NULL, PRIMARY KEY (hotel_id, valid_from));
      CREATE INDEX ix_hc_ref ON hotel_confirmations(booking_ref);
      CREATE INDEX ix_pay_ref ON payments(booking_ref);
      CREATE INDEX ix_log_ref ON api_log(booking_ref);
      CREATE INDEX ix_b_dup ON bookings(buyer_id, hotel_id, guest_name, check_in);
    `);
    Object.entries(FX).forEach(([c, r]) => db.run('INSERT INTO fx VALUES (?,?)', [c, r]));
    BUYERS.forEach(b => db.run('INSERT INTO buyers VALUES (?,?,?,?,?)', b));
    const hotels = [];
    CHAINS.forEach((c, ci) => c.hotels.forEach((h, hi) => { const id = `H${ci + 1}${hi + 1}`; hotels.push({ id, name: h[0], chain: c.chain, city: h[1] }); db.run('INSERT INTO hotels VALUES (?,?,?,?)', [id, h[0], c.chain, h[1]]); }));
    hotels.forEach(h => {
      // Marlowe Collection's 2027 contract was signed but rates were never loaded on the hotel side (root cause for rate mismatches)
      db.run('INSERT INTO contracts VALUES (?,?,?)', [h.id, '2026-01-01', h.chain === 'Marlowe Collection' ? '2026-12-31' : '2027-06-30']);
    });

    // ---- clean bookings ----
    const B = []; let seq = 100000;
    const nextRef = () => 'HC' + (seq += int(1, 9));
    const N = 4920;
    for (let i = 0; i < N; i++) {
      const buyer = pick(BUYERS); const hotel = pick(hotels);
      const nights = pick([1, 2, 2, 3, 3, 3, 4, 4, 5, 7]);
      const checkIn = addDays(TODAY, int(0, 110));
      const lead = int(2, 80);
      let created = addMin(addDays(checkIn, -lead) + ' 00:00:00', int(0, 1439));
      if (T(created).getTime() > nowT - 3600000) created = addMin(NOW, -int(90, 60 * 24 * 20));
      const perNightAED = int(320, 2600);
      const amt = r2(perNightAED * nights / FX[buyer[4]]);
      B.push({ ref: nextRef(), buyer: buyer[0], cur: buyer[4], hotel: hotel.id, chain: hotel.chain, guest: pick(FIRST) + ' ' + pick(LAST), room: pick(ROOMS), checkIn, checkOut: addDays(checkIn, nights), nights, amt, status: 'confirmed', group: null, created, cancelled: null, kind: 'clean' });
    }
    // legit group bookings: same guest, same dates, same room type, same second. Naive duplicate checks flag these.
    for (let g = 0; g < 46; g++) {
      const base = B[int(0, B.length - 1)]; if (base.group || base.kind !== 'clean') continue;
      const gref = 'GRP' + (7000 + g); base.group = gref;
      const extra = int(1, 2);
      for (let k = 0; k < extra; k++) B.push({ ...base, ref: nextRef(), group: gref, kind: 'group', created: addMin(base.created, (k + 1) * 0.25) });
    }
    // buyer cancellations (clean)
    B.forEach(b => { if (b.kind === 'clean' && !b.group && R() < 0.08) { b.status = 'cancelled'; b.cancelled = addMin(b.created, int(60, 60 * 24 * 10)); if (T(b.cancelled).getTime() > nowT) b.cancelled = addMin(NOW, -int(30, 600)); } });
    // in-flight bookings: created in the last 20 minutes, hotel has not confirmed yet. Not errors.
    for (let i = 0; i < 14; i++) {
      const buyer = pick(BUYERS); const hotel = pick(hotels); const nights = int(1, 4); const checkIn = addDays(TODAY, int(3, 60));
      B.push({ ref: nextRef(), buyer: buyer[0], cur: buyer[4], hotel: hotel.id, chain: hotel.chain, guest: pick(FIRST) + ' ' + pick(LAST), room: pick(ROOMS), checkIn, checkOut: addDays(checkIn, nights), nights, amt: r2(int(400, 2000) * nights / FX[buyer[4]]), status: 'confirmed', group: null, created: addMin(NOW, -int(2, 20)), cancelled: null, kind: 'inflight' });
    }

    // ---- plant errors (answer key) ----
    const planted = [];
    const used = new Set();
    const daysTo = b => Math.round((T(b.checkIn + ' 00:00:00').getTime() - T(TODAY + ' 00:00:00').getTime()) / 86400000);
    // share = chance this pick must come from the preferred chain (or buyer, if the value starts with 'B0')
    function take(filter, prefer, share) {
      const must = prefer && R() < share ? prefer : null;
      for (let tries = 0; tries < 20000; tries++) {
        const b = B[int(0, B.length - 1)];
        if (b.kind !== 'clean' || b.group || used.has(b.ref) || !filter(b)) continue;
        if (must && (must.startsWith('B0') ? b.buyer !== must : b.chain !== must)) continue;
        used.add(b.ref); return b;
      }
      return null;
    }
    const plant = (type, b) => { planted.push({ ref: b.ref, type }); b.kind = type; };

    for (let i = 0; i < 30; i++) { const b = take(b => b.status === 'confirmed' && (i < 9 ? daysTo(b) <= 3 : true), 'Corniche Hotels', 0.7); if (b) plant('NO_CONF', b); }
    for (let i = 0; i < 24; i++) { const b = take(b => b.status === 'confirmed' && (i < 6 ? daysTo(b) <= 4 : true)); if (b) { b.status = 'cancelled'; b.cancelled = addMin(b.created, int(120, 6000)); if (T(b.cancelled).getTime() > nowT) b.cancelled = addMin(NOW, -int(60, 900)); plant('ORPHAN', b); } }
    for (let i = 0; i < 28; i++) { const b = take(b => b.status === 'confirmed' && b.checkIn >= '2027-01-01', 'Marlowe Collection', 0.85); if (b) { b.rateFactor = 1 + int(4, 22) / 100; plant('RATE', b); } }
    for (let i = 0; i < 10; i++) { const b = take(b => b.status === 'confirmed' && b.cur !== 'AED', 'B02', 0.8); if (b) { b.hotelCur = 'AED'; plant('CURRENCY', b); } }
    for (let i = 0; i < 20; i++) { const b = take(b => b.status === 'confirmed'); if (b) { b.status = 'cancelled'; b.cancelled = addMin(b.created, int(120, 6000)); if (T(b.cancelled).getTime() > nowT) b.cancelled = addMin(NOW, -int(60, 900)); b.forcePaid = true; plant('PAID_CANCELLED', b); } }
    for (let i = 0; i < 22; i++) { const b = take(b => b.status === 'confirmed' && daysTo(b) <= 6); if (b) { b.noPay = true; plant('NOT_PAID', b); } }
    const dups = [];
    for (let i = 0; i < 20; i++) {
      const b = take(b => b.status === 'confirmed' && T(b.created).getTime() < nowT - 7200000, 'Corniche Hotels', 0.8); if (!b) continue;
      const gap = i < 18 ? int(1, 4) : int(24, 28); // the last two retries came 25+ minutes later: outside the 10-minute window, a known miss
      const d = { ...b, ref: nextRef(), created: addMin(b.created, gap), kind: 'DUPLICATE', dupOf: b.ref, gap };
      b.timedOut = true; dups.push(d); planted.push({ ref: d.ref, type: 'DUPLICATE' });
    }
    B.push(...dups);

    // ---- write rows ----
    db.run('BEGIN');
    const insB = db.prepare('INSERT INTO bookings VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    const insH = db.prepare('INSERT INTO hotel_confirmations VALUES (?,?,?,?,?,?,?)');
    const insP = db.prepare('INSERT INTO payments VALUES (?,?,?,?,?,?,?)');
    const insL = db.prepare('INSERT INTO api_log (booking_ref,hotel_id,call,http_status,latency_ms,at) VALUES (?,?,?,?,?,?)');
    let conf = 500000, pay = 800000;
    for (const b of B) {
      insB.run([b.ref, b.buyer, b.hotel, b.guest, b.room, b.checkIn, b.checkOut, b.nights, b.amt, b.cur, b.status, b.group, b.created, b.cancelled]);
      // API log for the booking call
      if (b.kind === 'NO_CONF') {
        insL.run([b.ref, b.hotel, 'book', 504, b.chain === 'Corniche Hotels' ? int(25000, 30000) : 30000, addMin(b.created, 0)]);
      } else if (b.timedOut) {
        insL.run([b.ref, b.hotel, 'book', 504, int(25000, 30000), addMin(b.created, 0)]);
      } else if (b.kind !== 'inflight') {
        insL.run([b.ref, b.hotel, 'book', 200, b.chain === 'Corniche Hotels' ? int(1800, 9000) : int(250, 2600), addMin(b.created, 0)]);
      } else {
        insL.run([b.ref, b.hotel, 'book', 202, int(300, 1500), addMin(b.created, 0)]);
      }
      if (b.status === 'cancelled') insL.run([b.ref, b.hotel, 'cancel', b.kind === 'ORPHAN' ? pick([500, 502, 504]) : 200, b.kind === 'ORPHAN' ? int(8000, 30000) : int(200, 1800), b.cancelled]);

      // hotel side
      if (b.kind !== 'NO_CONF' && b.kind !== 'inflight') {
        let amount = b.amt, cur = b.cur, st = b.status;
        if (b.kind === 'ORPHAN') st = 'confirmed';
        if (b.kind === 'RATE') amount = r2(b.amt * b.rateFactor);
        if (b.kind === 'CURRENCY') cur = b.hotelCur;
        if (b.kind === 'clean' && R() < 0.2) amount = r2(b.amt * (1 + (R() - 0.5) * 0.006)); // rounding noise within 0.3%
        insH.run(['CF' + (conf += int(1, 7)), b.ref, b.hotel, amount, cur, st, addMin(b.created, b.timedOut ? 1 : int(0, 2))]);
      }

      // payments: due 7 days before check-in; most buyers pay earlier
      const due = addDays(b.checkIn, -7) + ' 06:00:00';
      const isDue = T(due).getTime() <= nowT;
      if (b.noPay || b.kind === 'inflight') continue;
      const paid = b.forcePaid || isDue || R() < 0.55;
      if (!paid) continue;
      let capAt = isDue ? addMin(b.created, int(30, 60 * 24 * 3)) : addMin(b.created, int(30, 600));
      if (T(capAt).getTime() > nowT) capAt = addMin(NOW, -int(20, 300));
      if (b.status === 'cancelled' && b.cancelled && T(capAt).getTime() > T(b.cancelled).getTime()) capAt = addMin(b.cancelled, -int(5, 60));
      const refunded = b.status === 'cancelled' && !b.forcePaid;
      insP.run(['PY' + (pay += int(1, 9)), b.ref, b.amt, b.cur, refunded ? 'refunded' : 'captured', capAt, refunded ? addMin(b.cancelled, int(30, 600)) : null]);
    }
    insB.free(); insH.free(); insP.free(); insL.free();
    db.run('COMMIT');
    return { db, planted, dupsMeta: dups.map(d => ({ ref: d.ref, of: d.dupOf, gap: d.gap })) };
  }

  // ---- the checks (matcher agent's toolkit) ----
  // :now and :today are bound at run time. tuned=true adds the tolerance rules; tuned=false is the naive first draft.
  const CHECKS = [
    { id: 'NO_CONF', name: 'Booked, not confirmed by hotel', why: 'Guest arrives and there is no room.', risk: 'Full booking value (walk cost)',
      sql: t => `SELECT b.booking_ref, b.hotel_id, b.check_in, b.net_amount * fx.aed_rate AS risk_aed
FROM bookings b
JOIN fx ON fx.currency = b.currency
LEFT JOIN hotel_confirmations h ON h.booking_ref = b.booking_ref
WHERE b.status = 'confirmed'
  AND h.booking_ref IS NULL${t ? `
  AND b.created_at < datetime(:now, '-30 minutes')  -- still in flight, not an error yet` : ''};` },
    { id: 'ORPHAN', name: 'Cancelled by buyer, still live at hotel', why: 'Hotel charges a no-show.', risk: 'Hotel-side amount',
      sql: () => `SELECT b.booking_ref, b.hotel_id, b.check_in, h.amount * fx.aed_rate AS risk_aed
FROM bookings b
JOIN hotel_confirmations h ON h.booking_ref = b.booking_ref
JOIN fx ON fx.currency = h.currency
WHERE b.status = 'cancelled'
  AND h.status = 'confirmed';` },
    { id: 'RATE', name: 'Rate mismatch', why: 'Buyer is invoiced one price, hotel charges another.', risk: 'Price difference',
      sql: t => `SELECT b.booking_ref, b.hotel_id, b.check_in, ABS(h.amount - b.net_amount) * fx.aed_rate AS risk_aed
FROM bookings b
JOIN hotel_confirmations h ON h.booking_ref = b.booking_ref
JOIN fx ON fx.currency = b.currency
WHERE b.status = 'confirmed'
  AND h.currency = b.currency
  AND ${t ? `ABS(h.amount - b.net_amount) > b.net_amount * 0.01  -- 1% tolerance for rounding` : `h.amount <> b.net_amount`};` },
    { id: 'CURRENCY', name: 'Currency mismatch', why: 'Same number, different currency: the amount is silently wrong.', risk: 'Difference after FX',
      sql: () => `SELECT b.booking_ref, b.hotel_id, b.check_in,
       ABS(b.net_amount * fb.aed_rate - h.amount * fh.aed_rate) AS risk_aed
FROM bookings b
JOIN hotel_confirmations h ON h.booking_ref = b.booking_ref
JOIN fx fb ON fb.currency = b.currency
JOIN fx fh ON fh.currency = h.currency
WHERE b.status = 'confirmed'
  AND h.currency <> b.currency;` },
    { id: 'PAID_CANCELLED', name: 'Paid, but booking cancelled', why: 'Buyer is owed a refund.', risk: 'Payment amount',
      sql: () => `SELECT b.booking_ref, b.hotel_id, b.check_in, p.amount * fx.aed_rate AS risk_aed
FROM bookings b
JOIN payments p ON p.booking_ref = b.booking_ref
JOIN fx ON fx.currency = p.currency
WHERE b.status = 'cancelled'
  AND p.status = 'captured';` },
    { id: 'NOT_PAID', name: 'Booked, payment overdue', why: 'Payment was due 7 days before check-in.', risk: 'Full booking value',
      sql: () => `SELECT b.booking_ref, b.hotel_id, b.check_in, b.net_amount * fx.aed_rate AS risk_aed
FROM bookings b
JOIN fx ON fx.currency = b.currency
WHERE b.status = 'confirmed'
  AND b.check_in <= date(:today, '+7 days')
  AND b.created_at < datetime(:now, '-30 minutes')
  AND NOT EXISTS (SELECT 1 FROM payments p
                  WHERE p.booking_ref = b.booking_ref AND p.status = 'captured');` },
    { id: 'DUPLICATE', name: 'Duplicate booking', why: 'Same stay booked twice, usually a retry after a timeout.', risk: 'Value of the duplicate',
      sql: t => `SELECT b2.booking_ref, b2.hotel_id, b2.check_in, b2.net_amount * fx.aed_rate AS risk_aed
FROM bookings b1
JOIN bookings b2
  ON  b2.buyer_id   = b1.buyer_id
  AND b2.hotel_id   = b1.hotel_id
  AND b2.guest_name = b1.guest_name
  AND b2.check_in   = b1.check_in
  AND b2.check_out  = b1.check_out
  AND b2.room_type  = b1.room_type
  AND b2.created_at > b1.created_at
  AND b2.created_at <= datetime(b1.created_at, '+10 minutes')
JOIN fx ON fx.currency = b2.currency
WHERE b1.status = 'confirmed' AND b2.status = 'confirmed'${t ? `
  AND b1.group_ref IS NULL  -- multi-room group bookings are intentional` : ''};` }
  ];

  window.RECON = { NOW, TODAY, FX, build, CHECKS };
})();
