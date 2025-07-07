import ChangeHeroExchange from './ChangeHeroExchange.js';
import ChangeNOWExchange from './ChangeNOWExchange.js';
import ChangellyExchange from './ChangellyExchange.js';
import ExchangeStorage from '../storage/ExchangeStorage.js';

import {
  Amount,
  errors,
} from '@coinspace/cs-common';

import {
  ExchangeAmountError,
  ExchangeBigAmountError,
  ExchangeDisabledError,
  ExchangeSmallAmountError,
  InternalExchangeError,
} from './BaseExchange.js';

export default class Exchanges {
  #account;
  #exchanges = [];
  #request;

  constructor({ request, account }) {
    this.#account = account;
    this.#request = (config) => request({
      ...config,
      baseURL: this.#account.getBaseURL('swap'),
    });
    for (const Exchange of [ChangellyExchange, ChangeNOWExchange, ChangeHeroExchange]) {
      this.#exchanges.push(new Exchange({ request: this.#request, account }));
    }
  }

  isSupported(from, to) {
    return !from.custom && !to.custom;
  }

  async init() {
    const exchangeStorages = await ExchangeStorage.initMany(this.#account, this.#exchanges);
    const infos = await this.#request({
      url: 'api/v1/providers',
      method: 'get',
      seed: 'device',
    });
    for (const exchange of this.#exchanges) {
      const storage = exchangeStorages[exchange.id];
      const info = infos.find((info) => info.id === exchange.id);
      exchange.init({ storage, info });
    }
  }

  #getExchange(provider) {
    return this.#exchanges.find((item) => item.id === provider);
  }

  getProviderInfo(id) {
    return this.#getExchange(id)?.info;
  }

  async loadExchanges() {
    for (const exchange of this.#exchanges) {
      await exchange.loadExchanges();
    }
  }

  async estimateExchange({ from, to, amount }) {
    if (amount.value <= 0n) {
      throw new ExchangeAmountError('Invalid amount');
    }
    let estimations;
    try {
      estimations = (await this.#request({
        url: 'api/v1/estimate',
        method: 'get',
        params: {
          from,
          to,
          amount: amount.toString(),
        },
        seed: 'device',
      })).filter(({ provider }) => this.#exchanges.find((exchange) => exchange.id === provider));
    } catch (err) {
      if (err instanceof errors.NodeError) {
        throw new InternalExchangeError('Unable to estimate', { cause: err });
      }
      throw err;
    }
    const cryptoFrom = this.#account.cryptoDB.get(from);
    if (estimations.error) {
      if (estimations.error === 'AmountError') {
        throw new ExchangeAmountError('Invalid amount');
      }
      if (estimations.error === 'SmallAmountError') {
        throw new ExchangeSmallAmountError(
          Amount.fromString(estimations.amount || '0', cryptoFrom.decimals));
      }
      if (estimations.error === 'BigAmountError') {
        throw new ExchangeBigAmountError(
          Amount.fromString(estimations.amount || '0', cryptoFrom.decimals));
      }
      throw new InternalExchangeError(estimations.error);
    }
    if (!estimations.length) {
      throw new ExchangeDisabledError('Exchange disabled');
    }
    const cryptoTo = this.#account.cryptoDB.get(to);
    return estimations.map((estimate) => {
      estimate.result = Amount.fromString(estimate.result, cryptoTo.decimals);
      return estimate;
    });
  }

  createExchange({ provider, ...opts }) {
    return this.#getExchange(provider).createExchange(opts);
  }

  saveExchange({ provider, ...opts }) {
    return this.#getExchange(provider).saveExchange(opts);
  }

  validateAddress({ provider, ...opts }) {
    return this.#getExchange(provider).validateAddress(opts);
  }

  exchangifyTransactions(transactions, crypto) {
    for (const exchange of this.#exchanges) {
      exchange.exchangifyTransactions(transactions, crypto);
    }
    return transactions;
  }

  async reexchangifyTransaction(transaction) {
    return this.#getExchange(transaction.exchange.providerInfo.id).reexchangifyTransaction(transaction);
  }
}
