import {
  Amount,
  errors,
} from '@coinspace/cs-common';

import { areAddressesEqual as areTonAddressesEqual } from '@coinspace/cs-toncoin-wallet/helpers';

export class ExchangeDisabledError extends Error {
  name = 'ExchangeDisabledError';
  constructor(message, options) {
    super(message, options);
    this.provider = options?.provider;
  }
}

export class InternalExchangeError extends Error {
  name = 'InternalExchangeError';
  constructor(message, options) {
    super(message, options);
    this.provider = options?.provider;
  }
}

export class ExchangeAmountError extends errors.AmountError {
  name = 'ExchangeAmountError';
  constructor(message, options) {
    super(message, options);
    this.provider = options?.provider;
  }
}

export class ExchangeSmallAmountError extends errors.SmallAmountError {
  name = 'ExchangeSmallAmountError';
  constructor(message, options) {
    super(message, options);
    this.provider = options?.provider;
  }
}

export class ExchangeBigAmountError extends errors.BigAmountError {
  name = 'ExchangeBigAmountError';
  constructor(message, options) {
    super(message, options);
    this.provider = options?.provider;
  }
}

export default class BaseExchange {
  #id;
  #name;
  #request;
  #account;
  #storage;
  #exchanges;

  static STATUS_PENDING = Symbol('PENDING');
  static STATUS_EXCHANGING = Symbol('EXCHANGING');
  static STATUS_SUCCESS = Symbol('SUCCESS');
  static STATUS_REQUIRED_TO_ACCEPT = Symbol('REQUIRED_TO_ACCEPT');
  static STATUS_FAILED = Symbol('FAILED');
  static STATUS_REFUNDED = Symbol('REFUNDED');
  static STATUS_HOLD = Symbol('HOLD');

  static EXTRA_ID = [
    'xrp@ripple',
    'stellar@stellar',
    'eos@eos',
    'binance-coin@binance-chain',
    'monero@monero',
    'ardor@ardor',
    'nem@nem',
    'stacks@stacks',
    'iost@iost',
  ];


  get id() {
    return this.#id;
  }

  get name() {
    return this.#name;
  }

  constructor({ request, account, id, name }) {
    if (!request) throw new TypeError('request is required');
    if (!account) throw new TypeError('account is required');
    if (!id) throw new TypeError('id is required');
    if (!name) throw new TypeError('name is required');
    this.#id = id;
    this.#name = name;
    this.#request = request;
    this.#account = account;
  }

  init(storage) {
    this.#storage = storage;
  }

  async loadExchanges() {
    try {
      return this.#loadExchanges();
    } catch (err) {
      console.error(err);
    }
  }

