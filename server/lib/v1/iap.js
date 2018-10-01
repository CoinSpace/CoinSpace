'use strict';

var iap = require('in-app-purchase');
var PURCHASE_EXPIRED = 6778003;
var PURCHASE_NOT_FOUND = -1;
var UNKNOWN_PRODUCT_TYPE = -2;

var PAID_SUBSCRIPTION = 'paid subscription';
var NON_CONSUMABLE = 'non consumable';

iap.config({
  applePassword: process.env.IAP_APPLE_PASSWORD,
  googlePublicKeyStrLive: process.env.IAP_GOOGLE_PUBLIC_KEY,
  googleAccToken: process.env.IAP_GOOGLE_ACC_TOKEN,
  googleRefToken: process.env.IAP_GOOGLE_REF_TOKEN,
  googleClientID: process.env.IAP_GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.IAP_GOOGLE_CLIENT_SECRET
});

iap.setup();

function validate(product) {
  var transaction = product.transaction || {};
  var receipt;
  if (transaction.type === 'android-playstore') {
    receipt = {
      data: transaction.receipt,
      signature: transaction.signature
    };
  } else if (transaction.type === 'ios-appstore') {
    receipt = transaction.appStoreReceipt;
  }
  if (!receipt) return Promise.reject({error: 'bad_receipt'});
  var productId = product.id;
  if (!productId) return Promise.reject({error: 'bad_product_id'});
  var productType = product.type;
  if (!productType) return Promise.reject({error: 'bad_product_type'});

  return iap.validate(receipt).then(function(validatedData) {
    var purchaseData = iap.getPurchaseData(validatedData);
    var purchase = purchaseData.find(function(item) {
      return item.productId === productId;
    });
    if (!purchase) {
      return {ok: false, data: {code: PURCHASE_NOT_FOUND}};
    }

    if (productType === PAID_SUBSCRIPTION) {
      if (iap.isExpired(purchase)) {
        return {ok: false, data: {code: PURCHASE_EXPIRED}};
      }
    } else if (productType === NON_CONSUMABLE) {
      if (iap.isCanceled(purchase)) {
        return {ok: false, data: {code: PURCHASE_EXPIRED}};
      }
    } else {
      return {ok: false, data: {code: UNKNOWN_PRODUCT_TYPE}};
    }
    return {ok: true};
  });
}

module.exports = {
  validate: validate
};
