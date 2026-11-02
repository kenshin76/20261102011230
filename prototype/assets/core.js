/* 공통 유틸 · 아이콘 · 저장소 · 가격 엔진 · 서버 규칙 재현 */
(function () {
  'use strict';
  var D = window.D;
  var U = window.U = {};
  var DAY = 864e5;

  /* ---------- 기본 유틸 ---------- */
  U.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  U.won = function (n) { return Math.round(Number(n || 0)).toLocaleString('ko-KR'); };
  U.pad = function (n) { return (n < 10 ? '0' : '') + n; };
  U.now = function () { return Date.now() + ((window.ST && ST.s && ST.s.shift) || 0) * DAY; };
  U.ymd = function (ms, sep) { var d = new Date(ms); sep = sep == null ? '-' : sep; return d.getFullYear() + sep + U.pad(d.getMonth() + 1) + sep + U.pad(d.getDate()); };
  U.dt = function (ms) { var d = new Date(ms); return U.ymd(ms, '.') + ' ' + U.pad(d.getHours()) + ':' + U.pad(d.getMinutes()); };
  U.md = function (ms) { var d = new Date(ms); return (d.getMonth() + 1) + '/' + d.getDate(); };
  U.ago = function (ms) {
    var s = (U.now() - ms) / 1000;
    if (s < 60) return '방금'; if (s < 3600) return Math.floor(s / 60) + '분 전';
    if (s < 86400) return Math.floor(s / 3600) + '시간 전'; return Math.floor(s / 86400) + '일 전';
  };
  U.endOfDay = function (ms) { var d = new Date(ms); d.setHours(23, 59, 59, 0); return d.getTime(); };
  U.uid = function (p) { return (p || 'id') + '-' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4); };
  U.digits = function (s) { return String(s || '').replace(/\D/g, ''); };
  /* 관리자 숫자 입력: 부호·소수점·잘못된 문자를 지워 다른 금액으로 바꾸지 않습니다. */
  U.numeric = function (raw, opt) {
    opt = opt || {};
    var s = String(raw == null ? '' : raw).trim();
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(s)) return NaN;
    var n = Number(s.replace(/,/g, ''));
    if (!Number.isFinite(n) || opt.integer && !Number.isSafeInteger(n) || opt.min != null && n < opt.min || opt.max != null && n > opt.max) return NaN;
    return n;
  };
  U.bizFmt = function (s) { var d = U.digits(s).slice(0, 10); return d.length > 5 ? d.slice(0, 3) + '-' + d.slice(3, 5) + '-' + d.slice(5) : d.length > 3 ? d.slice(0, 3) + '-' + d.slice(3) : d; };
  U.bizValid = function (s) {
    var d = U.digits(s); if (d.length !== 10) return false;
    var w = [1, 3, 7, 1, 3, 7, 1, 3, 5], t = 0;
    for (var i = 0; i < 9; i++) t += +d[i] * w[i];
    t += Math.floor(+d[8] * 5 / 10);
    return (10 - t % 10) % 10 === +d[9];
  };
  U.korNum = function (n) {
    n = Math.floor(n); if (!n) return '영';
    var dg = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'], small = ['', '십', '백', '천'], big = ['', '만', '억', '조'], out = '', g = 0;
    while (n > 0) {
      var part = n % 10000, s = '';
      for (var i = 0; part > 0; i++, part = Math.floor(part / 10)) { var x = part % 10; if (x) s = dg[x] + small[i] + s; }
      if (s) out = s + big[g] + out;
      n = Math.floor(n / 10000); g++;
    }
    return out;
  };
  U.debounce = function (fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; };
  U.wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  U.download = function (name, blob) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  };
  U.csv = function (rows) {
    return '﻿' + rows.map(function (r) { return r.map(function (c) { c = String(c == null ? '' : c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\r\n');
  };
  U.parseCsv = function (text) {
    text = text.replace(/^﻿/, ''); var rows = [], row = [], cur = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true; else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
      else cur += c;
    }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (c) { return String(c).trim(); }); });
  };

  /* ---------- 아이콘 ---------- */
  var IC = {
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    cart: '<path d="M3 4h2l2.4 11.2a2 2 0 002 1.6h7.9a2 2 0 001.9-1.4L21 8H6.2"/><circle cx="10" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/>',
    doc: '<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    right: '<path d="M9 5l7 7-7 7"/>', left: '<path d="M15 5l-7 7 7 7"/>', down: '<path d="M5 9l7 7 7-7"/>', up: '<path d="M5 15l7-7 7 7"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>', check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    building: '<path d="M4 21V5a2 2 0 012-2h8a2 2 0 012 2v16M16 9h3a1 1 0 011 1v11M3 21h18"/><path d="M8 7h4M8 11h4M8 15h4"/>',
    school: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5M22 9v6"/>',
    grad: '<circle cx="12" cy="7" r="4"/><path d="M5 21v-1a7 7 0 0114 0v1"/><path d="M9 14l3 3 3-3"/>',
    hourglass: '<path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 10h18M7 15h4"/>',
    bank: '<path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16l4-5 3 3 5-7"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 7M18 14a6 6 0 013.5 6"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',
    table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H3a2 2 0 110-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V3a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z"/>',
    link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
    sync: '<path d="M20 11a8 8 0 00-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0014.3 4.9L20 16M20 20v-4h-4"/>',
    logout: '<path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 17l-5-5 5-5M5 12h11"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    file: '<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    wave: '<path d="M2 12c2-6 4-6 6 0s4 6 6 0 4-6 6 0"/>',
    filter: '<path d="M4 5h16l-6 8v6l-4-2v-4z"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>',
    refresh: '<path d="M20 12a8 8 0 11-2.3-5.6L20 8.6M20 4v4.6h-4.6"/>',
    send: '<path d="M4 12l16-8-6 16-2.5-6.5z"/>',
    headset: '<path d="M4 14v-2a8 8 0 0116 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/><path d="M19 20a3 3 0 01-3 2h-3"/>',
    erp: '<rect x="3" y="4" width="18" height="6" rx="1.5"/><rect x="3" y="14" width="18" height="6" rx="1.5"/><path d="M7 7h.01M7 17h.01M11 7h6M11 17h6"/>',
    stamp: '<path d="M9 4h6l-1 7h-4z"/><path d="M5 14h14v3H5zM4 20h16"/>',
    play: '<path d="M7 4l13 8-13 8z"/>',
    time: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'
  };
  U.ic = function (n, cls) { return '<svg class="i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (IC[n] || IC.info) + '</svg>'; };
  U.logo = function () {
    return '<svg class="logo-m" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#0E1726"/><path d="M5 17h4l2.5-7 4 13 3.5-10 2 4H27" fill="none" stroke="#12C2A0" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  };

  /* ---------- 저장소 ---------- */
  var KEY = 'signalab-demo:2026110201:v1';
  var ST = window.ST = { s: null, ok: true, key: KEY };
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  ST.load = function () {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { ST.ok = false; }
    if (raw) { try { ST.s = JSON.parse(raw); if (ST.s && ST.s.v === 1) { ST.s.policy.hideForGuest = true; return; } } catch (e) { /* 손상된 값은 새로 만듦 */ } }
    ST.s = seed();
    ST.save();
  };
  var saveNow = function () { try { localStorage.setItem(KEY, JSON.stringify(ST.s)); ST.ok = true; } catch (e) { ST.ok = false; } };
  ST.save = U.debounce(saveNow, 120);
  ST.flush = saveNow;
  ST.reset = function () { try { localStorage.removeItem(KEY); } catch (e) { /* 무시 */ } ST.s = seed(); saveNow(); };

  ST.me = function () { return ST.s.user ? ST.member(ST.s.user) : null; };
  ST.member = function (id) { return ST.s.members.filter(function (m) { return m.id === id; })[0] || null; };
  ST.product = function (id) { return ST.s.products.filter(function (p) { return p.id === id; })[0] || null; };
  ST.combo = function (p, cid) { if (!p) return null; return p.combos.filter(function (c) { return c.id === cid; })[0] || null; };
  ST.comboById = function (cid) { var p = ST.product(cid.split('-')[0]); return p ? { p: p, c: ST.combo(p, cid) } : null; };
  ST.quote = function (no) { return ST.s.quotes.filter(function (q) { return q.no === no; })[0] || null; };
  ST.order = function (no) { return ST.s.orders.filter(function (o) { return o.no === no; })[0] || null; };
  ST.cart = function () { var u = ST.s.user; if (!u) return []; if (!ST.s.carts[u]) ST.s.carts[u] = []; return ST.s.carts[u]; };
  ST.log = function (kind, text, ref) { ST.s.audit.unshift({ at: U.now(), kind: kind, text: text, ref: ref || '' }); if (ST.s.audit.length > 120) ST.s.audit.length = 120; };
  ST.cat = function (id) { return D.CATS.filter(function (c) { return c.id === id; })[0]; };

  /* ---------- 가격 엔진 ---------- */
  var PR = window.PR = {};
  PR.canSee = function (m) { return !!(m && m.role === 'member' && m.status === 'approved'); };
  PR.rateOf = function (m) {
    var pol = ST.s.policy; if (!m) return 0;
    return (pol.typeRate[m.type] || 0) + (pol.gradeRate[m.grade] || 0);
  };
  PR.policyError = function (pol) {
    var types = ['general', 'univ', 'grad'], grades = ['basic', 'vip'];
    var rates = types.map(function (k) { return pol.typeRate[k]; }).concat(grades.map(function (k) { return pol.gradeRate[k]; }));
    if (rates.some(function (n) { return !Number.isFinite(n) || n < 0 || n >= 100; })) return '할인율은 0 이상 100 미만의 숫자로 입력해 주세요.';
    if (types.some(function (t) { return grades.some(function (g) { return pol.typeRate[t] + pol.gradeRate[g] >= 100; }); })) return '회원 유형 할인과 등급 할인 합계는 100% 미만이어야 합니다.';
    if ([1, 10, 100, 1000].indexOf(pol.round) < 0) return '절사 단위를 확인해 주세요.';
    if ([pol.freeShip, pol.shipFee].some(function (n) { return !Number.isSafeInteger(n) || n < 0 || n > 1e9; })) return '무료배송 기준과 배송비는 0 이상 10억 원 이하의 정수로 입력해 주세요.';
    return '';
  };
  /* 기준가 → 회원 유형·등급 할인 → 상품 예외(할인 제외/고정가) → 10원 절사 */
  PR.price = function (p, c, m) {
    var pol = ST.s.policy, base = c.price, rate = PR.rateOf(m), unit, why;
    if (p.rule === 'fixed') { unit = p.fixed; rate = 0; why = '교육용 정찰가(고정가)'; }
    else if (p.rule === 'nodisc') { unit = base; rate = 0; why = '할인 제외 상품'; }
    else {
      var round = Math.max(1, Number(pol.round) || 10);
      unit = Math.floor(base * (100 - rate) / 100 / round) * round;
      why = rate ? (D.TYPE_NAME[m.type] + (m.grade === 'vip' ? ' · 우수 등급' : '') + ' 할인 ' + rate + '%') : '';
    }
    return { base: base, rate: rate, unit: unit, why: why, rule: p.rule };
  };
  PR.minPrice = function (p, m) {
    var best = null;
    p.combos.forEach(function (c) { if (!c.sale) return; var x = PR.price(p, c, m); if (!best || x.unit < best.unit) best = x; });
    return best;
  };
  PR.line = function (m, cid, qty) {
    var r = ST.comboById(cid); if (!r || !r.c || !r.p.visible || !r.c.sale || !Number.isInteger(qty) || qty < (r.p.moq || 1) || qty % (r.p.moq || 1) || qty > 9999) return null;
    var x = PR.price(r.p, r.c, m);
    return { pid: r.p.id, cid: cid, name: r.p.name, model: r.p.model, brand: r.p.brand, opt: r.c.key, sku: r.c.sku, unitName: r.p.unit,
      qty: qty, base: x.base, rate: x.rate, unit: x.unit, amount: x.unit * qty, rule: x.rule, why: x.why };
  };
  PR.totals = function (lines) {
    var pol = ST.s.policy, supply = lines.reduce(function (s, l) { return s + l.amount; }, 0);
    var ship = supply === 0 || supply >= pol.freeShip ? 0 : pol.shipFee;
    var vat = Math.floor((supply + ship) * 0.1);
    var list = lines.reduce(function (s, l) { return s + l.base * l.qty; }, 0);
    return { supply: supply, ship: ship, vat: vat, total: supply + ship + vat, save: Math.max(0, list - supply) };
  };

  /* ---------- 서버 규칙 재현 ---------- */
  var SV = window.SV = {};
  SV.seq = function (prefix, ms) {
    var k = prefix + U.ymd(ms, ''); ST.s.seq[k] = (ST.s.seq[k] || 0) + 1;
    return prefix + '-' + U.ymd(ms, '') + '-' + String(ST.s.seq[k]).padStart(4, '0');
  };
  /* 국세청 사업자 진위·상태 조회 재현 */
  SV.nts = function (bizNo) {
    return U.wait(650).then(function () {
      var d = U.digits(bizNo);
      if (!U.bizValid(d)) return { ok: false, code: 'FORMAT', s: '번호 오류', msg: '사업자등록번호 형식(검증번호)이 맞지 않습니다.' };
      var hit = D.NTS[d];
      if (!hit) return { ok: false, code: 'DEMO_ONLY', s: '조회 예시 없음', msg: '체험용 예시 번호로 확인해 주세요. 실제 사업자 정보는 외부로 조회하지 않습니다.' };
      return { ok: hit.s === '계속사업자', code: hit.s === '계속사업자' ? 'ACTIVE' : 'INACTIVE', s: hit.s, tax: hit.tax, at: U.now(),
        msg: hit.s === '계속사업자' ? '국세청에 등록된 계속사업자입니다.' : '현재 ' + hit.s + ' 상태로 확인되어 가입 승인이 제한됩니다.' };
    });
  };
  SV.quoteState = function (q) {
    if (q.orderNo) return 'ordered';
    if (U.now() > q.validUntil) return 'expired';
    return 'valid';
  };
  SV.QSTATE = { valid: ['유효', 'ok'], expired: ['만료', 'mute'], ordered: ['주문 전환', 'info'] };
  /* 견적 발행: 장바구니를 현재 가격으로 다시 계산해 스냅샷으로 저장 */
  SV.issueQuote = function (m, items, opt) {
    opt = opt || {};
    var t = U.now(), set = ST.s.settings;
    if (!PR.canSee(m) || !items.length) throw new Error('승인된 회원 계정과 견적 품목을 확인해 주세요.');
    var lines = items.map(function (it) { return PR.line(m, it.cid, it.qty); });
    if (lines.some(function (l) { return !l; })) throw new Error('품목의 판매 상태와 주문 수량을 다시 확인해 주세요.');
    var tot = PR.totals(lines);
    var q = {
      no: SV.seq('Q', t), uid: m.id, at: t, validUntil: U.endOfDay(t + (set.validDays - 1) * DAY), lines: lines, tot: tot,
      buyer: { company: m.company, name: m.name, dept: m.dept, phone: m.phone, email: m.email, bizNo: m.bizNo, kind: m.kind, type: m.type },
      supplier: { company: set.company, bizNo: set.bizNo, ceo: set.ceo, addr: set.addr, biz: set.biz, tel: set.tel, email: set.email, bank: set.bank },
      memo: opt.memo || '', from: opt.from || '', ms: 0, downloads: 0
    };
    ST.s.quotes.unshift(q);
    ST.log('quote', (m.company || m.name) + ' 견적서 발행 ' + q.no + ' · ' + U.won(tot.total) + '원', q.no);
    ST.save();
    return q;
  };
  /* 주문 생성: 같은 요청 ID는 한 번만 처리하고, 견적은 한 번만 주문으로 전환 */
  SV.createOrder = function (m, src, form) {
    if (!PR.canSee(m)) return { ok: false, msg: '승인된 회원 계정으로 주문해 주세요.' };
    var dup = ST.s.orders.filter(function (o) { return o.uid === m.id && o.reqId === form.reqId; })[0];
    if (dup) return { ok: true, order: dup, dup: true };
    var lines, quoteNo = '';
    if (src.type === 'quote') {
      var q = ST.quote(src.no); if (!q || q.uid !== m.id) return { ok: false, msg: '본인 명의의 견적서만 주문할 수 있습니다.' };
      var st = SV.quoteState(q);
      if (st === 'ordered') return { ok: false, code: 'ORDERED', msg: '이미 주문으로 전환된 견적서입니다. (' + q.orderNo + ')' };
      if (st === 'expired') return { ok: false, code: 'EXPIRED', msg: '유효기간이 지난 견적서입니다. 현재 가격으로 다시 발행해 주세요.' };
      lines = q.lines.map(function (l) { return Object.assign({}, l); }); quoteNo = q.no;
    } else {
      lines = src.items.map(function (it) { return PR.line(m, it.cid, it.qty); });
    }
    if (!lines.length || lines.some(function (l) { return !l; })) return { ok: false, msg: '판매 상태와 수량을 확인한 뒤 다시 주문해 주세요.' };
    // 견적 발행 당시의 배송비와 부가세까지 보존합니다.
    var t = U.now(), tot = quoteNo ? clone(q.tot) : PR.totals(lines), set = ST.s.settings;
    var o = {
      no: SV.seq('O', t), uid: m.id, at: t, reqId: form.reqId, quoteNo: quoteNo, lines: lines, tot: tot,
      pay: form.pay, evidence: form.evidence, ship: form.ship, memo: form.memo || '',
      status: form.pay === 'bank' ? 'await' : 'pending', depositDue: form.pay === 'bank' ? U.endOfDay(t + (set.depositDays - 1) * DAY) : 0,
      bank: set.bank, attempts: [], paidAt: 0, tax: null, invoiceNo: '', history: [{ at: t, s: form.pay === 'bank' ? 'await' : 'pending', by: '고객' }],
      buyer: { company: m.company, name: m.name, bizNo: m.bizNo, email: m.email, phone: m.phone, ecount: m.ecount || '' }
    };
    if (quoteNo) { var qq = ST.quote(quoteNo); qq.orderNo = o.no; qq.orderedAt = t; }
    ST.s.orders.unshift(o);
    ST.log('order', (m.company || m.name) + ' 주문 생성 ' + o.no + (quoteNo ? ' (견적 ' + quoteNo + ')' : ''), o.no);
    ST.save();
    return { ok: true, order: o };
  };
  SV.OSTATE = {
    pending: ['결제 대기', 'mute'], await: ['입금 대기', 'warn'], paid: ['결제 완료', 'ok'], prep: ['상품 준비', 'info'],
    ship: ['배송 중', 'info'], done: ['배송 완료', 'ok'], cancel: ['취소 완료', 'mute']
  };
  SV.setStatus = function (o, s, by, note) { o.status = s; o.history.push({ at: U.now(), s: s, by: by || '관리자', note: note || '' }); };
  /* PG 결제 승인 → 서버에서 금액 검증 → 주문 확정. 결제 시도마다 고유 ID */
  SV.pgConfirm = function (o, attempt) {
    if (!o || ST.order(o.no) !== o || o.status === 'cancel' || o.pay !== 'card') return { ok: false, code: 'STATE', msg: '결제할 수 없는 주문입니다. 주문 상태를 확인해 주세요.' };
    if (o.status === 'paid' || o.paidAt) { attempt.result = 'dup'; return { ok: false, code: 'DUP', msg: '이미 결제가 완료된 주문입니다. 중복 결제 요청을 차단했습니다.' }; }
    if (o.status !== 'pending') return { ok: false, code: 'STATE', msg: '결제 대기 상태의 주문만 결제할 수 있습니다.' };
    if (attempt.fail) { attempt.result = 'fail'; o.attempts.push(attempt); ST.save(); return { ok: false, code: 'FAIL', msg: '카드사 승인이 거절되었습니다. 다른 카드로 다시 시도해 주세요.' }; }
    if (attempt.amount !== o.tot.total) { attempt.result = 'mismatch'; o.attempts.push(attempt); ST.save(); return { ok: false, code: 'AMOUNT', msg: '결제 금액이 주문 금액과 달라 승인을 취소했습니다.' }; }
    attempt.result = 'ok'; o.attempts.push(attempt); o.paidAt = U.now(); o.payRef = attempt.id;
    SV.setStatus(o, 'paid', 'PG 승인'); ST.log('pay', o.no + ' 카드 결제 승인 · ' + U.won(o.tot.total) + '원', o.no); ST.save();
    return { ok: true };
  };
  SV.confirmDeposit = function (o) {
    if (o.status !== 'await') return { ok: false, msg: '입금 대기 상태의 주문만 입금 확인할 수 있습니다.' };
    o.paidAt = U.now(); SV.setStatus(o, 'paid', '관리자', '입금 확인'); ST.log('pay', o.no + ' 무통장 입금 확인 · ' + U.won(o.tot.total) + '원', o.no); ST.save();
    return { ok: true };
  };
  SV.cancel = function (o, by) {
    if (['ship', 'done', 'cancel'].indexOf(o.status) >= 0) return { ok: false, msg: '출고 이후에는 온라인으로 취소할 수 없습니다.' };
    if (taxJobs[o.no] || o.tax && (o.tax.state === 'issued' || o.tax.state === 'unknown')) return { ok: false, msg: '세금계산서 발행 결과를 확인한 뒤 취소해 주세요. 발행된 건은 수정세금계산서 처리가 필요합니다.' };
    var refund = o.paidAt ? o.tot.total : 0;
    SV.setStatus(o, 'cancel', by || '고객', refund ? '전액 환불 ' + U.won(refund) + '원' : '미결제 취소');
    if (o.quoteNo) { var q = ST.quote(o.quoteNo); if (q) q.cancelledOrder = o.no; }
    ST.log('cancel', o.no + ' 전액 취소' + (refund ? ' · 환불 ' + U.won(refund) + '원' : ''), o.no); ST.save();
    return { ok: true, refund: refund };
  };
  /* 전자세금계산서: 주문당 고유 관리번호. 재시도 전에 관리번호로 먼저 조회해 중복 발행을 막음 */
  SV.taxEligible = function (o) {
    if (o.evidence !== 'tax') return { ok: false, msg: '증빙을 세금계산서로 요청한 주문이 아닙니다.' };
    if (o.pay === 'card' && !ST.s.settings.cardTaxInvoice) return { ok: false, msg: '카드 결제 건은 매출전표가 증빙입니다. (기본 설정에서 변경 가능)' };
    if (!o.paidAt || o.status === 'cancel') return { ok: false, msg: '결제(입금) 확인 후 발행할 수 있습니다.' };
    return { ok: true };
  };
  SV.mgmtKey = function (o) { return 'SL' + o.no.replace(/\D/g, ''); };
  SV.taxQuery = function (key) {
    return U.wait(380).then(function () { return ST.s.invoices.filter(function (iv) { return iv.key === key && iv.state === 'issued'; })[0] || null; });
  };
  var taxJobs = Object.create(null);
  SV.taxIssue = function (o, opt) {
    if (!o || ST.order(o.no) !== o) return Promise.resolve({ ok: false, msg: '주문 정보를 다시 확인해 주세요.', log: [] });
    if (taxJobs[o.no]) return taxJobs[o.no];
    var state = ST.s;
    function current() { return ST.s === state && ST.order(o.no) === o && SV.taxEligible(o).ok; }
    var job = issueTax(o, opt, current);
    taxJobs[o.no] = job;
    return job.then(function (r) { if (taxJobs[o.no] === job) delete taxJobs[o.no]; return r; }, function (e) { if (taxJobs[o.no] === job) delete taxJobs[o.no]; throw e; });
  };
  function issueTax(o, opt, current) {
    opt = opt || {};
    var key = SV.mgmtKey(o), log = [], wasUnknown = !!(o.tax && o.tax.state === 'unknown');
    var el = SV.taxEligible(o); if (!el.ok) return Promise.resolve({ ok: false, msg: el.msg, log: log });
    log.push('관리번호 ' + key + ' 로 기존 발행 여부 조회');
    return SV.taxQuery(key).then(function (found) {
      if (!current()) return { ok: false, msg: '주문 상태가 변경되어 발행을 중단했습니다.', log: log };
      if (found) {
        log.push('이미 발행된 건 확인 → 재발행 요청을 보내지 않음');
        o.tax = { state: 'issued', key: key, nts: found.nts, at: found.at };
        ST.save();
        if (wasUnknown) return { ok: false, dup: true, recovered: true, msg: '조회 결과 직전 요청이 이미 발행되어 있었습니다. 상태를 발행 완료로 맞추고 재발행하지 않았습니다. (승인번호 ' + found.nts + ')', log: log, inv: found };
        return { ok: false, dup: true, msg: '이미 발행된 세금계산서입니다. 중복 발행을 차단했습니다.', log: log, inv: found };
      }
      log.push('발행 요청 전송 (공급가액 ' + U.won(o.tot.supply + o.tot.ship) + ' / 세액 ' + U.won(o.tot.vat) + ')');
      return U.wait(700).then(function () {
        if (!current()) return { ok: false, msg: '주문 상태가 변경되어 발행을 중단했습니다.', log: log };
        var nts = U.ymd(U.now(), '') + '-' + '4100' + String(1000 + Math.floor(Math.random() * 8999)) + '-' + Math.random().toString(16).slice(2, 10).toUpperCase();
        var inv = { key: key, orderNo: o.no, nts: nts, at: U.now(), state: 'issued', supply: o.tot.supply + o.tot.ship, vat: o.tot.vat, buyer: o.buyer.company, bizNo: o.buyer.bizNo };
        ST.s.invoices.unshift(inv);
        if (opt.timeout) {
          log.push('응답 시간 초과 — 발행 결과를 알 수 없음 (재시도 시 먼저 조회)');
          o.tax = { state: 'unknown', key: key }; ST.save();
          return { ok: false, timeout: true, msg: '응답이 지연되어 결과를 확인하지 못했습니다. 「다시 시도」를 누르면 먼저 조회합니다.', log: log };
        }
        log.push('국세청 승인번호 수신 ' + nts);
        o.tax = { state: 'issued', key: key, nts: nts, at: inv.at };
        ST.log('tax', o.no + ' 전자세금계산서 발행 · 승인번호 ' + nts, o.no); ST.save();
        return { ok: true, inv: inv, log: log };
      });
    });
  }

  /* ---------- 초기 데이터 ---------- */
  function seed() {
    var now = Date.now();
    var s = {
      v: 1, shift: 0, user: null, seq: {}, carts: {}, quotes: [], orders: [], invoices: [], audit: [], priceLog: [], inquiries: [],
      members: clone(D.MEMBERS).map(function (m) { m.joinedAt = now + (m.joined || 0) * DAY; delete m.joined; m.nts = m.nts ? Object.assign({ at: m.joinedAt }, m.nts) : null; return m; }),
      products: clone(D.PRODUCTS), policy: clone(D.POLICY), settings: clone(D.SETTINGS), faq: clone(D.FAQ), seen: {}
    };
    ST.s = s;
    var biz = ST.member('m-biz'), univ = ST.member('m-univ'), onn = ST.member('m-onn');
    function atAgo(d, h) { var x = new Date(now - d * DAY); x.setHours(h || 10, 20 + (d * 7) % 30, 0, 0); return Math.min(x.getTime(), now - (40 + h) * 60000); }
    function mkQuote(m, items, d) {
      var keep = s.shift; s.shift = 0;
      var realNow = Date.now; Date.now = function () { return atAgo(d, 10 + d % 6); };
      var q = SV.issueQuote(m, items); q.ms = 380 + (d * 37) % 400;
      Date.now = realNow; s.shift = keep; return q;
    }
    var q1 = mkQuote(univ, [{ cid: 'P01-05', qty: 2 }, { cid: 'P16-02', qty: 2 }, { cid: 'P05-03', qty: 1 }], 12);
    mkQuote(univ, [{ cid: 'P10-04', qty: 3 }, { cid: 'P07-01', qty: 6 }], 41);
    var q3 = mkQuote(biz, [{ cid: 'P02-04', qty: 1 }, { cid: 'P17-01', qty: 1 }], 6);
    var q4 = mkQuote(biz, [{ cid: 'P04-02', qty: 2 }, { cid: 'P08-01', qty: 1 }, { cid: 'P19-02', qty: 3 }], 1);
    var q5 = mkQuote(onn, [{ cid: 'P13-02', qty: 1 }, { cid: 'P18-01', qty: 1 }], 3);
    mkQuote(onn, [{ cid: 'P22-02', qty: 20 }, { cid: 'P23-01', qty: 4 }], 0);
    void q1; void q4;

    function mkOrder(m, src, d, form, after) {
      var realNow = Date.now; Date.now = function () { return atAgo(d, 14); };
      var r = SV.createOrder(m, src, Object.assign({ reqId: U.uid('req'), ship: { name: m.name, phone: m.phone, addr: m.company + ' 자재 수령처', zip: '15588' } }, form));
      Date.now = realNow; if (after) after(r.order); return r.order;
    }
    mkOrder(biz, { type: 'quote', no: q3.no }, 5, { pay: 'bank', evidence: 'tax' }, function (o) {
      o.paidAt = atAgo(3, 11); o.history.push({ at: o.paidAt, s: 'paid', by: '관리자', note: '입금 확인' });
      o.history.push({ at: atAgo(2, 9), s: 'prep', by: '관리자' }); o.status = 'prep';
    });
    mkOrder(onn, { type: 'quote', no: q5.no }, 0, { pay: 'bank', evidence: 'tax' });
    mkOrder(univ, { type: 'cart', items: [{ cid: 'P22-02', qty: 15 }, { cid: 'P19-01', qty: 2 }] }, 4, { pay: 'card', evidence: 'card' }, function (o) {
      o.attempts.push({ id: 'PAY-' + o.no.slice(-4) + 'A1', amount: o.tot.total, result: 'ok', at: o.at + 40000 });
      o.paidAt = o.at + 42000; o.payRef = o.attempts[0].id;
      o.history.push({ at: o.paidAt, s: 'paid', by: 'PG 승인' }, { at: atAgo(3, 15), s: 'prep', by: '관리자' }, { at: atAgo(2, 16), s: 'ship', by: '관리자', note: '송장 5520-1180-2214' });
      o.status = 'ship'; o.invoiceNo = '5520-1180-2214';
    });
    mkOrder(onn, { type: 'cart', items: [{ cid: 'P06-02', qty: 2 }, { cid: 'P16-01', qty: 6 }] }, 9, { pay: 'bank', evidence: 'tax' }, function (o) {
      o.paidAt = atAgo(8, 10); o.history.push({ at: o.paidAt, s: 'paid', by: '관리자', note: '입금 확인' }, { at: atAgo(7, 15), s: 'ship', by: '관리자', note: '송장 5520-1180-1902' }, { at: atAgo(5, 13), s: 'done', by: '택배사' });
      o.status = 'done'; o.invoiceNo = '5520-1180-1902';
      var key = SV.mgmtKey(o), nts = U.ymd(atAgo(8, 11), '') + '-41000237-5F2C9A1E';
      s.invoices.push({ key: key, orderNo: o.no, nts: nts, at: atAgo(8, 11), state: 'issued', supply: o.tot.supply + o.tot.ship, vat: o.tot.vat, buyer: o.buyer.company, bizNo: o.buyer.bizNo });
      o.tax = { state: 'issued', key: key, nts: nts, at: atAgo(8, 11) };
    });
    s.quotes.sort(function (a, b) { return b.at - a.at; }); s.orders.sort(function (a, b) { return b.at - a.at; });
    s.carts['m-univ'] = [];
    s.audit = [];
    s.audit.push({ at: now - 0.2 * DAY, kind: 'join', text: '누리솔루션 가입 신청 · 국세청 계속사업자 확인', ref: 'm-pend' });
    s.audit.push({ at: now - 0.6 * DAY, kind: 'join', text: '새솔대학교 대학원 문태오 가입 신청 · 재학증명서 첨부', ref: 'm-gr2' });
    s.quotes.slice(0, 4).forEach(function (q) { s.audit.push({ at: q.at, kind: 'quote', text: q.buyer.company + ' 견적서 발행 ' + q.no, ref: q.no }); });
    s.audit.sort(function (a, b) { return b.at - a.at; });
    s.inquiries.push({ id: 'iq-1', at: now - 0.3 * DAY, who: '온누리전자 주식회사', q: 'VNA 교정 키트도 같이 견적 가능한가요?', state: 'open', log: [] });
    return s;
  }
})();
