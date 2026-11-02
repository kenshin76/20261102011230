/* 제품군별 사진 참고 이미지. 가상 상품의 실제 제조사·모델 사진은 아닙니다. */
(function () {
  'use strict';
  var ART = window.ART = {};
  var PHOTOS = {
    osc: 'oscilloscope', dmm: 'multimeter', psu: 'power-supply',
    gen: 'signal-generator', ana: 'analyzer', prb: 'probes',
    pas: 'passives', sem: 'semiconductors'
  };
  var PRODUCT_PHOTOS = { P05: 'handheld-multimeter', P09: 'electronic-load', P17: 'differential-probe', P18: 'current-probe' };
  function photo(cat, label, cls, image) {
    var name = image || PHOTOS[cat] || PHOTOS.osc;
    return '<img class="art product-photo' + (cls ? ' ' + window.U.esc(cls) : '') +
      '" src="assets/images/' + name + '.jpg" alt="' + window.U.esc(label) +
      ' · 제품군 참고 이미지" width="960" height="640" loading="lazy" decoding="async">';
  }
  ART.product = function (p, cls) { return photo(p.cat, p.name, cls, PRODUCT_PHOTOS[p.id]); };
  ART.cat = function (id) {
    var cat = window.ST.cat(id);
    return photo(id, cat ? cat.name : '계측 장비', 'cat-art');
  };
})();
