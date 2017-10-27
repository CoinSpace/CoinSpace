'use strict';

var modalRemoveAds = require('widgets/modal-remove-ads');
var emitter = require('lib/emitter');

var ad_units = {
  ios : {banner: '196605347445795_200305920409071'},
  android : {banner: '196605347445795_200306843742312'}
}
var resizeHandler = null;
var storeIsReady = false;
var adFreeId = 'adfree';
var adFreePrice = '';

function init() {
  if (!window.store) return false;
  var store = window.store;

  store.ready(function() {
    storeIsReady = true;
  });

  store.register({
    id: adFreeId,
    type: store.NON_CONSUMABLE
  });

  store.when(adFreeId).approved(function(order) {
    emitter.emit('ad-free-owned');
    off();
    order.finish();
  });

  store.when(adFreeId).cancelled(function() {
    emitter.emit('ad-free-cancel-loading');
  });

  store.when(adFreeId).error(function(error) {
    emitter.emit('ad-free-cancel-loading');
    console.error(error);
  });

  var isOwned;
  var isWalletReady = false;

  store.when(adFreeId).loaded(function(product) {
    adFreePrice = product.price;
    isOwned = false;
    if (product.owned) {
      isOwned = true;
      return emitter.emit('ad-free-owned');
    }
    showBanner();
    if (isWalletReady) {
      emitter.emit('ad-fee-modal');
    }
  });

  emitter.once('wallet-ready', function() {
    isWalletReady = true;
    if (isOwned === false) {
      emitter.emit('ad-fee-modal');
    }
  });

  emitter.once('ad-fee-modal', function() {
    showAdFreeModal();
    document.addEventListener('resume', showAdFreeModal, false);
  });
}

function buyAdFree() {
  if (!storeIsReady) return false;
  window.store.order(adFreeId);
}

function showBanner() {
  if (!window.FacebookAds) return false;
  var FacebookAds = window.FacebookAds;
  var position = FacebookAds.AD_POSITION.BOTTOM_CENTER;

  var adid = (/(android)/i.test(navigator.userAgent)) ? ad_units.android : ad_units.ios;
  FacebookAds.createBanner({
    adId: adid.banner,
    position: position,
    autoShow: true
  }, function() {
    var timeout = false;
    resizeHandler = function() {
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        FacebookAds.showBanner(position);
      }, 300);
    }
    window.addEventListener('resize', resizeHandler);
    FacebookAds.showBanner(position);
  });
}

function showAdFreeModal() {
  var dismissDate = (new Date(parseInt(window.localStorage.getItem('_cs_ad_free_dismiss_date'), 10))).getTime();
  var dismissInterval = 30 * 24 * 3600 * 1000; // 30 days in ms
  if (isNaN(dismissDate) || (Date.now() - dismissDate) > dismissInterval) {
    modalRemoveAds({
      onDismiss: function() {
        window.localStorage.setItem('_cs_ad_free_dismiss_date', Date.now());
      },
      price: adFreePrice,
      buy: buyAdFree
    });
  }
}

function off() {
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    window.FacebookAds.removeBanner();
  }
  document.removeEventListener('resume', showAdFreeModal, false);
}

module.exports = {
  init: init,
  buyAdFree: buyAdFree
};
