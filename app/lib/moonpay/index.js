'use strict';

const request = require('lib/request');
const { urlRoot } = window;
let coins = {};
const emitter = require('lib/emitter');
const applePay = require('lib/apple-pay');
const LS = require('lib/wallet/localStorage');

let hasHandledMobileSuccess = false;
const apiKey = process.env.MOONPAY_API_KEY;
let customer;
let fiat;
const countries = { document: [], allowed: [] };
let ipCountry;
let isBuyAllowed = false;
let isSellAllowed = false;
let isInited = false;

emitter.on('handleOpenURL', (url) => {
  url = url || '';
  const matchAction = url.match(/action=([^&]+)/);

  if (matchAction && matchAction[1] === 'moonpay-3d-secure') {
    const matchTxId = url.match(/transactionId=([^&]+)/);
    const txId = matchTxId ? matchTxId[1] : '';

    window.localStorage.setItem('_cs_moonpay_3d_secure', txId);
    hasHandledMobileSuccess = true;
  }

  if (matchAction && matchAction[1] === 'moonpay-success') {
    window.localStorage.setItem('_cs_moonpay_success', 'true');
    hasHandledMobileSuccess = true;
  }
});

emitter.on('wallet-reset', () => {
  cleanAccessToken();
});

async function init() {
  if (isInited) return true;
  isInited = true;
  try {
    const data = await request({
      url: 'https://api.moonpay.io/v3/ip_address',
      params: { apiKey },
      hideFlashError: true,
    });
    ({ isBuyAllowed } = data);
    ({ isSellAllowed } = data);

    ipCountry = data.alpha3;
    if (isBuyAllowed || isSellAllowed) {
      const _coins = await request({
        url: urlRoot + 'v1/moonpay/coins',
        params: { country: data.alpha3 },
      });
      if (_coins) coins = _coins;
    }
  } catch (err) {
    if (err.message !== 'Network Error') console.error(err);
  }
}

function loadFiat() {
  if (fiat) return Promise.resolve();
  return request({ url: urlRoot + 'v1/moonpay/fiat' }).then((data) => {
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
  return Object.keys(fiat).map((key) => {
    const item = fiat[key];
    item.id = key;
    return item;
  }).sort((a, b) => {
    return a.symbol > b.symbol ? 1 : -1;
  });
}

function getCryptoSymbolById(id) {
  return coins[id] ? coins[id].symbol : '';
}

function isSupported(symbol) {
  if (!isBuyAllowed) return false;
  return !!Object.keys(coins).find((key) => {
    return coins[key].symbol === symbol && coins[key].isSupported;
  });
}

function isSellSupported(symbol) {
  if (!isSellAllowed) return false;
  return !!Object.keys(coins).find((key) => {
    return coins[key].symbol === symbol && coins[key].isSellSupported;
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
    params: { apiKey },
    data: { email, securityCode },
  }).then(fixPhonegapCookies).catch((err) => {
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
    headers: getAuthorizationHeaders(),
  });
}

function refreshToken() {
  return request({
    url: 'https://api.moonpay.io/v3/customers/refresh_token',
    params: { apiKey },
    headers: getAuthorizationHeaders(),
  }).then(fixPhonegapCookies);
}

function fixPhonegapCookies(data) {
  if (process.env.BUILD_TYPE !== 'phonegap') return Promise.resolve(data);
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line no-undef
    cookieMaster.setCookieValue('https://api.moonpay.io', 'customerToken', '',
      () => { resolve(data); },
      (err) => { reject(err); });
  });
}

function getAccessToken() {
  return window.localStorage.getItem('_cs_moonpay_token');
}

function getAuthorizationHeaders() {
  return {
    'Authorization': 'Bearer ' + getAccessToken(),
  };
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
    data,
    headers: getAuthorizationHeaders(),
  });
}

function verifyPhoneNumber(code) {
  return request({
    url: 'https://api.moonpay.io/v3/customers/verify_phone_number',
    method: 'post',
    data: {
      verificationCode: code,
    },
    headers: getAuthorizationHeaders(),
  });
}

function loadCountries(type) {
  return request({
    url: urlRoot + 'v1/moonpay/countries',
    params: { type },
  }).then((data) => {
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
    headers: getAuthorizationHeaders(),
  });
}

