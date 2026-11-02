/* 시연용 가상 데이터 — 브랜드·상품·회사·가격은 모두 가상입니다 */
(function () {
  'use strict';
  var D = window.D = {};

  D.CATS = [
    { id: 'osc', name: '오실로스코프', en: 'Oscilloscopes', desc: '디지털·혼합신호·고해상도 오실로스코프' },
    { id: 'dmm', name: '멀티미터', en: 'Multimeters', desc: '벤치형·핸드헬드 정밀 멀티미터' },
    { id: 'psu', name: '전원공급기', en: 'Power Supplies', desc: 'DC 전원·프로그래머블 전원·전자부하' },
    { id: 'gen', name: '신호발생기', en: 'Signal Generators', desc: '임의파형·함수·RF 신호발생기' },
    { id: 'ana', name: '분석기', en: 'Analyzers', desc: '스펙트럼·네트워크·전력 분석기' },
    { id: 'prb', name: '프로브·액세서리', en: 'Probes', desc: '패시브·차동·전류 프로브' },
    { id: 'pas', name: '수동소자', en: 'Passives', desc: '저항·MLCC·인덕터 키트' },
    { id: 'sem', name: '반도체·모듈', en: 'Semis & Modules', desc: '개발보드·전력소자·무선모듈' }
  ];
  D.BRANDS = { ORVEX: '#1554F6', LUMIQ: '#12A889', KAIRO: '#E0861B', 'PRAXIS-E': '#7A4DE0', SIGNALAB: '#0E1726' };

  /* 옵션 조합 가격표 생성: 조합마다 기준가·품목코드(이카운트)·판매 여부를 따로 보관 */
  function P(id, cat, brand, model, name, base, opts, x) {
    x = x || {};
    var keys = [[]];
    opts.forEach(function (o) {
      var next = [];
      keys.forEach(function (k) { o.v.forEach(function (v) { next.push(k.concat([v])); }); });
      keys = next;
    });
    var combos = keys.map(function (vals, i) {
      var price = base + vals.reduce(function (s, v) { return s + v[1]; }, 0);
      var key = vals.map(function (v) { return v[0]; }).join(' / ') || '기본';
      var no = (i + 1 < 10 ? '0' : '') + (i + 1);
      return {
        id: id + '-' + no, key: key, price: Math.round(price / 100) * 100,
        sku: (x.noSku || []).indexOf(i) >= 0 ? '' : (x.skuPrefix || model.replace(/[^A-Z0-9]/gi, '').toUpperCase()) + '-' + no,
        sale: (x.off || []).indexOf(i) < 0
      };
    });
    return {
      id: id, cat: cat, brand: brand, model: model, name: name,
      opts: opts.map(function (o) { return { n: o.n, v: o.v.map(function (v) { return v[0]; }) }; }),
      combos: combos, rule: x.rule || 'normal', fixed: x.fixed || 0,
      stock: x.stock || '재고 보유', unit: x.unit || 'EA', moq: x.moq || 1,
      tags: x.tags || [], specs: x.specs || [], desc: x.desc || '', hot: !!x.hot, edu: !!x.edu, visible: true
    };
  }

  D.PRODUCTS = [
    P('P01', 'osc', 'ORVEX', 'DSO-2104', '디지털 오실로스코프', 1180000,
      [{ n: '대역폭', v: [['70MHz', 0], ['100MHz', 260000], ['200MHz', 690000]] }, { n: '채널', v: [['2CH', 0], ['4CH', 420000]] }],
      { hot: true, edu: true, tags: ['교육용 추천', '베스트'], desc: '10.1형 터치 화면과 1GSa/s 샘플링을 갖춘 실험실 표준 모델입니다. 대역폭은 라이선스로 추후 업그레이드할 수 있습니다.',
        specs: [['샘플링', '1 GSa/s'], ['메모리', '24 Mpts'], ['화면', '10.1형 정전식 터치'], ['인터페이스', 'USB · LAN'], ['보증', '3년']], noSku: [5] }),
    P('P02', 'osc', 'LUMIQ', 'MSO-5204', '혼합신호 오실로스코프', 4850000,
      [{ n: '대역폭', v: [['200MHz', 0], ['350MHz', 1250000], ['500MHz', 2600000]] }, { n: '로직 분석', v: [['미포함', 0], ['16CH 로직', 980000]] }],
      { hot: true, tags: ['연구실 인기'], desc: '아날로그 4채널과 16채널 로직을 한 화면에서 분석합니다. 프로토콜 디코딩(I²C·SPI·UART)을 기본 제공합니다.',
        specs: [['샘플링', '5 GSa/s'], ['메모리', '250 Mpts'], ['채널', '4CH 아날로그'], ['디코딩', 'I²C · SPI · UART · CAN'], ['보증', '3년']] }),
    P('P03', 'osc', 'KAIRO', 'HDO-8', '고해상도 12bit 오실로스코프', 18900000,
      [{ n: '대역폭', v: [['1GHz', 0], ['2GHz', 6400000]] }, { n: '메모리', v: [['250Mpts', 0], ['500Mpts', 1700000]] }],
      { rule: 'nodisc', stock: '납기 3주', tags: ['할인 제외'], desc: '12bit 수직 해상도로 전원 무결성·리플을 정밀하게 측정합니다. 고가 장비 특별 공급가로 회원 할인이 적용되지 않습니다.',
        specs: [['수직 해상도', '12 bit'], ['샘플링', '10 GSa/s'], ['채널', '4CH'], ['인터페이스', 'USB · LAN · HDMI'], ['보증', '3년']] }),

    P('P04', 'dmm', 'ORVEX', 'DM-3065', '6½ 디지트 벤치 멀티미터', 1290000,
      [{ n: '인터페이스', v: [['USB', 0], ['USB + LAN', 120000], ['USB + LAN + GPIB', 360000]] }],
      { hot: true, desc: '0.0035% 기본 DC 정확도와 초당 10k 리딩을 지원하는 벤치형 멀티미터입니다.',
        specs: [['분해능', '6½ digit'], ['DCV 정확도', '0.0035%'], ['리딩 속도', '10k rdg/s'], ['보증', '3년']] }),
    P('P05', 'dmm', 'PRAXIS-E', 'HM-28', '핸드헬드 True RMS 멀티미터', 189000,
      [{ n: '구성', v: [['본체', 0], ['본체 + 온도 프로브', 24000], ['교육용 5대 세트', 731000]] }],
      { edu: true, tags: ['교육용 추천'], desc: 'CAT III 1000V 등급의 현장용 멀티미터입니다. 실습실 단위 구매를 위한 5대 세트를 함께 제공합니다.',
        specs: [['디스플레이', '6000 count'], ['안전 등급', 'CAT III 1000V'], ['측정', 'V · A · Ω · C · Hz · ℃'], ['보증', '2년']] }),
    P('P06', 'dmm', 'LUMIQ', 'DM-858', '5½ 듀얼 디스플레이 멀티미터', 640000,
      [{ n: '전원', v: [['AC 전원', 0], ['AC + 배터리팩', 95000]] }],
      { desc: '두 측정값을 동시에 표시하는 5½ 디지트 멀티미터입니다.', specs: [['분해능', '5½ digit'], ['디스플레이', '4.3형 컬러'], ['인터페이스', 'USB'], ['보증', '3년']] }),

    P('P07', 'psu', 'KAIRO', 'PS-3005', 'DC 전원공급기', 268000,
      [{ n: '출력', v: [['30V / 5A', 0], ['30V / 10A', 96000], ['60V / 5A', 128000]] }, { n: '채널', v: [['1CH', 0], ['3CH', 342000]] }],
      { hot: true, edu: true, tags: ['교육용 추천'], desc: '선형 레귤레이터 방식의 저잡음 DC 전원입니다. 3CH 모델은 직렬·병렬 트래킹을 지원합니다.',
        specs: [['리플', '< 1 mVrms'], ['분해능', '10 mV / 1 mA'], ['보호', 'OVP · OCP · OTP'], ['보증', '2년']], off: [5] }),
    P('P08', 'psu', 'ORVEX', 'PL-1600', '프로그래머블 DC 전원', 2450000,
      [{ n: '용량', v: [['800W', 0], ['1600W', 1180000]] }],
      { stock: '납기 2주', desc: 'SCPI 프로그래밍과 리스트 모드를 지원하는 자동화 테스트용 전원입니다.',
        specs: [['출력 전압', '0 ~ 80 V'], ['인터페이스', 'USB · LAN · RS-232'], ['프로그래밍', 'SCPI'], ['보증', '3년']] }),
    P('P09', 'psu', 'PRAXIS-E', 'EL-400', 'DC 전자부하', 1380000,
      [{ n: '용량', v: [['150W', 0], ['400W', 520000]] }],
      { desc: 'CC · CV · CR · CP 모드와 배터리 방전 테스트를 지원합니다.', specs: [['모드', 'CC · CV · CR · CP'], ['전압', '0 ~ 150 V'], ['보증', '2년']] }),

    P('P10', 'gen', 'LUMIQ', 'AG-4062', '임의파형 발생기', 690000,
      [{ n: '주파수', v: [['30MHz', 0], ['60MHz', 240000], ['120MHz', 610000]] }, { n: '채널', v: [['1CH', 0], ['2CH', 210000]] }],
      { hot: true, desc: '16bit 분해능과 8 Mpts 파형 메모리를 갖춘 2채널 임의파형 발생기입니다.',
        specs: [['분해능', '16 bit'], ['샘플링', '500 MSa/s'], ['파형 메모리', '8 Mpts'], ['보증', '3년']] }),
    P('P11', 'gen', 'ORVEX', 'SG-6G', 'RF 신호발생기', 9800000,
      [{ n: '주파수', v: [['3GHz', 0], ['6GHz', 4200000]] }, { n: '변조', v: [['아날로그 변조', 0], ['IQ 변조', 3100000]] }],
      { stock: '납기 4주', desc: '위상잡음 -120 dBc/Hz의 RF 신호발생기입니다. 통신 모듈 시험에 적합합니다.',
        specs: [['위상잡음', '-120 dBc/Hz @1GHz'], ['출력', '-130 ~ +20 dBm'], ['보증', '3년']], noSku: [3] }),
    P('P12', 'gen', 'KAIRO', 'FG-200', '교육용 함수발생기', 248000,
      [{ n: '구성', v: [['기본', 0]] }],
      { rule: 'fixed', fixed: 236000, edu: true, tags: ['교육용 정찰가'], desc: '실습실 표준 함수발생기입니다. 교육용 정찰가로 회원 유형과 관계없이 같은 가격에 공급합니다.',
        specs: [['주파수', '20 MHz'], ['파형', '사인 · 구형 · 삼각 · 펄스'], ['보증', '2년']] }),

    P('P13', 'ana', 'LUMIQ', 'SA-3032', '스펙트럼 분석기', 6900000,
      [{ n: '주파수', v: [['3.2GHz', 0], ['7.5GHz', 3800000]] }, { n: '트래킹 제너레이터', v: [['미포함', 0], ['포함', 1250000]] }],
      { desc: 'DANL -161 dBm 수준의 스펙트럼 분석기입니다. EMI 사전 측정 옵션을 지원합니다.',
        specs: [['DANL', '-161 dBm/Hz'], ['RBW', '1 Hz ~ 10 MHz'], ['화면', '10.1형 터치'], ['보증', '3년']] }),
    P('P14', 'ana', 'ORVEX', 'VNA-1406', '벡터 네트워크 분석기', 21500000,
      [{ n: '주파수', v: [['6GHz', 0], ['14GHz', 9600000]] }, { n: '포트', v: [['2포트', 0], ['4포트', 7400000]] }],
      { stock: '주문 제작', desc: '안테나·필터 특성 측정용 벡터 네트워크 분석기입니다. 교정 키트는 별도입니다.',
        specs: [['동적 범위', '130 dB'], ['측정 속도', '20 μs/pt'], ['보증', '3년']], noSku: [1, 3] }),
    P('P15', 'ana', 'PRAXIS-E', 'PA-310', '전력 분석기', 3240000,
      [{ n: '구성', v: [['단상', 0], ['3상', 2160000]] }],
      { desc: '고조파·효율 측정을 지원하는 전력 분석기입니다.', specs: [['정확도', '0.1%'], ['대역', 'DC · 0.1 Hz ~ 100 kHz'], ['보증', '3년']] }),

    P('P16', 'prb', 'ORVEX', 'PP-510', '패시브 프로브 500MHz', 89000,
      [{ n: '수량', v: [['1EA', 0], ['4EA 세트', 251000]] }],
      { edu: true, desc: '10:1 패시브 프로브입니다. 대부분의 오실로스코프 BNC 입력과 호환됩니다.', specs: [['대역폭', '500 MHz'], ['감쇠비', '10:1'], ['입력 용량', '9.5 pF']] }),
    P('P17', 'prb', 'LUMIQ', 'DP-1300', '고전압 차동 프로브', 1150000,
      [{ n: '대역폭', v: [['100MHz', 0], ['200MHz', 380000]] }],
      { desc: '±1300V 차동 측정이 가능한 고전압 차동 프로브입니다.', specs: [['차동 전압', '±1300 V'], ['CMRR', '80 dB @60Hz']] }),
    P('P18', 'prb', 'KAIRO', 'CP-30', 'AC/DC 전류 프로브', 1680000,
      [{ n: '정격', v: [['30A / 50MHz', 0], ['150A / 12MHz', 540000]] }],
      { desc: '홀 소자 방식의 AC/DC 전류 프로브입니다.', specs: [['정확도', '±1%'], ['인터페이스', 'BNC + 전원 어댑터']] }),

    P('P19', 'pas', 'SIGNALAB', 'RK-E96', '정밀 저항 키트 E96', 38000,
      [{ n: '허용오차', v: [['1%', 0], ['0.1%', 46000]] }, { n: '수량', v: [['1,000개', 0], ['5,000개', 112000]] }],
      { hot: true, edu: true, skuPrefix: 'RKE96', unit: '키트', desc: '0603 칩저항 E96 계열 96종을 칸막이 박스에 정리한 키트입니다.', specs: [['사이즈', '0603'], ['구성', 'E96 96종'], ['포장', '정리 박스 + 라벨']] }),
    P('P20', 'pas', 'SIGNALAB', 'CK-MLCC', 'MLCC 커패시터 키트', 52000,
      [{ n: '사이즈', v: [['0603', 0], ['0805', 6000], ['1206', 14000]] }],
      { unit: '키트', desc: '1pF ~ 10μF 72종 MLCC를 포함한 키트입니다.', specs: [['구성', '72종 × 50개'], ['유전체', 'C0G · X7R']] }),
    P('P21', 'pas', 'SIGNALAB', 'LB-CHIP', '칩 인덕터 샘플북', 74000,
      [{ n: '사이즈', v: [['0402', 0], ['0603', 8000]] }],
      { unit: '권', desc: 'RF 매칭용 칩 인덕터 샘플북입니다.', specs: [['구성', '1nH ~ 470nH 60종'], ['허용오차', '±2%']] }),

    P('P22', 'sem', 'SIGNALAB', 'SL-M4', 'MCU 개발보드 SL-M4', 46000,
      [{ n: '구성', v: [['보드 단품', 0], ['디버거 포함', 39000]] }],
      { hot: true, edu: true, tags: ['교육용 추천'], desc: 'Cortex-M4 기반 학습·시제품용 개발보드입니다.', specs: [['코어', 'Cortex-M4 168MHz'], ['메모리', '512KB Flash'], ['확장', '헤더 2열']] }),
    P('P23', 'sem', 'PRAXIS-E', 'MF-100K', '전력 MOSFET 100V 키트', 64000,
      [{ n: '수량', v: [['50EA', 0], ['200EA', 168000]] }],
      { unit: '키트', desc: '100V N채널 MOSFET 5종 구성 키트입니다.', specs: [['VDS', '100 V'], ['패키지', 'TO-220 · DPAK']] }),
    P('P24', 'sem', 'LUMIQ', 'BLE-52', 'BLE 무선 센서 모듈', 18500,
      [{ n: '구성', v: [['모듈', 0], ['모듈 + 평가보드', 42000]] }],
      { rule: 'nodisc', moq: 5, tags: ['할인 제외'], desc: 'BLE 5.3 무선 모듈입니다. 부품 원가 공급가로 회원 할인이 적용되지 않으며 5개 단위로 주문합니다.', specs: [['규격', 'BLE 5.3'], ['인증', 'KC · CE'], ['최소 수량', '5 EA']] })
  ];

  /* 회원(체험 계정 포함). status: approved | pending | rejected */
  var day = 864e5;
  D.MEMBERS = [
    { id: 'm-biz', role: 'member', type: 'general', kind: '법인 사업자', email: 'buyer@demo.signalab', pw: 'demo2026', company: '가람정밀 주식회사', bizNo: '214-87-06263', ceo: '정가람', name: '최도윤', dept: '생산기술팀', phone: '010-2041-7731', status: 'approved', grade: 'vip', ecount: 'C-10482', joined: -210, nts: { s: '계속사업자', tax: '일반과세자' } },
    { id: 'm-univ', role: 'member', type: 'univ', kind: '대학', email: 'lab@demo.signalab', pw: 'demo2026', company: '한결대학교 산학협력단', bizNo: '138-82-04103', ceo: '한결대학교 총장', name: '김서진', dept: '전자공학과 RF 연구실', phone: '010-5582-1140', status: 'approved', grade: 'basic', ecount: 'C-20117', joined: -150, nts: { s: '계속사업자', tax: '비영리법인' } },
    { id: 'm-grad', role: 'member', type: 'grad', kind: '대학원생', email: 'grad@demo.signalab', pw: 'demo2026', company: '한결대학교 대학원', bizNo: '', ceo: '', name: '이하늘', dept: '전자공학과 석사과정', phone: '010-3370-9921', status: 'approved', grade: 'basic', ecount: '', joined: -40, proof: '재학증명서_이하늘.pdf' },
    { id: 'm-pend', role: 'member', type: 'general', kind: '개인 사업자', email: 'new@demo.signalab', pw: 'demo2026', company: '누리솔루션', bizNo: '617-05-27869', ceo: '오누리', name: '오누리', dept: '대표', phone: '010-8812-4406', status: 'pending', grade: 'basic', ecount: '', joined: -0.2, nts: { s: '계속사업자', tax: '간이과세자' } },
    { id: 'm-adm', role: 'admin', type: 'general', kind: '운영 관리자', email: 'admin@demo.signalab', pw: 'admin2026', company: '시그널랩 운영팀', name: '운영 관리자', status: 'approved', grade: 'basic' },
    { id: 'm-onn', role: 'member', type: 'general', kind: '법인 사업자', email: 'onnuri@demo.signalab', pw: 'demo2026', company: '온누리전자 주식회사', bizNo: '305-81-46254', ceo: '박온유', name: '박지후', dept: '구매팀', phone: '010-6612-0084', status: 'approved', grade: 'basic', ecount: 'C-10511', joined: -320, nts: { s: '계속사업자', tax: '일반과세자' } },
    { id: 'm-doda', role: 'member', type: 'univ', kind: '대학', email: 'dodam@demo.signalab', pw: 'demo2026', company: '도담대학교 산학협력단', bizNo: '129-83-08081', ceo: '도담대학교 총장', name: '윤채원', dept: '메카트로닉스과', phone: '010-2290-4417', status: 'pending', grade: 'basic', ecount: '', joined: -1.1, nts: { s: '계속사업자', tax: '비영리법인' } },
    { id: 'm-gr2', role: 'member', type: 'grad', kind: '대학원생', email: 'grad2@demo.signalab', pw: 'demo2026', company: '새솔대학교 대학원', bizNo: '', name: '문태오', dept: '전기공학과 박사과정', phone: '010-7741-3308', status: 'pending', grade: 'basic', ecount: '', joined: -0.6, proof: '재학증명서_문태오.pdf' },
    { id: 'm-clos', role: 'member', type: 'general', kind: '법인 사업자', email: 'closed@demo.signalab', pw: 'demo2026', company: '한빛테크 주식회사', bizNo: '220-88-12054', ceo: '서한빛', name: '서한빛', dept: '대표', phone: '010-4402-1187', status: 'pending', grade: 'basic', ecount: '', joined: -2.3, nts: { s: '폐업자', tax: '폐업 2025-12-31' } }
  ];
  D.LOGIN_CARDS = [
    { id: 'm-biz', label: '법인 사업자 · 우수 등급', icon: 'building' },
    { id: 'm-univ', label: '대학 (산학협력단)', icon: 'school' },
    { id: 'm-grad', label: '대학원생 (재학 증빙)', icon: 'grad' },
    { id: 'm-pend', label: '가입 승인 대기', icon: 'hourglass' },
    { id: 'm-adm', label: '운영 관리자', icon: 'shield' }
  ];

  /* 국세청 진위·상태 확인을 흉내 내는 사전(시연용). 목록에 없고 형식이 맞으면 계속사업자로 응답 */
  D.NTS = {
    '1048622974': { s: '휴업자', tax: '휴업 2026-07-01' },
    '2208812054': { s: '폐업자', tax: '폐업 2025-12-31' },
    '3138123311': { s: '폐업자', tax: '폐업 2026-03-31' }
  };
  D.SIGNUP_SAMPLES = [
    { no: '211-87-31875', label: '계속사업자' },
    { no: '104-86-22974', label: '휴업자' },
    { no: '313-81-23311', label: '폐업자' }
  ];

  D.POLICY = {
    typeRate: { general: 0, univ: 5, grad: 5 },
    gradeRate: { basic: 0, vip: 2 },
    round: 10, freeShip: 300000, shipFee: 4000, hideForGuest: true
  };
  D.TYPE_NAME = { general: '일반', univ: '대학', grad: '대학원생' };
  D.GRADE_NAME = { basic: '기본', vip: '우수' };

  D.SETTINGS = {
    company: '시그널랩 주식회사', brand: 'SIGNALAB', bizNo: '120-86-11917', ceo: '박정민',
    addr: '경기도 가상시 계측로 128, 3층', biz: '도소매 / 전자계측기·전자부품', tel: '031-000-1234', email: 'sales@demo.signalab',
    validDays: 30, depositDays: 3, bank: '가상은행 100-2026-110201 (예금주 시그널랩 주식회사)',
    cardTaxInvoice: false, quoteFmt: 'Q-YYYYMMDD-NNNN', orderFmt: 'O-YYYYMMDD-NNNN',
    leadNote: '재고 보유 상품은 결제 확인 후 1~2영업일 내 출고합니다.'
  };

  D.FAQ = [
    { id: 'f1', q: '견적서는 어떻게 받나요?', a: '상품을 장바구니에 담은 뒤 「1초 견적서 발행」을 누르면 견적번호가 붙은 PDF가 즉시 만들어집니다. 발행한 견적서는 「내 견적함」에서 다시 내려받을 수 있습니다.', k: ['견적', '견적서', '발행', 'pdf'] },
    { id: 'f2', q: '견적서 유효기간은 얼마인가요?', a: '발행일로부터 30일입니다. 유효기간이 지난 견적서는 주문으로 전환할 수 없고, 현재 가격으로 다시 발행해 주시면 됩니다.', k: ['유효', '기간', '만료'] },
    { id: 'f3', q: '대학·대학원생 할인은 얼마인가요?', a: '승인된 대학·대학원생 회원은 대부분의 상품에 5% 할인가가 자동 적용됩니다. 고가 장비 특별가·교육용 정찰가 상품은 할인에서 제외됩니다.', k: ['대학', '할인', '대학원', '학생', '학교'] },
    { id: 'f4', q: '세금계산서는 언제 발행되나요?', a: '주문서에서 증빙을 「세금계산서」로 선택하시면 결제(입금) 확인 후 주문 건 기준으로 전자세금계산서가 발행됩니다. 카드 결제 건은 카드 매출전표가 증빙이 됩니다.', k: ['세금계산서', '계산서', '증빙', '매출전표'] },
    { id: 'f5', q: '무통장 입금은 어떻게 하나요?', a: '주문서에서 무통장 입금을 선택하면 입금 계좌와 입금 기한(주문일 포함 3일)이 안내됩니다. 입금이 확인되면 주문 상태가 「결제 완료」로 바뀝니다.', k: ['무통장', '입금', '계좌', '이체'] },
    { id: 'f6', q: '배송·납기는 얼마나 걸리나요?', a: '재고 보유 상품은 결제 확인 후 1~2영업일 내 출고합니다. 납기 표시 상품은 상품 상세의 납기를 확인해 주세요.', k: ['배송', '납기', '출고', '도착', '언제'] },
    { id: 'f7', q: '회원가입 승인은 얼마나 걸리나요?', a: '사업자등록번호 진위·상태 확인 후 담당자가 영업일 기준 1일 이내에 승인합니다. 승인 전에는 상품 가격이 「회원 전용 가격」으로 표시됩니다.', k: ['가입', '승인', '회원', '사업자'] },
    { id: 'f8', q: '교정성적서를 함께 받을 수 있나요?', a: '계측기는 출고 시 제조사 성적서를 동봉합니다. 공인 교정성적서가 필요하시면 주문 메모에 적어 주세요(별도 비용).', k: ['교정', '성적서', '인증'] },
    { id: 'f9', q: '주문을 취소하고 싶어요.', a: '출고 전 주문은 「주문 상세」에서 전액 취소를 요청할 수 있습니다. 부분 취소는 고객센터로 문의해 주세요.', k: ['취소', '환불', '반품'] }
  ];
  D.QUICK = ['f1', 'f3', 'f4', 'f5', 'f6'];
})();
