'use strict';

var request = require('lib/request');
var urlRoot = window.urlRoot;
var coins = {};
var emitter = require('lib/emitter');
var applePay = require('lib/apple-pay');

var hasHandledMobileSuccess = false;
var apiKey = process.env.MOONPAY_API_KEY;
var customer;
var fiat;
var countries = {document: [], allowed: []};
var ipCountry;

emitter.on('handleOpenURL', function(url) {
  url = url || '';
  var matchAction = url.match(/action=([^&]+)/);
  if (!matchAction || matchAction[1] !== 'moonpay-3d-secure') return;

  var matchTxId = url.match(/transactionId=([^&]+)/);
  var txId = matchTxId ? matchTxId[1] : '';

  window.localStorage.setItem('_cs_moonpay_3d_secure', txId);
  hasHandledMobileSuccess = true;
});

function init() {
  return request({
    url: 'https://api.moonpay.io/v3/ip_address',
    params: {apiKey: apiKey},
    hideFlashError: true
  }).catch(function(error) {
    if (error.message === 'Network Error') return false;
    throw error;
  }).then(function(data) {
    if (data && data.isAllowed) {
      ipCountry = data.alpha3;
      return request({
        url: urlRoot + 'moonpay/coins',
        params: {country: data.alpha3}
      });
    }
  }).then(function(data) {
    if (!data) return;
    coins = data;
    emitter.emit('moonpay-init');
  }).catch(console.error);
}

function loadFiat() {
  if (fiat) return Promise.resolve();
  return request({url: urlRoot + 'moonpay/fiat'}).then(function(data) {
    fiat = data;
  }).catch(console.error);
}

function getFiatById(id, field) {
  if (field) {
    return fiat[id] ? fiat[id][field] : '';
  }
  return fiat[id];
}

function getFiatList() {
  if (!fiat) return [];
  return Object.keys(fiat).map(function(key) {
    var item = fiat[key];
    item.id = key;
    return item;
  }).sort(function(a, b) {
    return a.symbol > b.symbol ? 1 : -1;
  });
}

function getCryptoSymbolById(id) {
  return coins[id] ? coins[id].symbol : '';
}

function isSupported(symbol) {
  return !!Object.keys(coins).find(function(key) {
    return coins[key].symbol === symbol && coins[key].isSupported;
  });
}

function isLogged() {
  return !!getAccessToken();
}

function signIn(email, securityCode) {
  if (email === '' || email.indexOf('@') === -1 || email.indexOf('.') === -1) {
    return Promise.reject(new Error('invalid_email'));
  }
  if (securityCode === '') {
    return Promise.reject(new Error('invalid_security_code'));
  }
  return request({
    url: 'https://api.moonpay.io/v3/customers/email_login',
    method: 'post',
    params: {apiKey: apiKey},
    data: {email: email, securityCode: securityCode}
  }).then(fixPhonegapCookies).catch(function(err) {
    if (/Invalid body/.test(err.message)) {
      if (securityCode) throw new Error('invalid_security_code');
      throw new Error('invalid_email');
    }
    if (/disposable email/.test(err.message)) throw new Error('invalid_email_disposable');
    if (/Invalid security code/.test(err.message)) throw new Error('invalid_security_code');
    if (/Security code has expired/.test(err.message)) throw new Error('invalid_security_code');
    throw err;
  });
}

function limits() {
  return request({
    url: 'https://api.moonpay.io/v3/customers/me/limits',
    headers: getAuthorizationHeaders()
  });
}

function refreshToken() {
  return request({
    url: 'https://api.moonpay.io/v3/customers/refresh_token',
    params: {apiKey: apiKey},
    headers: getAuthorizationHeaders()
  }).then(fixPhonegapCookies);
}

function fixPhonegapCookies(data) {
  if (process.env.BUILD_TYPE !== 'phonegap') return Promise.resolve(data);
  return new Promise(function(resolve, reject) {
    cookieMaster.setCookieValue('https://api.moonpay.io', 'customerToken', '',
    function() { resolve(data); },
    function(err) { reject(err); });
  });
}

function getAccessToken() {
  return window.localStorage.getItem('_cs_moonpay_token');
}

function getAuthorizationHeaders() {
  return {
    'Authorization': 'Bearer ' + getAccessToken()
  }
}

function setAccessToken(token) {
  window.localStorage.setItem('_cs_moonpay_token', token);
}

function cleanAccessToken() {
  window.localStorage.removeItem('_cs_moonpay_token');
}

function getCustomer() {
  return customer;
}

function setCustomer(data) {
  customer = data;
}

function cleanCustomer() {
  customer = undefined;
}

function updateCustomer(data) {
  return request({
    url: 'https://api.moonpay.io/v3/customers/me',
    method: 'patch',
    data: data,
    headers: getAuthorizationHeaders(),
  });
}