function uploadFile(file, type, country, side) {
  let key;
  return request({
    url: 'https://api.moonpay.io/v3/files/s3_signed_request',
    params: {
      apiKey,
      fileType: file.type,
    },
  }).then((data) => {
    // eslint-disable-next-line prefer-destructuring
    key = data.key;
    return request({
      url: data.signedRequest,
      method: 'put',
      data: file,
      headers: {
        'Content-Type': file.type,
      },
    });
  }).then(() => {
    return request({
      url: 'https://api.moonpay.io/v3/files',
      method: 'post',
      data: {
        key,
        type,
        country,
        side,
      },
      headers: getAuthorizationHeaders(),
    });
  });
}

function createCard(tokenId) {
  return request({
    url: 'https://api.moonpay.io/v3/cards',
    method: 'post',
    data: {
      tokenId,
    },
    headers: getAuthorizationHeaders(),
  });
}

function getCards() {
  return request({
    url: 'https://api.moonpay.io/v3/cards',
    headers: getAuthorizationHeaders(),
  }).then((cards) => {
    cards.forEach((card) => {
      card.label = card.brand.toUpperCase() + '...x' + card.lastDigits;
    });
    cards.sort((a, b) => {
      return (new Date(b.createdAt)).getTime() - (new Date(a.createdAt).getTime());
    });
    if (applePay.isApplePaySupported()) {
      cards.unshift({ type: 'applePay', label: 'Apple Pay' });
    }
    return cards;
  });
}

function deleteCard(id) {
  return request({
    url: 'https://api.moonpay.io/v3/cards/' + id,
    method: 'delete',
    headers: getAuthorizationHeaders(),
  });
}

function createBankAccount(bankAccount) {
  const data = { currencyCode: bankAccount.currencyCode.toLowerCase() };
  if (data.currencyCode === 'eur') {
    data.iban = bankAccount.iban;
  } else if (data.currencyCode === 'gbp') {
    data.accountNumber = bankAccount.accountNumber;
    data.sortCode = bankAccount.sortCode;
  }
  return request({
    url: 'https://api.moonpay.io/v3/bank_accounts',
    method: 'post',
    data,
    headers: getAuthorizationHeaders(),
  });
}

function getBankAccounts(fiat) {
  return request({
    url: 'https://api.moonpay.io/v3/bank_accounts',
    headers: getAuthorizationHeaders(),
  }).then((bankAccounts) => {
    bankAccounts.forEach((bankAccount) => {
      const fiatSymbol = getFiatById(bankAccount.currencyId, 'symbol');
      if (fiatSymbol === 'EUR') {
        bankAccount.label = fiatSymbol + ' – ' + bankAccount.iban.substr(0, 8) + '...' + bankAccount.iban.substr(-4);
      } else if (fiatSymbol === 'GBP') {
        bankAccount.label = fiatSymbol + ' – ' + bankAccount.sortCode + '...' + bankAccount.accountNumber.substr(-4);
      }
      bankAccount.fiatSymbol = fiatSymbol;
      bankAccount.type = 'bankAccount';
    });
    if (fiat) {
      bankAccounts = bankAccounts.filter((bankAccount) => {
        return bankAccount.fiatSymbol === fiat;
      });
    }
    bankAccounts.sort((a, b) => {
      return (new Date(b.createdAt)).getTime() - (new Date(a.createdAt).getTime());
    });
    return bankAccounts;
  });
}

function deleteBankAccount(id) {
  return request({
    url: 'https://api.moonpay.io/v3/bank_accounts/' + id,
    method: 'delete',
    headers: getAuthorizationHeaders(),
  });
}

function quote(currencyCode, baseCurrencyCode, baseCurrencyAmount, paymentMethod, areFeesIncluded) {
  let pm = 'credit_debit_card';
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
      apiKey,
      baseCurrencyCode,
      baseCurrencyAmount,
      paymentMethod: pm,
      areFeesIncluded,
    },
  });
}

function rate(currencyCode, baseCurrencyCode) {
  return request({
    url: 'https://api.moonpay.io/v3/currencies/' + currencyCode + '/price',
    params: {
      apiKey,
    },
  }).then((data) => {
    return data[baseCurrencyCode.toUpperCase()];
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
        amount: data.baseCurrencyAmount,
      },
      validateApplePayTransaction,
      callback(token) {
        data.externalToken = {
          tokenProvider: 'apple_pay',
          token,
        };
        delete data.paymentMethod;
        return _createTx(data);
      },
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
      bankAccountId: data.bankAccountId,
    },
    headers: getAuthorizationHeaders(),
  });
}

