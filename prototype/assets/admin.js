/* 관리자 콘솔 화면 */
(function () {
  'use strict';
  var U = window.U, ST = window.ST, D = window.D, SV = window.SV, PR = window.PR, ART = window.ART, APP = window.APP;
  var ic = U.ic, esc = U.esc, A = APP.act, DAY = 864e5;
  var P = {};

  APP.screens.admin = {
    admin: true,
    render: function (args) { var k = args[0] || 'dash'; return (P[k] || P.dash).render(args.slice(1)); },
    mount: function (root, args) { var k = args[0] || 'dash'; if ((P[k] || P.dash).mount) (P[k] || P.dash).mount(root, args.slice(1)); }
  };
  function head(t, d, right) { return '<div class="ah"><div><h1 data-title="' + esc(t.replace(/<[^>]+>/g, '')) + '">' + t + '</h1>' + (d ? '<p>' + d + '</p>' : '') + '</div>' + (right ? '<div class="ah-r">' + right + '</div>' : '') + '</div>'; }
  function kpi(label, val, sub, icon, tone, href) {
    var tag = href ? 'a href="' + href + '"' : 'div';
    return '<' + tag + ' class="kpi ' + (tone || '') + '"><span class="kp-i">' + ic(icon) + '</span><small>' + label + '</small><b class="mono">' + val + '</b><span class="kp-s">' + sub + '</span></' + (href ? 'a' : 'div') + '>';
  }
  function mname(id) { var m = ST.member(id); return m ? m.company || m.name : '-'; }
  function back(href, label) { return '<a class="backl" href="' + href + '">' + ic('back') + label + '</a>'; }
  function tbl(headers, rows, cls) { return '<div class="tw"><table class="tbl ' + (cls || '') + '"><thead><tr>' + headers.map(function (h) { return '<th' + (h.charAt(0) === '>' ? ' class="r">' + h.slice(1) : '>' + h) + '</th>'; }).join('') + '</tr></thead><tbody>' + (rows.join('') || '<tr><td colspan="' + headers.length + '" class="nodata">데이터가 없습니다</td></tr>') + '</tbody></table></div>'; }

  /* ---------- 대시보드 ---------- */
  function series() {
    var out = [], now = U.now();
    for (var i = 13; i >= 0; i--) {
      var d0 = new Date(now - i * DAY); d0.setHours(0, 0, 0, 0); var a = d0.getTime(), b = a + DAY;
      var q = ST.s.quotes.filter(function (x) { return x.at >= a && x.at < b; }).length;
      var o = ST.s.orders.filter(function (x) { return x.at >= a && x.at < b; }).length;
      out.push({ d: a, q: q, o: o });
    }
    return out;
  }
  function chart(data) {
    var W = 640, H = 220, pl = 34, pb = 26, max = Math.max(1, Math.max.apply(null, data.map(function (x) { return Math.max(x.q, x.o); }))) * 1.15, bw = (W - pl - 10) / data.length;
    var g = '';
    for (var k = 0; k <= 4; k++) { var y = 10 + (H - pb - 10) * k / 4; g += '<line x1="' + pl + '" x2="' + W + '" y1="' + y + '" y2="' + y + '" class="gl"/><text x="' + (pl - 6) + '" y="' + (y + 3) + '" text-anchor="end" class="ax">' + Math.round(max * (1 - k / 4)) + '</text>'; }
    data.forEach(function (x, i) {
      var cx = pl + i * bw + bw / 2, hq = (H - pb - 10) * x.q / max, ho = (H - pb - 10) * x.o / max;
      g += '<g class="bar" tabindex="0"><title>' + U.md(x.d) + ' · 견적 ' + x.q + '건 · 주문 ' + x.o + '건</title><rect x="' + (cx - bw * 0.36) + '" y="' + (H - pb - hq) + '" width="' + (bw * 0.36) + '" height="' + hq + '" rx="3" class="bq"/>' +
        '<rect x="' + cx + '" y="' + (H - pb - ho) + '" width="' + (bw * 0.36) + '" height="' + ho + '" rx="3" class="bo"/>' + (i % 2 === 0 ? '<text x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle" class="ax">' + U.md(x.d) + '</text>' : '') + '</g>';
    });
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="최근 14일 견적·주문 건수">' + g + '</svg>';
  }
  P.dash = {
    render: function () {
      var c = APP.adminCounts(), now = U.now(), d30 = now - 30 * DAY;
      var q30 = ST.s.quotes.filter(function (q) { return q.at >= d30; }), conv = q30.length ? Math.round(q30.filter(function (q) { return q.orderNo; }).length / q30.length * 100) : 0;
      var ms = ST.s.quotes.filter(function (q) { return q.ms; }), avg = ms.length ? ms.reduce(function (s, q) { return s + q.ms; }, 0) / ms.length / 1000 : 0;
      var await_ = ST.s.orders.filter(function (o) { return o.status === 'await'; }), awaitAmt = await_.reduce(function (s, o) { return s + o.tot.total; }, 0);
      var today = new Date(now); today.setHours(0, 0, 0, 0);
      var tq = ST.s.quotes.filter(function (q) { return q.at >= today.getTime(); }).length;
      var data = series(), sq = data.reduce(function (s, x) { return s + x.q; }, 0), so = data.reduce(function (s, x) { return s + x.o; }, 0);
      var todo = [
        [c.signup, '가입 승인 대기', '#/admin/signup', 'users'], [await_.length, '입금 확인 대기', '#/admin/orders?f=await', 'bank'],
        [c.tax, '세금계산서 발행 대기', '#/admin/tax', 'receipt'], [c.faq, '챗봇 상담원 연결 요청', '#/admin/faq', 'chat']
      ];
      return head('대시보드', U.ymd(now, '.') + ' 기준 · 견적에서 세금계산서까지 오늘 처리할 일', '<a class="btn sm ghost" href="#/" >' + ic('eye') + '쇼핑몰 화면</a>') +
        '<div class="kpis">' + kpi('오늘 발행 견적', tq + '건', '평균 발행 ' + avg.toFixed(2) + '초', 'bolt', 'blue', '#/admin/quotes') + kpi('견적 → 주문 전환', conv + '%', '최근 30일 견적 ' + q30.length + '건', 'sync', 'teal', '#/admin/quotes') +
        kpi('입금 대기', U.won(awaitAmt) + '원', await_.length + '건 · 기한 관리', 'bank', 'amber', '#/admin/orders?f=await') + kpi('가입 승인 대기', c.signup + '명', '사업자 상태 · 제출 증빙', 'users', c.signup ? 'red' : '', '#/admin/signup') + '</div>' +
        '<div class="dg"><section class="card"><div class="ch-h"><h3>최근 14일 견적 · 주문</h3><span class="lgd"><i class="bq"></i>견적 ' + sq + '<i class="bo"></i>주문 ' + so + '</span></div>' + chart(data) + '<p class="fine">' + ic('info') + '저장된 견적 발행일과 주문 접수일 기준입니다. 취소 주문도 접수 건수에 포함됩니다.</p></section>' +
        '<section class="card"><h3>처리할 일</h3><div class="todo">' + todo.map(function (t) { return '<a href="' + t[2] + '" class="' + (t[0] ? 'on' : '') + '">' + ic(t[3]) + '<span>' + t[1] + '</span><b class="mono">' + t[0] + '</b>' + ic('right') + '</a>'; }).join('') + '</div>' +
        '<h3 class="mt">최근 활동</h3><ul class="feed">' + ST.s.audit.slice(0, 7).map(function (a) { return '<li><span class="fd-i ' + a.kind + '">' + ic({ quote: 'doc', order: 'box', pay: 'card', tax: 'receipt', join: 'user', price: 'tag', cancel: 'x', chat: 'chat', policy: 'sliders', approve: 'check' }[a.kind] || 'info') + '</span><span>' + esc(a.text) + '</span><small>' + U.ago(a.at) + '</small></li>'; }).join('') + '</ul></section></div>';
    }
  };

  /* ---------- 가입 승인 ---------- */
  var SG = 'pending';
  P.signup = {
    render: function (args) {
      if (args[0]) return signupDetail(args[0]);
      var ms = ST.s.members.filter(function (m) { return m.role === 'member'; }), list = ms.filter(function (m) { return m.status === SG; }).sort(function (a, b) { return b.joinedAt - a.joinedAt; });
      return head('가입 승인', '사업자 상태 확인 결과와 제출 증빙을 확인하고, 회원 유형·등급을 지정해 승인합니다.') +
        '<div class="seg">' + [['pending', '승인 대기'], ['approved', '승인'], ['rejected', '반려']].map(function (t) { return '<button class="' + (SG === t[0] ? 'on' : '') + '" data-act="sg" data-v="' + t[0] + '">' + t[1] + ' <i>' + ms.filter(function (m) { return m.status === t[0]; }).length + '</i></button>'; }).join('') + '</div>' +
        '<div class="card">' + tbl(['신청일', '회원', '유형', '자격 확인', '담당자', '상태', ''], list.map(function (m) {
          return '<tr class="click" data-href="#/admin/signup/' + m.id + '"><td>' + U.dt(m.joinedAt) + '</td><td><b>' + esc(m.company) + '</b><br><small class="mono">' + esc(m.bizNo || '-') + '</small></td><td>' + esc(m.kind) + '</td><td>' + ntsTag(m) + '</td><td>' + esc(m.name) + '<br><small>' + esc(m.email) + '</small></td><td>' + APP.pill({ pending: ['대기', 'warn'], approved: ['승인', 'ok'], rejected: ['반려', 'mute'] }, m.status) + '</td><td>' + ic('right') + '</td></tr>';
        })) + '</div>';
    }
  };
  function ntsTag(m) {
    if (m.type === 'grad' && !m.bizNo) return '<span class="tg info">' + ic('file') + '증빙 ' + esc(m.proof || '-') + '</span>';
    if (!m.nts) return '<span class="tg">미확인</span>';
    return '<span class="tg ' + (m.nts.s === '계속사업자' ? 'ok' : 'bad') + '">국세청 ' + esc(m.nts.s) + '</span>';
  }
  A.sg = function (el) { SG = el.getAttribute('data-v'); APP.refresh(); };
  function signupDetail(id) {
    var m = ST.member(id); if (!m) return back('#/admin/signup', '가입 승인') + '<p>회원을 찾을 수 없습니다.</p>';
    var bad = m.nts && m.nts.s !== '계속사업자';
    return back('#/admin/signup', '가입 승인 목록') + head(esc(m.company), esc(m.kind) + ' · ' + U.dt(m.joinedAt) + ' 신청') +
      '<div class="dg"><section class="card"><h3>' + ic('building') + '신청 정보</h3><dl class="kv"><div><dt>회원 유형(신청)</dt><dd>' + esc(m.kind) + '</dd></div><div><dt>상호 · 기관</dt><dd>' + esc(m.company) + '</dd></div>' +
      '<div><dt>사업자등록번호</dt><dd class="mono">' + esc(m.bizNo || '해당 없음') + '</dd></div><div><dt>대표자</dt><dd>' + esc(m.ceo || '-') + '</dd></div><div><dt>담당자</dt><dd>' + esc(m.name) + (m.dept ? ' · ' + esc(m.dept) : '') + '</dd></div><div><dt>연락처</dt><dd>' + esc(m.phone) + ' · ' + esc(m.email) + '</dd></div></dl>' +
      '<h3 class="mt">' + ic('shield') + '자격 확인</h3>' + (m.bizNo ? '<div class="nts ' + (bad ? 'bad' : m.nts ? 'ok' : '') + '">' + ic(bad ? 'alert' : 'shield') + '<div><b>국세청 ' + esc(m.nts ? m.nts.s : '미확인') + (m.nts && m.nts.tax ? ' · ' + esc(m.nts.tax) : '') + '</b><p>' + (m.nts ? '조회 ' + U.dt(m.nts.at) : '') + (bad ? ' · 휴·폐업 사업자는 승인할 수 없습니다.' : '') + '</p></div><button class="btn sm ghost" data-act="renta" data-id="' + m.id + '">' + ic('refresh') + '다시 조회</button></div>' : '') +
      (m.proof ? '<div class="proof">' + ic('file') + '<div><b>' + esc(m.proof) + '</b><p>첨부 증빙 · 체험 화면에서는 파일 이름만 기록합니다</p></div><span class="tg">미리보기</span></div>' : '') + '</section>' +
      '<section class="card"><h3>' + ic('check') + '승인 처리</h3>' + (m.status !== 'pending' ? '<p class="alert ' + (m.status === 'approved' ? 'ok' : 'warn') + '">' + ic('info') + '<span>' + (m.status === 'approved' ? '승인된 회원입니다.' : '반려됨 · ' + esc(m.rejectReason || '')) + '</span></p>' : '') +
      '<div class="fm-g"><div class="fld"><label for="apT">회원 유형</label><select id="apT" class="inp">' + ['general', 'univ', 'grad'].map(function (t) { return '<option value="' + t + '"' + (m.type === t ? ' selected' : '') + '>' + D.TYPE_NAME[t] + ' (' + (ST.s.policy.typeRate[t] || 0) + '%)</option>'; }).join('') + '</select></div>' +
      '<div class="fld"><label for="apG">등급</label><select id="apG" class="inp">' + ['basic', 'vip'].map(function (g) { return '<option value="' + g + '"' + (m.grade === g ? ' selected' : '') + '>' + D.GRADE_NAME[g] + ' (+' + (ST.s.policy.gradeRate[g] || 0) + '%)</option>'; }).join('') + '</select></div>' +
      '<div class="fld full"><label for="apE">이카운트 거래처코드 <i class="opt">선택 · 2단계 연동 대비</i></label><input id="apE" class="inp mono" value="' + esc(m.ecount || '') + '" placeholder="예: C-10620"></div></div>' +
      '<div class="ap-b"><button class="btn pri" data-act="approve" data-id="' + m.id + '" ' + (bad ? 'disabled' : '') + '>' + ic('check') + (m.status === 'approved' ? '변경 저장' : '승인') + '</button></div>' +
      '<div class="rej"><label for="apR">반려 사유</label><div class="biz-row"><select id="apR" class="inp"><option>휴·폐업 사업자로 확인됨</option><option>증빙 서류 식별 불가</option><option>대학 소속 확인 필요</option><option>중복 가입</option></select><button class="btn dgr" data-act="reject" data-id="' + m.id + '">반려</button></div></div></section></div>';
  }
  A.renta = function (el) { var m = ST.member(el.getAttribute('data-id')); el.disabled = true; SV.nts(m.bizNo).then(function (r) { m.nts = { s: r.s, tax: r.tax, at: U.now() }; ST.save(); APP.toast('국세청 상태: ' + r.s); APP.refresh(); }); };
  A.approve = function (el) {
    var m = ST.member(el.getAttribute('data-id')), was = m.status;
    m.type = document.getElementById('apT').value; m.grade = document.getElementById('apG').value; m.ecount = document.getElementById('apE').value.trim(); m.status = 'approved'; m.rejectReason = '';
    if (!m.pw) m.pw = 'demo2026';
    ST.log('approve', m.company + ' ' + (was === 'approved' ? '회원 정보 변경' : '가입 승인') + ' · ' + D.TYPE_NAME[m.type] + ' / ' + D.GRADE_NAME[m.grade], m.id); ST.save();
    APP.toast(was === 'approved' ? '변경했습니다.' : esc(m.company) + ' 가입을 승인했습니다. 이제 회원가가 공개됩니다.');
    APP.go('/admin/signup');
  };
  A.reject = function (el) {
    var m = ST.member(el.getAttribute('data-id')); m.status = 'rejected'; m.rejectReason = document.getElementById('apR').value;
    ST.log('join', m.company + ' 가입 반려 · ' + m.rejectReason, m.id); ST.save(); APP.toast('반려 처리했습니다.'); APP.go('/admin/signup');
  };

  /* ---------- 회원 ---------- */
  P.members = {
    render: function () {
      var ms = ST.s.members.filter(function (m) { return m.role === 'member'; });
      return head('회원 · 등급', '회원 유형과 등급이 가격 계산에 바로 반영됩니다. 이카운트 거래처코드를 미리 관리합니다.') +
        '<div class="card">' + tbl(['회원', '유형', '등급', '적용 할인', '상태', '거래처코드', '견적 / 주문', ''], ms.map(function (m) {
          return '<tr><td><b>' + esc(m.company) + '</b><br><small>' + esc(m.name) + ' · ' + esc(m.email) + '</small></td><td>' + esc(D.TYPE_NAME[m.type]) + '<br><small>' + esc(m.kind) + '</small></td><td>' + (m.grade === 'vip' ? '<span class="tg ok">우수</span>' : '기본') + '</td><td class="mono">' + PR.rateOf(m) + '%</td>' +
            '<td>' + APP.pill({ pending: ['대기', 'warn'], approved: ['승인', 'ok'], rejected: ['반려', 'mute'] }, m.status) + '</td><td class="mono">' + (m.ecount || '<span class="tg warn">미등록</span>') + '</td>' +
            '<td class="mono">' + ST.s.quotes.filter(function (q) { return q.uid === m.id; }).length + ' / ' + ST.s.orders.filter(function (o) { return o.uid === m.id; }).length + '</td><td><a class="btn sm ghost" href="#/admin/signup/' + m.id + '">관리</a></td></tr>';
        })) + '</div>';
    }
  };

  /* ---------- 상품 · 조합 가격표 ---------- */
  var PCAT = '';
  P.products = {
    render: function (args) {
      if (args[0]) return productDetail(args[0]);
      var ps = ST.s.products.filter(function (p) { return !PCAT || p.cat === PCAT; });
      var allC = ST.s.products.reduce(function (s, p) { return s + p.combos.length; }, 0), sku = ST.s.products.reduce(function (s, p) { return s + p.combos.filter(function (c) { return c.sku; }).length; }, 0);
      return head('상품 · 조합 가격표', '상품 ' + ST.s.products.length + '개 · 옵션 조합 ' + allC + '개 · 품목코드 등록 ' + sku + '/' + allC, '<a class="btn sm pri" href="#/admin/upload">' + ic('table') + '엑셀 일괄 업로드</a>') +
        '<div class="seg wrapseg"><button class="' + (!PCAT ? 'on' : '') + '" data-act="pcat" data-v="">전체</button>' + D.CATS.map(function (c) { return '<button class="' + (PCAT === c.id ? 'on' : '') + '" data-act="pcat" data-v="' + c.id + '">' + esc(c.name) + '</button>'; }).join('') + '</div>' +
        '<div class="card">' + tbl(['', '상품', '카테고리', '가격 규칙', '조합', '>기준가 범위', '품목코드', '노출', ''], ps.map(function (p) {
          var pr = p.combos.map(function (c) { return c.price; }), sk = p.combos.filter(function (c) { return c.sku; }).length;
          return '<tr class="click" data-href="#/admin/products/' + p.id + '"><td class="thumb">' + ART.product(p) + '</td><td><b>' + esc(p.brand + ' ' + p.model) + '</b><br><small>' + esc(p.name) + '</small></td><td>' + esc(ST.cat(p.cat).name) + '</td>' +
            '<td>' + ({ normal: '<span class="tg">회원 할인</span>', nodisc: '<span class="tg rl">할인 제외</span>', fixed: '<span class="tg rl fx">고정가 ' + U.won(p.fixed) + '</span>' }[p.rule]) + '</td><td class="mono">' + p.combos.length + '</td>' +
            '<td class="r mono">' + U.won(Math.min.apply(null, pr)) + (pr.length > 1 ? ' ~ ' + U.won(Math.max.apply(null, pr)) : '') + '</td><td>' + (sk === p.combos.length ? '<span class="tg ok">' + sk + '/' + p.combos.length + '</span>' : '<span class="tg warn">' + sk + '/' + p.combos.length + '</span>') + '</td>' +
            '<td>' + (p.visible ? '<span class="pill ok">노출</span>' : '<span class="pill mute">숨김</span>') + '</td><td>' + ic('right') + '</td></tr>';
        })) + '</div>';
    },
    mount: function (root, args) { if (args[0]) mountProduct(root, args[0]); }
  };
  A.pcat = function (el) { PCAT = el.getAttribute('data-v'); APP.refresh(); };
  function previewMembers() {
    return [{ type: 'general', grade: 'basic', role: 'member', status: 'approved', l: '일반' }, { type: 'general', grade: 'vip', role: 'member', status: 'approved', l: '일반·우수' }, { type: 'univ', grade: 'basic', role: 'member', status: 'approved', l: '대학' }, { type: 'grad', grade: 'basic', role: 'member', status: 'approved', l: '대학원생' }];
  }
  function productDetail(id) {
    var p = ST.product(id); if (!p) return back('#/admin/products', '상품 목록') + '<p>상품이 없습니다.</p>';
    var pm = previewMembers();
    return back('#/admin/products', '상품 목록') + head(esc(p.brand + ' ' + p.model), esc(p.name) + ' · ' + esc(ST.cat(p.cat).name), '<a class="btn sm ghost" href="#/p/' + p.id + '">' + ic('eye') + '쇼핑몰에서 보기</a>') +
      '<div class="dg pd-adm"><section class="card"><div class="pa-art">' + ART.product(p) + '</div><h3>' + ic('sliders') + '가격 규칙 · 노출</h3><div class="fm-g">' +
      '<div class="fld full"><label for="prRule">회원 할인 적용</label><select id="prRule" class="inp"><option value="normal"' + (p.rule === 'normal' ? ' selected' : '') + '>회원 유형·등급 할인 적용</option><option value="nodisc"' + (p.rule === 'nodisc' ? ' selected' : '') + '>할인 제외 (기준가 그대로)</option><option value="fixed"' + (p.rule === 'fixed' ? ' selected' : '') + '>고정가 (모든 회원 같은 가격)</option></select></div>' +
      '<div class="fld"><label for="prFixed">고정가</label><input id="prFixed" class="inp mono" value="' + (p.fixed || '') + '" inputmode="numeric" ' + (p.rule === 'fixed' ? '' : 'disabled') + '></div>' +
      '<div class="fld"><label for="prVis">쇼핑몰 노출</label><select id="prVis" class="inp"><option value="1"' + (p.visible ? ' selected' : '') + '>노출</option><option value="0"' + (p.visible ? '' : ' selected') + '>숨김</option></select></div></div>' +
      '<p class="fine">' + ic('info') + '저장하면 이후 발행하는 견적부터 적용됩니다. 이미 발행한 견적·주문 금액은 바뀌지 않습니다.</p></section>' +
      '<section class="card"><h3>' + ic('table') + '옵션 조합별 가격표</h3><p class="muted">조합마다 기준가 · 이카운트 품목코드 · 판매 여부를 따로 관리합니다. 오른쪽은 회원 유형별 적용가 미리보기입니다.</p><div class="tw"><table class="tbl ed"><thead><tr><th>조합 ID</th><th>옵션 조합</th><th>품목코드</th><th class="r">기준가</th><th>판매</th>' + pm.map(function (m) { return '<th class="r pv">' + m.l + '</th>'; }).join('') + '</tr></thead><tbody>' +
      p.combos.map(function (c, i) {
        return '<tr data-ci="' + i + '"><td class="mono sm">' + c.id + '</td><td>' + esc(c.key) + '</td><td><input class="inp sm mono" data-f="sku" value="' + esc(c.sku) + '" placeholder="미등록"></td><td class="r"><input class="inp sm mono r" data-f="price" value="' + c.price + '" inputmode="numeric"></td>' +
          '<td><label class="sw"><input type="checkbox" data-f="sale" ' + (c.sale ? 'checked' : '') + '><i></i></label></td>' + pm.map(function (m) { return '<td class="r mono pv" data-pv="' + i + '">' + U.won(PR.price(p, c, m).unit) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div><div class="ap-b"><span class="muted" id="prMsg"></span><button class="btn pri" data-act="psave" data-p="' + p.id + '">' + ic('check') + '저장</button></div>' +
      '<h3 class="mt">' + ic('clock') + '가격 변경 이력</h3><ul class="feed">' + (ST.s.priceLog.filter(function (x) { return x.cid.indexOf(p.id + '-') === 0; }).slice(0, 6).map(function (x) { return '<li><span class="fd-i price">' + ic('tag') + '</span><span>' + esc(x.name) + ' <span class="mono">' + U.won(x.from) + ' → ' + U.won(x.to) + '</span> · ' + esc(x.by) + '</span><small>' + U.ago(x.at) + '</small></li>'; }).join('') || '<li class="nodata">변경 이력이 없습니다</li>') + '</ul></section></div>';
  }
  function mountProduct(root, id) {
    var p = ST.product(id); if (!p) return;
    var rule = root.querySelector('#prRule'), fx = root.querySelector('#prFixed');
    function preview() {
      var tmp = JSON.parse(JSON.stringify(p)); tmp.rule = rule.value; tmp.fixed = U.numeric(fx.value, { integer: true, min: 1, max: 1e9 });
      root.querySelectorAll('tr[data-ci]').forEach(function (tr) {
        var i = +tr.getAttribute('data-ci'), c = tmp.combos[i]; c.price = U.numeric(tr.querySelector('[data-f="price"]').value, { integer: true, min: 1, max: 1e9 });
        var pm = previewMembers(); tr.querySelectorAll('[data-pv]').forEach(function (td, k) { td.textContent = Number.isFinite(c.price) && (tmp.rule !== 'fixed' || Number.isFinite(tmp.fixed)) ? U.won(PR.price(tmp, c, pm[k]).unit) : '입력 확인'; });
      });
    }
    rule.addEventListener('change', function () { fx.disabled = rule.value !== 'fixed'; if (rule.value === 'fixed' && !fx.value) fx.value = p.combos[0].price; preview(); });
    root.addEventListener('input', function (e) { if (e.target.matches('[data-f="price"],#prFixed')) preview(); });
  }
  A.psave = function (el) {
    if (!ST.me() || ST.me().role !== 'admin') return;
    var p = ST.product(el.getAttribute('data-p')), root = document.getElementById('view'), n = 0, err = '';
    var rule = root.querySelector('#prRule').value, fixed = rule === 'fixed' ? U.numeric(root.querySelector('#prFixed').value, { integer: true, min: 1, max: 1e9 }) : p.fixed;
    if (rule === 'fixed' && !Number.isFinite(fixed)) err = '고정가는 1원 이상 10억 원 이하의 정수로 입력해 주세요.';
    var skus = {}; ST.s.products.forEach(function (x) { if (x.id !== p.id) x.combos.forEach(function (c) { if (c.sku) skus[c.sku] = 1; }); });
    var rows = [];
    root.querySelectorAll('tr[data-ci]').forEach(function (tr) {
      var c = p.combos[+tr.getAttribute('data-ci')], price = U.numeric(tr.querySelector('[data-f="price"]').value, { integer: true, min: 1, max: 1e9 }), sku = tr.querySelector('[data-f="sku"]').value.trim().toUpperCase();
      if (!Number.isFinite(price)) err = c.id + ' 기준가는 1원 이상 10억 원 이하의 정수로 입력해 주세요.'; if (sku && skus[sku]) err = '품목코드 ' + sku + ' 가 다른 조합과 중복됩니다.'; if (sku) skus[sku] = 1;
      rows.push({ c: c, price: price, sku: sku, sale: tr.querySelector('[data-f="sale"]').checked });
    });
    if (err) { document.getElementById('prMsg').textContent = err; APP.toast(err, 'err'); return; }
    rows.forEach(function (r) {
      if (r.c.price !== r.price) { ST.s.priceLog.unshift({ at: U.now(), cid: r.c.id, name: p.brand + ' ' + p.model + ' ' + r.c.key, from: r.c.price, to: r.price, by: '관리자' }); n++; }
      r.c.price = r.price; r.c.sku = r.sku; r.c.sale = r.sale;
    });
    p.rule = rule; p.fixed = fixed; p.visible = root.querySelector('#prVis').value === '1';
    ST.log('price', p.brand + ' ' + p.model + ' 가격표 저장' + (n ? ' · 기준가 ' + n + '건 변경' : ''), p.id); ST.save();
    APP.toast('저장했습니다.' + (n ? ' 기준가 ' + n + '건 변경 · 담아 둔 고객에게 변경 알림이 표시됩니다.' : '')); APP.refresh();
  };

  /* ---------- 엑셀 일괄 업로드 ---------- */
  var UP = null, UP_BUSY = false, READ_SEQ = 0, XLSX_LOADING = null;
  var COLS = ['조합ID', '브랜드', '모델', '옵션 조합', '품목코드', '기준가', '판매(Y/N)'];
  APP.clearAdminDrafts = function () { UP = null; UP_BUSY = false; READ_SEQ++; APP.polDraft = null; };
  APP.cancelAdminReads = function () { READ_SEQ++; UP_BUSY = false; };
  function adminUser() { return ST.me() && ST.me().role === 'admin'; }
  function loadXLSX() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (XLSX_LOADING) return XLSX_LOADING;
    XLSX_LOADING = new Promise(function (res, rej) { var s = document.createElement('script'); s.src = 'assets/vendor/xlsx.full.min.js'; s.onload = function () { if (window.XLSX) res(window.XLSX); else rej(new Error('xlsx')); }; s.onerror = function () { rej(new Error('xlsx')); }; document.head.appendChild(s); });
    XLSX_LOADING = XLSX_LOADING.catch(function (e) { XLSX_LOADING = null; throw e; });
    return XLSX_LOADING;
  }
  function allRows() { var out = []; ST.s.products.forEach(function (p) { p.combos.forEach(function (c) { out.push([c.id, p.brand, p.model, c.key, c.sku, c.price, c.sale ? 'Y' : 'N']); }); }); return out; }
  function sample(bad) {
    var r = [['P01-01', 'ORVEX', 'DSO-2104', '70MHz / 2CH', 'DSO2104-01', 1210000, 'Y'], ['P01-02', 'ORVEX', 'DSO-2104', '70MHz / 4CH', 'DSO2104-02', 1640000, 'Y'], ['P07-04', 'KAIRO', 'PS-3005', '30V / 10A / 3CH', 'PS3005-04', 718000, 'Y'],
      ['P11-04', 'ORVEX', 'SG-6G', '6GHz / IQ 변조', 'SG6G-04', 17100000, 'Y'], ['P14-02', 'ORVEX', 'VNA-1406', '6GHz / 4포트', 'VNA1406-02', 28900000, 'Y'], ['P19-04', 'SIGNALAB', 'RK-E96', '0.1% / 5,000개', 'RKE96-04', 199000, 'Y']];
    if (bad) r = r.concat([['P02-09', 'LUMIQ', 'MSO-5204', '700MHz / 16CH 로직', 'MSO5204-09', 9900000, 'Y'], ['P05-02', 'PRAXIS-E', 'HM-28', '본체 + 온도 프로브', 'HM28-02', '이십일만', 'Y'], ['P10-02', 'LUMIQ', 'AG-4062', '30MHz / 2CH', 'DSO2104-01', 905000, 'Y'], ['P16-01', 'ORVEX', 'PP-510', '1EA', 'PP510-01', 91000, '판매']]);
    return r;
  }
  function validate(rows, fname) {
    var res = [], skuOwn = Object.create(null), seen = Object.create(null), touched = Object.create(null), changes = 0, errs = 0, warns = 0;
    rows.forEach(function (r) { touched[String(r[0] || '').trim()] = true; });
    ST.s.products.forEach(function (p) { p.combos.forEach(function (c) { if (c.sku && !touched[c.id]) skuOwn[c.sku] = c.id; }); });
    var fileSku = Object.create(null);
    rows.forEach(function (r, i) {
      var line = i + 2, id = String(r[0] || '').trim(), e = [], w = [], x = id ? ST.comboById(id) : null;
      var sku = String(r[4] || '').trim().toUpperCase(), price = U.numeric(String(r[5] == null ? '' : r[5]).trim().replace(/원$/, '').trim(), { integer: true, min: 1, max: 1e9 }), sale = String(r[6] || '').trim().toUpperCase();
      if (!id) e.push('조합ID가 비어 있습니다'); else if (!x || !x.c) e.push('없는 조합ID입니다');
      if (seen[id]) e.push(seen[id] + '행과 같은 조합ID가 중복됩니다'); seen[id] = line;
      if (!Number.isFinite(price)) e.push('기준가는 1원 이상 10억 원 이하의 정수여야 합니다');
      if (sale !== 'Y' && sale !== 'N') e.push('판매는 Y 또는 N으로 입력합니다');
      if (r.slice(COLS.length).some(function (v) { return String(v == null ? '' : v).trim(); })) e.push('양식의 7개 열 밖에 값이 있습니다');
      if (sku && !/^[A-Z0-9-]{3,24}$/.test(sku)) e.push('품목코드는 영문 대문자·숫자·하이픈 3~24자입니다');
      if (sku && fileSku[sku]) e.push('파일 안에서 품목코드가 중복됩니다 (' + fileSku[sku] + '행)');
      if (sku && skuOwn[sku] && skuOwn[sku] !== id) e.push('품목코드가 다른 조합(' + skuOwn[sku] + ')에 이미 쓰입니다');
      if (sku) fileSku[sku] = line;
      var diff = [];
      if (!e.length && x) {
        var np = price;
        if (np !== x.c.price) { diff.push('기준가 ' + U.won(x.c.price) + ' → ' + U.won(np)); if (Math.abs(np - x.c.price) / x.c.price > 0.3) w.push('기준가 변동 ' + Math.round((np - x.c.price) / x.c.price * 100) + '% (30% 초과)'); }
        if (sku !== (x.c.sku || '')) diff.push('품목코드 ' + (x.c.sku || '없음') + ' → ' + (sku || '없음'));
        if ((sale === 'Y') !== x.c.sale) diff.push('판매 ' + (x.c.sale ? 'Y' : 'N') + ' → ' + sale);
      }
      if (e.length) errs++; else if (diff.length) changes++; if (w.length) warns++;
      res.push({ line: line, id: id, name: x && x.p ? x.p.model + ' · ' + (x.c ? x.c.key : '') : String(r[2] || '') + ' ' + String(r[3] || ''), e: e, w: w, diff: diff, sku: sku, price: price, sale: sale === 'Y' });
    });
    return { file: fname, rows: res, errs: errs, warns: warns, changes: changes, total: rows.length, sourceRows: JSON.parse(JSON.stringify(rows)), baseline: JSON.stringify(allRows()), state: ST.s, uid: ST.s.user };
  }
  function parseUpload(rows, fname) {
    function invalid(message) { var e = new Error(message); e.userMessage = message; throw e; }
    if (!rows.length || COLS.some(function (name, i) { return String(rows[0][i] || '').trim() !== name; }) || rows[0].slice(COLS.length).some(function (v) { return String(v || '').trim(); })) invalid('머리글 7개와 열 순서가 양식과 다릅니다. 내려받은 양식을 사용해 주세요.');
    var data = rows.slice(1).filter(function (r) { return r.some(function (v) { return String(v == null ? '' : v).trim(); }); });
    if (!data.length) invalid('반영할 데이터가 없습니다. 머리글 아래에 수정할 가격표를 입력해 주세요.');
    if (data.length > 5000) invalid('한 번에 최대 5,000행까지 검사할 수 있습니다. 파일을 나눠 올려 주세요.');
    return validate(data, fname);
  }
  APP.parsePriceUpload = parseUpload;
  P.upload = {
    render: function () {
      var r = UP;
      var result = !r ? '' : '<section class="card up-r"><div class="ur-h"><div><h3>' + ic('table') + '검증 결과 · ' + esc(r.file) + '</h3><p class="muted">' + r.total + '행을 모두 검사했습니다.</p></div><div class="ur-k"><span class="ok">변경 <b class="mono">' + r.changes + '</b></span><span class="' + (r.errs ? 'bad' : '') + '">오류 <b class="mono">' + r.errs + '</b></span><span class="' + (r.warns ? 'warn' : '') + '">경고 <b class="mono">' + r.warns + '</b></span></div></div>' +
        (r.notice ? '<div class="alert warn" role="status">' + ic('info') + '<p>' + esc(r.notice) + '</p></div>' : '') +
        (r.errs ? '<div class="alert bad">' + ic('alert') + '<div><b>오류가 있는 행이 ' + r.errs + '개 있어 전체 반영을 보류했습니다.</b><p>일부만 반영되어 가격표가 어긋나지 않도록, 오류를 모두 고친 파일을 다시 올려야 반영할 수 있습니다.</p></div></div>' : r.applied ? '<div class="alert ok">' + ic('check') + '<div><b>' + r.changes + '개 조합을 반영했습니다.</b><p>가격 변경 이력에 기록되었고, 이 상품을 담아 둔 고객에게 변경 알림이 표시됩니다.</p></div></div>' : !r.changes ? '<div class="alert info">' + ic('info') + '<div><b>현재 가격표와 같습니다.</b><p>반영할 변경 사항이 없습니다. 수정한 파일을 다시 올려 주세요.</p></div></div>' : '<div class="alert ok">' + ic('check') + '<div><b>오류가 없습니다.</b><p>변경 ' + r.changes + '건을 확인한 뒤 반영해 주세요.' + (r.warns ? ' 변동폭이 큰 행은 한 번 더 확인해 주세요.' : '') + '</p></div></div>') +
        tbl(['행', '조합ID', '상품 · 옵션', '변경 내용', '결과'], r.rows.map(function (x) {
          return '<tr class="' + (x.e.length ? 'er' : x.w.length ? 'wr' : '') + '"><td class="mono">' + x.line + '</td><td class="mono">' + esc(x.id || '-') + '</td><td>' + esc(x.name) + '</td><td>' + (x.diff.length ? x.diff.map(esc).join('<br>') : '<span class="muted">변경 없음</span>') + '</td>' +
            '<td>' + (x.e.length ? x.e.map(function (m) { return '<span class="tg bad">' + esc(m) + '</span>'; }).join(' ') : x.w.length ? x.w.map(function (m) { return '<span class="tg warn">' + esc(m) + '</span>'; }).join(' ') : '<span class="tg ok">정상</span>') + '</td></tr>';
        })) + '<div class="ap-b"><button class="btn ghost" data-act="up-clear">다시 올리기</button><button class="btn pri" data-act="up-apply" ' + (r.errs || r.applied || !r.changes ? 'disabled' : '') + '>' + ic('check') + (r.errs ? '오류 수정 후 반영 가능' : r.applied ? '반영 완료' : !r.changes ? '변경 사항 없음' : '변경 ' + r.changes + '건 반영') + '</button></div></section>';
      return head('엑셀 일괄 업로드', '옵션 조합별 기준가 · 품목코드 · 판매 여부를 한 번에 수정합니다. 모든 행을 검사하고, 오류가 하나라도 있으면 전체 반영을 보류합니다.') +
        '<div class="up-steps"><section class="card us"><span class="us-n">1</span><h3>양식 내려받기</h3><p>현재 가격표 전체(' + allRows().length + '행)가 담긴 양식입니다. 조합ID는 수정하지 마세요.</p><div class="us-b"><button class="btn dark" data-act="up-tpl" data-t="xlsx">' + ic('download') + '엑셀(.xlsx)</button><button class="btn ghost" data-act="up-tpl" data-t="csv">CSV</button></div></section>' +
        '<section class="card us"><span class="us-n">2</span><h3>파일 올리기</h3><p>XLSX·XLS·CSV 파일, 10MB·5,000행 이하를 올려 주세요.</p><label class="filebox drop">' + ic('upload') + '<span>파일 선택 또는 끌어 놓기</span><input type="file" id="upFile" accept=".xlsx,.xls,.csv"></label></section>' +
        '<section class="card us"><span class="us-n">3</span><h3>샘플 데이터로 확인</h3><p>샘플을 불러와 변경 내용과 오류를 확인할 수 있습니다.</p><div class="us-b"><button class="btn ghost" data-act="up-sample" data-v="ok">' + ic('check') + '정상 샘플 6행</button><button class="btn ghost" data-act="up-sample" data-v="bad">' + ic('alert') + '오류 포함 샘플 10행</button></div></section></div>' +
        (UP_BUSY ? '<div class="alert info" role="status"><span class="spin"></span>파일을 읽고 가격표를 검사하고 있습니다.</div>' : '') + result + '<section class="card"><h3>' + ic('info') + '검사 규칙</h3><ul class="rules"><li>조합ID 존재 · 중복 여부</li><li>기준가: 1원 이상 10억 원 이하의 정수 (콤마·원 표기 허용)</li><li>판매: Y / N</li><li>품목코드: 영문 대문자·숫자·하이픈, 최종 가격표에서 중복 불가</li><li>기준가 변동 30% 초과는 경고 (반영 가능)</li><li>오류가 1행이라도 있으면 전체 반영 보류</li></ul></section>';
    },
    mount: function (root) {
      var inp = root.querySelector('#upFile'); if (!inp) return;
      inp.addEventListener('change', function () { if (inp.files[0]) readFile(inp.files[0]); });
      var drop = root.querySelector('.drop');
      drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('over'); });
      drop.addEventListener('dragleave', function () { drop.classList.remove('over'); });
      drop.addEventListener('drop', function (e) { e.preventDefault(); drop.classList.remove('over'); if (e.dataTransfer.files[0]) readFile(e.dataTransfer.files[0]); });
    }
  };
  function readFile(f) {
    if (!adminUser()) return;
    var context = APP.context(), seq = ++READ_SEQ;
    UP = null; UP_BUSY = false;
    function active() { return seq === READ_SEQ && adminUser() && APP.sameContext(context); }
    function fail(message) { if (!active()) return; UP_BUSY = false; UP = null; APP.refresh(); APP.toast(message, 'err'); }
    if (!/\.(xlsx|xls|csv)$/i.test(f.name)) { fail('XLSX·XLS·CSV 파일만 올릴 수 있습니다.'); return; }
    if (f.size > 10 * 1024 * 1024) { fail('파일 크기는 10MB 이하여야 합니다.'); return; }
    var isCsv = /\.csv$/i.test(f.name), rd = new FileReader();
    UP_BUSY = true; APP.refresh();
    rd.onload = function () {
      if (!active()) { if (seq === READ_SEQ) UP_BUSY = false; return; }
      var p = Promise.resolve().then(function () { return isCsv ? U.parseCsv(rd.result) : loadXLSX().then(function (X) { var wb = X.read(new Uint8Array(rd.result), { type: 'array' }); return X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true, defval: '' }); }); });
      p.then(function (rows) {
        if (!active()) { if (seq === READ_SEQ) UP_BUSY = false; return; }
        UP = parseUpload(rows, f.name); UP_BUSY = false; APP.refresh();
      }).catch(function (e) { fail(e.userMessage || '파일을 읽지 못했습니다. 내려받은 양식으로 저장해 다시 올려 주세요.'); });
    };
    rd.onerror = function () { fail('파일을 읽지 못했습니다. 파일을 다시 선택해 주세요.'); };
    if (isCsv) rd.readAsText(f, 'utf-8'); else rd.readAsArrayBuffer(f);
  }
  A['up-sample'] = function (el) { if (!adminUser()) return; READ_SEQ++; UP_BUSY = false; var bad = el.getAttribute('data-v') === 'bad'; UP = validate(sample(bad), bad ? '샘플_오류포함.xlsx' : '샘플_정상.xlsx'); APP.refresh(); setTimeout(function () { var r = document.querySelector('.up-r'); if (r) r.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50); };
  A['up-clear'] = function () { READ_SEQ++; UP = null; UP_BUSY = false; APP.refresh(); };
  A['up-apply'] = function () {
    if (!adminUser() || !UP || UP.errs || UP.applied || !UP.changes) return;
    if (UP.state !== ST.s || UP.uid !== ST.s.user) { UP = null; APP.toast('계정이나 체험 데이터가 변경되었습니다. 파일을 다시 올려 주세요.', 'warn'); APP.refresh(); return; }
    var fresh = validate(UP.sourceRows, UP.file);
    if (fresh.errs || fresh.baseline !== UP.baseline) { UP = fresh; UP.notice = '검사 이후 가격표가 변경되어 최신 값으로 다시 검사했습니다. 변경 내용을 다시 확인해 주세요.'; APP.refresh(); APP.toast(UP.notice, 'warn'); return; }
    UP = fresh; var n = 0;
    UP.rows.forEach(function (x) {
      if (!x.diff.length) return; var r = ST.comboById(x.id);
      if (r.c.price !== x.price) ST.s.priceLog.unshift({ at: U.now(), cid: x.id, name: r.p.brand + ' ' + r.p.model + ' ' + r.c.key, from: r.c.price, to: x.price, by: '엑셀 업로드' });
      r.c.price = x.price; r.c.sku = x.sku; r.c.sale = x.sale; n++;
    });
    UP.applied = true; ST.log('price', '엑셀 일괄 업로드 반영 · ' + n + '개 조합 (' + UP.file + ')'); ST.save(); APP.toast(n + '개 조합을 반영했습니다.'); APP.refresh();
  };
  A['up-tpl'] = function (el) {
    if (!adminUser()) return;
    var context = APP.context();
    var rows = [COLS].concat(allRows()), name = '옵션조합_가격표_' + U.ymd(U.now(), '');
    if (el.getAttribute('data-t') === 'csv') { U.download(name + '.csv', new Blob([U.csv(rows)], { type: 'text/csv;charset=utf-8' })); return; }
    el.disabled = true;
    loadXLSX().then(function (X) {
      if (!adminUser() || !APP.sameContext(context)) return;
      var ws = X.utils.aoa_to_sheet(rows); ws['!cols'] = [{ wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 26 }, { wch: 16 }, { wch: 12 }, { wch: 10 }];
      var wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, '가격표'); X.writeFile(wb, name + '.xlsx'); el.disabled = false;
    }).catch(function () { if (!adminUser() || !APP.sameContext(context)) return; el.disabled = false; U.download(name + '.csv', new Blob([U.csv(rows)], { type: 'text/csv;charset=utf-8' })); APP.toast('엑셀 모듈을 불러오지 못해 CSV로 내려받았습니다.', 'warn'); });
  };

  /* ---------- 가격 정책 ---------- */
  var PV = { pid: 'P01', cid: 'P01-04' };
  P.policy = {
    render: function () {
      var pol = ST.s.policy, p = ST.product(PV.pid), c = ST.combo(p, PV.cid) || p.combos[0];
      var prev = previewMembers().concat([{ l: '비회원 · 승인대기', guest: true }]);
      return head('가격 정책', '기준가 → 회원 유형 할인 + 등급 할인 → 상품 예외(할인 제외·고정가) → 절사 순서로 계산합니다.') +
        '<div class="dg"><section class="card"><h3>' + ic('users') + '회원 유형 할인</h3><div class="fm-g">' + ['general', 'univ', 'grad'].map(function (t) { return '<div class="fld"><label for="tr_' + t + '">' + D.TYPE_NAME[t] + '</label><div class="sfx"><input id="tr_' + t + '" class="inp mono" data-pol="typeRate.' + t + '" value="' + pol.typeRate[t] + '" inputmode="decimal"><span>%</span></div></div>'; }).join('') + '</div>' +
        '<h3 class="mt">' + ic('flag') + '등급 추가 할인</h3><div class="fm-g">' + ['basic', 'vip'].map(function (g) { return '<div class="fld"><label for="gr_' + g + '">' + D.GRADE_NAME[g] + '</label><div class="sfx"><input id="gr_' + g + '" class="inp mono" data-pol="gradeRate.' + g + '" value="' + pol.gradeRate[g] + '" inputmode="decimal"><span>%</span></div></div>'; }).join('') + '</div>' +
        '<h3 class="mt">' + ic('settings') + '계산 · 노출</h3><div class="fm-g"><div class="fld"><label for="polR">절사 단위</label><select id="polR" class="inp" data-pol="round">' + [1, 10, 100, 1000].map(function (n) { return '<option value="' + n + '"' + (pol.round === n ? ' selected' : '') + '>' + U.won(n) + '원 단위</option>'; }).join('') + '</select></div>' +
        '<div class="fld"><label for="polF">무료배송 기준 (공급가)</label><div class="sfx"><input id="polF" class="inp mono" data-pol="freeShip" value="' + pol.freeShip + '"><span>원</span></div></div><div class="fld"><label for="polS">배송비</label><div class="sfx"><input id="polS" class="inp mono" data-pol="shipFee" value="' + pol.shipFee + '"><span>원</span></div></div>' +
        '<div class="fld"><label>가격 공개 대상</label><p class="policy-access">' + ic('lock') + '승인 회원 전용</p><small class="hint2">비회원·승인 대기·반려 회원에게는 가격이 공개되지 않습니다.</small></div></div>' +
        '<div class="ap-b"><button class="btn pri" data-act="polsave">' + ic('check') + '정책 저장</button></div></section>' +
        '<section class="card"><h3>' + ic('eye') + '적용가 미리보기</h3><div class="fm-g"><div class="fld"><label for="pvP">상품</label><select id="pvP" class="inp">' + ST.s.products.map(function (x) { return '<option value="' + x.id + '"' + (x.id === p.id ? ' selected' : '') + '>' + esc(x.brand + ' ' + x.model + ' · ' + x.name) + '</option>'; }).join('') + '</select></div>' +
        '<div class="fld"><label for="pvC">옵션 조합</label><select id="pvC" class="inp">' + p.combos.map(function (x) { return '<option value="' + x.id + '"' + (x.id === c.id ? ' selected' : '') + '>' + esc(x.key) + '</option>'; }).join('') + '</select></div></div>' +
        '<div class="pvw" id="pvW">' + pvTable(p, c, prev) + '</div><p class="fine">' + ic('info') + '회원 유형 할인과 등급 할인 합계는 100% 미만이어야 합니다. 저장 전에는 쇼핑몰에 반영되지 않습니다.</p></section></div>';
    },
    mount: function (root) {
      function draft() {
        var d = JSON.parse(JSON.stringify(ST.s.policy));
        root.querySelectorAll('[data-pol]').forEach(function (i) { var k = i.getAttribute('data-pol').split('.'), v = U.numeric(i.value, { integer: !k[1], min: 0, max: k[1] ? 100 : 1e9 }); if (k[1]) d[k[0]][k[1]] = v; else d[k[0]] = v; });
        d.hideForGuest = true;
        return d;
      }
      function redraw() {
        var next = draft(), error = PR.policyError(next);
        if (error) { root.querySelector('#pvW').innerHTML = '<p class="alert bad" role="alert">' + esc(error) + '</p>'; return; }
        var keep = ST.s.policy; ST.s.policy = next;
        var p = ST.product(root.querySelector('#pvP').value), c = ST.combo(p, root.querySelector('#pvC').value) || p.combos[0];
        root.querySelector('#pvW').innerHTML = pvTable(p, c, previewMembers().concat([{ l: '비회원 · 승인대기', guest: true }]));
        ST.s.policy = keep;
      }
      root.querySelector('#pvP').addEventListener('change', function (e) { var p = ST.product(e.target.value); PV.pid = p.id; PV.cid = p.combos[0].id; APP.refresh(); });
      root.querySelector('#pvC').addEventListener('change', function (e) { PV.cid = e.target.value; redraw(); });
      root.querySelectorAll('[data-pol]').forEach(function (i) { i.addEventListener('input', redraw); i.addEventListener('change', redraw); });
      APP.polDraft = draft;
    }
  };
  function pvTable(p, c, ms) {
    return '<div class="pv-base"><span>기준가</span><b class="mono">' + U.won(c.price) + '원</b>' + ({ normal: '', nodisc: '<span class="tg rl">할인 제외 상품</span>', fixed: '<span class="tg rl fx">고정가 ' + U.won(p.fixed) + '</span>' }[p.rule]) + '</div>' +
      ms.map(function (m) {
        if (m.guest) return '<div class="pv-r"><span>' + m.l + '</span><span class="lock">' + ic('lock') + '회원 전용 가격</span></div>';
        var x = PR.price(p, c, m); return '<div class="pv-r"><span>' + m.l + '</span><span class="tg ' + (x.rate ? 'ok' : '') + '">' + (x.rule === 'normal' ? x.rate + '%' : x.rule === 'fixed' ? '고정가' : '제외') + '</span><b class="mono">' + U.won(x.unit) + '원</b></div>';
      }).join('');
  }
  A.polsave = function () {
    if (!ST.me() || ST.me().role !== 'admin') return;
    var next = APP.polDraft(), error = PR.policyError(next);
    if (error) { APP.toast(error, 'err'); return; }
    next.hideForGuest = true; ST.s.policy = next;
    ST.log('policy', '가격 정책 변경 · 대학 ' + ST.s.policy.typeRate.univ + '% / 대학원생 ' + ST.s.policy.typeRate.grad + '% / 우수 +' + ST.s.policy.gradeRate.vip + '%'); ST.save(); APP.toast('가격 정책을 저장했습니다. 새로 발행하는 견적부터 적용됩니다.'); APP.refresh();
  };

  /* ---------- 견적 관리 ---------- */
  var QF = 'all';
  P.quotes = {
    render: function (args) {
      if (args[0]) return quoteDetail(args[0]);
      var qs = ST.s.quotes, list = qs.filter(function (q) { return QF === 'all' || SV.quoteState(q) === QF; });
      var ms = qs.filter(function (q) { return q.ms; }), avg = ms.length ? ms.reduce(function (s, q) { return s + q.ms; }, 0) / ms.length / 1000 : 0;
      return head('견적 관리', '발행된 견적은 발행 시점 가격으로 고정되며, 한 번만 주문으로 전환됩니다.') +
        '<div class="kpis">' + kpi('전체 견적', qs.length + '건', '유효 ' + qs.filter(function (q) { return SV.quoteState(q) === 'valid'; }).length + '건', 'doc', 'blue') + kpi('평균 발행 시간', avg.toFixed(2) + '초', '견적 저장 + PDF 생성', 'bolt', 'teal') +
        kpi('주문 전환', qs.filter(function (q) { return q.orderNo; }).length + '건', '전환율 ' + (qs.length ? Math.round(qs.filter(function (q) { return q.orderNo; }).length / qs.length * 100) : 0) + '%', 'sync', 'amber') + kpi('만료', qs.filter(function (q) { return SV.quoteState(q) === 'expired'; }).length + '건', '유효기간 ' + ST.s.settings.validDays + '일', 'clock', '') + '</div>' +
        '<div class="seg">' + [['all', '전체'], ['valid', '유효'], ['expired', '만료'], ['ordered', '주문 전환']].map(function (t) { return '<button class="' + (QF === t[0] ? 'on' : '') + '" data-act="qf" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' +
        '<div class="card">' + tbl(['견적번호', '회원', '발행일', '유효기한', '>합계', '발행 소요', '상태', '주문'], list.map(function (q) {
          var st = SV.quoteState(q);
          return '<tr class="click" data-href="#/admin/quotes/' + q.no + '"><td class="mono b">' + q.no + '</td><td>' + esc(q.buyer.company) + '<br><small>' + esc(q.buyer.kind) + '</small></td><td>' + U.dt(q.at) + '</td><td>' + U.ymd(q.validUntil) + (st === 'valid' ? ' <small class="dd">' + APP.dday(q) + '</small>' : '') + '</td><td class="r mono">' + U.won(q.tot.total) + '</td><td class="mono">' + (q.ms ? (q.ms / 1000).toFixed(2) + '초' : '-') + '</td><td>' + APP.pill(SV.QSTATE, st) + '</td><td class="mono">' + (q.orderNo || '-') + '</td></tr>';
        })) + '</div>';
    },
    mount: function (root, args) {
      if (!args[0]) return; var q = ST.quote(args[0]); if (!q) return;
      var context = APP.context(), box = root.querySelector('#aqImgs');
      APP.quoteImgs(q, SV.quoteState(q) === 'expired' ? '유효기간 만료' : '').then(function (imgs) { if (APP.sameContext(context) && box && box.isConnected) box.innerHTML = imgs.map(function (s, i) { return '<img src="' + s + '" alt="견적서 ' + (i + 1) + '쪽">'; }).join(''); });
    }
  };
  A.qf = function (el) { QF = el.getAttribute('data-v'); APP.refresh(); };
  function quoteDetail(no) {
    var q = ST.quote(no); if (!q) return back('#/admin/quotes', '견적 목록') + '<p>견적이 없습니다.</p>';
    var m = ST.member(q.uid), st = SV.quoteState(q);
    return back('#/admin/quotes', '견적 목록') + head('<span class="mono">' + q.no + '</span>', esc(q.buyer.company) + ' · ' + U.dt(q.at) + ' 발행 · ' + APP.pill(SV.QSTATE, st), '<button class="btn sm ghost" data-act="qpdf" data-q="' + q.no + '">' + ic('download') + 'PDF</button>') +
      '<div class="dg"><section class="card"><h3>' + ic('table') + '견적 발행가와 현재 가격 비교</h3><p class="muted">견적 금액은 발행 시점 값으로 저장되어, 이후 가격이 바뀌어도 이 견적으로 주문하면 같은 금액이 적용됩니다.</p>' +
      tbl(['품목', '품목코드', '>수량', '>견적 단가', '>현재 단가', '차이'], q.lines.map(function (l) { var cur = m ? PR.line(m, l.cid, l.qty) : null, d = cur ? cur.unit - l.unit : 0; return '<tr><td><b>' + esc(l.model) + '</b><br><small>' + esc(l.opt) + '</small></td><td class="mono">' + (l.sku || '<span class="tg warn">미등록</span>') + '</td><td class="r mono">' + l.qty + '</td><td class="r mono b">' + U.won(l.unit) + '</td><td class="r mono">' + (cur ? U.won(cur.unit) : '-') + '</td><td class="mono ' + (d > 0 ? 'up' : d < 0 ? 'dn' : '') + '">' + (d ? (d > 0 ? '+' : '') + U.won(d) : '동일') + '</td></tr>'; })) +
      '<dl class="kv mt"><div><dt>합계 (VAT 포함)</dt><dd class="mono b">' + U.won(q.tot.total) + '원</dd></div><div><dt>발행 소요</dt><dd class="mono">' + (q.ms ? (q.ms / 1000).toFixed(2) + '초' : '-') + '</dd></div><div><dt>PDF 다운로드</dt><dd>' + (q.downloads || 0) + '회</dd></div><div><dt>주문</dt><dd>' + (q.orderNo ? '<a href="#/admin/orders/' + q.orderNo + '" class="mono">' + q.orderNo + '</a>' : '전환 전') + '</dd></div>' + (q.memo ? '<div><dt>메모</dt><dd>' + esc(q.memo) + '</dd></div>' : '') + '</dl></section>' +
      '<section class="card"><h3>' + ic('file') + '견적서 미리보기</h3><div class="qv-pages sm" id="aqImgs"><div class="qv-ld"><span class="spin"></span>견적서를 불러오는 중…</div></div></section></div>';
  }

  /* ---------- 주문 · 입금확인 ---------- */
  var OF = 'all';
  P.orders = {
    render: function (args, qs) {
      if (args[0]) return orderDetail(args[0]);
      if (APP.route.qs.f) { OF = APP.route.qs.f; }
      var os = ST.s.orders, list = os.filter(function (o) { return OF === 'all' || o.status === OF; });
      return head('주문 · 입금확인', '무통장 입금 확인, 출고·송장, 전액 취소와 세금계산서 발행을 처리합니다.') +
        '<div class="seg wrapseg">' + [['all', '전체']].concat(Object.keys(SV.OSTATE).map(function (k) { return [k, SV.OSTATE[k][0]]; })).map(function (t) { return '<button class="' + (OF === t[0] ? 'on' : '') + '" data-act="of" data-v="' + t[0] + '">' + t[1] + ' <i>' + os.filter(function (o) { return t[0] === 'all' || o.status === t[0]; }).length + '</i></button>'; }).join('') + '</div>' +
        '<div class="card">' + tbl(['주문번호', '회원', '주문일', '결제', '>금액', '증빙', '상태', ''], list.map(function (o) {
          return '<tr class="click" data-href="#/admin/orders/' + o.no + '"><td class="mono b">' + o.no + (o.quoteNo ? '<br><small class="mono">견적 ' + o.quoteNo + '</small>' : '') + '</td><td>' + esc(o.buyer.company) + '</td><td>' + U.dt(o.at) + '</td><td>' + (o.pay === 'card' ? '카드' : '무통장' + (o.status === 'await' ? '<br><small>기한 ' + U.md(o.depositDue) + '</small>' : '')) + '</td><td class="r mono">' + U.won(o.tot.total) + '</td>' +
            '<td>' + taxCell(o) + '</td><td>' + APP.pill(SV.OSTATE, o.status) + '</td><td>' + (o.status === 'await' ? '<button class="btn sm pri" data-act="deposit" data-o="' + o.no + '">입금 확인</button>' : ic('right')) + '</td></tr>';
        })) + '</div>';
    }
  };
  function taxCell(o) {
    if (o.evidence === 'card') return '<span class="tg">매출전표</span>';
    if (o.evidence === 'none') return '<span class="muted">-</span>';
    if (o.tax && o.tax.state === 'issued') return '<span class="tg ok">발행 완료</span>';
    if (o.tax && o.tax.state === 'unknown') return '<span class="tg warn">결과 확인 필요</span>';
    return SV.taxEligible(o).ok ? '<span class="tg info">발행 대기</span>' : '<span class="tg">입금 후 발행</span>';
  }
  A.of = function (el) { OF = el.getAttribute('data-v'); if (APP.route.qs.f) { APP.go('/admin/orders'); return; } APP.refresh(); };
  A.deposit = function (el, e) { if (e) e.stopPropagation(); var o = ST.order(el.getAttribute('data-o')), r = SV.confirmDeposit(o); APP.toast(r.ok ? o.no + ' 입금을 확인했습니다. 세금계산서를 발행할 수 있습니다.' : r.msg, r.ok ? '' : 'err'); APP.refresh(); };
  function orderDetail(no) {
    var o = ST.order(no); if (!o) return back('#/admin/orders', '주문 목록') + '<p>주문이 없습니다.</p>';
    var nextMap = { paid: ['prep', '상품 준비로 변경'], prep: ['ship', '출고 · 송장 등록'], ship: ['done', '배송 완료 처리'] }, nx = nextMap[o.status];
    var el = SV.taxEligible(o), issued = o.tax && o.tax.state === 'issued';
    var taxPanel = o.evidence !== 'tax' ? '<p class="muted">' + (o.evidence === 'card' ? '카드 결제 건 · 증빙은 카드 매출전표입니다.' : '증빙을 요청하지 않은 주문입니다.') + '</p>' :
      '<dl class="kv"><div><dt>공급받는 자</dt><dd>' + esc(o.buyer.company) + ' <span class="mono">' + esc(o.buyer.bizNo || '-') + '</span></dd></div><div><dt>공급가액 · 세액</dt><dd class="mono">' + U.won(o.tot.supply + o.tot.ship) + ' · ' + U.won(o.tot.vat) + '</dd></div><div><dt>관리번호</dt><dd class="mono">' + SV.mgmtKey(o) + '</dd></div>' +
      '<div><dt>상태</dt><dd>' + (issued ? '<span class="tg ok">발행 완료</span> <span class="mono">' + o.tax.nts + '</span>' : o.tax && o.tax.state === 'unknown' ? '<span class="tg warn">결과 확인 필요</span>' : el.ok ? '<span class="tg info">발행 가능</span>' : '<span class="tg">' + esc(el.msg) + '</span>') + '</dd></div></dl>' +
      (issued ? '<button class="btn ghost" data-act="tax" data-o="' + o.no + '">' + ic('copy') + '같은 주문으로 다시 발행 요청 (중복 확인)</button>' : '<label class="ck"><input type="checkbox" id="taxTo"><span>응답 지연(시간 초과) 상황 만들기 (시연)</span></label><button class="btn pri" data-act="tax" data-o="' + o.no + '" ' + (el.ok ? '' : 'disabled') + '>' + ic('receipt') + (o.tax && o.tax.state === 'unknown' ? '다시 시도 (먼저 조회)' : '세금계산서 발행') + '</button>') +
      '<ol class="tlog" id="taxLog"></ol>';
    return back('#/admin/orders', '주문 목록') + head('<span class="mono">' + o.no + '</span>', esc(o.buyer.company) + ' · ' + U.dt(o.at) + ' · ' + APP.pill(SV.OSTATE, o.status), '<a class="btn sm ghost" href="#/o/' + o.no + '">' + ic('eye') + '고객 화면</a>') +
      '<div class="dg"><section class="card act-p"><h3>' + ic('bolt') + '주문 처리</h3>' +
      (o.status === 'await' ? '<div class="alert info">' + ic('bank') + '<div><b>' + U.won(o.tot.total) + '원 입금 확인 대기</b><p>기한 ' + U.dt(o.depositDue) + ' · 통장 입금 내역과 금액·입금자명을 확인한 뒤 처리합니다.</p></div></div><button class="btn pri" data-act="deposit" data-o="' + o.no + '">' + ic('check') + '입금 확인</button>' : '') +
      (o.status === 'pending' ? '<p class="muted">고객의 카드 결제를 기다리고 있습니다.</p>' : '') +
      (nx ? (nx[0] === 'ship' ? '<div class="biz-row"><input class="inp mono" id="invNo" placeholder="송장번호" value="5520-1180-' + String(2300 + Math.floor(Math.random() * 600)) + '"><button class="btn dark" data-act="onext" data-o="' + o.no + '">' + ic('truck') + nx[1] + '</button></div>' : '<button class="btn dark" data-act="onext" data-o="' + o.no + '">' + ic('right') + nx[1] + '</button>') : '') +
      (['pending', 'await', 'paid', 'prep'].indexOf(o.status) >= 0 ? '<button class="btn ghost dgr-t" data-act="ocancel" data-o="' + o.no + '">전액 취소' + (o.paidAt ? ' · 환불' : '') + '</button>' : '') +
      (o.status === 'cancel' ? '<p class="muted">취소된 주문입니다.</p>' : '') + (o.status === 'done' ? '<p class="muted">배송이 완료된 주문입니다.</p>' : '') + '</section>' +
      '<section class="card"><h3>' + ic('receipt') + '전자세금계산서</h3>' + taxPanel + '</section></div>' + APP.orderBody(o, true);
  }
  A.onext = function (el) {
    var o = ST.order(el.getAttribute('data-o')), nx = { paid: 'prep', prep: 'ship', ship: 'done' }[o.status]; if (!nx) return;
    var note = ''; if (nx === 'ship') { var v = (document.getElementById('invNo') || {}).value || ''; if (!v.trim()) { APP.toast('송장번호를 입력해 주세요.', 'warn'); return; } o.invoiceNo = v.trim(); note = '송장 ' + o.invoiceNo; }
    SV.setStatus(o, nx, '관리자', note); ST.log('order', o.no + ' ' + SV.OSTATE[nx][0], o.no); ST.save(); APP.toast(o.no + ' → ' + SV.OSTATE[nx][0]); APP.refresh();
  };
  A.tax = function (el) {
    if (!ST.me() || ST.me().role !== 'admin') return;
    var uid = ST.s.user, route = APP.route.path;
    var o = ST.order(el.getAttribute('data-o')), to = document.getElementById('taxTo'), logEl = document.getElementById('taxLog');
    el.disabled = true; logEl.innerHTML = '<li class="run"><span class="spin"></span>처리 중…</li>';
    SV.taxIssue(o, { timeout: to && to.checked }).then(function (r) {
      if (ST.s.user !== uid || APP.route.path !== route) return;
      var html = r.log.map(function (l) { return '<li>' + ic('right') + esc(l) + '</li>'; }).join('') + '<li class="' + (r.ok || r.recovered ? 'ok' : r.dup ? 'warn' : 'bad') + '">' + ic(r.ok ? 'check' : 'alert') + esc(r.ok ? '발행 완료 · 승인번호 ' + r.inv.nts : r.msg) + '</li>';
      APP.toast(r.ok ? '세금계산서를 발행했습니다.' : r.recovered ? '이미 발행된 건을 확인해 상태를 맞췄습니다. (중복 발행 없음)' : r.msg, r.ok || r.recovered ? '' : r.timeout ? 'warn' : 'err');
      APP.refresh(); var l2 = document.getElementById('taxLog'); if (l2) l2.innerHTML = html;
    });
  };

  /* ---------- 세금계산서 ---------- */
  P.tax = {
    render: function () {
      var os = ST.s.orders.filter(function (o) { return o.evidence === 'tax'; });
      return head('전자세금계산서', '주문 건마다 고유 관리번호로 발행합니다. 재시도 전에는 관리번호로 먼저 조회해 같은 주문이 두 번 발행되지 않게 합니다.') +
        '<div class="kpis">' + kpi('발행 대기', os.filter(function (o) { return SV.taxEligible(o).ok && !(o.tax && o.tax.state === 'issued'); }).length + '건', '결제(입금) 확인 완료', 'receipt', 'amber') + kpi('발행 완료', ST.s.invoices.length + '건', '이번 달', 'check', 'teal') +
        kpi('입금 전', os.filter(function (o) { return !o.paidAt && o.status !== 'cancel'; }).length + '건', '입금 확인 후 발행', 'bank', '') + kpi('카드 결제 건', ST.s.settings.cardTaxInvoice ? '발행' : '매출전표', '<a href="#/admin/settings">기본 설정에서 변경</a>', 'card', 'blue') + '</div>' +
        '<div class="card">' + tbl(['주문번호', '공급받는 자', '>공급가액', '>세액', '관리번호', '상태', ''], os.map(function (o) {
          var st = o.tax && o.tax.state;
          return '<tr class="click" data-href="#/admin/orders/' + o.no + '"><td class="mono b">' + o.no + '</td><td>' + esc(o.buyer.company) + '<br><small class="mono">' + esc(o.buyer.bizNo || '-') + '</small></td><td class="r mono">' + U.won(o.tot.supply + o.tot.ship) + '</td><td class="r mono">' + U.won(o.tot.vat) + '</td><td class="mono sm">' + SV.mgmtKey(o) + '</td>' +
            '<td>' + (st === 'issued' ? '<span class="tg ok">발행</span><br><small class="mono">' + o.tax.nts + '</small>' : taxCell(o)) + '</td><td>' + ic('right') + '</td></tr>';
        })) + '</div><section class="card"><h3>' + ic('info') + '발행 · 취소 안내</h3><ul class="rules"><li>결제 또는 입금 확인 후 발행할 수 있습니다.</li><li>주문별 관리번호로 발행 결과를 확인합니다.</li><li>응답이 지연되면 기존 발행 결과를 먼저 조회합니다.</li><li>카드 결제 건은 기본적으로 매출전표를 증빙으로 관리합니다.</li><li>발행된 주문을 취소하려면 수정세금계산서 처리가 필요합니다.</li></ul><p class="fine">이 체험 화면에서는 외부로 전송하지 않고 발행 상태만 재현합니다.</p></section>';
    }
  };

  /* ---------- 챗봇 FAQ · 문의 ---------- */
  P.faq = {
    render: function () {
      var iq = ST.s.inquiries;
      return head('챗봇 FAQ · 문의', '버튼형 FAQ와 키워드 답변을 관리합니다. 답을 찾지 못한 대화는 상담원 연결 요청으로 남습니다.', '<button class="btn sm pri" data-act="faq-add">' + ic('plus') + 'FAQ 추가</button>') +
        '<div class="dg"><section class="card"><h3>' + ic('chat') + 'FAQ ' + ST.s.faq.length + '개</h3><div class="faqs">' + ST.s.faq.map(function (f, i) {
          return '<details class="faq"><summary><span class="mono">' + (i + 1) + '</span><b>' + esc(f.q) + '</b>' + (D.QUICK.indexOf(f.id) >= 0 ? '<span class="tg info">빠른 버튼</span>' : '') + '</summary><div class="faq-b"><label>답변<textarea class="inp" data-faq="' + i + '" data-k="a" rows="3">' + esc(f.a) + '</textarea></label><label>키워드 <small>쉼표로 구분</small><input class="inp" data-faq="' + i + '" data-k="k" value="' + esc(f.k.join(', ')) + '"></label>' +
            '<div class="ap-b"><button class="btn sm ghost dgr-t" data-act="faq-del" data-i="' + i + '">삭제</button><button class="btn sm pri" data-act="faq-save" data-i="' + i + '">저장</button></div></div></details>';
        }).join('') + '</div></section>' +
        '<section class="card"><h3>' + ic('headset') + '상담원 연결 요청</h3>' + (iq.length ? '<ul class="iqs">' + iq.map(function (x) { return '<li class="' + x.state + '"><div><b>' + esc(x.who) + '</b><small>' + U.ago(x.at) + '</small></div><p>' + esc(x.q) + '</p>' + (x.log && x.log.length ? '<details><summary>대화 ' + x.log.length + '개 보기</summary><div class="iq-log">' + x.log.map(function (m) { return '<span class="' + (m.w === 'u' ? 'me' : 'it') + '">' + m.t + '</span>'; }).join('') + '</div></details>' : '') + (x.state === 'open' ? '<button class="btn sm ghost" data-act="iq-done" data-id="' + x.id + '">' + ic('check') + '처리 완료</button>' : '<span class="tg ok">처리 완료</span>') + '</li>'; }).join('') + '</ul>' : '<p class="nodata">요청이 없습니다</p>') +
        '<div class="note">' + ic('spark') + '<p><b>AI 상담 (2단계 확장)</b> 상품 사양서·FAQ·견적 정책 문서를 근거로 답하는 문서 기반 상담을 같은 창에 붙일 수 있습니다. 1단계에서는 FAQ·버튼형 응답과 기존 상담 채널 연결로 운영합니다.</p></div></section></div>';
    }
  };
  A['faq-save'] = function (el) {
    var i = +el.getAttribute('data-i'), f = ST.s.faq[i];
    f.a = document.querySelector('[data-faq="' + i + '"][data-k="a"]').value.trim(); f.k = document.querySelector('[data-faq="' + i + '"][data-k="k"]').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    ST.save(); APP.toast('FAQ를 저장했습니다.');
  };
  A['faq-del'] = function (el) { ST.s.faq.splice(+el.getAttribute('data-i'), 1); ST.save(); APP.refresh(); };
  A['faq-add'] = function () {
    var m = APP.modal({ title: 'FAQ 추가', size: 'md', body: '<div class="fm-g"><div class="fld full"><label for="fq">질문</label><input id="fq" class="inp" autofocus></div><div class="fld full"><label for="fa">답변</label><textarea id="fa" class="inp" rows="3"></textarea></div><div class="fld full"><label for="fk">키워드 (쉼표로 구분)</label><input id="fk" class="inp"></div></div>', foot: '<button class="btn ghost" data-x>취소</button><button class="btn pri" data-ok>추가</button>' });
    m.el.querySelector('[data-ok]').addEventListener('click', function () {
      var q = m.el.querySelector('#fq').value.trim(), a = m.el.querySelector('#fa').value.trim(); if (!q || !a) return;
      ST.s.faq.push({ id: U.uid('f'), q: q, a: a, k: m.el.querySelector('#fk').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean) }); ST.save(); m.close(); APP.refresh(); APP.toast('FAQ를 추가했습니다. 챗봇에 바로 반영됩니다.');
    });
  };
  A['iq-done'] = function (el) { var x = ST.s.inquiries.filter(function (i) { return i.id === el.getAttribute('data-id'); })[0]; x.state = 'done'; ST.save(); APP.refresh(); };

  /* ---------- 이카운트 연동 준비 ---------- */
  var EO = '';
  P.ecount = {
    render: function () {
      var combos = [], miss = [];
      ST.s.products.forEach(function (p) { p.combos.forEach(function (c) { combos.push(c); if (!c.sku) miss.push([p, c]); }); });
      var mem = ST.s.members.filter(function (m) { return m.role === 'member' && m.status === 'approved'; }), mm = mem.filter(function (m) { return !m.ecount; });
      var o = ST.order(EO) || ST.s.orders.filter(function (x) { return x.paidAt; })[0] || ST.s.orders[0]; EO = o.no;
      var pct = function (a, b) { return Math.round(a / b * 100); };
      var payload = { SaleList: o.lines.map(function (l, i) { return { BulkDatas: { IO_DATE: U.ymd(o.paidAt || o.at, ''), UPLOAD_SER_NO: '1', CUST: o.buyer.ecount || '(거래처코드 미등록)', CUST_DES: o.buyer.company, WH_CD: '00001', PROD_CD: l.sku || '(품목코드 미등록)', PROD_DES: l.brand + ' ' + l.model + ' ' + l.opt, QTY: String(l.qty), PRICE: String(l.unit), SUPPLY_AMT: String(l.amount), VAT_AMT: String(Math.floor(l.amount * 0.1)), REMARKS: o.no + (o.quoteNo ? ' / ' + o.quoteNo : '') + (i ? '' : '') } }; }) };
      return head('이카운트 연동 준비', '1단계에서는 코드 매핑과 외부 전표번호 칸을 갖추고, 실제 전송은 2단계에서 연결합니다.', '<span class="tg warn">' + ic('info') + '실제 전송 없음 · 2단계 예정</span>') +
        '<div class="kpis">' + kpi('품목코드 매핑', pct(combos.length - miss.length, combos.length) + '%', (combos.length - miss.length) + ' / ' + combos.length + ' 옵션 조합', 'tag', miss.length ? 'amber' : 'teal', '#/admin/products') +
        kpi('거래처코드 매핑', pct(mem.length - mm.length, mem.length) + '%', (mem.length - mm.length) + ' / ' + mem.length + ' 승인 회원', 'users', mm.length ? 'amber' : 'teal', '#/admin/members') + kpi('전송 대상 주문', ST.s.orders.filter(function (x) { return x.paidAt && x.status !== 'cancel'; }).length + '건', '결제 확인된 주문', 'box', 'blue') + kpi('외부 전표번호', '0건', '2단계 연동 후 기록', 'erp', '') + '</div>' +
        '<div class="dg"><section class="card"><h3>' + ic('alert') + '매핑이 필요한 항목</h3><div class="mis"><b>품목코드 미등록 ' + miss.length + '개</b>' + miss.map(function (x) { return '<a href="#/admin/products/' + x[0].id + '"><span class="mono">' + x[1].id + '</span>' + esc(x[0].model + ' · ' + x[1].key) + ic('right') + '</a>'; }).join('') +
        '<b class="mt">거래처코드 미등록 ' + mm.length + '명</b>' + mm.map(function (m) { return '<a href="#/admin/signup/' + m.id + '"><span>' + esc(m.kind) + '</span>' + esc(m.company) + ic('right') + '</a>'; }).join('') + '</div>' +
        '<h3 class="mt">' + ic('sync') + '2단계 연동 흐름</h3><ol class="eflow"><li><b>주문 결제 확인</b><span>판매 전표 생성 대상</span></li><li><b>판매 입력 전송</b><span>품목코드 · 거래처코드로 매핑</span></li><li><b>전표번호 저장</b><span>주문에 외부 전표번호 · 상태 기록</span></li><li><b>실패 재전송</b><span>오류 사유와 함께 재시도 대기열</span></li></ol></section>' +
        '<section class="card"><h3>' + ic('doc') + '전송 데이터 미리보기</h3><div class="fld"><label for="eoSel">주문 선택</label><select id="eoSel" class="inp">' + ST.s.orders.map(function (x) { return '<option value="' + x.no + '"' + (x.no === o.no ? ' selected' : '') + '>' + x.no + ' · ' + esc(x.buyer.company) + '</option>'; }).join('') + '</select></div>' +
        '<pre class="code">' + esc(JSON.stringify(payload, null, 2)) + '</pre><p class="fine">' + ic('info') + '판매 입력 형식의 예시입니다. 창고코드 등 실제 필드는 2단계에서 고객사 이카운트 설정에 맞춰 확정합니다.</p></section></div>';
    },
    mount: function (root) { var s = root.querySelector('#eoSel'); if (s) s.addEventListener('change', function () { EO = s.value; APP.refresh(); }); }
  };

  /* ---------- 기본 설정 ---------- */
  P.settings = {
    render: function () {
      var s = ST.s.settings;
      function f(k, label, cls, mono) { return '<div class="fld ' + (cls || '') + '"><label for="st_' + k + '">' + label + '</label><input id="st_' + k + '" class="inp' + (mono ? ' mono' : '') + '" data-st="' + k + '" value="' + esc(s[k]) + '"></div>'; }
      return head('기본 설정', '견적서 공급자 정보 · 유효기간 · 입금 계좌 · 증빙 규칙. 저장하면 이후 발행하는 견적서에 반영됩니다.') +
        '<div class="dg"><section class="card"><h3>' + ic('building') + '공급자 정보 (견적서 · 세금계산서)</h3><div class="fm-g">' + f('company', '상호') + f('bizNo', '사업자등록번호', '', true) + f('ceo', '대표자') + f('tel', '전화') + f('addr', '주소', 'full') + f('biz', '업태 · 종목', 'full') + f('email', '이메일', 'full') + '</div>' +
        '<div class="stamp-p"><svg viewBox="0 0 60 60" aria-hidden="true"><g transform="rotate(-7 30 30)" fill="none" stroke="#D8342C"><circle cx="30" cy="30" r="27" stroke-width="2.4"/><circle cx="30" cy="30" r="23" stroke-width="1"/></g><g fill="#D8342C" font-family="Pretendard Variable, sans-serif" font-weight="800" text-anchor="middle"><text x="30" y="25" font-size="8.5">시그널랩</text><text x="30" y="35" font-size="8.5">주식회사</text><text x="30" y="44" font-size="6.5">대표이사인</text></g></svg><div><b>직인 이미지</b><p>견적서 공급자 칸에 자동으로 찍힙니다. 본 구축에서는 이미지 파일을 업로드합니다.</p></div></div></section>' +
        '<section class="card"><h3>' + ic('doc') + '견적 · 주문 · 증빙</h3><div class="fm-g">' + '<div class="fld"><label for="st_validDays">견적 유효기간</label><div class="sfx"><input id="st_validDays" class="inp mono" data-st="validDays" value="' + s.validDays + '"><span>일</span></div></div>' +
        '<div class="fld"><label for="st_depositDays">무통장 입금 기한</label><div class="sfx"><input id="st_depositDays" class="inp mono" data-st="depositDays" value="' + s.depositDays + '"><span>일</span></div></div>' + f('bank', '입금 계좌', 'full') +
        '<div class="fld"><label>견적번호 형식</label><input class="inp mono" value="' + s.quoteFmt + '" disabled></div><div class="fld"><label>주문번호 형식</label><input class="inp mono" value="' + s.orderFmt + '" disabled></div>' +
        '<div class="fld full"><label>카드 결제 건 증빙</label><label class="sw lbl"><input type="checkbox" data-st="cardTaxInvoice" ' + (s.cardTaxInvoice ? 'checked' : '') + '><i></i><span>카드 결제 건도 세금계산서 발행 허용 (끄면 매출전표만)</span></label><small class="hint2">카드 결제 건의 세금계산서 발행 여부는 세무 판단에 따라 결제수단별로 정합니다.</small></div></div>' +
        '<div class="ap-b"><button class="btn pri" data-act="stsave">' + ic('check') + '설정 저장</button></div></section></div>';
    }
  };
  A.stsave = function () {
    var s = ST.s.settings;
    document.querySelectorAll('[data-st]').forEach(function (i) { var k = i.getAttribute('data-st'); s[k] = i.type === 'checkbox' ? i.checked : /Days$/.test(k) ? Math.max(1, Math.min(90, +U.digits(i.value) || s[k])) : i.value.trim(); });
    ST.log('policy', '기본 설정 변경 · 유효기간 ' + s.validDays + '일 · 입금 기한 ' + s.depositDays + '일'); ST.save(); APP.toast('설정을 저장했습니다.'); APP.refresh();
  };

  /* 표의 행 클릭 이동 */
  document.addEventListener('click', function (e) {
    if (e.target.closest('button,a,input,select,label,textarea')) return;
    var tr = e.target.closest('tr[data-href]'); if (tr) APP.go(tr.getAttribute('data-href').slice(1));
  });
  A['to-shop'] = function () { };
})();