function verifyPhoneNumber(code) {
  return request({
    url: 'https://api.moonpay.io/v3/customers/verify_phone_number',
    method: 'post',
    data: {
      verificationCode: code
    },
    headers: getAuthorizationHeaders(),
  });
}

function loadCountries(type) {
  return request({
    url: urlRoot + 'moonpay/countries',
    params: {type: type}
  }).then(function(data) {
    if (!data) return;
    countries[type] = data;
  });
}

function getCountries(type) {
  return countries[type];
}

function getIpCountry() {
  return ipCountry;
}

function getFiles() {
  return request({
    url: 'https://api.moonpay.io/v3/files',
    headers: getAuthorizationHeaders()
  });
}

function uploadFile(file, type, country, side) {
  var key;
  return request({
    url: 'https://api.moonpay.io/v3/files/s3_signed_request',
    params: {
      apiKey: apiKey,
      fileType: file.type
    }
  }).then(function(data) {
    key = data.key;
    return request({
      url: data.signedRequest,
      method: 'put',
      data: file,
      headers: {
        'Content-Type': file.type
      }
    });
  }).then(function() {
    return request({
      url: 'https://api.moonpay.io/v3/files',
      method: 'post',
      data: {
        key: key,
        type: type,
        country: country,
        side: side
      },
      headers: getAuthorizationHeaders()
    })
  });
}

function createCard(tokenId) {
  return request({
    url: 'https://api.moonpay.io/v3/cards',
    method: 'post',
    data: {
      tokenId: tokenId
    },
    headers: getAuthorizationHeaders()
  })
}

function getCards() {
  return request({
    url: 'https://api.moonpay.io/v3/cards',
    headers: getAuthorizationHeaders()
  }).then(function(cards) {
    cards.forEach(function(card) {
      card.label = card.brand.toUpperCase() + '...x' + card.lastDigits;
    });
    cards.sort(function(a, b) {
      return (new Date(b.createdAt)).getTime() - (new Date(a.createdAt).getTime());
    });
    if (applePay.isApplePaySupported()) {
      cards.unshift({type: 'applePay', label: 'Apple Pay'});
    }
    return cards;
  });
}

function deleteCard(id) {
  return request({
    url: 'https://api.moonpay.io/v3/cards/' + id,
    method: 'delete',
    headers: getAuthorizationHeaders()
  });
}

function createBankAccount(bankAccount) {
  var data = { currencyCode: bankAccount.currencyCode.toLowerCase() };
  if (data.currencyCode === 'eur') {
    data.iban = bankAccount.iban;
  } else if (data.currencyCode === 'gbp') {
    data.accountNumber = bankAccount.accountNumber;
    data.sortCode = bankAccount.sortCode;
  }
  return request({
    url: 'https://api.moonpay.io/v3/bank_accounts',
    method: 'post',
    data: data,
    headers: getAuthorizationHeaders()
  })
}

function getBankAccounts(fiat) {
  return request({
    url: 'https://api.moonpay.io/v3/bank_accounts',
    headers: getAuthorizationHeaders()
  }).then(function(bankAccounts) {
    bankAccounts.forEach(function(bankAccount) {
      var fiatSymbol = getFiatById(bankAccount.currencyId, 'symbol');
      if (fiatSymbol === 'EUR') {
        bankAccount.label = fiatSymbol + ' – ' + bankAccount.iban.substr(0, 8) + '...' + bankAccount.iban.substr(-4);
      } else if (fiatSymbol === 'GBP') {
        bankAccount.label = fiatSymbol + ' – ' + bankAccount.sortCode + '...' + bankAccount.accountNumber.substr(-4);
      }
      bankAccount.fiatSymbol = fiatSymbol;
      bankAccount.type = 'bankAccount';
    });
    if (fiat) {
      bankAccounts = bankAccounts.filter(function(bankAccount) {
        return bankAccount.fiatSymbol === fiat;
      });
    }
    bankAccounts.sort(function(a, b) {
      return (new Date(b.createdAt)).getTime() - (new Date(a.createdAt).getTime());
    });
    return bankAccounts;
  });
}

function deleteBankAccount(id) {
  return request({
    url: 'https://api.moonpay.io/v3/bank_accounts/' + id,
    method: 'delete',
    headers: getAuthorizationHeaders()
  });
}

function quote(currencyCode, baseCurrencyCode, baseCurrencyAmount, paymentMethod, areFeesIncluded) {
  var pm = 'credit_debit_card';
  if (paymentMethod && paymentMethod.type === 'bankAccount') {
    if (paymentMethod.fiatSymbol === 'EUR') {
      pm = 'sepa_bank_transfer';
    } else if (paymentMethod.fiatSymbol === 'GBP') {
      pm = 'gbp_bank_transfer';
    }
  }
  return request({
    url: 'https://api.moonpay.io/v3/currencies/' + currencyCode + '/quote',
    params: {
      apiKey: apiKey,
      baseCurrencyCode: baseCurrencyCode,
      baseCurrencyAmount: baseCurrencyAmount,
      paymentMethod: pm,
      areFeesIncluded: areFeesIncluded,
    }
  });
}

