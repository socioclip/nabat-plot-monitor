// Ask your results: the fictional member's two blood tests, their protocol and a small
// reference library. Shared by the page (window.ASK_RESULTS) and the API (require).
// Every value here is illustrative. Nothing is real patient data.
(function (root) {
  const MEMBER = { name: 'Rami S.', age: 41, sex: 'Male', member: 'Kinra member since Mar 2026' };
  const TESTS = { a: { label: 'Baseline', date: '12 Mar 2026' }, b: { label: 'Retest', date: '14 Sep 2026' } };

  // lo/hi = lab reference range. optLo/optHi = tighter target band; inside the lab range
  // but outside the target band shows as "Watch".
  const MARKERS = [
    { id: 'apob', name: 'ApoB', group: 'Heart', unit: 'mg/dL', a: 112, b: 98, hi: 100, optHi: 90, better: 'lower' },
    { id: 'ldl', name: 'LDL cholesterol', group: 'Heart', unit: 'mg/dL', a: 141, b: 124, hi: 130, optHi: 100, better: 'lower' },
    { id: 'hdl', name: 'HDL cholesterol', group: 'Heart', unit: 'mg/dL', a: 48, b: 52, lo: 40, better: 'higher' },
    { id: 'tg', name: 'Triglycerides', group: 'Heart', unit: 'mg/dL', a: 165, b: 128, hi: 150, better: 'lower' },
    { id: 'lpa', name: 'Lp(a)', group: 'Heart', unit: 'nmol/L', a: 38, b: null, hi: 75, better: 'lower', once: true },
    { id: 'hba1c', name: 'HbA1c', group: 'Metabolic', unit: '%', a: 5.8, b: 5.6, hi: 5.6, optHi: 5.4, better: 'lower' },
    { id: 'glucose', name: 'Fasting glucose', group: 'Metabolic', unit: 'mg/dL', a: 104, b: 97, lo: 70, hi: 99, better: 'lower' },
    { id: 'insulin', name: 'Fasting insulin', group: 'Metabolic', unit: 'µIU/mL', a: 14, b: 10, lo: 2, hi: 20, optHi: 10, better: 'lower' },
    { id: 'alt', name: 'ALT (liver)', group: 'Metabolic', unit: 'U/L', a: 46, b: 38, hi: 41, better: 'lower' },
    { id: 'tsh', name: 'TSH', group: 'Thyroid', unit: 'mIU/L', a: 2.1, b: 4.6, lo: 0.4, hi: 4.0 },
    { id: 'ft4', name: 'Free T4', group: 'Thyroid', unit: 'ng/dL', a: 1.2, b: 1.1, lo: 0.8, hi: 1.8 },
    { id: 'testo', name: 'Total testosterone', group: 'Hormones', unit: 'ng/dL', a: 410, b: 455, lo: 264, hi: 916 },
    { id: 'crp', name: 'hs-CRP', group: 'Inflammation', unit: 'mg/L', a: 3.4, b: 1.6, hi: 3, optHi: 1, better: 'lower' },
    { id: 'wbc', name: 'White blood cells', group: 'Inflammation', unit: '×10⁹/L', a: 6.2, b: 5.9, lo: 4, hi: 11 },
    { id: 'vitd', name: 'Vitamin D', group: 'Nutrients', unit: 'ng/mL', a: 18, b: 34, lo: 30, hi: 100, better: 'higher' },
    { id: 'omega3', name: 'Omega-3 index', group: 'Nutrients', unit: '%', a: 4.1, b: 6.2, lo: 4, hi: 12, optLo: 8, better: 'higher' },
    { id: 'ferritin', name: 'Ferritin', group: 'Nutrients', unit: 'ng/mL', a: 210, b: 185, lo: 30, hi: 400 },
    { id: 'b12', name: 'Vitamin B12', group: 'Nutrients', unit: 'pg/mL', a: 290, b: 410, lo: 200, hi: 900 },
    { id: 'egfr', name: 'eGFR (kidney)', group: 'Kidney', unit: 'mL/min', a: 98, b: 101, lo: 90, better: 'higher' }
  ];

  const PROTOCOL = {
    set: '12 Mar 2026, by the Kinra clinician',
    items: [
      'Vitamin D3, 2,000 IU daily',
      'Zone 2 cardio, 150 minutes a week',
      'Less saturated fat; oily fish twice a week',
      'Retest the focused panel after 6 months'
    ]
  };

  // Short educational notes the assistant may cite. Plain, general, not advice for one person.
  const NOTES = {
    apob: 'ApoB counts the particles that carry cholesterol into artery walls. Many cardiology guidelines use it next to LDL cholesterol to judge heart risk; lower is generally better. The right target depends on a person\'s overall risk, which a clinician sets.',
    ldl: 'LDL cholesterol is the cholesterol carried in LDL particles. Diet, activity, body weight and genes all move it.',
    hdl: 'HDL cholesterol is often called "good" cholesterol. Very low levels are linked with higher heart risk; raising it on its own has not been shown to lower risk.',
    tg: 'Triglycerides are fats in the blood. They respond quickly to alcohol, refined carbohydrates and activity, and are read fasting.',
    lpa: 'Lp(a) is mostly set by genes and changes little with lifestyle, so it is usually measured once.',
    hba1c: 'HbA1c reflects average blood sugar over roughly the past 2 to 3 months. Labs commonly treat 5.7 to 6.4% as the prediabetes range and 6.5% or above as the diabetes range, but only a clinician can diagnose, usually after a repeat test.',
    glucose: 'Fasting glucose is a single snapshot of blood sugar after an overnight fast. It moves with sleep, stress and the previous evening\'s meal.',
    insulin: 'Fasting insulin shows how hard the body is working to keep blood sugar steady. Lower values inside the range usually mean better insulin sensitivity.',
    alt: 'ALT is a liver enzyme. Mild rises can come from many causes, including hard exercise, alcohol, some medicines and fat in the liver.',
    tsh: 'TSH is the signal from the pituitary gland that tells the thyroid to work harder. One high reading can be temporary (recent illness, test timing, or supplements such as biotin), so clinicians usually repeat it and read it with free T4 before drawing conclusions.',
    ft4: 'Free T4 is the main hormone the thyroid releases. Read together with TSH, it shows how the thyroid is working.',
    testo: 'Total testosterone varies through the day and is best measured in the morning. It is affected by sleep, weight and illness.',
    crp: 'hs-CRP is a general marker of inflammation. Recent infection, injury or hard exercise can raise it for a few days. For heart risk, below 1 mg/L is often described as lower, 1 to 3 as average and above 3 as higher.',
    wbc: 'White blood cells fight infection. The count rises with infection or stress and is read against the whole blood count.',
    vitd: 'Vitamin D below 20 ng/mL is commonly called deficient and 20 to 29 insufficient. Very high doses over time can be harmful, so dose changes should go through a clinician.',
    omega3: 'The omega-3 index is the share of EPA and DHA in red blood cell membranes. About 8% or more is often described as a desirable target. Oily fish raises it.',
    ferritin: 'Ferritin reflects iron stores. It also rises with inflammation, so it is read with CRP.',
    b12: 'Vitamin B12 supports nerves and red blood cells. Low values are more common with low intake of animal foods and with some medicines.',
    egfr: 'eGFR estimates how well the kidneys filter blood. 90 or above is normal kidney filtering.'
  };

  function status(m, v) {
    if (v == null) return null;
    if ((m.lo != null && v < m.lo) || (m.hi != null && v > m.hi)) return 'out';
    if ((m.optLo != null && v < m.optLo) || (m.optHi != null && v > m.optHi)) return 'watch';
    return 'ok';
  }
  function latest(m) { return m.b != null ? m.b : m.a; }
  function rangeText(m) {
    if (m.lo != null && m.hi != null) return `${m.lo}–${m.hi}`;
    if (m.hi != null) return `up to ${m.hi}`;
    return `${m.lo} or above`;
  }
  function targetText(m) {
    if (m.optHi != null) return `target below ${m.optHi}`;
    if (m.optLo != null) return `target ${m.optLo} or above`;
    return '';
  }
  function change(m) {
    if (m.a == null || m.b == null) return null;
    const d = m.b - m.a, pct = Math.round(Math.abs(d) / m.a * 100);
    const dir = d === 0 ? 'same' : d > 0 ? 'up' : 'down';
    const good = !m.better || d === 0 ? null : (m.better === 'lower') === (d < 0);
    return { delta: +d.toFixed(2), pct, dir, good };
  }

  // Context the model sees: one line per marker, plus protocol and notes.
  function contextText() {
    const lines = MARKERS.map(m => {
      const c = change(m);
      const s = { ok: 'in range', watch: 'in lab range, outside target', out: 'OUT OF RANGE' };
      return `- [${m.id}] ${m.name} (${m.group}), ${m.unit}: baseline ${m.a} (${s[status(m, m.a)]})` +
        (m.b != null ? `; retest ${m.b} (${s[status(m, m.b)]}); change ${c.delta > 0 ? '+' : ''}${c.delta} (${c.pct}%)` : '; measured once, not retested') +
        `; lab range ${rangeText(m)}${targetText(m) ? '; ' + targetText(m) : ''}`;
    });
    return `MEMBER: ${MEMBER.name}, ${MEMBER.age}, ${MEMBER.sex}. Tests: baseline ${TESTS.a.date}, retest ${TESTS.b.date}.
RESULTS:
${lines.join('\n')}
PROTOCOL (set ${PROTOCOL.set}):
${PROTOCOL.items.map(i => '- ' + i).join('\n')}
REFERENCE NOTES (cite by id):
${Object.entries(NOTES).map(([k, v]) => `- [${k}] ${v}`).join('\n')}`;
  }

  // Every number the assistant may state: anything in the data, notes and protocol,
  // plus changes and percentage changes between the two tests.
  let allowedCache = null;
  function allowedNumbers() {
    if (allowedCache) return allowedCache;
    const set = new Set();
    const add = n => { if (Number.isFinite(n)) set.add(+(+n).toFixed(2)); };
    const scan = t => (String(t).match(/\d[\d,]*(?:\.\d+)?/g) || []).forEach(s => add(parseFloat(s.replace(/,/g, ''))));
    scan(JSON.stringify({ MEMBER, TESTS, MARKERS, PROTOCOL, NOTES }));
    MARKERS.forEach(m => { const c = change(m); if (c) { add(Math.abs(c.delta)); add(Math.round(Math.abs(c.delta))); add(c.pct); } });
    allowedCache = [...set];
    return allowedCache;
  }
  // Numbers in a text that do not match the data. Ignores digits that are part of a
  // name (B12, T4, D3, omega-3, Lp(a)).
  function checkNumbers(text) {
    const allowed = allowedNumbers();
    const found = [];
    const re = /(?<![A-Za-z0-9\-.])\d[\d,]*(?:\.\d+)?/g;
    let m;
    while ((m = re.exec(String(text)))) {
      const raw = m[0].replace(/[.,]$/, '');
      const n = parseFloat(raw.replace(/,/g, ''));
      if (Number.isFinite(n)) found.push({ raw, n });
    }
    const unmatched = found.filter(f => !(/^\d+$/.test(f.raw) && f.n <= 12) && !allowed.some(a => Math.abs(a - f.n) < 0.051 || (Number.isInteger(f.n) && f.n >= 10 && Math.round(a) === f.n))).map(f => f.raw);
    return { checked: found.length, matched: found.length - unmatched.length, unmatched: [...new Set(unmatched)] };
  }

  const API = { MEMBER, TESTS, MARKERS, PROTOCOL, NOTES, status, latest, rangeText, targetText, change, contextText, allowedNumbers, checkNumbers };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.ASK_RESULTS = API;
})(typeof window !== 'undefined' ? window : globalThis);