  async #loadExchanges() {
    this.#exchanges = this.#storage.get('exchanges');
    const ids = this.#exchanges
      .filter((exchange) => {
        return [
          'waiting',
          'confirming',
          'exchanging',
          'sending',
          'hold',
          undefined, // fresh
        ].includes(exchange.status);
      })
      .slice(-10)
      .map((exchange) => exchange.id);
    if (ids.length) {
      const updates = await this.#request({
        url: `/api/v4/exchange/${this.#id}/transactions`,
        method: 'get',
        params: {
          transactions: ids.join(','),
        },
        seed: 'device',
      });
      this.#exchanges = this.#exchanges.map((exchange) => {
        const update = updates.find((update) => update.id === exchange.id);
        if (update) {
          return {
            ...exchange,
            ...update,
          };
        }
        return exchange;
      });
      this.#storage.set('exchanges', this.#exchanges);
      await this.#storage.save();
    }
  }

  async loadExchange(id) {
    const [update] = await this.#request({
      url: `/api/v4/exchange/${this.#id}/transactions`,
      method: 'get',
      params: {
        transactions: id,
      },
      seed: 'device',
    });
    const index = this.#exchanges.findIndex((exchange) => exchange.id === id);
    if (update) {
      this.#exchanges[index] = {
        ...this.#exchanges[index],
        ...update,
      };
      await this.#storage.save();
    }
    return this.#exchanges[index];
  }

  async estimateExchange({ from, to, amount }) {
    if (amount.value <= 0n) {
      throw new ExchangeAmountError('Invalid amount', { provider: this.#id });
    }
    let estimation;
    try {
      estimation = await this.#request({
        url: `/api/v4/exchange/${this.#id}/estimate`,
        method: 'get',
        params: {
          from,
          to,
          amount: amount.toString(),
        },
        seed: 'device',
      });
    } catch (err) {
      if (err instanceof errors.NodeError) {
        throw new InternalExchangeError('Unable to estimate', { cause: err, provider: this.#id });
      }
      throw err;
    }
    const cryptoFrom = this.#account.cryptoDB.get(from);
    if (estimation.error) {
      if (estimation.error === 'AmountError') {
        throw new ExchangeAmountError('Invalid amount', { provider: this.#id });
      }
      if (estimation.error === 'SmallAmountError') {
        throw new ExchangeSmallAmountError(
          Amount.fromString(estimation.amount || '0', cryptoFrom.decimals), { provider: this.#id });
      }
      if (estimation.error === 'BigAmountError') {
        throw new ExchangeBigAmountError(
          Amount.fromString(estimation.amount || '0', cryptoFrom.decimals), { provider: this.#id });
      }
      if (estimation.error === 'ExchangeDisabled') {
        throw new ExchangeDisabledError('Exchange disabled', { provider: this.#id });
      }
      throw new InternalExchangeError(estimation.error, { provider: this.#id });
    }
    const cryptoTo = this.#account.cryptoDB.get(to);
    return {
      provider: this.#id,
      result: Amount.fromString(estimation.result, cryptoTo.decimals),
    };
  }

  async createExchange({ from, to, amount, address, extraId, refundAddress }) {
    try {
      const exchange = await this.#request({
        url: `/api/v4/exchange/${this.#id}/transaction`,
        method: 'post',
        data: {
          from,
          to,
          amount: amount.toString(),
          address,
          extraId,
          refundAddress,
        },
        seed: 'device',
      });
      return exchange;
    } catch (err) {
      if (err instanceof errors.NodeError) {
        throw new InternalExchangeError('Unable to create exchange', { cause: err, provider: this.#id });
      }
      throw err;
    }
  }

  async saveExchange({ from, to, exchangeId, transactionId, internal }) {
    if (!this.#exchanges) {
      await this.loadExchanges();
    }
    this.#exchanges.push({
      cryptoFrom: from,
      cryptoTo: to,
      id: exchangeId,
      payinHash: transactionId,
      internal,
    });
    this.#storage.set('exchanges', this.#exchanges);
    await this.#storage.save();
  }

  async validateAddress({ to, address, extraId }) {
    if (!address) {
      throw new errors.EmptyAddressError();
    }
    try {
      const data = await this.#request({
        url: `/api/v4/exchange/${this.#id}/validate`,
        method: 'get',
        params: {
          crypto: to,
          address: encodeURIComponent(address),
          extra: extraId ? encodeURIComponent(extraId) : undefined,
        },
        seed: 'device',
      });
      if (data.isValid) {
        return true;
      } else {
        throw new errors.InvalidAddressError(address);
      }
    } catch (err) {
      throw new errors.InvalidAddressError(address);
    }
  }

  exchangifyTransactions(transactions, crypto) {
    return transactions.map((transaction) => this.#exchangifyTransaction(transaction, crypto));
  }

  async reexchangifyTransaction(transaction) {
    if (['finished', 'failed', 'refunded', 'overdue', 'expired'].includes(transaction.exchange.originalStatus)) {
      const exchange = await this.loadExchange(transaction.exchange.id);
      return this.#assignExchange(transaction, exchange);
    } else {
      return transaction;
    }
  }

  #exchangifyTransaction(transaction, crypto) {
    const exchange = this.#exchanges
      .filter((item) => item.cryptoFrom === crypto._id || item.cryptoTo === crypto._id)
      .find((item) => {
        if (crypto._id === 'toncoin@toncoin') {
          if (item.cryptoFrom === 'toncoin@toncoin') {
            return areTonAddressesEqual(transaction.to, item.payinAddress);
          }
          if (item.cryptoTo === 'toncoin@toncoin') {
            const amountTo = item.amountTo !== '0' ? item.amountTo : item.amountExpectedTo;
            return areTonAddressesEqual(transaction.to, item.payoutAddress)
              && transaction.amount.value === Amount.fromString(amountTo, crypto.decimals).value;
          }
        }
        return item?.payinHash?.toLowerCase() === transaction.id.toLowerCase()
            || item?.payoutHash?.toLowerCase() === transaction.id.toLowerCase();
      });
    if (!exchange) {
      return transaction;
    }
    return this.#assignExchange(transaction, exchange);
  }

  #assignExchange(transaction, exchange) {
    transaction.exchange = {
      id: exchange.id,
      trackUrl: exchange.trackUrl,
      status: this.#mapExchangeStatus(exchange),
      originalStatus: exchange.status,
      to: exchange.internal === true ? 'your wallet' : exchange.payoutAddress,
      payoutHash: exchange?.payoutHash?.toLowerCase(),
      provider: this.#id,
    };
    if (transaction.incoming) {
      const cryptoFrom = this.#account.cryptoDB.get(exchange.cryptoFrom);
      const amountFrom = exchange.amountFrom !== '0' ? exchange.amountFrom : exchange.amountExpectedFrom;
      transaction.exchange.cryptoFrom = cryptoFrom;
      transaction.exchange.amountFrom = Amount.fromString(amountFrom, cryptoFrom.decimals);
    } else {
      const cryptoTo = this.#account.cryptoDB.get(exchange.cryptoTo);
      const amountTo = exchange.amountTo !== '0' ? exchange.amountTo : exchange.amountExpectedTo;
      transaction.exchange.cryptoTo = cryptoTo;
      transaction.exchange.amountTo = Amount.fromString(amountTo, cryptoTo.decimals);
    }
    return transaction;
  }

  #mapExchangeStatus(exchange) {
    switch (exchange.status) {
      case 'waiting':
      case 'confirming':
        return BaseExchange.STATUS_PENDING;
      case 'exchanging':
      case 'sending':
        return BaseExchange.STATUS_EXCHANGING;
      case 'finished':
        if (this.#isRequiredToAccept(exchange)) {
          return BaseExchange.STATUS_REQUIRED_TO_ACCEPT;
        } else {
          return BaseExchange.STATUS_SUCCESS;
        }
      case 'failed':
      case 'overdue':
      case 'expired':
        return BaseExchange.STATUS_FAILED;
      case 'refunded':
        return BaseExchange.STATUS_REFUNDED;
      case 'hold':
        return BaseExchange.STATUS_HOLD;
      default:
        return BaseExchange.STATUS_FAILED;
    }
  }

  #isRequiredToAccept({ internal, cryptoTo, payoutHash = '' }) {
    if (cryptoTo !== 'monero@monero') return false;
    if (!internal) return false;
    const txsIds = this.#account.wallet('monero@monero')?.storage?.get('txIds') || [];
    return !txsIds.includes(payoutHash.toLowerCase());
  }
}
