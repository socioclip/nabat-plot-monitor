// Ask your results: four fictional members' blood tests (baseline and retest), their
// protocols and a small reference library. Shared by the page (window.ASK_RESULTS) and the API (require).
// Every value here is illustrative. Nothing is real patient data.
(function (root) {
  // Marker definitions shared by every member. lo/hi = lab reference range. optLo/optHi =
  // tighter target band; inside the lab range but outside the target shows as "Watch".
  // Some ranges differ for women: see SEX_RANGES.
  const DEFS = [
    { id: 'apob', name: 'ApoB', group: 'Heart', unit: 'mg/dL', hi: 100, optHi: 90, better: 'lower' },
    { id: 'ldl', name: 'LDL cholesterol', group: 'Heart', unit: 'mg/dL', hi: 130, optHi: 100, better: 'lower' },
    { id: 'hdl', name: 'HDL cholesterol', group: 'Heart', unit: 'mg/dL', lo: 40, better: 'higher' },
    { id: 'tg', name: 'Triglycerides', group: 'Heart', unit: 'mg/dL', hi: 150, better: 'lower' },
    { id: 'lpa', name: 'Lp(a)', group: 'Heart', unit: 'nmol/L', hi: 75, better: 'lower', once: true },
    { id: 'hba1c', name: 'HbA1c', group: 'Metabolic', unit: '%', hi: 5.6, optHi: 5.4, better: 'lower' },
    { id: 'glucose', name: 'Fasting glucose', group: 'Metabolic', unit: 'mg/dL', lo: 70, hi: 99, better: 'lower' },
    { id: 'insulin', name: 'Fasting insulin', group: 'Metabolic', unit: 'µIU/mL', lo: 2, hi: 20, optHi: 10, better: 'lower' },
    { id: 'alt', name: 'ALT (liver)', group: 'Metabolic', unit: 'U/L', hi: 41, better: 'lower' },
    { id: 'tsh', name: 'TSH', group: 'Thyroid', unit: 'mIU/L', lo: 0.4, hi: 4.0 },
    { id: 'ft4', name: 'Free T4', group: 'Thyroid', unit: 'ng/dL', lo: 0.8, hi: 1.8 },
    { id: 'testo', name: 'Total testosterone', group: 'Hormones', unit: 'ng/dL', lo: 264, hi: 916 },
    { id: 'crp', name: 'hs-CRP', group: 'Inflammation', unit: 'mg/L', hi: 3, optHi: 1, better: 'lower' },
    { id: 'wbc', name: 'White blood cells', group: 'Inflammation', unit: '×10⁹/L', lo: 4, hi: 11 },
    { id: 'vitd', name: 'Vitamin D', group: 'Nutrients', unit: 'ng/mL', lo: 30, hi: 100, better: 'higher' },
    { id: 'omega3', name: 'Omega-3 index', group: 'Nutrients', unit: '%', lo: 4, hi: 12, optLo: 8, better: 'higher' },
    { id: 'ferritin', name: 'Ferritin', group: 'Nutrients', unit: 'ng/mL', lo: 30, hi: 400 },
    { id: 'b12', name: 'Vitamin B12', group: 'Nutrients', unit: 'pg/mL', lo: 200, hi: 900, better: 'higher' },
    { id: 'egfr', name: 'eGFR (kidney)', group: 'Kidney', unit: 'mL/min', lo: 90, better: 'higher' }
  ];
  const SEX_RANGES = {
    Female: { hdl: { lo: 50 }, alt: { hi: 33 }, testo: { lo: 8, hi: 60 }, ferritin: { lo: 15, hi: 150 } }
  };

  // Four fictional members, each with a different story. Values are [baseline, retest];
  // Lp(a) is measured once. Nothing here is real patient data.
  const MEMBERS = [
    { id: 'rami', name: 'Rami S.', first: 'Rami', initials: 'RS', age: 41, sex: 'Male', tag: 'Mostly improving',
      tests: { a: { label: 'Baseline', date: '12 Mar 2026' }, b: { label: 'Retest', date: '14 Sep 2026' } },
      v: { apob: [112, 98], ldl: [141, 124], hdl: [48, 52], tg: [165, 128], lpa: [38], hba1c: [5.8, 5.6], glucose: [104, 97], insulin: [14, 10], alt: [46, 38], tsh: [2.1, 4.6], ft4: [1.2, 1.1], testo: [410, 455], crp: [3.4, 1.6], wbc: [6.2, 5.9], vitd: [18, 34], omega3: [4.1, 6.2], ferritin: [210, 185], b12: [290, 410], egfr: [98, 101] },
      protocol: { set: '12 Mar 2026, by the Kinra clinician', items: ['Vitamin D3, 2,000 IU daily', 'Zone 2 cardio, 150 minutes a week', 'Less saturated fat; oily fish twice a week', 'Retest the focused panel after 6 months'] },
      starters: ['What improved since my first test?', 'Is my ApoB still a concern?', 'Why is my TSH flagged?', 'Do I have prediabetes?', 'Should I double my vitamin D?'] },
    { id: 'layla', name: 'Layla K.', first: 'Layla', initials: 'LK', age: 34, sex: 'Female', tag: 'Iron recovering',
      tests: { a: { label: 'Baseline', date: '3 Feb 2026' }, b: { label: 'Retest', date: '6 Aug 2026' } },
      v: { apob: [82, 78], ldl: [102, 96], hdl: [58, 62], tg: [88, 80], lpa: [22], hba1c: [5.2, 5.1], glucose: [86, 84], insulin: [6, 6], alt: [18, 16], tsh: [1.9, 2.0], ft4: [1.3, 1.3], testo: [32, 35], crp: [0.9, 2.4], wbc: [5.4, 5.8], vitd: [22, 41], omega3: [5.2, 6.8], ferritin: [12, 28], b12: [230, 185], egfr: [112, 110] },
      protocol: { set: '3 Feb 2026, by the Kinra clinician', items: ['Iron supplement as prescribed, taken with vitamin C', 'Vitamin D3, 2,000 IU daily', 'Plant-based diet with iron-rich foods', 'Retest the focused panel after 6 months'] },
      starters: ['Is my iron back to normal?', 'Why is my B12 flagged?', 'What improved since my first test?', 'Why did my hs-CRP go up?', 'Should I stop my iron supplement?'] },
    { id: 'ahmed', name: 'Ahmed M.', first: 'Ahmed', initials: 'AM', age: 56, sex: 'Male', tag: 'Needs attention',
      tests: { a: { label: 'Baseline', date: '8 Apr 2026' }, b: { label: 'Retest', date: '9 Oct 2026' } },
      v: { apob: [118, 106], ldl: [150, 132], hdl: [38, 40], tg: [210, 240], lpa: [92], hba1c: [6.1, 6.6], glucose: [112, 128], insulin: [22, 26], alt: [52, 58], tsh: [2.4, 2.2], ft4: [1.1, 1.2], testo: [380, 360], crp: [2.8, 3.6], wbc: [7.1, 7.4], vitd: [26, 31], omega3: [3.8, 4.4], ferritin: [290, 310], b12: [420, 400], egfr: [84, 79] },
      protocol: { set: '8 Apr 2026, by the Kinra clinician', items: ['Walk 30 minutes after dinner, 5 days a week', 'Cut sugary drinks and refined carbs', 'Less alcohol', 'Retest the focused panel after 6 months'] },
      starters: ['Do I have diabetes?', 'What got worse since my first test?', 'Is my liver OK?', 'What does my Lp(a) mean?', 'Should I start a statin?'] },
    { id: 'sofia', name: 'Sofia R.', first: 'Sofia', initials: 'SR', age: 29, sex: 'Female', tag: 'All in range',
      tests: { a: { label: 'Baseline', date: '20 Jan 2026' }, b: { label: 'Retest', date: '22 Jul 2026' } },
      v: { apob: [64, 60], ldl: [82, 78], hdl: [72, 75], tg: [60, 55], lpa: [15], hba1c: [5.0, 5.0], glucose: [82, 80], insulin: [4, 4], alt: [20, 22], tsh: [1.6, 1.8], ft4: [1.4, 1.3], testo: [38, 40], crp: [0.4, 0.3], wbc: [5.0, 4.8], vitd: [48, 52], omega3: [8.4, 9.1], ferritin: [40, 24], b12: [520, 540], egfr: [118, 116] },
      overrides: { ferritin: { optLo: 30 } },
      protocol: { set: '20 Jan 2026, by the Kinra clinician', items: ['Endurance training, 8 to 10 hours a week', 'Iron-rich meals around training', 'Retest the focused panel after 6 months'] },
      starters: ['Is there anything to worry about?', 'Why is my ferritin going down?', 'What improved since my first test?', 'Is my omega-3 good for training?', 'Should I take an iron supplement?'] }
  ];

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

  // One member's view: marker definitions merged with their values and any sex or
  // personal range overrides. Cached per member.
  const views = {};
  function view(id) {
    const P = MEMBERS.find(x => x.id === id) || MEMBERS[0];
    if (views[P.id]) return views[P.id];
    const sexR = SEX_RANGES[P.sex] || {};
    const MARKERS = DEFS.map(d => {
      const v = P.v[d.id] || [];
      return { ...d, ...(sexR[d.id] || {}), ...((P.overrides || {})[d.id] || {}), a: v[0], b: v.length > 1 ? v[1] : null };
    });
    const V = { id: P.id, MEMBER: { name: P.name, first: P.first, initials: P.initials, age: P.age, sex: P.sex, tag: P.tag },
      TESTS: P.tests, MARKERS, PROTOCOL: P.protocol, STARTERS: P.starters, NOTES };
    V.contextText = () => contextText(V);
    V.checkNumbers = t => checkNumbers(t, V);
    return (views[P.id] = V);
  }

  // Context the model sees: one line per marker, plus protocol and notes.
  function contextText(V) {
    const { MEMBER, TESTS, MARKERS, PROTOCOL } = V;
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

  // Every number the assistant may state for this member: anything in their data, the
  // notes and protocol, plus changes and percentage changes between the two tests.
  const allowedCache = {};
  function allowedNumbers(V) {
    if (allowedCache[V.id]) return allowedCache[V.id];
    const set = new Set();
    const add = n => { if (Number.isFinite(n)) set.add(+(+n).toFixed(2)); };
    const scan = t => (String(t).match(/\d[\d,]*(?:\.\d+)?/g) || []).forEach(s => add(parseFloat(s.replace(/,/g, ''))));
    scan(JSON.stringify({ M: V.MEMBER, T: V.TESTS, K: V.MARKERS, P: V.PROTOCOL, NOTES }));
    V.MARKERS.forEach(m => { const c = change(m); if (c) { add(Math.abs(c.delta)); add(Math.round(Math.abs(c.delta))); add(c.pct); } });
    return (allowedCache[V.id] = [...set]);
  }
  // Numbers in a text that do not match the data. Whole numbers up to 12 are always
  // allowed; digits that are part of a name (B12, T4, D3, omega-3) are ignored.
  function checkNumbers(text, V) {
    const allowed = allowedNumbers(V || view());
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

  const API = { MEMBERS: MEMBERS.map(P => ({ id: P.id, name: P.name, first: P.first, initials: P.initials, age: P.age, sex: P.sex, tag: P.tag })), NOTES, view, status, latest, rangeText, targetText, change };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.ASK_RESULTS = API;
})(typeof window !== 'undefined' ? window : globalThis);
