/* 사용자 판매몰 화면 */
(function () {
  'use strict';
  var U = window.U, ST = window.ST, D = window.D, SV = window.SV, PR = window.PR, ART = window.ART, PDF = window.PDF, APP = window.APP;
  var ic = U.ic, esc = U.esc, S = APP.screens, A = APP.act, DAY = 864e5;
  APP.pdfCache = {};

  /* ---------- 공용 조각 ---------- */
  function money(n, cls) { return '<span class="mn ' + (cls || '') + '">' + U.won(n) + '<small>원</small></span>'; }
  function lockBox(me, compact) {
    var t = !me ? '로그인하면 회원 유형별 가격이 보입니다' : me.status === 'pending' ? '가입 승인 후 가격이 공개됩니다' : me.status === 'rejected' ? '가입이 반려되어 가격을 볼 수 없습니다' : '';
    if (compact) return '<span class="lock">' + ic('lock') + '회원 전용 가격</span>';
    return '<div class="lockbox">' + ic('lock') + '<div><b>회원 전용 가격</b><p>' + t + '</p></div>' +
      (!me ? '<div class="lb-b"><a class="btn pri" href="#/login">로그인</a><a class="btn ghost" href="#/signup">회원가입</a></div>' : me.status === 'pending' ? '<a class="btn ghost" href="#/pending">승인 상태 보기</a>' : '') + '</div>';
  }
  function ruleTag(p) { return p.rule === 'nodisc' ? '<span class="tg rl">할인 제외</span>' : p.rule === 'fixed' ? '<span class="tg rl fx">정찰가</span>' : ''; }
  function card(p, me) {
    var see = PR.canSee(me), mp = PR.minPrice(p, me), many = p.combos.filter(function (c) { return c.sale; }).length > 1;
    var price = !mp ? '<div class="pc-p"><span class="lock">판매 준비 중</span></div>' : !see ? '<div class="pc-p">' + lockBox(me, true) + '</div>' :
      '<div class="pc-p">' + (mp.rate ? '<span class="was">' + U.won(mp.base) + '</span><span class="rt">' + mp.rate + '%</span>' : '') + money(mp.unit) + (many ? '<em>~</em>' : '') + '</div>';
    return '<a class="pcard" href="#/p/' + p.id + '"><div class="pc-art">' + ART.product(p) + '<span class="pc-stk ' + (p.stock === '재고 보유' ? 'in' : '') + '">' + esc(p.stock) + '</span></div>' +
      '<div class="pc-b"><span class="pc-br">' + esc(p.brand) + ' · <span class="mono">' + esc(p.model) + '</span></span><b class="pc-n">' + esc(p.name) + '</b>' +
      '<div class="pc-t">' + ruleTag(p) + p.tags.filter(function (t) { return t !== '할인 제외'; }).slice(0, 2).map(function (t) { return '<span class="tg">' + esc(t) + '</span>'; }).join('') + '<span class="tg ol">옵션 ' + p.combos.filter(function (c) { return c.sale; }).length + '종</span></div>' + price + '</div></a>';
  }
  APP.card = card;
  function crumbs(list) { return '<nav class="crumb" aria-label="현재 위치"><a href="#/">홈</a>' + list.map(function (x) { return ic('right') + (x[1] ? '<a href="' + x[1] + '">' + esc(x[0]) + '</a>' : '<span>' + esc(x[0]) + '</span>'); }).join('') + '</nav>'; }
  function empty(icon, t, d, btn) { return '<div class="empty">' + ic(icon) + '<b>' + t + '</b><p>' + d + '</p>' + (btn || '') + '</div>'; }
  function dday(q) { var d = Math.ceil((q.validUntil - U.now()) / DAY); return d > 0 ? 'D-' + d : d === 0 ? 'D-day' : '만료'; }
  APP.dday = dday;

  /* ---------- 로그인 ---------- */
  S.login = {
    bare: true,
    render: function () {
      var cards = D.LOGIN_CARDS.map(function (c) {
        var m = ST.member(c.id) || D.MEMBERS.filter(function (x) { return x.id === c.id; })[0];
        return '<button type="button" class="acc" data-act="fill" data-id="' + c.id + '"><span class="acc-i ' + c.id + '">' + ic(c.icon) + '</span><span class="acc-t"><b>' + esc(c.label) + '</b><small>' + esc(m.email) + ' · ' + esc(m.pw) + '</small></span>' + ic('right') + '</button>';
      }).join('');
      return '<div class="login" data-title="로그인"><section class="lg-art"><div class="lg-scope"><img src="assets/images/lab-workbench.jpg" alt="계측 장비가 놓인 정돈된 전자 실험실"></div><div class="lg-in">' +
        '<span class="lg-brand">' + U.logo() + '<b>SIGNALAB</b></span>' +
        '<h1>더 나은 연구를 위한<br><em>정확한 선택.</em></h1><p>계측 장비와 전자부품을 찾고,<br>회원가 견적부터 주문까지 한곳에서 시작하세요.</p>' +
        '<ul class="lg-f"><li>' + ic('tag') + '회원 전용 가격</li><li>' + ic('doc') + '견적서 바로 발행</li><li>' + ic('card') + '카드 · 무통장 입금</li><li>' + ic('receipt') + '구매 증빙 관리</li></ul></div></section>' +
        '<section class="lg-form"><div class="lg-box"><div class="lg-top"><a class="to-main" href="../index.html">' + ic('back') + '<span>메인으로</span></a><a class="to-shop" href="#/"><span>쇼핑몰 보기</span>' + ic('right') + '</a></div>' +
        '<h2>로그인</h2><p class="lg-sub">승인된 회원에게 회원 유형별 가격이 공개됩니다.</p>' +
        '<form class="lg-fm" data-act-submit="login" novalidate><label for="lgId">이메일</label><input id="lgId" name="email" class="inp" type="email" autocomplete="username" placeholder="이메일을 입력해 주세요">' +
        '<label for="lgPw">비밀번호</label><input id="lgPw" name="pw" class="inp" type="password" autocomplete="current-password" placeholder="비밀번호를 입력해 주세요">' +
        '<p class="lg-err" role="alert" aria-live="polite"></p><button class="btn pri lg" type="submit">로그인</button></form>' +
        '<div class="lg-alt"><a href="#/" data-act="guest">' + ic('eye') + '비회원으로 둘러보기</a><a href="#/signup">' + ic('user') + '회원가입</a></div>' +
        '<div class="lg-trial"><div class="lt-h"><b>체험 계정</b><span>계정을 누르면 입력란에 채워집니다.</span></div><div class="lt-l">' + cards + '</div>' +
        '<p class="lt-d">회사명·상품·가격·주문은 모두 체험용 가상 데이터입니다. 변경 내용은 이 브라우저에만 저장됩니다.</p>' +
        '<div class="trial-tools"><button type="button" class="btn sm ghost" data-act="demo">' + ic('info') + '체험 기능 안내</button><button type="button" class="btn sm ghost" data-act="reset">' + ic('refresh') + '체험 데이터 초기화</button></div></div></div></section></div>';
    }
  };
  A.fill = function (el) {
    var m = ST.member(el.getAttribute('data-id')); if (!m) return;
    var f = document.querySelector('.lg-fm'); f.email.value = m.email; f.pw.value = m.pw;
    document.querySelector('.lg-err').textContent = '';
    document.querySelectorAll('.acc').forEach(function (x) { x.classList.toggle('sel', x === el); });
  };
  A.login = function (f) {
    var em = f.email.value.trim().toLowerCase(), pw = f.pw.value, err = f.querySelector('.lg-err');
    if (!em || !pw) { err.textContent = '이메일과 비밀번호를 입력해 주세요.'; return; }
    var m = ST.s.members.filter(function (x) { return x.email === em; })[0];
    if (!m || m.pw !== pw) { err.textContent = '이메일 또는 비밀번호를 확인해 주세요.'; f.pw.focus(); return; }
    var to = APP.afterLogin;
    APP.login(m.id); APP.afterLogin = null;
    APP.go(to && to !== '/login' ? to : m.role === 'admin' ? '/admin' : m.status === 'approved' ? '/' : '/pending');
  };
  A.guest = function () { APP.switchAccount(null); };

  /* ---------- 회원가입 ---------- */
  var SU = null;
  function suInit() { SU = { step: 1, type: '', bizNo: '', company: '', ceo: '', nts: null, proof: '', school: '', dept: '', name: '', phone: '', email: '', pw: '', pw2: '', agree: [false, false, false] }; }
  function signupReady() { return SU && SU.name.trim() && /^[0-9+() -]{8,20}$/.test(SU.phone) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(SU.email.trim()) && SU.pw.length >= 8 && SU.pw === SU.pw2 && SU.agree[0] && SU.agree[1]; }
  S.signup = {
    render: function () {
      if (!SU) suInit();
      var steps = ['회원 유형', '자격 확인', '담당자 정보'];
      var head = '<div class="su-steps">' + steps.map(function (s, i) { return '<span class="' + (SU.step > i + 1 ? 'done' : SU.step === i + 1 ? 'on' : '') + '"><i>' + (SU.step > i + 1 ? ic('check') : i + 1) + '</i>' + s + '</span>'; }).join('<b></b>') + '</div>';
      var body = '';
      if (SU.step === 1) {
        var types = [['general', 'building', '일반 회원', '개인·법인 사업자', '사업자등록번호로 등록 상태를 확인합니다.', '기본가'], ['univ', 'school', '대학', '산학협력단 · 학과 · 연구실', '대학 사업자등록증으로 가입합니다.', '5% 할인'], ['grad', 'grad', '대학원생', '석사 · 박사 과정', '재학증명서 등 증빙을 첨부하면 담당자가 확인합니다.', '5% 할인']];
        body = '<h2 class="su-t">어떤 회원으로 가입하시나요?</h2><p class="su-d">회원 유형에 따라 가격과 필요한 확인 절차가 달라집니다. 승인 후 가격이 공개됩니다.</p><div class="su-types">' +
          types.map(function (t) { return '<button class="sut ' + (SU.type === t[0] ? 'sel' : '') + '" data-act="su-type" data-v="' + t[0] + '"><span class="sut-i">' + ic(t[1]) + '</span><b>' + t[2] + '</b><small>' + t[3] + '</small><p>' + t[4] + '</p><span class="sut-r">' + t[5] + '</span></button>'; }).join('') + '</div>' +
          '<div class="su-nav"><span></span><button class="btn pri" data-act="su-next" ' + (SU.type ? '' : 'disabled') + '>다음' + ic('arrow') + '</button></div>';
      } else if (SU.step === 2) {
        if (SU.type === 'grad') {
          body = '<h2 class="su-t">재학 정보와 증빙</h2><p class="su-d">대학원생은 사업자등록번호 대신 재학증명서 등 증빙을 첨부합니다. 담당자가 증빙을 확인한 뒤 승인합니다.</p><div class="fm-g">' +
            fld('school', '학교명', SU.school, '예: 한결대학교 대학원') + fld('dept', '학과 · 과정', SU.dept, '예: 전자공학과 석사과정') +
            '<div class="fld full"><label>재학증명서 등 증빙 <i class="req">필수</i></label><label class="filebox">' + ic('upload') + '<span>' + (SU.proof ? esc(SU.proof) : 'PDF · JPG · PNG 파일 선택 (10MB 이하)') + '</span><input type="file" data-su-file accept=".pdf,.jpg,.jpeg,.png"></label>' +
            '<small class="hint2">체험 화면에서는 파일 이름만 기록하며, 파일은 어디에도 전송되지 않습니다.</small></div></div>' +
            '<div class="su-nav"><button class="btn ghost" data-act="su-prev">' + ic('back') + '이전</button><button class="btn pri" data-act="su-next" ' + (SU.school && SU.dept && SU.proof ? '' : 'disabled') + '>다음' + ic('arrow') + '</button></div>';
        } else {
          var r = SU.nts;
          body = '<h2 class="su-t">사업자 상태 확인</h2><p class="su-d">사업자등록번호를 입력해 계속·휴업·폐업 상태를 확인해 주세요. <span class="tg ol">체험용 조회 결과</span></p>' +
            '<div class="fm-g">' + '<div class="fld full"><label for="suBiz">사업자등록번호 <i class="req">필수</i></label><div class="biz-row"><input id="suBiz" class="inp mono" data-su="bizNo" inputmode="numeric" maxlength="12" placeholder="000-00-00000" value="' + esc(SU.bizNo) + '">' +
            '<button class="btn dark" data-act="su-nts">' + ic('shield') + '등록 상태 확인</button></div><div class="biz-ex"><span>예시 번호</span>' + D.SIGNUP_SAMPLES.map(function (x) { return '<button class="chip" data-act="su-ex" data-v="' + x.no + '"><span class="mono">' + x.no + '</span> ' + x.label + '</button>'; }).join('') + '</div>' +
            '<div id="ntsR">' + ntsCard(r) + '</div></div>' +
            fld('company', SU.type === 'univ' ? '기관명 (산학협력단 등)' : '상호', SU.company, SU.type === 'univ' ? '예: 도담대학교 산학협력단' : '예: 가람정밀 주식회사') + fld('ceo', '대표자', SU.ceo, '대표자 성명') +
            (SU.type === 'univ' ? '<div class="fld full"><label>사업자등록증 사본 <i class="opt">선택</i></label><label class="filebox">' + ic('upload') + '<span>' + (SU.proof ? esc(SU.proof) : '파일 선택') + '</span><input type="file" data-su-file accept=".pdf,.jpg,.jpeg,.png"></label></div>' : '') + '</div>' +
            '<div class="su-nav"><button class="btn ghost" data-act="su-prev">' + ic('back') + '이전</button><button class="btn pri" data-act="su-next" ' + (r && r.ok && SU.company && SU.ceo ? '' : 'disabled') + '>다음' + ic('arrow') + '</button></div>';
        }
      } else {
        body = '<h2 class="su-t">담당자 정보와 로그인 설정</h2><p class="su-d">로그인과 견적·증빙 수신에 사용할 정보를 입력해 주세요. 체험용 비밀번호를 사용해 주세요.</p><div class="fm-g">' +
          fld('name', '담당자 이름', SU.name, '이름') + fld('phone', '연락처', SU.phone, '010-0000-0000') + fld('email', '이메일 (세금계산서 수신)', SU.email, 'name@company.com', 'full') + fld('pw', '비밀번호', SU.pw, '8자 이상 · 체험용 비밀번호') + fld('pw2', '비밀번호 확인', SU.pw2, '비밀번호를 다시 입력해 주세요') + '</div>' +
          '<div class="agree">' + ['[필수] 이용약관 동의', '[필수] 개인정보 수집·이용 동의', '[선택] 신상품·교육용 특가 안내 수신'].map(function (t, i) { return '<label class="ck"><input type="checkbox" data-su-ag="' + i + '" ' + (SU.agree[i] ? 'checked' : '') + '><span>' + t + '</span></label>'; }).join('') + '</div>' +
          '<div class="su-nav"><button class="btn ghost" data-act="su-prev">' + ic('back') + '이전</button><button class="btn pri" data-act="su-done" ' + (signupReady() ? '' : 'disabled') + '>가입 신청' + ic('check') + '</button></div>';
      }
      var side = '<aside class="su-side"><b>가입 후 진행</b><ol><li><span>1</span>가입 신청 · 자격 확인</li><li><span>2</span>담당자 승인 (영업일 1일 이내)</li><li><span>3</span>회원 유형별 가격 공개</li><li><span>4</span>1초 견적 · 주문 · 세금계산서</li></ol><p>' + ic('info') + '승인 전에는 상품 가격이 「회원 전용 가격」으로 표시됩니다.</p></aside>';
      return '<div class="wrap pg" data-title="회원가입">' + crumbs([['회원가입']]) + '<div class="su"><div class="su-main card">' + head + body + '</div>' + side + '</div></div>';
    },
    mount: function (root) {
      root.querySelectorAll('[data-su]').forEach(function (inp) {
        inp.addEventListener('input', function () {
          var k = inp.getAttribute('data-su');
          if (k === 'bizNo') { inp.value = U.bizFmt(inp.value); if (SU.nts) { SU.nts = null; document.getElementById('ntsR').innerHTML = ''; } }
          SU[k] = inp.value; syncNext(root);
        });
      });
      root.querySelectorAll('[data-su-file]').forEach(function (inp) { inp.addEventListener('change', function () { var file = inp.files[0]; if (!file) return; if (file.size > 10 * 1024 * 1024 || !/\.(pdf|jpe?g|png)$/i.test(file.name)) { inp.value = ''; APP.toast('PDF·JPG·PNG 파일을 10MB 이하로 선택해 주세요.', 'warn'); return; } SU.proof = file.name; APP.refresh(); }); });
      root.querySelectorAll('[data-su-ag]').forEach(function (inp) { inp.addEventListener('change', function () { SU.agree[+inp.getAttribute('data-su-ag')] = inp.checked; syncNext(root); }); });
    }
  };
  function syncNext(root) {
    var b = root.querySelector('[data-act="su-next"],[data-act="su-done"]'); if (!b) return;
    var ok = SU.step === 2 ? (SU.type === 'grad' ? SU.school && SU.dept && SU.proof : SU.nts && SU.nts.ok && SU.company && SU.ceo) : SU.step === 3 ? signupReady() : SU.type;
    b.disabled = !ok;
  }
  function fld(k, label, v, ph, cls) { return '<div class="fld ' + (cls || '') + '"><label for="su_' + k + '">' + label + ' <i class="req">필수</i></label><input id="su_' + k + '" class="inp" data-su="' + k + '" type="' + (k === 'pw' || k === 'pw2' ? 'password' : k === 'email' ? 'email' : 'text') + '" autocomplete="' + (k === 'pw' || k === 'pw2' ? 'new-password' : 'off') + '" value="' + esc(v) + '" placeholder="' + esc(ph) + '"></div>'; }
  function ntsCard(r) {
    if (!r) return '';
    if (r.loading) return '<div class="nts ld"><span class="spin"></span><div><b>국세청 사업자 상태 조회 중…</b><p>검증번호 확인 완료 · 상태 조회 요청</p></div></div>';
    return '<div class="nts ' + (r.ok ? 'ok' : 'bad') + '">' + ic(r.ok ? 'shield' : 'alert') + '<div><b>' + esc(r.s) + (r.tax ? ' · ' + esc(r.tax) : '') + '</b><p>' + esc(r.msg) + '</p></div></div>';
  }
  A['su-type'] = function (el) { SU.type = el.getAttribute('data-v'); SU.nts = null; SU.proof = ''; APP.refresh(); };
  A['su-next'] = function () { SU.step++; APP.refresh(); };
  A['su-prev'] = function () { SU.step--; APP.refresh(); };
  A['su-ex'] = function (el) { SU.bizNo = el.getAttribute('data-v'); SU.nts = null; var i = document.getElementById('suBiz'); i.value = SU.bizNo; A['su-nts'](); };
  A['su-nts'] = function () {
    var v = document.getElementById('suBiz').value; SU.bizNo = v;
    if (!U.bizValid(v)) { SU.nts = { ok: false, s: '번호 오류', msg: U.digits(v).length !== 10 ? '사업자등록번호 10자리를 입력해 주세요.' : '검증번호가 맞지 않습니다. 번호를 다시 확인해 주세요.' }; document.getElementById('ntsR').innerHTML = ntsCard(SU.nts); syncNext(document); return; }
    if (ST.s.members.some(function (m) { return U.digits(m.bizNo) === U.digits(v); })) { SU.nts = { ok: false, s: '가입된 번호', msg: '이미 가입된 사업자등록번호입니다. 기존 계정으로 로그인하거나 담당자 추가를 문의해 주세요.' }; document.getElementById('ntsR').innerHTML = ntsCard(SU.nts); syncNext(document); return; }
    document.getElementById('ntsR').innerHTML = ntsCard({ loading: true });
    var draft = SU;
    SV.nts(v).then(function (r) { if (SU !== draft || U.digits(SU.bizNo) !== U.digits(v)) return; SU.nts = r; var el = document.getElementById('ntsR'); if (el) { el.innerHTML = ntsCard(r); syncNext(document); } });
  };
  A['su-done'] = function () {
    if (!signupReady()) { APP.toast('필수 정보와 비밀번호 확인란을 확인해 주세요.', 'warn'); return; }
    if (ST.s.members.some(function (m) { return m.email.toLowerCase() === SU.email.trim().toLowerCase(); })) { APP.toast('이미 가입된 이메일입니다. 다른 이메일을 입력해 주세요.', 'warn'); return; }
    var id = U.uid('m'), kind = SU.type === 'univ' ? '대학' : SU.type === 'grad' ? '대학원생' : (U.digits(SU.bizNo).slice(3, 5) >= '81' ? '법인 사업자' : '개인 사업자');
    var m = { id: id, role: 'member', type: SU.type, kind: kind, email: SU.email.trim().toLowerCase(), pw: SU.pw, company: SU.type === 'grad' ? SU.school : SU.company, bizNo: SU.type === 'grad' ? '' : SU.bizNo,
      ceo: SU.ceo, name: SU.name, dept: SU.type === 'grad' ? SU.dept : '', phone: SU.phone, status: 'pending', grade: 'basic', ecount: '', joinedAt: U.now(), proof: SU.proof,
      nts: SU.nts && SU.nts.ok ? { s: SU.nts.s, tax: SU.nts.tax, at: SU.nts.at } : null };
    ST.s.members.push(m); APP.switchAccount(id);
    ST.log('join', (m.company || m.name) + ' 가입 신청 · ' + (m.nts ? '국세청 ' + m.nts.s + ' 확인' : '증빙 ' + m.proof), id);
    ST.save(); suInit(); APP.toast('가입 신청을 접수했습니다.'); APP.go('/pending');
  };

  S.pending = {
    auth: true,
    render: function () {
      var me = ST.me();
      if (me.status === 'approved') return '<div class="wrap pg" data-title="승인 완료"><div class="pendbox card ok">' + ic('check') + '<h2>가입이 승인되었습니다</h2><p>' + esc(D.TYPE_NAME[me.type]) + ' 회원 가격이 적용됩니다.</p><a class="btn pri" href="#/">쇼핑 시작하기</a></div></div>';
      var rej = me.status === 'rejected';
      return '<div class="wrap pg" data-title="가입 승인 대기"><div class="pendbox card"><span class="pd-i">' + ic(rej ? 'alert' : 'hourglass') + '</span><h2>' + (rej ? '가입이 반려되었습니다' : '가입 승인을 기다리고 있습니다') + '</h2>' +
        '<p>' + (rej ? '반려 사유: <b>' + esc(me.rejectReason || '-') + '</b><br>보완할 내용을 확인하고 상담을 통해 담당자에게 문의해 주세요.' : esc(me.company || '') + ' ' + esc(me.name) + '님의 신청을 담당자가 확인하고 있습니다. 승인 전에는 가격이 「회원 전용 가격」으로 표시됩니다.') + '</p>' +
        '<ol class="pd-tl"><li class="done">' + ic('check') + '<b>가입 신청</b><small>' + U.dt(me.joinedAt) + '</small></li><li class="done">' + ic('check') + '<b>' + (me.nts ? '국세청 ' + esc(me.nts.s) : '증빙 첨부') + '</b><small>' + esc(me.nts ? me.nts.tax || '' : me.proof || '') + '</small></li>' +
        '<li class="' + (rej ? 'bad' : 'now') + '">' + ic(rej ? 'x' : 'clock') + '<b>' + (rej ? '반려' : '관리자 승인') + '</b><small>' + (rej ? '' : '영업일 1일 이내') + '</small></li><li>' + ic('tag') + '<b>가격 공개</b><small>' + esc(D.TYPE_NAME[me.type]) + ' 회원가</small></li></ol>' +
        '<div class="pd-b"><a class="btn ghost" href="#/">상품 둘러보기</a><a class="btn dark" href="#/my">계정 정보 보기</a></div></div></div>';
    }
  };

  /* ---------- 홈 ---------- */
  S.home = {
    render: function () {
      var me = ST.me(), ps = ST.s.products.filter(function (p) { return p.visible; });
      var hot = ps.filter(function (p) { return p.hot; }).slice(0, 8), edu = ps.filter(function (p) { return p.edu; }).slice(0, 4);
      var banner = !me ? '<div class="mbn guest">' + ic('lock') + '<div><b>가격은 승인된 회원에게 공개됩니다</b><p>사업자 · 대학 · 대학원생 회원으로 가입하고 승인이 완료되면 회원 유형별 가격으로 견적을 받을 수 있습니다.</p></div><a class="btn pri" href="#/signup">회원가입</a><a class="btn ghost" href="#/login">로그인</a></div>' :
        me.role === 'admin' ? '<div class="mbn">' + ic('shield') + '<div><b>관리자 계정으로 쇼핑몰을 보고 있습니다</b><p>관리자 계정에는 회원가가 표시되지 않습니다. 「기능 살펴보기」에서 회원 계정으로 바꿔 보세요.</p></div><a class="btn dark" href="#/admin">관리자 콘솔</a></div>' :
        me.status !== 'approved' ? '<div class="mbn pend">' + ic('hourglass') + '<div><b>' + (me.status === 'rejected' ? '가입 신청에 보완이 필요합니다' : '가입 승인 대기 중입니다') + '</b><p>' + (me.status === 'rejected' ? '반려 사유를 확인하고 담당자에게 문의해 주세요.' : '승인되면 ' + esc(D.TYPE_NAME[me.type]) + ' 회원 가격이 공개됩니다.') + '</p></div><a class="btn ghost" href="#/pending">진행 상태</a></div>' :
        '<div class="mbn ok">' + ic('check') + '<div><b>' + esc(me.company) + ' · ' + esc(D.TYPE_NAME[me.type]) + ' 회원' + (PR.rateOf(me) ? ' <span class="rt">' + PR.rateOf(me) + '% 할인 적용 중</span>' : '') + '</b><p>모든 가격은 부가세 별도 · 회원 유형별 할인 적용가입니다. 할인 제외·정찰가 상품은 표시됩니다.</p></div><a class="btn pri" href="#/cart">' + ic('bolt') + '1초 견적</a></div>';
      return '<div class="home" data-title="홈"><section class="hero"><div class="hero-bg"><img src="assets/images/lab-workbench.jpg" alt="정밀 계측을 위한 전자 실험실"></div><div class="wrap hero-in"><div class="hero-t">' +
        '<span class="eyebrow"><i></i>PRECISION FOR YOUR NEXT DISCOVERY</span><h1>연구의 시작,<br><em>정확한 장비 선택부터.</em></h1>' +
        '<p>실험실의 계측기부터 회로의 작은 부품까지.<br>필요한 사양을 고르고, 회원가로 견적을 받아보세요.</p>' +
        '<div class="hero-b"><a class="btn pri lg" href="#/c/osc">' + ic('grid') + '상품 둘러보기</a><a class="btn glass lg" href="#/cart">' + ic('bolt') + '1초 견적 시작</a></div>' +
        '<div class="hero-k"><span><b class="mono">8</b>개 카테고리</span><span><b class="mono">' + ps.length + '</b>개 모델</span><span><b class="mono">' + ps.reduce(function (s, p) { return s + p.combos.length; }, 0) + '</b>개 옵션 조합 가격</span></div></div>' +
        '</div></section>' +
        '<div class="wrap">' + banner +
        '<section class="flow"><div class="fl-i">' + ic('tag') + '<b>회원 전용 가격</b><p>승인된 유형과 등급에 맞춰 적용됩니다.</p></div>' +
        '<div class="fl-i hl">' + ic('doc') + '<b>견적서 바로 발행</b><p>필요한 품목을 담아 PDF로 받아보세요.</p></div>' +
        '<div class="fl-i">' + ic('card') + '<b>편리한 구매</b><p>카드와 무통장 입금 중 선택하세요.</p></div>' +
        '<div class="fl-i">' + ic('receipt') + '<b>구매 증빙 관리</b><p>견적함과 주문 내역에서 확인하세요.</p></div></section>' +
        '<section class="sec"><div class="sec-h"><h2>카테고리</h2><a href="#/c/osc">상품 둘러보기' + ic('right') + '</a></div><div class="cats">' +
        D.CATS.map(function (c) { var n = ps.filter(function (p) { return p.cat === c.id; }).length; return '<a class="cat" href="#/c/' + c.id + '"><div class="cat-a">' + ART.cat(c.id) + '</div><b>' + esc(c.name) + '</b><small>' + esc(c.en) + ' · ' + n + '개 모델</small></a>'; }).join('') + '</div></section>' +
        '<section class="sec"><div class="sec-h"><h2>연구실 추천 장비</h2><span class="sec-s">계측 · 분석 · 실습</span></div><div class="grid4">' + hot.map(function (p) { return card(p, me); }).join('') + '</div></section>' +
        '<section class="lab-banner"><img src="assets/images/electronics-workbench.jpg" alt="회로 기판과 전자부품이 놓인 실험용 작업대" loading="lazy"><div><span class="eyebrow dk">SMALL PARTS, BIG POSSIBILITIES</span><h2>회로의 가능성을 넓히는<br>작은 부품들.</h2><p>실험과 개발에 필요한 전자부품을 만나보세요.</p><a class="btn dark" href="#/c/pas">전자부품 둘러보기' + ic('arrow') + '</a></div></section>' +
        '<section class="sec edu"><div class="edu-h"><span class="eyebrow dk">' + ic('school') + '대학 · 대학원생 회원</span><h2>실습실 · 연구실 구매는<br>회원가 5% 할인으로</h2><p>대학 사업자등록증 또는 재학 증빙으로 가입하면 대부분의 상품에 5% 할인가가 자동 적용됩니다. 교육용 정찰가 상품은 같은 가격으로 공급합니다.</p><a class="btn pri" href="#/signup">대학 회원 가입</a></div>' +
        '<div class="grid2">' + edu.map(function (p) { return card(p, me); }).join('') + '</div></section>' +
        '<section class="sec perks">' + [['tag', '회원가 안내', '회원 유형과 상품별 할인 조건을 확인해 보세요.'], ['receipt', '구매 증빙', '무통장 입금은 세금계산서, 카드 결제는 매출전표로 관리합니다.'], ['chat', '구매 상담', '상품 구매와 견적·증빙 관련 질문을 남겨주세요.'], ['box', '주문 내역 관리', '주문 접수부터 결제·배송까지 진행 상태를 확인하세요.']].map(function (x) { return '<div class="perk">' + ic(x[0]) + '<b>' + x[1] + '</b><p>' + x[2] + '</p></div>'; }).join('') + '</section></div></div>';
    }
  };

  /* ---------- 카테고리 · 검색 ---------- */
  var FIL = { brand: '', edu: false, stock: false, sort: 'rec' };
  var FILTER_SCOPE = '';
  function filterScope(key) {
    if (FILTER_SCOPE !== key) { FIL = { brand: '', edu: false, stock: false, sort: FIL.sort }; FILTER_SCOPE = key; }
  }
  function listView(list, me) {
    var brands = []; list.forEach(function (p) { if (brands.indexOf(p.brand) < 0) brands.push(p.brand); });
    var xs = list.filter(function (p) { return (!FIL.brand || p.brand === FIL.brand) && (!FIL.edu || p.edu) && (!FIL.stock || p.stock === '재고 보유'); });
    if (FIL.sort !== 'rec' && PR.canSee(me)) xs.sort(function (a, b) { var pa = PR.minPrice(a, me), pb = PR.minPrice(b, me); if (!pa) return pb ? 1 : 0; if (!pb) return -1; return FIL.sort === 'lo' ? pa.unit - pb.unit : pb.unit - pa.unit; });
    return '<div class="fbar"><div class="fb-l"><button class="chip ' + (!FIL.brand ? 'on' : '') + '" data-act="fil" data-k="brand" data-v="">전체 브랜드</button>' + brands.map(function (b) { return '<button class="chip ' + (FIL.brand === b ? 'on' : '') + '" data-act="fil" data-k="brand" data-v="' + esc(b) + '">' + esc(b) + '</button>'; }).join('') +
      '<button class="chip ' + (FIL.edu ? 'on' : '') + '" data-act="fil" data-k="edu">' + ic('school') + '교육용 추천</button><button class="chip ' + (FIL.stock ? 'on' : '') + '" data-act="fil" data-k="stock">' + ic('box') + '재고 보유</button></div>' +
      '<label class="sortsel">' + ic('filter') + '<select data-sort aria-label="정렬">' + [['rec', '추천순'], ['lo', '낮은 가격순'], ['hi', '높은 가격순']].map(function (o) { return '<option value="' + o[0] + '"' + (FIL.sort === o[0] ? ' selected' : '') + (o[0] !== 'rec' && !PR.canSee(me) ? ' disabled' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label></div>' +
      (xs.length ? '<div class="grid4">' + xs.map(function (p) { return card(p, me); }).join('') + '</div>' : empty('search', '조건에 맞는 상품이 없습니다', '필터를 바꿔 보세요.'));
  }
  A.fil = function (el) { var k = el.getAttribute('data-k'); if (k === 'brand') FIL.brand = el.getAttribute('data-v'); else FIL[k] = !FIL[k]; APP.refresh(); };
  function mountSort(root) { var s = root.querySelector('[data-sort]'); if (s) s.addEventListener('change', function () { FIL.sort = s.value; APP.refresh(); }); }
  S.cat = {
    render: function (args) {
      var c = ST.cat(args[0]) || D.CATS[0], me = ST.me();
      filterScope('cat:' + c.id);
      var list = ST.s.products.filter(function (p) { return p.cat === c.id && p.visible; });
      return '<div class="wrap pg" data-title="' + esc(c.name) + '">' + crumbs([['상품'], [c.name]]) + '<div class="cat-hd"><div><span class="eyebrow dk">' + esc(c.en) + '</span><h1>' + esc(c.name) + '</h1><p>' + esc(c.desc) + ' · ' + list.length + '개 모델 · 가격은 부가세 별도</p></div>' +
        '<div class="cat-tabs">' + D.CATS.map(function (x) { return '<a href="#/c/' + x.id + '" class="' + (x.id === c.id ? 'on' : '') + '">' + esc(x.name) + '</a>'; }).join('') + '</div></div>' + listView(list, me) + '</div>';
    },
    mount: mountSort
  };
  S.search = {
    render: function (args) {
      var q = (args[0] || '').trim(), low = q.toLowerCase(), me = ST.me();
      filterScope('search:' + low);
      var list = ST.s.products.filter(function (p) { return p.visible && (p.name + ' ' + p.model + ' ' + p.brand + ' ' + ST.cat(p.cat).name + ' ' + p.combos.map(function (c) { return c.sku; }).join(' ')).toLowerCase().indexOf(low) >= 0; });
      return '<div class="wrap pg" data-title="검색">' + crumbs([['검색'], [q]]) + '<div class="cat-hd"><div><h1>「' + esc(q) + '」 검색 결과</h1><p>' + list.length + '개 상품</p></div></div>' + listView(list, me) + '</div>';
    },
    mount: mountSort
  };

  /* ---------- 상품 상세 ---------- */
  var SEL = {};
  function pickCombo(p) {
    var cur = SEL[p.id];
    if (!cur || !ST.combo(p, cur)) { var first = p.combos.filter(function (c) { return c.sale; })[0] || p.combos[0]; SEL[p.id] = first.id; }
    return ST.combo(p, SEL[p.id]);
  }
  function comboFor(p, vals) { var key = vals.join(' / '); return p.combos.filter(function (c) { return c.key === key; })[0]; }
  function comboValues(p, c) {
    var found = [];
    function match(i, parts) {
      if (i === p.opts.length) { if (parts.join(' / ') === c.key) { found = parts; return true; } return false; }
      return p.opts[i].v.some(function (v) { return match(i + 1, parts.concat(v)); });
    }
    match(0, []); return found;
  }
  S.product = {
    render: function (args) {
      var p = ST.product(args[0]); if (!p || !p.visible) return '<div class="wrap pg">' + empty('search', '상품을 찾을 수 없습니다', '', '<a class="btn pri" href="#/">홈으로</a>') + '</div>';
      var me = ST.me(), see = PR.canSee(me), c = pickCombo(p), vals = comboValues(p, c), x = PR.price(p, c, me), qty = SEL[p.id + ':q'] || p.moq;
      var optHtml = p.opts.map(function (o, oi) {
        return '<div class="pd-option"><span class="opt-n">' + esc(o.n) + '</span><div class="opt-v">' + o.v.map(function (v) {
          var test = vals.slice(); test[oi] = v; var cc = comboFor(p, test), off = !cc || !cc.sale;
          return '<button class="ov ' + (vals[oi] === v ? 'on' : '') + '" data-act="opt" data-p="' + p.id + '" data-i="' + oi + '" data-v="' + esc(v) + '" ' + (off ? 'disabled title="판매하지 않는 조합"' : '') + '>' + esc(v) + '</button>';
        }).join('') + '</div></div>';
      }).join('');
      var priceBox = !see ? lockBox(me) :
        '<div class="pbox"><div class="pb-r"><span>기준가</span><span class="' + (x.rate || x.rule === 'fixed' ? 'was' : '') + ' mono">' + U.won(x.base) + '원</span></div>' +
        '<div class="pb-r"><span>적용 규칙</span><span>' + (x.rule === 'fixed' ? '<span class="tg rl fx">교육용 정찰가</span>' : x.rule === 'nodisc' ? '<span class="tg rl">할인 제외 상품</span>' : x.rate ? '<span class="tg ok">' + esc(x.why) + '</span>' : '<span class="tg">일반 회원 기본가</span>') + '</span></div>' +
        '<div class="pb-u"><span>회원 적용가 <small>부가세 별도 · 10원 단위 절사</small></span><b class="mono">' + U.won(x.unit) + '<small>원</small></b></div>' +
        '<div class="pb-q"><span>수량' + (p.moq > 1 ? ' <small>' + p.moq + '개 단위</small>' : '') + '</span><div class="stepper"><button data-act="pq" data-p="' + p.id + '" data-d="-1" aria-label="수량 줄이기">' + ic('minus') + '</button><input class="mono" value="' + qty + '" data-pq="' + p.id + '" inputmode="numeric" aria-label="수량"><button data-act="pq" data-p="' + p.id + '" data-d="1" aria-label="수량 늘리기">' + ic('plus') + '</button></div></div>' +
        '<div class="pb-t"><span>합계 <small>부가세 별도</small></span><b class="mono" id="pTot">' + U.won(x.unit * qty) + '원</b></div>' +
        '<div class="pb-b"><button class="btn ghost lg" data-act="add" data-p="' + p.id + '">' + ic('cart') + '장바구니 담기</button><button class="btn pri lg" data-act="quick-q" data-p="' + p.id + '">' + ic('bolt') + '바로 견적서 받기</button></div></div>';
      var table = '<div class="tw"><table class="tbl"><thead><tr><th>옵션 조합</th>' + (see ? '<th class="r">기준가</th><th class="r">내 회원가</th>' : '<th>가격</th>') + '<th>판매</th></tr></thead><tbody>' +
        p.combos.map(function (cc) { var y = PR.price(p, cc, me); return '<tr class="' + (cc.id === c.id ? 'cur' : '') + (cc.sale ? '' : ' off') + '"><td>' + esc(cc.key) + '</td>' + (see ? '<td class="r mono">' + U.won(cc.price) + '</td><td class="r mono b">' + (cc.sale ? U.won(y.unit) : '-') + '</td>' : '<td>회원 전용</td>') + '<td>' + (cc.sale ? '<span class="pill ok">판매</span>' : '<span class="pill mute">미판매</span>') + '</td></tr>'; }).join('') +
        '</tbody></table></div>';
      return '<div class="wrap pg" data-title="' + esc(p.model) + '">' + crumbs([[ST.cat(p.cat).name, '#/c/' + p.cat], [p.model]]) +
        '<div class="pd"><div class="pd-art"><div class="pd-stage">' + ART.product(p) + '</div><div class="pd-badges"><span class="pc-stk ' + (p.stock === '재고 보유' ? 'in' : '') + '">' + esc(p.stock) + '</span>' + ruleTag(p) + '</div></div>' +
        '<div class="pd-info"><span class="pc-br">' + esc(p.brand) + ' · <span class="mono">' + esc(p.model) + '</span></span><h1>' + esc(p.name) + '</h1><p class="pd-d">' + esc(p.desc) + '</p>' +
        '<div class="pd-t">' + p.tags.map(function (t) { return '<span class="tg">' + esc(t) + '</span>'; }).join('') + '<span class="tg ol">' + p.combos.length + '개 조합 가격표</span></div>' + optHtml + priceBox + '</div></div>' +
        '<div class="pd-tabs"><section><h2>' + ic('table') + '옵션별 가격 안내</h2><p class="muted">필요한 사양을 선택해 회원 적용가를 확인해 주세요. 가격은 부가세 별도입니다.</p>' + table + '</section>' +
        '<section><h2>' + ic('info') + '주요 사양</h2><dl class="spec">' + p.specs.map(function (s) { return '<div><dt>' + esc(s[0]) + '</dt><dd>' + esc(s[1]) + '</dd></div>'; }).join('') + '<div><dt>판매 단위</dt><dd>' + esc(p.unit) + (p.moq > 1 ? ' · 최소 ' + p.moq + '개' : '') + '</dd></div><div><dt>납기</dt><dd>' + esc(p.stock) + '</dd></div></dl>' +
        '<div class="note">' + ic('doc') + '<p><b>견적 · 증빙 안내</b> 견적서는 발행일을 포함해 ' + ST.s.settings.validDays + '일간 유효합니다. 세금계산서를 요청한 무통장 입금 주문은 입금 확인 후 담당자가 발행합니다.</p></div></section></div></div>';
    },
    mount: function (root, args) {
      var p = ST.product(args[0]); if (!p) return;
      var inp = root.querySelector('[data-pq]'); if (inp) inp.addEventListener('change', function () { setQty(p, +U.digits(inp.value) || p.moq); });
    }
  };
  function setQty(p, n) {
    n = Math.min(Math.floor(9999 / p.moq) * p.moq, Math.max(p.moq, Math.ceil(n / p.moq) * p.moq));
    SEL[p.id + ':q'] = n; APP.refresh();
  }
  A.pq = function (el) { var p = ST.product(el.getAttribute('data-p')); setQty(p, (SEL[p.id + ':q'] || p.moq) + (+el.getAttribute('data-d')) * p.moq); };
  A.opt = function (el) {
    var p = ST.product(el.getAttribute('data-p')), c = pickCombo(p), vals = comboValues(p, c);
    vals[+el.getAttribute('data-i')] = el.getAttribute('data-v');
    var cc = comboFor(p, vals); if (cc && cc.sale) { SEL[p.id] = cc.id; APP.refresh(); }
  };
  function addToCart(p, qty) {
    var me = ST.me(), c = pickCombo(p), cart = ST.cart(), ex = cart.filter(function (x) { return x.cid === c.id; })[0], unit = PR.price(p, c, me).unit;
    if (!PR.line(me, c.id, (ex ? ex.qty : 0) + qty)) { APP.toast('판매 상태와 최대 주문 수량을 확인해 주세요.', 'warn'); return null; }
    if (ex) { ex.qty += qty; ex.seen = unit; } else cart.push({ cid: c.id, qty: qty, seen: unit, at: U.now() });
    ST.save(); return c;
  }
  function needMember() {
    var me = ST.me();
    if (!me) { APP.toast('로그인 후 장바구니와 견적을 이용할 수 있습니다.', 'warn'); APP.afterLogin = APP.route.path; APP.go('/login'); return null; }
    if (me.role === 'admin') { APP.toast('관리자 계정은 주문할 수 없습니다. 회원 계정으로 바꿔 주세요.', 'warn'); return null; }
    if (me.status !== 'approved') { APP.toast('가입 승인 후 이용할 수 있습니다.', 'warn'); return null; }
    return me;
  }
  A.add = function (el) {
    if (!needMember()) return; var p = ST.product(el.getAttribute('data-p')), c = addToCart(p, SEL[p.id + ':q'] || p.moq);
    if (!c) return; APP.refresh(); APP.toast('장바구니에 담았습니다 · ' + esc(p.model + ' ' + c.key) + ' <a href="#/cart">장바구니 보기</a>');
  };
  A['quick-q'] = function (el) {
    var me = needMember(); if (!me) return; var p = ST.product(el.getAttribute('data-p')), c = pickCombo(p);
    issue(me, [{ cid: c.id, qty: SEL[p.id + ':q'] || p.moq }], { from: 'product' }, el);
  };

  /* ---------- 장바구니 · 1초 견적 ---------- */
  S.cart = {
    auth: true,
    render: function () {
      var me = ST.me();
      if (me.role === 'admin' || me.status !== 'approved') return '<div class="wrap pg" data-title="장바구니">' + crumbs([['장바구니']]) + empty('lock', me.role === 'admin' ? '관리자 계정에는 장바구니가 없습니다' : '가입 승인 후 이용할 수 있습니다', '「기능 살펴보기」에서 회원 계정으로 바꿔 보세요.') + '</div>';
      var cart = ST.cart(), lines = [], changed = 0, unavailable = 0;
      var rows = cart.map(function (it, i) {
        var l = PR.line(me, it.cid, it.qty);
        if (!l) {
          unavailable++;
          var missing = ST.comboById(it.cid), product = missing && missing.p, combo = missing && missing.c;
          return '<div class="ci off">' + (product ? '<div class="ci-a">' + ART.product(product) + '</div>' : '<div class="ci-a"></div>') +
            '<div class="ci-b"><b>' + esc(product ? product.name : '확인할 수 없는 상품') + '</b><span class="ci-o">' + esc(combo ? combo.key : it.cid) + '</span><span class="ci-chg">판매 상태 또는 수량을 확인해 주세요. 삭제 후 다시 담을 수 있습니다.</span></div>' +
            '<div class="ci-u">주문 불가</div><button class="ibtn ci-x" data-act="cdel" data-i="' + i + '" aria-label="삭제">' + ic('x') + '</button></div>';
        }
        lines.push(l);
        var r = ST.comboById(it.cid), ch = it.seen !== l.unit; if (ch) changed++;
        return '<div class="ci ' + (ch ? 'chg' : '') + (r.c.sale ? '' : ' off') + '"><a class="ci-a" href="#/p/' + r.p.id + '">' + ART.product(r.p) + '</a><div class="ci-b"><span class="pc-br">' + esc(r.p.brand) + ' · <span class="mono">' + esc(r.p.model) + '</span></span>' +
          '<a class="ci-n" href="#/p/' + r.p.id + '">' + esc(r.p.name) + '</a><span class="ci-o">' + esc(r.c.key) + '</span>' +
          (ch ? '<span class="ci-chg">' + ic('alert') + '담은 뒤 가격 변경 <span class="mono">' + U.won(it.seen) + ' → ' + U.won(l.unit) + '원</span></span>' : '') + (r.c.sale ? '' : '<span class="ci-chg">' + ic('alert') + '현재 판매하지 않는 조합입니다</span>') + '</div>' +
          '<div class="ci-u"><small>단가</small><b class="mono">' + U.won(l.unit) + '</b>' + (l.rate ? '<span class="rt">' + l.rate + '%</span>' : l.rule !== 'normal' ? '<span class="tg rl ' + (l.rule === 'fixed' ? 'fx' : '') + '">' + (l.rule === 'fixed' ? '정찰가' : '할인 제외') + '</span>' : '') + '</div>' +
          '<div class="stepper sm"><button data-act="cq" data-i="' + i + '" data-d="-1" aria-label="수량 줄이기">' + ic('minus') + '</button><input class="mono" value="' + it.qty + '" data-cq="' + i + '" aria-label="수량" inputmode="numeric"><button data-act="cq" data-i="' + i + '" data-d="1" aria-label="수량 늘리기">' + ic('plus') + '</button></div>' +
          '<div class="ci-t mono">' + U.won(l.amount) + '<small>원</small></div><button class="ibtn ci-x" data-act="cdel" data-i="' + i + '" aria-label="삭제">' + ic('x') + '</button></div>';
      }).join('');
      if (!cart.length) return '<div class="wrap pg" data-title="장바구니">' + crumbs([['장바구니']]) + empty('cart', '장바구니가 비어 있습니다', '상품을 담으면 회원가로 1초 만에 견적서를 발행할 수 있습니다.', '<a class="btn pri" href="#/c/osc">상품 둘러보기</a>') + '</div>';
      var t = PR.totals(lines), pol = ST.s.policy;
      return '<div class="wrap pg" data-title="장바구니">' + crumbs([['장바구니 · 1초 견적']]) + '<div class="ph"><h1>장바구니</h1><p>' + cart.length + '개 품목 · 회원 적용가 기준 · 부가세 별도</p></div>' +
        (unavailable ? '<div class="alert warn">' + ic('alert') + '<div><b>주문할 수 없는 품목이 ' + unavailable + '개 있습니다.</b><p>아래 합계는 주문 가능한 품목 기준입니다. 주문 불가 품목을 삭제한 뒤 견적 또는 주문을 진행해 주세요.</p></div></div>' : '') +
        (changed ? '<div class="alert warn">' + ic('alert') + '<div><b>담아 둔 뒤 가격이 바뀐 품목이 ' + changed + '개 있습니다.</b><p>견적서는 현재 가격으로 발행되며, 발행 전에 변경 내용을 한 번 더 확인합니다.</p></div></div>' : '') +
        '<div class="cart"><div class="cart-l card">' + rows + '<div class="cart-f"><button class="btn sm ghost" data-act="cclear">' + ic('trash') + '전체 비우기</button><span class="muted">' + (t.ship ? '공급가 ' + U.won(pol.freeShip) + '원 이상 무료배송 · ' + U.won(pol.freeShip - t.supply) + '원 남음' : '무료배송 적용') + '</span></div></div>' +
        '<aside class="cart-r"><div class="sumbox card"><h3>결제 예정 금액</h3><dl><div><dt>공급가액</dt><dd class="mono">' + U.won(t.supply) + '원</dd></div><div><dt>배송비</dt><dd class="mono">' + (t.ship ? U.won(t.ship) + '원' : '무료') + '</dd></div><div><dt>부가세 (10%)</dt><dd class="mono">' + U.won(t.vat) + '원</dd></div>' +
        '<div class="tot"><dt>합계</dt><dd class="mono">' + U.won(t.total) + '<small>원</small></dd></div></dl>' + (t.save ? '<p class="save">' + ic('tag') + '회원 할인으로 <b class="mono">' + U.won(t.save) + '원</b> 절감</p>' : '') +
        '<label class="memo"><span>견적 메모 <small>선택 · 견적서에 표시</small></span><input class="inp" id="qMemo" maxlength="60" placeholder="예: 과제번호, 납품 장소"></label>' +
        '<button class="btn pri xl qbtn" data-act="issue" ' + (unavailable ? 'disabled' : '') + '>' + ic('bolt') + '<span>1초 견적서 발행</span><small>PDF · 견적번호 · ' + ST.s.settings.validDays + '일 유효</small></button>' +
        (unavailable ? '<button class="btn ghost lg" disabled>주문 불가 품목을 먼저 삭제해 주세요</button>' : '<a class="btn ghost lg" href="#/checkout/cart">견적 없이 바로 주문</a>') + '<p class="fine">' + ic('info') + '견적서에는 발행 시점의 가격이 고정되어 저장됩니다. 이후 가격이 바뀌어도 이 견적으로는 같은 금액에 주문합니다.</p></div></aside></div></div>';
    },
    mount: function (root) {
      root.querySelectorAll('[data-cq]').forEach(function (inp) { inp.addEventListener('change', function () { setCQ(+inp.getAttribute('data-cq'), +U.digits(inp.value) || 1); }); });
    }
  };
  function setCQ(i, n) { var it = ST.cart()[i]; if (!it) return; var p = ST.product(it.cid.split('-')[0]); if (!p) return; it.qty = Math.min(Math.floor(9999 / p.moq) * p.moq, Math.max(p.moq, Math.ceil(n / p.moq) * p.moq)); ST.save(); APP.refresh(); }
  A.cq = function (el) { var i = +el.getAttribute('data-i'), it = ST.cart()[i], p = ST.product(it.cid.split('-')[0]); setCQ(i, it.qty + (+el.getAttribute('data-d')) * p.moq); };
  A.cdel = function (el) { ST.cart().splice(+el.getAttribute('data-i'), 1); ST.save(); APP.refresh(); };
  A.cclear = function () { APP.confirm('장바구니 비우기', '담아 둔 품목을 모두 삭제할까요?', '비우기', function () { ST.cart().length = 0; ST.save(); APP.refresh(); }, true); };
  A.issue = function (el) {
    var me = needMember(); if (!me) return;
    var cart = ST.cart();
    if (!cart.length) { APP.toast('견적서를 발행할 수 있는 품목이 없습니다.', 'warn'); return; }
    if (cart.some(function (it) { return !PR.line(me, it.cid, it.qty); })) { APP.toast('주문 불가 품목의 판매 상태와 수량을 먼저 확인해 주세요.', 'warn'); return; }
    var memo = (document.getElementById('qMemo') || {}).value || '';
    var chg = cart.map(function (it) { var l = PR.line(me, it.cid, it.qty); return it.seen !== l.unit ? { it: it, l: l } : null; }).filter(Boolean);
    if (!chg.length) return issue(me, cart, { memo: memo, from: 'cart' }, el);
    var m = APP.modal({ title: '가격이 바뀐 품목을 확인해 주세요', size: 'md',
      body: '<p class="muted">장바구니에 담은 뒤 아래 품목의 가격이 바뀌었습니다. 견적서는 <b>현재 가격</b>으로 발행됩니다.</p><div class="tw"><table class="tbl"><thead><tr><th>품목</th><th class="r">담을 때</th><th class="r">현재</th><th class="r">차이</th></tr></thead><tbody>' +
        chg.map(function (x) { var d = x.l.unit - x.it.seen; return '<tr><td><b>' + esc(x.l.model) + '</b><br><small>' + esc(x.l.opt) + '</small></td><td class="r mono">' + U.won(x.it.seen) + '</td><td class="r mono b">' + U.won(x.l.unit) + '</td><td class="r mono ' + (d > 0 ? 'up' : 'dn') + '">' + (d > 0 ? '+' : '') + U.won(d) + '</td></tr>'; }).join('') + '</tbody></table></div>',
      foot: '<button class="btn ghost" data-x>취소</button><button class="btn pri" data-ok>' + ic('bolt') + '현재 가격으로 발행</button>' });
    m.el.querySelector('[data-ok]').addEventListener('click', function () { chg.forEach(function (x) { x.it.seen = x.l.unit; }); ST.save(); m.close(); issue(me, cart, { memo: memo, from: 'cart' }, el); });
  };
  /* 발행 시간 = 버튼을 누른 시점부터 견적 저장 + PDF 생성까지 */
  function issue(me, items, opt, el) {
    var t0 = performance.now();
    var state = ST.s;
    if (el) { el.disabled = true; el.classList.add('busy'); }
    PDF.fontsReady().then(function () {
      if (ST.s !== state || ST.s.user !== me.id) throw new Error('계정이 변경되었습니다. 현재 계정에서 다시 발행해 주세요.');
      var q = SV.issueQuote(me, items, opt);
      var cvs = PDF.render(q), blob = PDF.build(cvs, q.no);
      q.ms = Math.max(1, Math.round(performance.now() - t0)); q.pages = cvs.length; ST.save();
      APP.pdfCache[q.no] = { blob: blob, imgs: cvs.map(function (c) { return c.toDataURL('image/jpeg', 0.86); }) };
      APP.justIssued = q.no; APP.go('/q/' + q.no);
    }).catch(function (e) { if (el) { el.disabled = false; el.classList.remove('busy'); } APP.toast('견적서를 만들지 못했습니다: ' + esc(e.message), 'err'); });
  }
  APP.issue = issue;

  /* ---------- 견적서 ---------- */
  function quoteImgs(q, mark) {
    var c = APP.pdfCache[q.no];
    if (c && !mark && !c.mark) return Promise.resolve(c.imgs);
    var context = APP.context();
    return PDF.fontsReady().then(function () {
      if (!APP.sameContext(context)) return [];
      var cvs = PDF.render(q, { mark: mark }); var imgs = cvs.map(function (cv) { return cv.toDataURL('image/jpeg', 0.86); });
      APP.pdfCache[q.no] = { blob: PDF.build(cvs, q.no), imgs: imgs, mark: mark }; return imgs;
    });
  }
  APP.quoteImgs = quoteImgs;
  S.quote = {
    auth: true,
    render: function (args) {
      var q = ST.quote(args[0]), me = ST.me();
      if (!q || (q.uid !== me.id && me.role !== 'admin')) return '<div class="wrap pg">' + empty('doc', '견적서를 찾을 수 없습니다', '본인이 발행한 견적서만 볼 수 있습니다.', '<a class="btn pri" href="#/my/quotes">내 견적함</a>') + '</div>';
      var st = SV.quoteState(q), fresh = APP.justIssued === q.no; APP.justIssued = null;
      var diff = q.lines.filter(function (l) { var x = PR.line(ST.member(q.uid), l.cid, l.qty); return x && x.unit !== l.unit; }).length;
      var act = st === 'valid' ? '<a class="btn pri xl" href="#/checkout/' + q.no + '">' + ic('card') + '이 견적으로 주문하기</a>' :
        st === 'expired' ? '<button class="btn pri xl" data-act="reissue" data-q="' + q.no + '">' + ic('refresh') + '현재 가격으로 재발행</button>' :
        '<a class="btn dark xl" href="#/o/' + q.orderNo + '">' + ic('box') + '주문 ' + q.orderNo + ' 보기</a>';
      return '<div class="wrap pg" data-title="' + q.no + '">' + crumbs([['내 견적함', '#/my/quotes'], [q.no]]) +
        (fresh ? '<div class="issued"><span class="is-i">' + ic('check') + '</span><div><b><span class="mono">' + (q.ms / 1000).toFixed(2) + '초</span> 만에 견적서를 발행했습니다</b><p>견적번호 <span class="mono">' + q.no + '</span> · ' + q.lines.length + '개 품목 · ' + U.ymd(q.validUntil) + '까지 유효 · PDF ' + (q.pages || 1) + '쪽</p></div><button class="btn pri" data-act="qpdf" data-q="' + q.no + '">' + ic('download') + 'PDF 다운로드</button></div>' : '') +
        '<div class="qv"><div class="qv-doc card"><div class="qv-bar"><span>' + ic('file') + '견적서_' + q.no + '.pdf</span><span class="muted" id="qvPages"></span></div><div class="qv-pages" id="qvImgs"><div class="qv-ld"><span class="spin"></span>견적서를 불러오는 중…</div></div></div>' +
        '<aside class="qv-side"><div class="card qs"><div class="qs-h">' + APP.pill(SV.QSTATE, st) + '<span class="dd ' + (st === 'valid' ? '' : 'mute') + '">' + (st === 'valid' ? dday(q) : '') + '</span></div><b class="mono qs-no">' + q.no + '</b>' +
        '<dl><div><dt>발행일</dt><dd>' + U.dt(q.at) + '</dd></div><div><dt>유효기한</dt><dd>' + U.ymd(q.validUntil) + '</dd></div><div><dt>발행 소요</dt><dd class="mono">' + (q.ms ? (q.ms / 1000).toFixed(2) + '초' : '-') + '</dd></div><div><dt>품목</dt><dd>' + q.lines.length + '개</dd></div>' +
        '<div class="tot"><dt>합계 (VAT 포함)</dt><dd class="mono">' + U.won(q.tot.total) + '원</dd></div></dl>' + act +
        '<button class="btn ghost lg" data-act="qpdf" data-q="' + q.no + '">' + ic('download') + 'PDF 다운로드</button>' +
        (st === 'expired' ? '<p class="fine warn">' + ic('alert') + '유효기간이 지난 견적은 주문으로 전환할 수 없습니다.</p>' : '') +
        (st === 'ordered' ? '<p class="fine">' + ic('info') + '이 견적은 이미 주문으로 전환되었습니다. 같은 견적으로 다시 주문할 수 없습니다.</p>' : '') +
        (diff && st === 'valid' ? '<p class="fine">' + ic('info') + '현재 가격과 다른 품목이 ' + diff + '개 있습니다. 이 견적으로 주문하면 <b>발행 시점 금액</b>이 그대로 적용됩니다.</p>' : '') +
        '</div><div class="card qs2"><b>견적 품목</b>' + q.lines.map(function (l) { return '<div class="ql"><span>' + esc(l.model) + ' <small>' + esc(l.opt) + '</small></span><span class="mono">× ' + l.qty + '</span></div>'; }).join('') +
        '<button class="btn sm ghost" data-act="q2cart" data-q="' + q.no + '">' + ic('cart') + '이 품목 다시 담기</button></div></aside></div></div>';
    },
    mount: function (root, args) {
      var q = ST.quote(args[0]), me = ST.me(); if (!q || !me || q.uid !== me.id && me.role !== 'admin') return;
      var st = SV.quoteState(q), context = APP.context(), box = root.querySelector('#qvImgs');
      quoteImgs(q, st === 'expired' ? '유효기간 만료' : '').then(function (imgs) {
        if (!APP.sameContext(context) || !box || !box.isConnected || !imgs.length) return;
        box.innerHTML = imgs.map(function (src, i) { return '<img src="' + src + '" alt="견적서 ' + (i + 1) + '쪽" width="1191" height="1684">'; }).join('');
        document.getElementById('qvPages').textContent = 'A4 · ' + imgs.length + '쪽';
      });
    }
  };
  A.qpdf = function (el) {
    var q = ST.quote(el.getAttribute('data-q')), me = ST.me();
    if (!q || !me || q.uid !== me.id && me.role !== 'admin') return;
    var c = APP.pdfCache[q.no];
    if (c && c.blob) { U.download('견적서_' + q.no + '.pdf', c.blob); q.downloads = (q.downloads || 0) + 1; ST.save(); APP.toast('PDF를 내려받았습니다 · 견적서_' + q.no + '.pdf'); return; }
    PDF.download(q, { mark: SV.quoteState(q) === 'expired' ? '유효기간 만료' : '' }).then(function () { APP.toast('PDF를 내려받았습니다 · 견적서_' + q.no + '.pdf'); });
  };
  A.reissue = function (el) {
    var q = ST.quote(el.getAttribute('data-q')), me = needMember(); if (!me || !q || q.uid !== me.id) return;
    var items = q.lines.map(function (l) { return { cid: l.cid, qty: l.qty }; });
    if (items.some(function (it) { return !PR.line(me, it.cid, it.qty); })) { APP.toast('판매 상태나 수량 조건이 바뀐 품목이 있습니다. 「이 품목 다시 담기」로 장바구니에서 확인해 주세요.', 'warn'); return; }
    issue(me, items, { from: 'reissue:' + q.no }, el);
  };
  A.q2cart = function (el) {
    var q = ST.quote(el.getAttribute('data-q')), me = needMember(); if (!me || !q || q.uid !== me.id) return;
    var next = ST.cart().map(function (it) { return Object.assign({}, it); });
    q.lines.forEach(function (l) { var r = ST.comboById(l.cid), ex = next.filter(function (x) { return x.cid === l.cid; })[0], u = r && r.c ? PR.price(r.p, r.c, me).unit : l.unit; if (ex) { ex.qty += l.qty; ex.seen = u; } else next.push({ cid: l.cid, qty: l.qty, seen: u, at: U.now() }); });
    if (next.some(function (it) { return it.qty > 9999; })) { APP.toast('합산 수량이 최대 주문 수량을 초과합니다. 장바구니 수량을 조정한 뒤 다시 담아 주세요.', 'warn'); return; }
    ST.s.carts[me.id] = next;
    ST.save(); APP.toast('견적 품목을 장바구니에 담았습니다.'); APP.go('/cart');
  };

  /* ---------- 주문서 ---------- */
  var CO = null;
  APP.clearAccountForms = function () { CO = null; SU = null; SEL = {}; FIL = { brand: '', edu: false, stock: false, sort: 'rec' }; FILTER_SCOPE = ''; };
  S.checkout = {
    auth: true,
    render: function (args) {
      var me = ST.me(), src = args[0] || 'cart';
      if (me.role === 'admin' || me.status !== 'approved') return '<div class="wrap pg">' + empty('lock', '회원 계정으로 이용해 주세요', '') + '</div>';
      var lines, q = null;
      if (src !== 'cart') {
        q = ST.quote(src); if (!q || q.uid !== me.id) return '<div class="wrap pg">' + empty('doc', '견적서를 찾을 수 없습니다', '') + '</div>';
        var st = SV.quoteState(q);
        if (st !== 'valid') return '<div class="wrap pg" data-title="주문서">' + crumbs([['주문서']]) + empty('alert', st === 'ordered' ? '이미 주문으로 전환된 견적서입니다' : '유효기간이 지난 견적서입니다', st === 'ordered' ? '견적서는 한 번만 주문으로 전환됩니다. 주문 ' + q.orderNo + '을 확인해 주세요.' : '현재 가격으로 다시 발행한 뒤 주문해 주세요.', st === 'ordered' ? '<a class="btn pri" href="#/o/' + q.orderNo + '">주문 보기</a>' : '<a class="btn pri" href="#/q/' + q.no + '">견적서로 돌아가기</a>') + '</div>';
        lines = q.lines;
      } else {
        if (ST.cart().some(function (it) { return !PR.line(me, it.cid, it.qty); })) return '<div class="wrap pg">' + empty('alert', '장바구니에 주문 불가 품목이 있습니다', '판매 상태와 수량을 확인한 뒤 다시 진행해 주세요.', '<a class="btn pri" href="#/cart">장바구니 확인</a>') + '</div>';
        lines = ST.cart().map(function (it) { return PR.line(me, it.cid, it.qty); });
        if (!lines.length) return '<div class="wrap pg">' + empty('cart', '주문할 품목이 없습니다', '', '<a class="btn pri" href="#/cart">장바구니</a>') + '</div>';
      }
      if (!CO || CO.src !== src || CO.uid !== me.id) CO = { uid: me.id, src: src, reqId: U.uid('req'), pay: 'card', evidence: 'card', name: me.name, phone: me.phone, addr: me.company + ' ' + (me.dept || '') + ' 자재 수령처', zip: '15588', memo: '' };
      var t = q ? q.tot : PR.totals(lines), set = ST.s.settings;
      var evOpts = CO.pay === 'card' ? [['card', '카드 매출전표', '카드 결제 건의 증빙']].concat(set.cardTaxInvoice ? [['tax', '전자세금계산서', '설정에 따라 카드 결제도 발행']] : []) : [['tax', '전자세금계산서', '입금 확인 후 주문 건 기준 발행'], ['none', '증빙 없음', '개인 구매 등']];
      if (!evOpts.some(function (o) { return o[0] === CO.evidence; })) CO.evidence = evOpts[0][0];
      return '<div class="wrap pg" data-title="주문서">' + crumbs([q ? ['내 견적함', '#/my/quotes'] : ['장바구니', '#/cart'], ['주문서']]) + '<div class="ph"><h1>주문서</h1>' +
        (q ? '<p><span class="tg info">' + ic('doc') + '견적 ' + q.no + ' 금액 그대로 주문</span> 견적 발행 시점의 품목·수량·금액이 바뀌지 않습니다.</p>' : '<p>현재 회원 적용가로 주문합니다.</p>') + '</div>' +
        '<div class="co"><div class="co-l"><section class="card co-s"><h3>' + ic('truck') + '배송 정보</h3><div class="fm-g">' +
        cof('name', '받는 분', CO.name) + cof('phone', '연락처', CO.phone) + cof('zip', '우편번호', CO.zip) + cof('addr', '주소', CO.addr, 'full') + cof('memo', '주문 메모 (선택)', CO.memo, 'full', '예: 교정성적서 필요, 납품 시간') + '</div></section>' +
        '<section class="card co-s"><h3>' + ic('card') + '결제 수단</h3><div class="paysel">' +
        [['card', 'card', '카드 결제 (PG)', '카드 선택 후 안전결제'], ['bank', 'bank', '무통장 입금', set.depositDays + '일 이내 입금 · 입금 확인 후 처리']].map(function (x) { return '<button class="pay ' + (CO.pay === x[0] ? 'on' : '') + '" data-act="co-pay" data-v="' + x[0] + '">' + ic(x[1]) + '<b>' + x[2] + '</b><small>' + x[3] + '</small></button>'; }).join('') + '</div>' +
        (CO.pay === 'bank' ? '<div class="note">' + ic('bank') + '<p><b>입금 계좌</b> ' + esc(set.bank) + '<br>입금 기한: 주문일 포함 ' + set.depositDays + '일 (' + U.ymd(U.endOfDay(U.now() + (set.depositDays - 1) * DAY)) + ' 23:59)</p></div>' : '') + '</section>' +
        '<section class="card co-s"><h3>' + ic('receipt') + '증빙</h3><div class="paysel ev">' + evOpts.map(function (x) { return '<button class="pay ' + (CO.evidence === x[0] ? 'on' : '') + '" data-act="co-ev" data-v="' + x[0] + '"><b>' + x[1] + '</b><small>' + x[2] + '</small></button>'; }).join('') + '</div>' +
        (CO.evidence === 'tax' ? '<p class="fine">' + ic('info') + '공급받는 자: ' + esc(me.company) + (me.bizNo ? ' (' + me.bizNo + ')' : '') + ' · 수신 ' + esc(me.email) + '</p>' : '') + '</section></div>' +
        '<aside class="co-r"><div class="card sumbox"><h3>주문 상품 ' + lines.length + '개</h3><div class="co-items">' + lines.map(function (l) { return '<div class="ql"><span>' + esc(l.model) + ' <small>' + esc(l.opt) + ' × ' + l.qty + '</small></span><span class="mono">' + U.won(l.amount) + '</span></div>'; }).join('') + '</div>' +
        '<dl><div><dt>공급가액</dt><dd class="mono">' + U.won(t.supply) + '원</dd></div><div><dt>배송비</dt><dd class="mono">' + (t.ship ? U.won(t.ship) + '원' : '무료') + '</dd></div><div><dt>부가세</dt><dd class="mono">' + U.won(t.vat) + '원</dd></div><div class="tot"><dt>결제 금액</dt><dd class="mono">' + U.won(t.total) + '<small>원</small></dd></div></dl>' +
        '<button class="btn pri xl" data-act="co-submit">' + (CO.pay === 'card' ? ic('card') + U.won(t.total) + '원 결제하기' : ic('bank') + '무통장 입금으로 주문') + '</button><p class="fine">' + ic('shield') + '같은 주문 요청이 두 번 들어와도 주문은 하나만 만들어집니다.</p></div></aside></div></div>';
    },
    mount: function (root) { root.querySelectorAll('[data-co]').forEach(function (inp) { inp.addEventListener('input', function () { CO[inp.getAttribute('data-co')] = inp.value; }); }); }
  };
  function cof(k, label, v, cls, ph) { return '<div class="fld ' + (cls || '') + '"><label for="co_' + k + '">' + label + '</label><input id="co_' + k + '" class="inp" data-co="' + k + '" value="' + esc(v) + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + '></div>'; }
  A['co-pay'] = function (el) { CO.pay = el.getAttribute('data-v'); CO.evidence = CO.pay === 'card' ? 'card' : 'tax'; APP.refresh(); };
  A['co-ev'] = function (el) { CO.evidence = el.getAttribute('data-v'); APP.refresh(); };
  A['co-submit'] = function (el) {
    var me = needMember(); if (!me || !CO || CO.uid !== me.id) return;
    if (!CO.name.trim() || !CO.phone.trim() || !CO.addr.trim()) { APP.toast('배송 정보를 입력해 주세요.', 'warn'); return; }
    el.disabled = true;
    var src = CO.src === 'cart' ? { type: 'cart', items: ST.cart().map(function (it) { return { cid: it.cid, qty: it.qty }; }) } : { type: 'quote', no: CO.src };
    var r = SV.createOrder(me, src, { reqId: CO.reqId, pay: CO.pay, evidence: CO.evidence, memo: CO.memo, ship: { name: CO.name, phone: CO.phone, addr: CO.addr, zip: CO.zip } });
    if (!r.ok) { el.disabled = false; APP.toast(r.msg, 'err'); return; }
    if (CO.src === 'cart' && !r.dup) { ST.s.carts[me.id] = []; ST.save(); }
    CO = null;
    APP.go('/o/' + r.order.no);
    if (r.order.pay === 'card') setTimeout(function () { if (ST.s.user === r.order.uid && APP.route.path === '/o/' + r.order.no) APP.pg(r.order); }, 120);
    else APP.toast('주문을 접수했습니다. 입금 기한 안에 입금해 주세요.');
  };

  /* ---------- PG 결제창 (가상) ---------- */
  APP.pg = function (o) {
    if (!o || !ST.me() || o.uid !== ST.s.user || o.pay !== 'card' || o.status !== 'pending') { APP.toast('결제할 수 없는 주문입니다.', 'warn'); return; }
    var closed = false, context = APP.context(), uid = ST.s.user;
    function active() { return !closed && APP.sameContext(context) && o.uid === uid && m.active(); }
    var stepsHtml = ['카드 인증', '승인 요청', '결제 금액 확인', '결제 완료'].map(function (s, i) { return '<li data-s="' + i + '"><i></i><span>' + s + '</span><small></small></li>'; }).join('');
    var m = APP.modal({ title: '안전결제', size: 'pgm', onClose: function (reason) { closed = true; if (!reason) APP.refresh(); },
      titleHtml: ic('lock') + '안전결제 <span class="tg ol">테스트 모드</span>',
      body: '<div class="pg-amt"><span>' + esc(ST.s.settings.company) + ' · ' + o.no + '</span><b class="mono">' + U.won(o.tot.total) + '원</b></div>' +
        '<div class="pg-f"><label>카드사<select class="inp" id="pgCard"><option>가상카드 A</option><option>가상카드 B</option><option>가상카드 C</option></select></label><label>할부<select class="inp"><option>일시불</option><option>2개월</option><option>3개월</option></select></label></div>' +
        '<details class="pg-test"><summary>결제 테스트 옵션</summary><label class="ck"><input type="checkbox" id="pgFail"><span>카드 승인 거절 재현</span></label></details><ol class="pg-steps">' + stepsHtml + '</ol><p class="pg-msg" role="status"></p>',
      foot: '<button class="btn ghost" data-x>닫기</button><button class="btn pri" id="pgGo">' + ic('lock') + '결제하기</button>' });
    var go = m.el.querySelector('#pgGo');
    go.addEventListener('click', function () {
      if (go.getAttribute('data-done')) { m.close(); return; }
      if (go.getAttribute('data-dup')) { dupTry(); return; }
      run();
    });
    function mark(i, cls, note) { var li = m.el.querySelector('[data-s="' + i + '"]'); li.className = cls; if (note != null) li.querySelector('small').textContent = note; }
    function run() {
      if (!active()) return;
      var attempt = { id: 'PAY-' + o.no.slice(-4) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase(), amount: o.tot.total, fail: m.el.querySelector('#pgFail').checked, at: U.now() };
      go.disabled = true; m.el.querySelector('.pg-msg').textContent = ''; m.el.querySelector('.pg-msg').className = 'pg-msg';
      [0, 1, 2, 3].forEach(function (i) { mark(i, '', ''); });
      mark(0, 'run'); U.wait(450).then(function () { if (!active()) return; mark(0, 'ok', '인증 완료'); mark(1, 'run', attempt.id); return U.wait(600); }).then(function () {
        if (!active()) return;
        if (attempt.fail) { var r0 = SV.pgConfirm(o, attempt); mark(1, 'bad', '거절 · ' + attempt.id); fin(false, r0.msg + ' (결제 시도 ' + attempt.id + ')'); return; }
        mark(1, 'ok', '승인 · ' + attempt.id); mark(2, 'run', '주문 ' + U.won(o.tot.total) + ' = 승인 ' + U.won(attempt.amount)); return U.wait(500).then(function () {
          if (!active()) return;
          var r = SV.pgConfirm(o, attempt);
          if (!r.ok) { mark(2, 'bad', r.msg); fin(false, r.msg); return; }
          mark(2, 'ok', '금액 일치'); mark(3, 'run'); return U.wait(300).then(function () { if (active()) { mark(3, 'ok', o.no + ' 결제 완료'); fin(true); } });
        });
      });
    }
    function fin(ok, msg) {
      var p = m.el.querySelector('.pg-msg');
      if (ok) {
        p.className = 'pg-msg ok'; p.innerHTML = ic('check') + '결제가 완료되었습니다. 주문 상세에서 처리 현황을 확인하세요.';
        go.disabled = false; go.innerHTML = ic('check') + '주문 상세 보기'; go.setAttribute('data-done', '1');
        var d = document.createElement('button'); d.className = 'btn sm ghost'; d.innerHTML = ic('copy') + '중복 요청 차단 확인'; d.addEventListener('click', dupTry); m.el.querySelector('.pg-test').appendChild(d);
        APP.toast('결제가 완료되었습니다.');
      } else { p.className = 'pg-msg bad'; p.innerHTML = ic('alert') + esc(msg); go.disabled = false; go.innerHTML = ic('refresh') + '다시 결제하기'; }
    }
    function dupTry() {
      if (!active()) return;
      var r = SV.pgConfirm(o, { id: o.payRef, amount: o.tot.total, at: U.now() });
      var p = m.el.querySelector('.pg-msg'); p.className = 'pg-msg warn'; p.innerHTML = ic('shield') + esc(r.msg) + ' (결제 ID ' + o.payRef + ')';
    }
  };
  A['pg-open'] = function (el) { var o = ST.order(el.getAttribute('data-o')); if (o) APP.pg(o); };

  /* ---------- 주문 상세 ---------- */
  var FLOW = ['paid', 'prep', 'ship', 'done'];
  APP.orderBody = function (o, adminView) {
    var stIdx = FLOW.indexOf(o.status), cancel = o.status === 'cancel';
    var steps = (o.pay === 'bank' ? [['await', '입금 대기']] : [['pending', '결제 대기']]).concat([['paid', '결제 완료'], ['prep', '상품 준비'], ['ship', '배송 중'], ['done', '배송 완료']]);
    var cur = cancel ? -1 : o.status === 'await' || o.status === 'pending' ? 0 : stIdx + 1;
    var tl = '<ol class="ostep ' + (cancel ? 'cx' : '') + '">' + steps.map(function (s, i) { return '<li class="' + (i < cur ? 'done' : i === cur ? 'now' : '') + '"><i>' + (i < cur ? ic('check') : i + 1) + '</i><span>' + s[1] + '</span></li>'; }).join('') + '</ol>';
    var payInfo = o.pay === 'card' ? '<dl class="kv"><div><dt>결제 수단</dt><dd>카드 (PG)</dd></div><div><dt>결제 상태</dt><dd>' + (o.paidAt ? '승인 완료 · ' + U.dt(o.paidAt) : '미결제') + '</dd></div>' +
      (o.attempts.length ? '<div><dt>결제 시도</dt><dd class="atts">' + o.attempts.map(function (a) { return '<span class="att ' + a.result + '"><span class="mono">' + a.id + '</span>' + ({ ok: '승인', fail: '거절', mismatch: '금액 불일치', dup: '중복 차단' }[a.result] || '') + '</span>'; }).join('') + '</dd></div>' : '') + '</dl>' :
      '<dl class="kv"><div><dt>결제 수단</dt><dd>무통장 입금</dd></div><div><dt>입금 계좌</dt><dd>' + esc(o.bank) + '</dd></div><div><dt>입금 기한</dt><dd>' + U.dt(o.depositDue) + (o.status === 'await' ? ' <span class="tg warn">' + Math.max(0, Math.ceil((o.depositDue - U.now()) / 36e5)) + '시간 남음</span>' : '') + '</dd></div><div><dt>입금 확인</dt><dd>' + (o.paidAt ? U.dt(o.paidAt) : '확인 전') + '</dd></div></dl>';
    var ev = cancel ? '주문 취소됨' : o.evidence === 'card' ? (o.paidAt ? '카드 매출전표 (PG 발행)' : '결제 완료 후 매출전표 확인 가능') : o.evidence === 'none' ? '증빙 없음' :
      o.tax && o.tax.state === 'issued' ? '<span class="tg ok">발행 완료</span> 승인번호 <span class="mono">' + o.tax.nts + '</span>' : o.tax && o.tax.state === 'unknown' ? '<span class="tg warn">결과 확인 필요</span> 관리번호 <span class="mono">' + o.tax.key + '</span>' : '<span class="tg">발행 대기</span> ' + (o.paidAt ? '결제 확인됨 · 발행 예정' : '입금 확인 후 발행');
    return tl + '<div class="od-g"><section class="card"><h3>' + ic('card') + '결제</h3>' + payInfo + '</section>' +
      '<section class="card"><h3>' + ic('receipt') + '증빙</h3><dl class="kv"><div><dt>요청</dt><dd>' + ({ tax: '전자세금계산서', card: '카드 매출전표', none: '없음' }[o.evidence]) + '</dd></div><div><dt>상태</dt><dd>' + ev + '</dd></div>' + (o.evidence === 'tax' ? '<div><dt>관리번호</dt><dd class="mono">' + SV.mgmtKey(o) + '</dd></div>' : '') + '</dl></section>' +
      '<section class="card"><h3>' + ic('truck') + '배송</h3><dl class="kv"><div><dt>받는 분</dt><dd>' + esc(o.ship.name) + ' · ' + esc(o.ship.phone) + '</dd></div><div><dt>주소</dt><dd>(' + esc(o.ship.zip) + ') ' + esc(o.ship.addr) + '</dd></div><div><dt>송장</dt><dd class="mono">' + (o.invoiceNo || '-') + '</dd></div>' + (o.memo ? '<div><dt>메모</dt><dd>' + esc(o.memo) + '</dd></div>' : '') + '</dl></section></div>' +
      '<section class="card"><h3>' + ic('box') + '주문 품목' + (o.quoteNo ? ' <a class="tg info" href="' + (adminView ? '#/admin/quotes/' : '#/q/') + o.quoteNo + '">' + ic('doc') + '원 견적 ' + o.quoteNo + '</a>' : '') + '</h3><div class="tw"><table class="tbl"><thead><tr><th>품목</th><th>옵션</th>' + (adminView ? '<th>품목코드</th>' : '') + '<th class="r">수량</th><th class="r">단가</th><th class="r">금액</th></tr></thead><tbody>' +
      o.lines.map(function (l) { return '<tr><td><b>' + esc(l.brand + ' ' + l.model) + '</b><br><small>' + esc(l.name) + '</small></td><td>' + esc(l.opt) + '</td>' + (adminView ? '<td class="mono">' + (l.sku || '<span class="tg warn">미등록</span>') + '</td>' : '') + '<td class="r mono">' + l.qty + '</td><td class="r mono">' + U.won(l.unit) + '</td><td class="r mono b">' + U.won(l.amount) + '</td></tr>'; }).join('') +
      '</tbody><tfoot><tr><td colspan="' + (adminView ? 5 : 4) + '" class="r">공급가액 ' + U.won(o.tot.supply) + ' · 배송비 ' + U.won(o.tot.ship) + ' · 부가세 ' + U.won(o.tot.vat) + '</td><td class="r mono b">' + U.won(o.tot.total) + '원</td></tr></tfoot></table></div></section>' +
      '<section class="card"><h3>' + ic('clock') + '처리 이력</h3><ul class="hist">' + o.history.slice().reverse().map(function (h) { return '<li><span class="mono">' + U.dt(h.at) + '</span>' + APP.pill(SV.OSTATE, h.s) + '<span>' + esc(h.by) + (h.note ? ' · ' + esc(h.note) : '') + '</span></li>'; }).join('') + '</ul></section>';
  };
  S.order = {
    auth: true,
    render: function (args) {
      var o = ST.order(args[0]), me = ST.me();
      if (!o || (o.uid !== me.id && me.role !== 'admin')) return '<div class="wrap pg">' + empty('box', '주문을 찾을 수 없습니다', '') + '</div>';
      var canCancel = ['pending', 'await', 'paid', 'prep'].indexOf(o.status) >= 0 && !(o.tax && o.tax.state === 'issued');
      return '<div class="wrap pg" data-title="' + o.no + '">' + crumbs([['주문 내역', '#/my/orders'], [o.no]]) +
        '<div class="ph row"><div><h1 class="mono">' + o.no + '</h1><p>' + U.dt(o.at) + ' 주문 · ' + APP.pill(SV.OSTATE, o.status) + '</p></div><div class="ph-b">' +
        (o.status === 'pending' ? '<button class="btn pri" data-act="pg-open" data-o="' + o.no + '">' + ic('card') + '결제 계속하기</button>' : '') +
        (canCancel ? '<button class="btn ghost" data-act="ocancel" data-o="' + o.no + '">전액 취소 요청</button>' : '') + '</div></div>' +
        (o.status === 'await' ? '<div class="alert info">' + ic('bank') + '<div><b>' + U.won(o.tot.total) + '원을 입금해 주세요</b><p>' + esc(o.bank) + ' · 기한 ' + U.dt(o.depositDue) + '. 입금이 확인되면 결제 완료로 바뀌고 세금계산서가 발행됩니다.</p></div></div>' : '') +
        APP.orderBody(o, false) + '</div>';
    }
  };
  A.ocancel = function (el) {
    var o = ST.order(el.getAttribute('data-o')), me = ST.me();
    function allowed(actor, order) { return actor && order && (actor.role === 'admin' || actor.id === order.uid); }
    if (!allowed(me, o)) { APP.toast('취소할 수 있는 주문이 아닙니다.', 'warn'); return; }
    var uid = me.id, state = ST.s;
    APP.confirm('주문 전액 취소', '주문 ' + o.no + '을 전액 취소합니다.' + (o.paidAt ? ' 결제 금액 ' + U.won(o.tot.total) + '원이 전액 환불됩니다. (부분 취소는 고객센터로 문의)' : ''), '전액 취소', function () {
      var actor = ST.me(), order = ST.order(o.no);
      if (ST.s !== state || !actor || actor.id !== uid || !allowed(actor, order)) { APP.toast('계정이 변경되었습니다. 주문을 다시 확인해 주세요.', 'warn'); return; }
      var r = SV.cancel(order, actor.role === 'admin' ? '관리자' : '고객'); APP.toast(r.ok ? '주문을 취소했습니다.' + (r.refund ? ' 환불 ' + U.won(r.refund) + '원' : '') : r.msg, r.ok ? '' : 'err'); APP.refresh();
    }, true);
  };

  /* ---------- 마이페이지 ---------- */
  var QTAB = 'all';
  S.my = {
    auth: true,
    render: function (args) {
      var me = ST.me(), sub = args[0] || '';
      if (me.role === 'admin') return '<div class="wrap pg">' + empty('shield', '관리자 계정입니다', '견적·주문은 관리자 콘솔에서 관리합니다.', '<a class="btn pri" href="#/admin">관리자 콘솔</a>') + '</div>';
      var myQ = ST.s.quotes.filter(function (q) { return q.uid === me.id; }), myO = ST.s.orders.filter(function (o) { return o.uid === me.id; });
      var tabs = '<div class="mytabs"><a href="#/my" class="' + (!sub ? 'on' : '') + '">' + ic('user') + '회원 정보</a><a href="#/my/quotes" class="' + (sub === 'quotes' ? 'on' : '') + '">' + ic('doc') + '내 견적함 <i>' + myQ.length + '</i></a><a href="#/my/orders" class="' + (sub === 'orders' ? 'on' : '') + '">' + ic('box') + '주문 내역 <i>' + myO.length + '</i></a></div>';
      var body;
      if (sub === 'quotes') {
        var list = myQ.filter(function (q) { return QTAB === 'all' || SV.quoteState(q) === QTAB; });
        body = '<div class="seg">' + [['all', '전체'], ['valid', '유효'], ['expired', '만료'], ['ordered', '주문 전환']].map(function (t) { return '<button class="' + (QTAB === t[0] ? 'on' : '') + '" data-act="qtab" data-v="' + t[0] + '">' + t[1] + ' <i>' + myQ.filter(function (q) { return t[0] === 'all' || SV.quoteState(q) === t[0]; }).length + '</i></button>'; }).join('') + '</div>' +
          (list.length ? '<div class="qlist">' + list.map(function (q) {
            var st = SV.quoteState(q);
            return '<a class="qcard card ' + st + '" href="#/q/' + q.no + '"><div class="qc-l"><span class="qc-i">' + ic('doc') + '</span><div><b class="mono">' + q.no + '</b><small>' + U.dt(q.at) + ' 발행 · ' + q.lines.length + '개 품목 · ' + esc(q.lines[0].model) + (q.lines.length > 1 ? ' 외 ' + (q.lines.length - 1) + '건' : '') + '</small></div></div>' +
              '<div class="qc-m"><small>유효기한</small><span>' + U.ymd(q.validUntil) + ' <b class="dd">' + (st === 'valid' ? dday(q) : '') + '</b></span></div><div class="qc-t mono">' + U.won(q.tot.total) + '원</div>' + APP.pill(SV.QSTATE, st) + ic('right') + '</a>';
          }).join('') + '</div>' : empty('doc', '해당하는 견적서가 없습니다', '장바구니에서 1초 만에 견적서를 발행해 보세요.', '<a class="btn pri" href="#/cart">장바구니</a>'));
      } else if (sub === 'orders') {
        body = myO.length ? '<div class="qlist">' + myO.map(function (o) {
          return '<a class="qcard card" href="#/o/' + o.no + '"><div class="qc-l"><span class="qc-i">' + ic('box') + '</span><div><b class="mono">' + o.no + '</b><small>' + U.dt(o.at) + ' · ' + (o.pay === 'card' ? '카드' : '무통장') + (o.quoteNo ? ' · 견적 ' + o.quoteNo : '') + '</small></div></div><div class="qc-m"><small>증빙</small><span>' + ({ tax: o.tax && o.tax.state === 'issued' ? '세금계산서 발행' : '세금계산서 대기', card: '매출전표', none: '-' }[o.evidence]) + '</span></div><div class="qc-t mono">' + U.won(o.tot.total) + '원</div>' + APP.pill(SV.OSTATE, o.status) + ic('right') + '</a>';
        }).join('') + '</div>' : empty('box', '주문 내역이 없습니다', '', '<a class="btn pri" href="#/c/osc">상품 둘러보기</a>');
      } else {
        var r = PR.rateOf(me);
        body = '<div class="prof"><div class="card pf-c"><span class="pf-i">' + ic(me.type === 'univ' ? 'school' : me.type === 'grad' ? 'grad' : 'building') + '</span><div><b>' + esc(me.company) + '</b><p>' + esc(me.name) + (me.dept ? ' · ' + esc(me.dept) : '') + '</p></div>' + APP.memberChip(me) + '</div>' +
          '<div class="pf-g"><div class="card stat"><small>회원 유형</small><b>' + esc(me.kind) + '</b><span>' + esc(D.TYPE_NAME[me.type]) + ' 가격 적용</span></div><div class="card stat"><small>적용 할인</small><b class="mono">' + r + '%</b><span>유형 ' + (ST.s.policy.typeRate[me.type] || 0) + '% + 등급 ' + (ST.s.policy.gradeRate[me.grade] || 0) + '%</span></div>' +
          '<div class="card stat"><small>유효 견적</small><b class="mono">' + myQ.filter(function (q) { return SV.quoteState(q) === 'valid'; }).length + '</b><span>견적별 유효기한 확인</span></div><div class="card stat"><small>진행 중 주문</small><b class="mono">' + myO.filter(function (o) { return ['done', 'cancel'].indexOf(o.status) < 0; }).length + '</b><span>전체 ' + myO.length + '건</span></div></div>' +
          '<section class="card"><h3>' + ic('building') + '사업자 · 증빙 정보</h3><dl class="kv"><div><dt>사업자등록번호</dt><dd class="mono">' + esc(me.bizNo || '해당 없음 (재학 증빙)') + '</dd></div><div><dt>국세청 상태</dt><dd>' + (me.nts ? esc(me.nts.s + ' · ' + (me.nts.tax || '')) : '-') + '</dd></div><div><dt>세금계산서 수신</dt><dd>' + esc(me.email) + '</dd></div><div><dt>연락처</dt><dd>' + esc(me.phone) + '</dd></div>' + (me.proof ? '<div><dt>증빙</dt><dd>' + esc(me.proof) + '</dd></div>' : '') + '</dl></section></div>';
      }
      return '<div class="wrap pg" data-title="마이페이지">' + crumbs([['마이페이지']]) + '<div class="ph"><h1>' + (sub === 'quotes' ? '내 견적함' : sub === 'orders' ? '주문 내역' : '마이페이지') + '</h1></div>' + tabs + body + '</div>';
    }
  };
  A.qtab = function (el) { QTAB = el.getAttribute('data-v'); APP.refresh(); };
})();
