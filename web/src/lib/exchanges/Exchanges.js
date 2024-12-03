import ChangeNOWExchange from './ChangeNOWExchange.js';
import ChangellyExchange from './ChangellyExchange.js';

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

  constructor({ request, account }) {
    this.#account = account;
    for (const Exchange of [ChangellyExchange, ChangeNOWExchange]) {
      this.#exchanges.push(new Exchange({ request, account }));
    }
  }

  isSupported(from, to) {
    if (to) {
      return !!((from.changelly && to.changelly) || (from.changenow && to.changenow));
    } else {
      return !!(from.changelly || from.changenow);
    }
  }

  getProviderName(id) {
    return this.#exchanges.find((item) => item.id === id).name;
  }

  async init() {
    return Promise
      .all(this.#exchanges.map((exchange) => exchange.init()));
  }

  #getExchange(provider) {
    return this.#exchanges.find((item) => item.id === provider);
  }

  async loadExchanges() {
    for (const exchange of this.#exchanges) {
      await exchange.loadExchanges();
    }
  }

  async estimateExchange({ from, to, amount, provider }) {
    if (provider) {
      return this.#getExchange(provider).estimateExchange({ from, to, amount });
    }
    const cryptoFrom = this.#account.cryptoDB.get(from);
    const cryptoTo = this.#account.cryptoDB.get(to);
    const exchanges = this.#exchanges.filter((exchange) => {
      return cryptoFrom[exchange.id] && cryptoTo[exchange.id];
    });
    if (!exchanges.length) throw new ExchangeDisabledError();

    const estimations = await Promise
      .allSettled(exchanges.map((exchange) => exchange.estimateExchange({ from, to, amount })));

    if (estimations.some((item) => item.status === 'fulfilled')) {
      const values = estimations.filter((item) => item.status === 'fulfilled').map((item) => item.value);
      values.sort((a, b) => {
        if (a.result.value > b.result.value) return -1;
        if (a.result.value < b.result.value) return 1;
        return 0;
      });
      return values;
    }

    if (estimations.every((item) => item.reason instanceof InternalExchangeError)) {
      throw new InternalExchangeError();
    }
    if (estimations.every((item) => item.reason instanceof ExchangeDisabledError)) {
      throw new ExchangeDisabledError();
    }

    const filtered = estimations.filter((item) => {
      if (item.reason instanceof InternalExchangeError) return false;
      if (item.reason instanceof ExchangeDisabledError) return false;
      return true;
    });

    if (filtered.some((item) => item.reason instanceof ExchangeSmallAmountError)) {
      throw filtered
        .filter((item) => item.reason instanceof ExchangeSmallAmountError)
        .reduce((prev, curr) => prev?.reason?.amount?.value < curr?.reason?.amount?.value ? prev : curr).reason;
    }
    if (filtered.some((item) => item.reason instanceof ExchangeBigAmountError)) {
      throw filtered
        .filter((item) => item.reason instanceof ExchangeBigAmountError)
        .reduce((prev, curr) => prev?.reason?.amount?.value > curr?.reason?.amount?.value ? prev : curr).reason;
    }
    if (filtered.some((item) => item.reason instanceof ExchangeAmountError)) {
      throw new ExchangeAmountError();
    }

    throw new InternalExchangeError('Unusual behavior');
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

  async exchangifyTransaction(transaction, crypto) {
    for (const exchange of this.#exchanges) {
      await exchange.exchangifyTransaction(transaction, crypto);
    }
  }

  async exchangifyTransactions(transactions, crypto) {
    for (const exchange of this.#exchanges) {
      await exchange.exchangifyTransactions(transactions, crypto);
    }
    return transactions;
  }

  async reexchangifyTransaction(transaction) {
    return this.#getExchange(transaction.exchange.provider).reexchangifyTransaction(transaction);
  }
}
