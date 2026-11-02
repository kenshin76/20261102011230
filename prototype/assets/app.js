/* 라우터 · 화면 틀 · 모달 · 알림 · 기능 살펴보기 · 상담 챗봇 */
(function () {
  'use strict';
  var U = window.U, ST = window.ST, D = window.D, SV = window.SV;
  var ic = U.ic, esc = U.esc;
  var APP = window.APP = { screens: {}, act: {}, hint: null, route: null, modals: [] };
  APP.context = function () { return { state: ST.s, uid: ST.s.user, path: location.hash || '' }; };
  APP.sameContext = function (ctx) { return ST.s === ctx.state && ST.s.user === ctx.uid && (location.hash || '') === ctx.path; };
  APP.closeModals = function (reason, staleOnly) {
    APP.modals.slice().forEach(function (m) { if (!staleOnly || !APP.sameContext(m.context)) m.close(reason); });
  };

  /* ---------- 라우팅 ---------- */
  APP.go = function (path) { if (location.hash === '#' + path) APP.render(); else location.hash = path; };
  APP.parse = function () {
    var h = (location.hash || '').replace(/^#/, '');
    if (!h) { h = '/'; history.replaceState(null, '', '#' + h); }
    function decode(s) { try { return decodeURIComponent(s); } catch (e) { return s; } }
    var parts = h.split('?')[0].split('/').filter(Boolean).map(decode);
    var qs = {}; (h.split('?')[1] || '').split('&').forEach(function (kv) { if (kv) { var p = kv.split('='); qs[p[0]] = decode(p[1] || ''); } });
    return { path: h, parts: parts, qs: qs };
  };
  var ROUTES = [
    ['login', 'login'], ['signup', 'signup'], ['pending', 'pending'],
    ['', 'home'], ['c', 'cat'], ['search', 'search'], ['p', 'product'], ['cart', 'cart'], ['q', 'quote'], ['checkout', 'checkout'],
    ['my', 'my'], ['o', 'order'], ['admin', 'admin']
  ];
  APP.render = function () {
    var r = APP.parse(), head = r.parts[0] || '', name = 'home';
    if (APP.route && APP.route.path !== r.path && APP.cancelAdminReads) APP.cancelAdminReads();
    ROUTES.forEach(function (x) { if (x[0] === head) name = x[1]; });
    var scr = APP.screens[name] || APP.screens.home, me = ST.me();
    APP.route = { name: name, parts: r.parts, qs: r.qs, path: r.path };
    APP.closeModals('navigation', true);
    if (scr.admin && (!me || me.role !== 'admin')) { APP.toast('관리자 계정으로 로그인해 주세요.', 'warn'); return APP.go('/login'); }
    if (scr.auth && !me) { APP.afterLogin = r.path; APP.toast('로그인 후 이용할 수 있습니다.', 'warn'); return APP.go('/login'); }
    if (me && me.role === 'admin' && !scr.admin && !scr.bare && !APP.adminShop) { /* 관리자도 쇼핑몰을 볼 수 있음 */ }
    var html = scr.render(r.parts.slice(1), r.qs);
    var root = document.getElementById('app');
    if (scr.bare) root.innerHTML = html;
    else if (scr.admin) root.innerHTML = APP.adminShell(html, r.parts[1] || 'dash');
    else root.innerHTML = APP.shopShell(html, name);
    document.body.className = scr.bare ? 'bare' : scr.admin ? 'admin' : 'shop';
    document.body.classList.toggle('noscroll', APP.modals.length > 0);
    if (scr.mount) scr.mount(root, r.parts.slice(1), r.qs);
    APP.mountHint(); APP.renderDemo(); APP.renderBot();
    if (!APP.keepScroll) window.scrollTo(0, 0);
    APP.keepScroll = false;
    var t = root.querySelector('[data-title]'); document.title = (t ? t.getAttribute('data-title') + ' · ' : '') + 'SIGNALAB [프로토타입]';
  };
  APP.refresh = function () { APP.keepScroll = true; APP.render(); };

  /* ---------- 쇼핑몰 틀 ---------- */
  APP.badgeCounts = function () {
    var me = ST.me(); if (!me) return { cart: 0, quotes: 0 };
    return {
      cart: ST.cart().reduce(function (s, x) { return s + 1; }, 0),
      quotes: ST.s.quotes.filter(function (q) { return q.uid === me.id && SV.quoteState(q) === 'valid'; }).length
    };
  };
  APP.memberChip = function (me) {
    if (!me) return '<span class="mchip guest">' + ic('lock') + '비회원 · 가격 비공개</span>';
    if (me.role === 'admin') return '<span class="mchip admc">' + ic('shield') + '운영 관리자</span>';
    if (me.status !== 'approved') return '<span class="mchip pnd">' + ic('hourglass') + (me.status === 'rejected' ? '가입 반려' : '가입 승인 대기') + '</span>';
    var r = window.PR.rateOf(me);
    return '<span class="mchip ok">' + ic('check') + esc(D.TYPE_NAME[me.type]) + ' 회원' + (me.grade === 'vip' ? ' · 우수' : '') + (r ? ' · <b>' + r + '% 할인</b>' : '') + '</span>';
  };
  APP.shopShell = function (inner, name) {
    var me = ST.me(), b = APP.badgeCounts(), q = (APP.route.name === 'search' && APP.route.parts[1]) || '';
    var cats = D.CATS.map(function (c) { return '<a href="#/c/' + c.id + '" class="' + (APP.route.name === 'cat' && APP.route.parts[1] === c.id ? 'on' : '') + '">' + esc(c.name) + '</a>'; }).join('');
    var mega = D.CATS.map(function (c) {
      var ps = ST.s.products.filter(function (p) { return p.cat === c.id && p.visible; }).slice(0, 3);
      return '<div class="mg-col"><a class="mg-h" href="#/c/' + c.id + '">' + esc(c.name) + ic('right') + '</a>' + ps.map(function (p) { return '<a href="#/p/' + p.id + '">' + esc(p.brand + ' ' + p.model) + '</a>'; }).join('') + '</div>';
    }).join('');
    return '<div class="ubar"><div class="wrap ubar-in"><span class="ub-t">연구실과 산업 현장을 위한 계측기 · 전자부품</span><a class="admin-entry" href="#/admin">' + ic('shield') + '관리자</a>' +
      '<span class="ub-r">' + APP.memberChip(me) + (me ? (me.role === 'admin' ? '<a href="#/admin">관리자 콘솔</a>' : '') + '<button class="lnk" data-act="logout">로그아웃</button>' : '<a href="#/login">로그인</a><a href="#/signup">회원가입</a>') + '</span></div></div>' +
      '<header class="hd"><div class="wrap hd-in">' +
      '<a class="brand" href="#/" aria-label="SIGNALAB 홈">' + U.logo() + '<span><b>SIGNALAB</b><small>계측기 · 전자부품 B2B</small></span></a>' +
      '<form class="sbox" data-act-submit="search" role="search"><span class="sb-i">' + ic('search') + '</span><input name="q" value="' + esc(q) + '" placeholder="모델명, 상품명, 품목코드로 검색 (예: DSO, 프로브)" aria-label="상품 검색"><button class="btn sm pri" type="submit">검색</button></form>' +
      '<nav class="hd-act" aria-label="내 메뉴">' +
      '<a href="#/my/quotes" class="ha">' + ic('doc') + '<span>견적함</span>' + (b.quotes ? '<i class="bdg">' + b.quotes + '</i>' : '') + '</a>' +
      '<a href="#/cart" class="ha">' + ic('cart') + '<span>장바구니</span>' + (b.cart ? '<i class="bdg hot">' + b.cart + '</i>' : '') + '</a>' +
      '<a href="' + (me ? '#/my' : '#/login') + '" class="ha">' + ic('user') + '<span>' + (me ? '마이' : '로그인') + '</span></a></nav></div>' +
      '<div class="catnav"><div class="wrap cn-in"><div class="mega-w"><button class="allcat" data-act="mega" aria-expanded="false">' + ic('menu') + '전체 카테고리</button><div class="mega" id="mega"><div class="wrap mega-in">' + mega + '</div></div></div>' +
      '<div class="cn-l">' + cats + '</div><a class="cn-q" href="#/cart">' + ic('bolt') + '1초 견적</a></div></div></header>' +
      '<main id="view" class="view">' + inner + '</main>' +
      '<footer class="ft"><div class="wrap ft-in"><div class="ft-b">' + U.logo() + '<div><b>SIGNALAB</b><p>가상 브랜드로 구성한 B2B 판매몰 프로토타입입니다. 상품·가격·회사·주문 정보는 모두 시연용 가상 데이터이며, 결제·세금계산서·국세청 조회는 브라우저 안에서 재현합니다.</p></div></div>' +
      '<div class="ft-l"><a href="#/">홈</a><a href="#/cart">장바구니 · 견적</a><a href="#/my/quotes">내 견적함</a><a href="#/my/orders">주문 내역</a><button class="lnk" data-act="bot-open">상담 챗봇</button><button class="lnk" data-act="demo">체험 기능 안내</button><a href="#/admin">관리자 콘솔</a></div></div></footer>' +
      '<nav class="tabbar" aria-label="하단 메뉴"><a href="#/" class="' + (name === 'home' ? 'on' : '') + '">' + ic('home') + '<span>홈</span></a><a href="#/c/osc" class="' + (name === 'cat' ? 'on' : '') + '">' + ic('grid') + '<span>카테고리</span></a>' +
      '<a href="#/cart" class="tb-q ' + (name === 'cart' ? 'on' : '') + '">' + ic('bolt') + '<span>1초 견적</span>' + (b.cart ? '<i class="bdg hot">' + b.cart + '</i>' : '') + '</a>' +
      '<a href="#/my/quotes" class="' + (name === 'my' && APP.route.parts[1] === 'quotes' ? 'on' : '') + '">' + ic('doc') + '<span>견적함</span></a><a href="' + (me ? '#/my' : '#/login') + '" class="' + (name === 'my' && !APP.route.parts[1] ? 'on' : '') + '">' + ic('user') + '<span>마이</span></a></nav>';
  };

  /* ---------- 관리자 틀 ---------- */
  APP.ADMIN_MENU = [
    ['운영', [['dash', '대시보드', 'chart'], ['signup', '가입 승인', 'users'], ['members', '회원 · 등급', 'user']]],
    ['상품 · 가격', [['products', '상품 · 조합 가격표', 'tag'], ['upload', '엑셀 일괄 업로드', 'table'], ['policy', '가격 정책', 'sliders']]],
    ['판매', [['quotes', '견적 관리', 'doc'], ['orders', '주문 · 입금확인', 'box'], ['tax', '전자세금계산서', 'receipt']]],
    ['고객 · 연동', [['faq', '챗봇 FAQ · 문의', 'chat'], ['ecount', '이카운트 연동 준비', 'erp'], ['settings', '기본 설정', 'settings']]]
  ];
  APP.adminCounts = function () {
    return {
      signup: ST.s.members.filter(function (m) { return m.status === 'pending'; }).length,
      orders: ST.s.orders.filter(function (o) { return o.status === 'await'; }).length,
      tax: ST.s.orders.filter(function (o) { return SV.taxEligible(o).ok && !(o.tax && o.tax.state === 'issued'); }).length,
      faq: ST.s.inquiries.filter(function (x) { return x.state === 'open'; }).length
    };
  };
  APP.adminShell = function (inner, cur) {
    var cnt = APP.adminCounts(), me = ST.me(), label = '대시보드';
    APP.ADMIN_MENU.forEach(function (g) { g[1].forEach(function (m) { if (m[0] === cur) label = g[0] + ' · ' + m[1]; }); });
    var nav = APP.ADMIN_MENU.map(function (g) {
      return '<div class="sn-g"><span class="sn-gt">' + g[0] + '</span>' + g[1].map(function (m) {
        return '<a href="#/admin/' + m[0] + '" class="' + (cur === m[0] ? 'on' : '') + '">' + ic(m[2]) + '<span>' + m[1] + '</span>' + (cnt[m[0]] ? '<i class="bdg' + (m[0] === 'signup' || m[0] === 'orders' ? ' hot' : '') + '">' + cnt[m[0]] + '</i>' : '') + '</a>';
      }).join('') + '</div>';
    }).join('');
    return '<div class="adm"><aside class="side" id="side"><a class="brand dk" href="#/admin">' + U.logo() + '<span><b>SIGNALAB</b><small>관리자 콘솔</small></span></a><nav class="snav">' + nav + '</nav>' +
      '<div class="side-f"><span class="proto">[프로토타입]</span><p>가상 데이터 · 브라우저 안에서 동작</p><button class="lnk" data-act="demo">체험 기능 안내</button></div></aside><div class="side-dim" data-act="side"></div>' +
      '<div class="amain"><header class="atop"><button class="ibtn only-m" data-act="side" aria-label="메뉴">' + ic('menu') + '</button><div class="atop-t">' + esc(label) + '</div>' +
      '<div class="atop-r"><a class="btn sm ghost" href="#/" data-act="to-shop">' + ic('home') + '<span>쇼핑몰 보기</span></a><span class="who">' + ic('shield') + esc(me ? me.name : '') + '</span><button class="ibtn" data-act="logout" aria-label="로그아웃" title="로그아웃">' + ic('logout') + '</button></div></header>' +
      '<main id="view" class="aview">' + inner + '</main></div></div>';
  };

  /* ---------- 모달 · 알림 ---------- */
  APP.modal = function (o) {
    var context = APP.context(), returnFocus = document.activeElement;
    var el = document.createElement('div');
    el.className = 'mdl-w'; el.innerHTML = '<div class="mdl-dim" data-x></div><div class="mdl ' + (o.size || '') + '" role="dialog" aria-modal="true" aria-label="' + esc(o.title || '') + '">' +
      '<div class="mdl-h"><h3>' + (o.titleHtml || esc(o.title || '')) + '</h3>' + (o.noClose ? '' : '<button class="ibtn" data-x aria-label="닫기">' + ic('x') + '</button>') + '</div>' +
      '<div class="mdl-b">' + (o.body || '') + '</div>' + (o.foot ? '<div class="mdl-f">' + o.foot + '</div>' : '') + '</div>';
    document.body.appendChild(el); document.body.classList.add('noscroll');
    requestAnimationFrame(function () { el.classList.add('on'); });
    var closed = false;
    function close(reason) {
      if (closed) return;
      closed = true; el.classList.remove('on');
      APP.modals = APP.modals.filter(function (m) { return m !== modal; });
      document.body.classList.toggle('noscroll', APP.modals.length > 0);
      if (reason) el.remove(); else setTimeout(function () { el.remove(); }, 200);
      document.removeEventListener('keydown', esc1);
      if (!reason && returnFocus && returnFocus.isConnected) returnFocus.focus();
      if (o.onClose) o.onClose(reason);
    }
    function esc1(e) {
      if (APP.modals[APP.modals.length - 1] !== modal) return;
      if (e.key === 'Escape' && !o.noClose) close();
      if (e.key === 'Tab') {
        var inputs = Array.prototype.filter.call(el.querySelectorAll('button, a[href], input, select, textarea, [tabindex="0"]'), function (x) { return !x.disabled && x.getClientRects().length; });
        if (!inputs.length) return;
        var first = inputs[0], last = inputs[inputs.length - 1];
        if (e.shiftKey && (document.activeElement === first || !el.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (document.activeElement === last || !el.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
      }
    }
    var modal = { el: el, close: close, context: context, body: el.querySelector('.mdl-b'), foot: el.querySelector('.mdl-f'), active: function () { return !closed && APP.sameContext(context) && el.isConnected; } };
    APP.modals.push(modal);
    document.addEventListener('keydown', esc1);
    el.addEventListener('click', function (e) { if (e.target.closest('[data-x]') && !o.noClose) close(); });
    if (o.mount) o.mount(el.querySelector('.mdl'), close);
    var f = el.querySelector('[autofocus], button, input, select'); if (f) setTimeout(function () { if (modal.active()) f.focus(); }, 60);
    return modal;
  };
  APP.confirm = function (title, text, okLabel, cb, danger) {
    var m = APP.modal({ title: title, size: 'sm', body: '<p class="cf-t">' + text + '</p>', foot: '<button class="btn ghost" data-x>취소</button><button class="btn ' + (danger ? 'dgr' : 'pri') + '" data-ok>' + esc(okLabel) + '</button>' });
    m.el.querySelector('[data-ok]').addEventListener('click', function () { if (!m.active()) { m.close('stale'); return; } m.close(); cb(); });
  };
  APP.toast = function (msg, kind) {
    var host = document.getElementById('toasts'); if (!host) return;
    var t = document.createElement('div'); t.className = 'toast ' + (kind || ''); t.setAttribute('role', 'status');
    t.innerHTML = ic(kind === 'err' ? 'alert' : kind === 'warn' ? 'info' : 'check') + '<span>' + msg + '</span>';
    host.appendChild(t); requestAnimationFrame(function () { t.classList.add('on'); });
    setTimeout(function () { t.classList.remove('on'); setTimeout(function () { t.remove(); }, 300); }, 3200);
  };
  APP.pill = function (map, k) { var x = map[k] || [k, 'mute']; return '<span class="pill ' + x[1] + '">' + esc(x[0]) + '</span>'; };

  /* ---------- 시연 안내 띠 ---------- */
  APP.mountHint = function () {
    var v = document.getElementById('view'); if (!v || !APP.hint) return;
    if (APP.hint.route && APP.route.path.indexOf(APP.hint.route) !== 0) { APP.hint = null; return; }
    var d = document.createElement('div'); d.className = 'hint';
    d.innerHTML = '<span class="hint-k">' + ic('spark') + '시연 안내</span><p><b>' + esc(APP.hint.t) + '</b> ' + APP.hint.d + '</p><button class="ibtn" data-act="hint-x" aria-label="안내 닫기">' + ic('x') + '</button>';
    v.insertBefore(d, v.firstChild);
  };
  APP.act['hint-x'] = function () { APP.hint = null; var h = document.querySelector('.hint'); if (h) h.remove(); };

  /* ---------- 공용 동작 ---------- */
  APP.switchAccount = function (id) {
    if (ST.s.user !== id) {
      APP.closeModals('account');
      APP.botOpen = false; APP.pdfCache = {}; APP.afterLogin = null;
      if (APP.clearAccountForms) APP.clearAccountForms();
      if (APP.clearAdminDrafts) APP.clearAdminDrafts();
    }
    ST.s.user = id; ST.save();
  };
  APP.login = function (id) {
    APP.switchAccount(id);
    var me = ST.me(); APP.toast(esc(me.name) + '님, 환영합니다.');
  };
  APP.act.logout = function () { APP.switchAccount(null); APP.hint = null; APP.toast('로그아웃했습니다.'); APP.go('/login'); };
  APP.act.mega = function (el) { var w = el.closest('.mega-w'), on = !w.classList.contains('open'); w.classList.toggle('open', on); el.setAttribute('aria-expanded', on); };
  APP.act.side = function () { document.querySelector('.adm').classList.toggle('side-on'); };
  APP.act.reset = function () {
    APP.confirm('체험 데이터 초기화', '이 브라우저에 저장된 장바구니·견적·주문·관리자 변경 내용과 로그인 상태를 모두 처음 상태로 되돌립니다.', '초기화', function () {
      APP.switchAccount(null); ST.reset(); APP.pdfCache = {}; APP.botOpen = false; APP.hint = null; APP.toast('체험 데이터를 초기화했습니다.'); APP.go('/login'); APP.render();
    }, true);
  };

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-act]');
    if (a && APP.act[a.getAttribute('data-act')]) { if (a.tagName === 'A' && a.getAttribute('href') === '#') e.preventDefault(); APP.act[a.getAttribute('data-act')](a, e); }
    if (!e.target.closest('.mega-w')) { var mw = document.querySelector('.mega-w.open'); if (mw) { mw.classList.remove('open'); mw.querySelector('.allcat').setAttribute('aria-expanded', 'false'); } }
    if (e.target.closest('.mega a')) { var m2 = document.querySelector('.mega-w.open'); if (m2) m2.classList.remove('open'); }
  });
  document.addEventListener('submit', function (e) {
    var f = e.target.closest('[data-act-submit]'); if (!f) return;
    e.preventDefault(); var k = f.getAttribute('data-act-submit'); if (APP.act[k]) APP.act[k](f, e);
  });
  APP.act.search = function (f) { var q = f.q.value.trim(); APP.go(q ? '/search/' + encodeURIComponent(q) : '/'); };

  /* ---------- 기능 살펴보기 ---------- */
  function as(id) { APP.switchAccount(id); }
  APP.SCEN = [
    { t: '회원 유형별 가격 노출', d: '비회원·승인대기는 「회원 전용 가격」, 승인 회원은 할인 적용가', run: function () { as(null); APP.hint = { route: '/p/P01', t: '비회원으로 상품을 보고 있습니다.', d: '가격 대신 「회원 전용 가격」이 보입니다. 하단 「체험 기능 안내」에서 대학 계정으로 바꾸면 5% 할인가가 나타납니다.' }; APP.go('/p/P01'); } },
    { t: '대학 5% 할인 · 예외 상품', d: '대학 계정으로 조합별 기준가 → 할인 → 적용가 확인', run: function () { as('m-univ'); APP.hint = { route: '/p/P01', t: '대학 회원(5%)으로 보는 화면입니다.', d: '옵션을 바꾸면 조합별 기준가와 10원 절사한 할인가가 즉시 계산됩니다. 「가격 정책 예외」의 할인 제외·정찰가 상품도 눌러 보세요.' }; APP.go('/p/P01'); } },
    { t: '장바구니 → 1초 견적서 PDF', d: '견적번호 자동 채번 · 30일 유효 · PDF 즉시 발행', run: function () {
      as('m-univ'); ST.s.carts['m-univ'] = [cartItem('P01-04', 2), cartItem('P16-02', 1), cartItem('P07-04', 4), cartItem('P12-01', 4)]; ST.save();
      APP.hint = { route: '/cart', t: '장바구니에 4개 품목을 담아 두었습니다.', d: '「1초 견적서 발행」을 누르면 현재 가격으로 견적번호가 붙은 PDF가 만들어지고 걸린 시간이 표시됩니다.' }; APP.go('/cart'); } },
    { t: '견적서 → 주문 → PG 결제', d: '견적 금액 그대로 주문 전환 · 결제 시도별 ID · 중복 결제 차단', run: function () {
      as('m-biz'); var q = ST.s.quotes.filter(function (x) { return x.uid === 'm-biz' && SV.quoteState(x) === 'valid'; })[0];
      if (!q) { q = SV.issueQuote(ST.member('m-biz'), [{ cid: 'P04-02', qty: 2 }, { cid: 'P19-02', qty: 3 }]); }
      APP.hint = { route: '/q/' + q.no, t: '법인 회원의 유효한 견적서입니다.', d: '「이 견적으로 주문하기」 → 카드 결제를 선택하면 PG 결제창 → 서버 금액 검증 → 주문 확정 단계를 볼 수 있습니다. 같은 견적은 한 번만 주문됩니다.' }; APP.go('/q/' + q.no); } },
    { t: '담은 뒤 가격이 바뀌면 재확인', d: '관리자가 단가를 올린 상황 → 견적 발행 전 변경 내역 고지', run: function () {
      as('m-biz'); ST.s.carts['m-biz'] = [cartItem('P10-04', 2), cartItem('P04-01', 1)];
      var p = ST.product('P10'), c = ST.combo(p, 'P10-04'), old = c.price; c.price = Math.round(old * 1.06 / 1000) * 1000;
      ST.s.priceLog.unshift({ at: U.now(), cid: c.id, name: p.brand + ' ' + p.model + ' ' + c.key, from: old, to: c.price, by: '관리자(시연)' }); ST.save();
      APP.hint = { route: '/cart', t: '담아 둔 AG-4062 기준가가 6% 인상되었습니다.', d: '장바구니에 변경 표시가 나타나고, 「1초 견적서 발행」을 누르면 바뀐 금액을 확인한 뒤에만 발행됩니다.' }; APP.go('/cart'); } },
    { t: '유효기간 만료 견적 처리', d: '시간을 31일 뒤로 이동 → 주문 전환 차단 · 현재가로 재발행', run: function () {
      as('m-univ'); ST.s.shift = 31; ST.save();
      APP.hint = { route: '/my/quotes', t: '체험 시간을 31일 뒤로 옮겼습니다.', d: '유효기간이 지난 견적은 「만료」로 바뀌고 주문 전환이 막힙니다. 「현재 가격으로 재발행」으로 새 견적을 받을 수 있습니다. (기능 살펴보기 하단에서 시간을 되돌릴 수 있습니다)' }; APP.go('/my/quotes'); } },
    { t: '가입 · 사업자 진위확인 · 승인', d: '사업자번호 검증 → 국세청 상태 조회 재현 → 관리자 승인', run: function () {
      as(null); APP.hint = { route: '/signup', t: '회원가입 화면입니다.', d: '아래 예시 번호(계속·휴업·폐업)를 눌러 진위·상태 확인 결과를 비교해 보세요. 가입 후에는 관리자 콘솔 「가입 승인」에서 승인합니다.' }; APP.go('/signup'); } },
    { t: '입금확인 → 세금계산서 발행', d: '무통장 입금 확인 · 관리번호 조회 후 발행 · 중복 발행 차단', run: function () {
      as('m-adm'); var o = ST.s.orders.filter(function (x) { return x.status === 'await'; })[0];
      if (!o) { var onn = ST.member('m-onn'); o = SV.createOrder(onn, { type: 'cart', items: [{ cid: 'P04-01', qty: 1 }, { cid: 'P16-02', qty: 2 }] }, { reqId: U.uid('req'), pay: 'bank', evidence: 'tax', ship: { name: onn.name, phone: onn.phone, addr: onn.company + ' 자재 수령처', zip: '15588' } }).order; }
      APP.hint = { route: '/admin/orders/' + o.no, t: '입금 대기 주문입니다.', d: '「입금 확인」 후 「세금계산서 발행」을 눌러 보세요. 응답 지연을 켜고 발행하면, 다시 시도할 때 관리번호로 먼저 조회해 중복 발행을 막는 과정을 볼 수 있습니다.' }; APP.go('/admin/orders/' + o.no); } },
    { t: '옵션 조합 가격 엑셀 업로드', d: '전체 행 검사 → 오류가 하나라도 있으면 전체 반영 보류', run: function () { as('m-adm'); APP.hint = { route: '/admin/upload', t: '엑셀 일괄 업로드 화면입니다.', d: '「오류 포함 샘플」을 불러오면 행 번호와 사유가 표시되고 반영 버튼이 잠깁니다. 「정상 샘플」은 변경 전후를 확인한 뒤 반영합니다. 양식을 내려받아 직접 수정한 파일도 올릴 수 있습니다.' }; APP.go('/admin/upload'); } },
    { t: '상담 챗봇', d: 'FAQ 버튼 응답 · 키워드 답변 · 상담 채널 연결', run: function () { var me = ST.me(); if (!me || me.role === 'admin' || me.status !== 'approved') as('m-univ'); APP.hint = null; APP.go('/'); setTimeout(function () { APP.bot(true); }, 80); } },
    { t: '이카운트 ERP 연동 준비', d: '품목·거래처 코드 매핑 현황과 전송 데이터 미리보기', run: function () { as('m-adm'); APP.hint = { route: '/admin/ecount', t: '2단계 연동을 위한 준비 화면입니다.', d: '1단계에서는 코드 매핑과 외부 전표번호 칸까지만 갖추고, 실제 전송은 2단계에서 연결합니다.' }; APP.go('/admin/ecount'); } }
  ];
  function cartItem(cid, qty) { var r = ST.comboById(cid), me = ST.member(ST.s.user); return { cid: cid, qty: qty, seen: window.PR.price(r.p, r.c, me).unit, at: U.now() }; }
  APP.cartItem = cartItem;
  APP.demoOpen = false;
  APP.renderDemo = function () {
    var el = document.getElementById('demo'); if (!el) return;
    var me = ST.me();
    el.className = 'demo' + (APP.demoOpen ? ' open' : ' hide') + (APP.route && APP.route.name === 'login' ? ' on-login' : '');
    el.innerHTML = '<button class="demo-fab" data-act="demo" aria-expanded="' + APP.demoOpen + '">' + ic(APP.demoOpen ? 'x' : 'spark') + '<span>기능 살펴보기</span></button>' +
      (APP.demoOpen ? '<div class="demo-p" role="dialog" aria-label="기능 살펴보기"><div class="demo-h"><b>기능 살펴보기</b><span>필요한 계정으로 바꾼 뒤 해당 화면을 엽니다.</span>' +
        '<span class="demo-me">현재: ' + (me ? '<b>' + esc(me.company || me.name) + '</b> · ' + esc(me.kind) : '<b>비회원</b>') + '</span></div><div class="demo-l">' +
        APP.SCEN.map(function (s, i) { return '<button class="demo-i" data-act="scen" data-i="' + i + '"><span class="dnum">' + (i + 1) + '</span><span><b>' + esc(s.t) + '</b><small>' + esc(s.d) + '</small></span>' + ic('right') + '</button>'; }).join('') +
        '</div><div class="demo-f">' + (ST.s.shift ? '<button class="btn sm warn" data-act="unshift">' + ic('time') + '시간 되돌리기 (현재 +' + ST.s.shift + '일)</button>' : '') +
        '<button class="btn sm ghost" data-act="reset">' + ic('refresh') + '체험 데이터 초기화</button></div></div>' : '');
  };
  APP.act.demo = function () { APP.demoOpen = !APP.demoOpen; APP.renderDemo(); };
  APP.act.scen = function (el) {
    var i = +el.getAttribute('data-i'); APP.demoOpen = false;
    if (i !== 5 && ST.s.shift) { ST.s.shift = 0; ST.save(); APP.toast('체험 시간을 현재로 되돌렸습니다.'); }
    APP.SCEN[i].run(); APP.render();
  };
  APP.act.unshift = function () { ST.s.shift = 0; ST.save(); APP.toast('체험 시간을 현재로 되돌렸습니다.'); APP.refresh(); };

  /* ---------- 상담 챗봇 ---------- */
  APP.botOpen = false;
  APP.bot = function (open) { APP.botOpen = open; APP.renderBot(); var i = document.querySelector('.bot-in input'); if (open && i) setTimeout(function () { i.focus(); }, 50); };
  function botLog() {
    // 기존 공용 기록은 소유자를 알 수 없어 표시하지 않습니다.
    if (ST.s.chat) delete ST.s.chat;
    if (!ST.s.chats) ST.s.chats = {};
    var key = ST.s.user || 'guest';
    if (!ST.s.chats[key]) ST.s.chats[key] = [];
    return ST.s.chats[key];
  }
  function faq(id) { return ST.s.faq.filter(function (f) { return f.id === id; })[0]; }
  APP.renderBot = function () {
    var el = document.getElementById('bot'); if (!el) return;
    var name = APP.route && APP.route.name;
    if (name === 'login' || name === 'admin') { el.innerHTML = ''; el.className = 'bot hide'; return; }
    el.className = 'bot' + (APP.botOpen ? ' open' : '');
    if (!APP.botOpen) { el.innerHTML = '<button class="bot-fab" data-act="bot-open" aria-label="상담 챗봇 열기">' + ic('chat') + '<span>상담</span></button>'; return; }
    var log = botLog(), quick = D.QUICK.map(faq).filter(Boolean);
    var msgs = '<div class="bm it"><p>안녕하세요, SIGNALAB 상담 도우미입니다. 자주 묻는 질문을 누르거나 궁금한 내용을 입력해 주세요.</p></div>' +
      log.map(function (m) { return '<div class="bm ' + (m.w === 'u' ? 'me' : 'it') + '"><p>' + m.t + '</p></div>'; }).join('');
    el.innerHTML = '<div class="bot-p" role="dialog" aria-label="상담 챗봇"><div class="bot-h"><span class="bot-av">' + ic('chat') + '</span><div><b>SIGNALAB 상담</b><small>견적 · 주문 · 구매 증빙 안내</small></div>' +
      '<button class="ibtn" data-act="bot-close" aria-label="챗봇 닫기">' + ic('x') + '</button></div><div class="bot-b" id="botB">' + msgs + '</div>' +
      '<div class="bot-q">' + quick.map(function (f) { return '<button data-act="bot-faq" data-id="' + f.id + '">' + esc(f.q) + '</button>'; }).join('') + '<button data-act="bot-myq">내 견적서 찾기</button><button class="hum" data-act="bot-human">상담원 연결</button></div>' +
      '<form class="bot-in" data-act-submit="bot-ask"><input name="q" placeholder="예: 대학 할인, 세금계산서" aria-label="챗봇에 질문 입력" autocomplete="off"><button class="ibtn pri" type="submit" aria-label="보내기">' + ic('send') + '</button></form></div>';
    var b = document.getElementById('botB'); b.scrollTop = b.scrollHeight;
  };
  function say(w, t) { botLog().push({ w: w, t: t, at: U.now() }); if (botLog().length > 40) botLog().shift(); ST.save(); }
  APP.act['bot-open'] = function () { APP.bot(true); };
  APP.act['bot-close'] = function () { APP.bot(false); };
  APP.act['bot-faq'] = function (el) { var f = faq(el.getAttribute('data-id')); say('u', esc(f.q)); say('b', esc(f.a)); APP.renderBot(); };
  APP.act['bot-myq'] = function () {
    say('u', '내 견적서 찾기'); var me = ST.me();
    if (!me) say('b', '로그인하시면 발행한 견적서를 바로 찾아 드립니다. <a href="#/login">로그인하기</a>');
    else {
      var qs = ST.s.quotes.filter(function (q) { return q.uid === me.id; }).slice(0, 3);
      say('b', qs.length ? '최근 견적서입니다.<br>' + qs.map(function (q) { return '<a href="#/q/' + q.no + '">' + q.no + '</a> · ' + U.won(q.tot.total) + '원 · ' + SV.QSTATE[SV.quoteState(q)][0]; }).join('<br>') : '아직 발행한 견적서가 없습니다. 장바구니에서 「1초 견적서 발행」을 눌러 보세요.');
    }
    APP.renderBot();
  };
  APP.act['bot-human'] = function () {
    var me = ST.me(), last = botLog().filter(function (m) { return m.w === 'u'; }).slice(-1)[0];
    say('u', '상담원 연결');
    ST.s.inquiries.unshift({ id: U.uid('iq'), at: U.now(), who: me ? (me.company || me.name) : '비회원', q: last ? last.t.replace(/<[^>]+>/g, '') : '상담원 연결 요청', state: 'open', log: botLog().slice(-6) });
    ST.log('chat', '챗봇 상담원 연결 요청 · ' + (me ? me.company || me.name : '비회원'));
    say('b', '상담 요청을 접수했습니다. 문의 내용을 담당자가 확인합니다. 운영 시간: 평일 09:00~18:00<br><small>체험 화면에서는 문의를 이 브라우저에 기록하며 외부로 전송하지 않습니다.</small>');
    APP.renderBot();
  };
  APP.act['bot-ask'] = function (f) {
    var q = f.q.value.trim(); if (!q) return; say('u', esc(q));
    var best = null, score = 0, low = q.toLowerCase();
    ST.s.faq.forEach(function (x) { var s = x.k.reduce(function (a, k) { return a + (low.indexOf(k.toLowerCase()) >= 0 ? k.length : 0); }, 0); if (s > score) { score = s; best = x; } });
    var p = ST.s.products.filter(function (x) { return low.length > 1 && (x.model.toLowerCase().indexOf(low) >= 0 || x.name.indexOf(q) >= 0); })[0];
    if (best) say('b', esc(best.a));
    else if (p) say('b', '찾으시는 상품이 있습니다: <a href="#/p/' + p.id + '">' + esc(p.brand + ' ' + p.model + ' ' + p.name) + '</a>');
    else say('b', '정확한 답변을 찾지 못했습니다. 「상담원 연결」을 누르시면 담당자가 이어서 안내드립니다.');
    APP.renderBot();
  };

  /* ---------- 시작 ---------- */
  APP.start = function () {
    ST.load();
    window.addEventListener('hashchange', APP.render);
    window.addEventListener('pagehide', function () { ST.flush(); });
    APP.render();
    if (!ST.ok) APP.toast('이 브라우저에서는 저장소를 쓸 수 없어 새로고침하면 처음 상태로 돌아갑니다.', 'warn');
  };
})();
