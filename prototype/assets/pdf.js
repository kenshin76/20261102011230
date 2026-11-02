/* 견적서 문서 렌더러: A4 캔버스 여러 장 → 이미지 기반 PDF 파일 (외부 라이브러리 없음) */
(function () {
  'use strict';
  var U = window.U, D = window.D;
  var PDF = window.PDF = {};
  var W = 595.28, H = 841.89, S = 2, M = 40;
  var FONT = '"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif';
  var MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  var C = { ink: '#182A32', sub: '#4C6067', line: '#DEE4E2', soft: '#F4F5F3', blue: '#34576B', teal: '#3D7B70', red: '#D8342C' };
  var COLS = [['No', 20, 'c'], ['품목 · 모델', 152, 'l'], ['옵션', 100, 'l'], ['수량', 30, 'r'], ['기준가', 58, 'r'], ['할인', 30, 'r'], ['단가', 58, 'r'], ['금액', 67, 'r']];

  PDF.fontsReady = function () {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var p = Promise.all([document.fonts.load('400 12px "Pretendard Variable"'), document.fonts.load('800 12px "Pretendard Variable"')]).catch(function () {});
    return Promise.race([p, U.wait(1200)]);
  };

  function f(ctx, size, weight, mono) { ctx.font = (weight || 400) + ' ' + size + 'px ' + (mono ? MONO : FONT); }
  function txt(ctx, s, x, y, align, color) { ctx.fillStyle = color || C.ink; ctx.textAlign = align === 'r' ? 'right' : align === 'c' ? 'center' : 'left'; ctx.fillText(s, x, y); }
  function wrap(ctx, s, maxW, maxLines) {
    var words = String(s).split(' '), lines = [], cur = '';
    words.forEach(function (w) {
      var t = cur ? cur + ' ' + w : w;
      if (ctx.measureText(t).width <= maxW) { cur = t; return; }
      if (cur) lines.push(cur);
      cur = '';
      for (var i = 0; i < w.length; i++) { if (ctx.measureText(cur + w[i]).width > maxW && cur) { lines.push(cur); cur = ''; } cur += w[i]; }
    });
    if (cur) lines.push(cur);
    if (maxLines && lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = lines[maxLines - 1].replace(/.$/, '…'); }
    return lines;
  }
  function rect(ctx, x, y, w, h, fill, stroke) { if (fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 0.7; ctx.strokeRect(x, y, w, h); } }
  function hline(ctx, x1, x2, y, color, lw) { ctx.strokeStyle = color || C.line; ctx.lineWidth = lw || 0.7; ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke(); }

  function stamp(ctx, cx, cy) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.12); ctx.globalAlpha = 0.86;
    ctx.strokeStyle = C.red; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, 0, 21, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.stroke();
    f(ctx, 6.6, 800); txt(ctx, '시그널랩', 0, -5, 'c', C.red); txt(ctx, '주식회사', 0, 3.5, 'c', C.red);
    f(ctx, 5.4, 700); txt(ctx, '대표이사인', 0, 11.5, 'c', C.red);
    ctx.restore();
  }
  function logo(ctx, x, y) {
    ctx.fillStyle = C.ink; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, 18, 18, 5); else ctx.rect(x, y, 18, 18); ctx.fill();
    ctx.strokeStyle = '#12C2A0'; ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath();
    ctx.moveTo(x + 3, y + 9.6); ctx.lineTo(x + 5.2, y + 9.6); ctx.lineTo(x + 6.6, y + 5.6); ctx.lineTo(x + 8.8, y + 13); ctx.lineTo(x + 10.8, y + 7.3); ctx.lineTo(x + 12, y + 9.6); ctx.lineTo(x + 15.2, y + 9.6); ctx.stroke();
    f(ctx, 11, 800); txt(ctx, 'SIGNALAB', x + 24, y + 13, 'l', C.ink);
  }

  function header(ctx, q, cont) {
    rect(ctx, 0, 0, W, 6, C.blue); rect(ctx, W * 0.62, 0, W * 0.38, 6, C.teal);
    logo(ctx, M, 22);
    f(ctx, 8, 700, true); txt(ctx, 'QUOTATION', W - M, 34, 'r', C.sub);
    if (cont) { f(ctx, 12, 800); txt(ctx, '견적서 ' + q.no + ' (계속)', M, 70); hline(ctx, M, W - M, 80, C.ink, 1); return 92; }
    f(ctx, 26, 800); ctx.letterSpacing = '12px'; txt(ctx, '견 적 서', W / 2 + 6, 92, 'c'); ctx.letterSpacing = '0px';
    return 108;
  }
  function footer(ctx, q, page, pages) {
    hline(ctx, M, W - M, H - 38, C.line);
    f(ctx, 7, 500); txt(ctx, q.supplier.company + ' · ' + q.supplier.tel + ' · ' + q.supplier.email, M, H - 26, 'l', C.sub);
    txt(ctx, '[프로토타입] 가상 데이터로 만든 시연용 견적서입니다', W / 2, H - 16, 'c', '#98A2B3');
    f(ctx, 7.5, 700, true); txt(ctx, q.no + '  ·  ' + page + ' / ' + pages, W - M, H - 26, 'r', C.sub);
  }
  function tableHead(ctx, y) {
    rect(ctx, M, y, W - 2 * M, 20, C.ink);
    var x = M; f(ctx, 7.6, 700);
    COLS.forEach(function (c) {
      var tx = c[2] === 'r' ? x + c[1] - 5 : c[2] === 'c' ? x + c[1] / 2 : x + 5;
      txt(ctx, c[0], tx, y + 13.2, c[2], '#fff'); x += c[1];
    });
    return y + 20;
  }
  var ROW = 31;
  function row(ctx, l, i, y) {
    if (i % 2) rect(ctx, M, y, W - 2 * M, ROW, '#FAFBFD');
    hline(ctx, M, W - M, y + ROW, C.line, 0.5);
    var x = M, cy = y + 13;
    f(ctx, 7.5, 600, true); txt(ctx, String(i + 1), x + COLS[0][1] / 2, cy + 3, 'c', C.sub); x += COLS[0][1];
    f(ctx, 8.2, 700); txt(ctx, wrap(ctx, l.name, COLS[1][1] - 10, 1)[0], x + 5, cy);
    f(ctx, 6.8, 500, true); txt(ctx, l.brand + ' ' + l.model + (l.sku ? '  ·  ' + l.sku : ''), x + 5, cy + 10.5, 'l', C.sub); x += COLS[1][1];
    f(ctx, 7.4, 500); var ol = wrap(ctx, l.opt, COLS[2][1] - 10, 2);
    ol.forEach(function (s, k) { txt(ctx, s, x + 5, cy + (ol.length > 1 ? k * 9.5 - 1 : 3), 'l', '#2F3A4F'); }); x += COLS[2][1];
    f(ctx, 8, 600, true); txt(ctx, U.won(l.qty), x + COLS[3][1] - 5, cy + 3, 'r'); x += COLS[3][1];
    f(ctx, 7.6, 500, true); txt(ctx, U.won(l.base), x + COLS[4][1] - 5, cy + 3, 'r', C.sub); x += COLS[4][1];
    var dc = l.rule === 'fixed' ? '정찰' : l.rule === 'nodisc' ? '제외' : l.rate ? l.rate + '%' : '-';
    f(ctx, 7.4, 700); txt(ctx, dc, x + COLS[5][1] - 5, cy + 3, 'r', l.rate ? C.teal : C.sub); x += COLS[5][1];
    f(ctx, 7.8, 600, true); txt(ctx, U.won(l.unit), x + COLS[6][1] - 5, cy + 3, 'r'); x += COLS[6][1];
    f(ctx, 8.2, 700, true); txt(ctx, U.won(l.amount), x + COLS[7][1] - 5, cy + 3, 'r');
  }
  function topBlock(ctx, q, y) {
    var set = q.supplier, b = q.buyer;
    f(ctx, 8, 500); var meta = [['견적번호', q.no], ['견적일자', U.ymd(q.at)], ['유효기한', U.ymd(q.validUntil) + ' 까지']];
    meta.forEach(function (m, k) { var x = M + k * 172; f(ctx, 7.4, 600); txt(ctx, m[0], x, y + 6, 'l', C.sub); f(ctx, 9.6, 800, k === 0); txt(ctx, m[1], x + 44, y + 6.5); });
    y += 18;
    var bw = 222, bh = 132;
    rect(ctx, M, y, bw, bh, C.soft);
    rect(ctx, M, y, 3, bh, C.blue);
    f(ctx, 7.2, 700); txt(ctx, '수 신', M + 14, y + 18, 'l', C.blue);
    f(ctx, 13, 800); var cl = wrap(ctx, b.company, bw - 60, 2); cl.forEach(function (s, k) { txt(ctx, s, M + 14, y + 38 + k * 15); });
    var by = y + 38 + (cl.length - 1) * 15, lw = ctx.measureText(cl[cl.length - 1]).width; f(ctx, 9, 600); txt(ctx, '귀하', M + 14 + lw + 6, by, 'l', C.sub);
    f(ctx, 7.8, 500);
    [['담당', (b.name || '') + (b.dept ? ' · ' + b.dept : '')], ['연락처', b.phone || '-'], ['이메일', b.email || '-'], ['회원 유형', b.kind + (b.bizNo ? ' · ' + b.bizNo : '')]].forEach(function (r, k) {
      txt(ctx, r[0], M + 14, by + 20 + k * 13, 'l', C.sub); txt(ctx, wrap(ctx, r[1], bw - 70, 1)[0], M + 62, by + 20 + k * 13, 'l', '#2F3A4F');
    });
    f(ctx, 8, 700); txt(ctx, '아래와 같이 견적합니다.', M + 14, y + bh - 10, 'l', C.ink);

    var sx = M + bw + 12, sw = W - M - sx, rh = bh / 6;
    rect(ctx, sx, y, 18, bh, C.ink);
    f(ctx, 8, 800); ['공', '급', '자'].forEach(function (ch, k) { txt(ctx, ch, sx + 9, y + bh / 2 - 12 + k * 13, 'c', '#fff'); });
    var rows = [['등록번호', set.bizNo], ['상호', set.company], ['대표자', set.ceo], ['주소', set.addr], ['업태 · 종목', set.biz], ['연락처', set.tel + ' · ' + set.email]];
    rows.forEach(function (r, k) {
      var ry = y + k * rh; rect(ctx, sx + 18, ry, 56, rh, '#EEF1F6', C.line); rect(ctx, sx + 74, ry, sw - 74, rh, '#fff', C.line);
      f(ctx, 7.2, 700); txt(ctx, r[0], sx + 46, ry + rh / 2 + 2.6, 'c', C.sub);
      f(ctx, k === 0 ? 8.4 : 7.6, k < 3 ? 700 : 500, k === 0); txt(ctx, wrap(ctx, r[1], sw - 86, 1)[0], sx + 80, ry + rh / 2 + 2.8, 'l');
    });
    stamp(ctx, W - M - 32, y + rh * 2.5);
    y += bh + 14;
    rect(ctx, M, y, W - 2 * M, 38, C.ink);
    rect(ctx, M, y, 6, 38, '#12C2A0');
    f(ctx, 7.6, 700); txt(ctx, '합계금액', M + 18, y + 16, 'l', '#9FB2D3'); f(ctx, 6.8, 500); txt(ctx, '부가세 포함', M + 18, y + 27, 'l', '#9FB2D3');
    f(ctx, 11.5, 800); txt(ctx, '일금 ' + U.korNum(q.tot.total) + '원정', M + 78, y + 23.5, 'l', '#fff');
    f(ctx, 15, 800, true); txt(ctx, '₩ ' + U.won(q.tot.total), W - M - 14, y + 24.5, 'r', '#fff');
    return y + 50;
  }
  function bottomBlock(ctx, q, y) {
    var tw = 200, tx = W - M - tw, t = q.tot;
    var items = [['공급가액', t.supply], ['배송비', t.ship], ['부가세 (10%)', t.vat]];
    items.forEach(function (r, k) {
      var ry = y + k * 18; hline(ctx, tx, W - M, ry + 18, C.line, 0.5);
      f(ctx, 8, 600); txt(ctx, r[0], tx + 6, ry + 12.5, 'l', C.sub); f(ctx, 8.6, 700, true); txt(ctx, U.won(r[1]), W - M - 6, ry + 12.5, 'r');
    });
    rect(ctx, tx, y + 56, tw, 24, '#EAF0FF'); f(ctx, 8.6, 800); txt(ctx, '합계', tx + 6, y + 71.5, 'l', C.blue);
    f(ctx, 11, 800, true); txt(ctx, U.won(t.total) + '원', W - M - 6, y + 72, 'r', C.blue);
    if (t.save) { f(ctx, 7.2, 600); txt(ctx, '회원 할인으로 ' + U.won(t.save) + '원 절감 (공급가 기준)', W - M - 6, y + 92, 'r', C.teal); }

    var nx = M, nw = W - 2 * M - tw - 18;
    f(ctx, 8, 800); txt(ctx, '특기 사항', nx, y + 11);
    var notes = [
      '견적 유효기한은 ' + U.ymd(q.validUntil) + '까지이며, 기한이 지나면 현재 가격으로 다시 발행합니다.',
      '결제: 카드(PG) 또는 무통장 입금 · 입금 기한은 주문일 포함 3일입니다.',
      '입금 계좌: ' + q.supplier.bank,
      '납기: 재고 보유 상품은 결제 확인 후 1~2영업일 내 출고합니다.',
      '이 견적서는 1회에 한해 주문으로 전환되며, 주문서에 견적번호가 기록됩니다.'
    ];
    if (q.lines.some(function (l) { return l.rule !== 'normal'; })) notes.push('「제외」는 회원 할인 제외 상품, 「정찰」은 교육용 정찰가 상품입니다.');
    if (q.memo) notes.push('메모: ' + q.memo);
    f(ctx, 7.3, 500); var ny = y + 26;
    notes.forEach(function (n, k) { var ls = wrap(ctx, (k + 1) + '. ' + n, nw, 3); ls.forEach(function (s) { txt(ctx, s, nx, ny, 'l', '#3A465C'); ny += 10.5; }); ny += 2; });
    return Math.max(ny, y + 100);
  }
  function watermark(ctx, label) {
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-0.42); ctx.globalAlpha = 0.13;
    f(ctx, 64, 900); txt(ctx, label, 0, 20, 'c', C.red); ctx.restore();
  }

  /* 페이지 나누기: 첫 장 상단 블록, 마지막 장 합계·특기사항 공간을 남겨 행 배치 */
  PDF.paginate = function (n) {
    var first = Math.floor((H - 342 - 50) / ROW), mid = Math.floor((H - 112 - 50) / ROW), lastFirst = Math.floor((H - 342 - 50 - 160) / ROW), lastMid = Math.floor((H - 112 - 50 - 160) / ROW);
    if (n <= lastFirst) return [[0, n]];
    var pages = [], i = 0, cap = first;
    while (n - i > 0) {
      var isFirst = pages.length === 0, lastCap = isFirst ? lastFirst : lastMid;
      if (n - i <= lastCap) { pages.push([i, n]); i = n; break; }
      cap = isFirst ? first : mid;
      var take = Math.min(cap, n - i); if (n - i - take === 0) take = n - i - 1; // 마지막 장에 최소 1행을 남겨 합계를 붙임
      pages.push([i, i + take]); i += take;
    }
    return pages;
  };
  PDF.render = function (q, opt) {
    opt = opt || {};
    var parts = PDF.paginate(q.lines.length);
    return parts.map(function (rg, pi) {
      var cv = document.createElement('canvas'); cv.width = Math.round(W * S); cv.height = Math.round(H * S);
      var ctx = cv.getContext('2d'); ctx.scale(S, S); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.textBaseline = 'alphabetic';
      var y = header(ctx, q, pi > 0);
      if (pi === 0) y = topBlock(ctx, q, y);
      y = tableHead(ctx, y);
      for (var i = rg[0]; i < rg[1]; i++) { row(ctx, q.lines[i], i, y); y += ROW; }
      if (pi === parts.length - 1) bottomBlock(ctx, q, y + 14);
      else { f(ctx, 7.4, 600); txt(ctx, '다음 장에 계속됩니다', W - M, y + 14, 'r', C.sub); }
      footer(ctx, q, pi + 1, parts.length);
      if (opt.mark) watermark(ctx, opt.mark);
      return cv;
    });
  };
  function bytesOf(cv) {
    var b64 = cv.toDataURL('image/jpeg', 0.9).split(',')[1], bin = atob(b64), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  PDF.build = function (canvases, title) {
    var chunks = [], len = 0, offs = [];
    function add(x) {
      if (typeof x === 'string') { var b = new Uint8Array(x.length); for (var i = 0; i < x.length; i++) b[i] = x.charCodeAt(i) & 255; x = b; }
      chunks.push(x); len += x.length;
    }
    function obj(id, body) { offs[id] = len; add(id + ' 0 obj\n'); body(); add('\nendobj\n'); }
    var n = canvases.length, kids = [];
    for (var k = 0; k < n; k++) kids.push((4 + 3 * k) + ' 0 R');
    add('%PDF-1.4\n%âãÏÓ\n');
    obj(1, function () { add('<< /Type /Catalog /Pages 2 0 R >>'); });
    obj(2, function () { add('<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + n + ' >>'); });
    obj(3, function () { add('<< /Title (' + title.replace(/[()\\]/g, '') + ') /Producer (SIGNALAB prototype) >>'); });
    canvases.forEach(function (cv, i) {
      var pid = 4 + 3 * i, bytes = bytesOf(cv), cs = 'q ' + W + ' 0 0 ' + H + ' 0 0 cm /Im' + i + ' Do Q';
      obj(pid, function () { add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Resources << /XObject << /Im' + i + ' ' + (pid + 2) + ' 0 R >> >> /Contents ' + (pid + 1) + ' 0 R >>'); });
      obj(pid + 1, function () { add('<< /Length ' + cs.length + ' >>\nstream\n' + cs + '\nendstream'); });
      obj(pid + 2, function () { add('<< /Type /XObject /Subtype /Image /Width ' + cv.width + ' /Height ' + cv.height + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + bytes.length + ' >>\nstream\n'); add(bytes); add('\nendstream'); });
    });
    var xref = len, total = 4 + 3 * n, body = 'xref\n0 ' + total + '\n0000000000 65535 f \n';
    for (var j = 1; j < total; j++) body += String(offs[j]).padStart(10, '0') + ' 00000 n \n';
    add(body + 'trailer\n<< /Size ' + total + ' /Root 1 0 R /Info 3 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
    return new Blob(chunks, { type: 'application/pdf' });
  };
  PDF.download = function (q, opt) {
    return PDF.fontsReady().then(function () {
      var cvs = PDF.render(q, opt), blob = PDF.build(cvs, q.no);
      U.download('견적서_' + q.no + '.pdf', blob);
      q.downloads = (q.downloads || 0) + 1; window.ST.save();
      return { pages: cvs.length, size: blob.size };
    });
  };
  void D;
})();