function rate(currencyCode, baseCurrencyCode) {
  return request({
    url: 'https://api.moonpay.io/v3/currencies/' + currencyCode + '/price',
    params: {
      apiKey: apiKey
    }
  }).then(function(data) {
    return data[baseCurrencyCode.toUpperCase()]
  });
}

function createTx(data) {
  if (data.paymentMethod.type === 'applePay') {
    return applePay.generateToken({
      countryCode: 'MT',
      currencyCode: data.baseCurrencyCode.toUpperCase(),
      total: {
        label: 'MoonPay',
        type: 'final',
        amount: data.baseCurrencyAmount
      },
      validateApplePayTransaction: validateApplePayTransaction,
      callback: function(token) {
        data.externalToken = {
          tokenProvider: 'apple_pay',
          token: token
        }
        delete data.paymentMethod;
        return _createTx(data);
      }
    });
  } if (data.paymentMethod.type === 'card') {
    data.cardId = data.paymentMethod.id;
    delete data.paymentMethod;
    return _createTx(data);
  } if (data.paymentMethod.type === 'bankAccount') {
    data.bankAccountId = data.paymentMethod.id;
    delete data.paymentMethod;
    return _createTx(data);
  }
}

function _createTx(data) {
  return request({
    url: 'https://api.moonpay.io/v3/transactions',
    method: 'post',
    data: {
      baseCurrencyAmount: parseFloat(data.baseCurrencyAmount),
      areFeesIncluded: data.areFeesIncluded,
      walletAddress: data.walletAddress,
      baseCurrencyCode: data.baseCurrencyCode,
      currencyCode: data.currencyCode,
      returnUrl: data.returnUrl,
      externalToken: data.externalToken,
      cardId: data.cardId,
      bankAccountId: data.bankAccountId
    },
    headers: getAuthorizationHeaders()
  });
}

function getTxs() {
  return request({
    url: 'https://api.moonpay.io/v3/transactions',
    headers: getAuthorizationHeaders()
  });
}

function getTxById(id) {
  return request({
    url: 'https://api.moonpay.io/v3/transactions/' + id,
    headers: getAuthorizationHeaders()
  });
}

function open3dSecure(url) {
  return new Promise(function(resolve) {
    var width = 500;
    var height = 600;
    var options = 'width=' + width + ', ';
    options += 'height=' + height + ', ';
    options += 'left=' + ((screen.width - width) / 2) + ', ';
    options += 'top=' + ((screen.height - height) / 2) + '';

    window.localStorage.removeItem('_cs_moonpay_3d_secure');
    var popup = window.open(url, process.env.BUILD_TYPE === 'electron' ? '_modal' : '_blank', options);
    var popupInterval = setInterval(function() {
      if ((popup && popup.closed) || hasHandledMobileSuccess) {
        clearInterval(popupInterval);
        hasHandledMobileSuccess = false;
        if (popup && !popup.closed && popup.close) {
          popup.close();
        }
        return resolve(window.localStorage.getItem('_cs_moonpay_3d_secure'));
      }
    }, 250);
  }).then(function(txId) {
    if (!txId) throw new Error('3d_failed');
    return getTxById(txId);
  }).then(function(tx) {
    if (tx.status !== 'completed' && tx.status !== 'pending') throw new Error('3d_failed');
  });
}

function validateApplePayTransaction(validationUrl) {
  return request({
    url: 'https://api.moonpay.io/v3/apple_pay/validate',
    method: 'post',
    data: {validationUrl: validationUrl},
    headers: getAuthorizationHeaders()
  });
}

module.exports = {
  init: init,
  loadFiat: loadFiat,
  getFiatById: getFiatById,
  getFiatList: getFiatList,
  getCryptoSymbolById: getCryptoSymbolById,
  isSupported: isSupported,
  isLogged: isLogged,
  signIn: signIn,
  limits: limits,
  refreshToken: refreshToken,
  setAccessToken: setAccessToken,
  cleanAccessToken: cleanAccessToken,
  getCustomer: getCustomer,
  setCustomer: setCustomer,
  cleanCustomer: cleanCustomer,
  updateCustomer: updateCustomer,
  verifyPhoneNumber: verifyPhoneNumber,
  loadCountries: loadCountries,
  getCountries: getCountries,
  getIpCountry: getIpCountry,
  getFiles: getFiles,
  uploadFile: uploadFile,
  createCard: createCard,
  getCards: getCards,
  deleteCard: deleteCard,
  createBankAccount: createBankAccount,
  getBankAccounts: getBankAccounts,
  deleteBankAccount: deleteBankAccount,
  quote: quote,
  rate: rate,
  createTx: createTx,
  getTxs: getTxs,
  open3dSecure: open3dSecure,
  validateApplePayTransaction: validateApplePayTransaction
}