function getTxs() {
  return request({
    url: 'https://api.moonpay.io/v3/transactions',
    headers: getAuthorizationHeaders(),
  });
}

function getTxById(id) {
  return request({
    url: 'https://api.moonpay.io/v3/transactions/' + id,
    headers: getAuthorizationHeaders(),
  });
}

function open3dSecure(url) {
  return new Promise((resolve) => {
    const width = 500;
    const height = 600;
    let options = 'width=' + width + ', ';
    options += 'height=' + height + ', ';
    options += 'left=' + ((screen.width - width) / 2) + ', ';
    options += 'top=' + ((screen.height - height) / 2) + '';

    window.localStorage.removeItem('_cs_moonpay_3d_secure');
    const popup = window.open(url, process.env.BUILD_TYPE === 'electron' ? '_modal' : '_blank', options);
    const popupInterval = setInterval(() => {
      if ((popup && popup.closed) || hasHandledMobileSuccess) {
        clearInterval(popupInterval);
        hasHandledMobileSuccess = false;
        if (popup && !popup.closed && popup.close) {
          popup.close();
        }
        return resolve(window.localStorage.getItem('_cs_moonpay_3d_secure'));
      }
    }, 250);
  }).then((txId) => {
    if (!txId) throw new Error('3d_failed');
    return getTxById(txId);
  }).then((tx) => {
    if (tx.status !== 'completed' && tx.status !== 'pending') throw new Error('3d_failed');
  });
}

function validateApplePayTransaction(validationUrl) {
  return request({
    url: 'https://api.moonpay.io/v3/apple_pay/validate',
    method: 'post',
    data: { validationUrl },
    headers: getAuthorizationHeaders(),
  });
}

async function getWidgetUrls(symbol, address) {
  let buy;
  let sell;
  let urls = [];

  if (isSupported(symbol) && address) {
    buy = getBuyUrl(symbol.toLowerCase(), address);
    urls.push(buy);
    buy = urls.length - 1;
  }
  if (isSellSupported(symbol) && address) {
    sell = getSellUrl(symbol.toLowerCase(), address);
    urls.push(sell);
    sell = urls.length - 1;
  }

  if (urls.length) {
    urls = await signUrls(urls);
    buy = urls[buy];
    sell = urls[sell];
  }

  return {
    buy,
    sell,
  };
}

function getSellUrl(baseCurrencyCode, refundWalletAddress) {
  let baseUrl = process.env.MOONPAY_WIDGET_SELL_URL + '&';
  const params = {
    baseCurrencyCode,
    refundWalletAddress,
  };
  const queryString = Object.keys(params).map((key) => {
    return key + '=' + encodeURIComponent(params[key]);
  }).join('&');
  baseUrl += queryString;
  return baseUrl;
}

function getBuyUrl(currencyCode, walletAddress) {
  let baseUrl = process.env.MOONPAY_WIDGET_BUY_URL + '&';
  const params = {
    currencyCode,
    walletAddress,
    enabledPaymentMethods: 'credit_debit_card,sepa_bank_transfer,gbp_bank_transfer,apple_pay',
  };

  const queryString = Object.keys(params).map((key) => {
    return key + '=' + encodeURIComponent(params[key]);
  }).join('&');

  baseUrl += queryString;
  return baseUrl;
}

async function signUrls(urls) {
  const result = await request({
    url: `${urlRoot}v2/moonpay/sign?id=${LS.getId()}`,
    method: 'post',
    data: {
      urls,
    },
    seed: 'public',
  });
  return result.urls;
}

module.exports = {
  init,
  loadFiat,
  getFiatById,
  getFiatList,
  getCryptoSymbolById,
  isSupported,
  isSellSupported,
  isLogged,
  signIn,
  limits,
  refreshToken,
  setAccessToken,
  cleanAccessToken,
  getCustomer,
  setCustomer,
  cleanCustomer,
  updateCustomer,
  verifyPhoneNumber,
  loadCountries,
  getCountries,
  getIpCountry,
  getFiles,
  uploadFile,
  createCard,
  getCards,
  deleteCard,
  createBankAccount,
  getBankAccounts,
  deleteBankAccount,
  quote,
  rate,
  createTx,
  getTxs,
  open3dSecure,
  validateApplePayTransaction,
  getWidgetUrls,
};
