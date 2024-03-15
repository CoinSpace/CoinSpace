import ExchangeStorage from './ExchangeStorage.js';
import {
  Amount,
  errors,
} from '@coinspace/cs-common';

export class ExchangeDisabledError extends Error {
  name = 'ExchangeDisabledError';
}

export class InternalExchangeError extends Error {
  name = 'InternalExchangeError';
}

export class ExchangeAmountError extends errors.AmountError {
  name = 'ExchangeAmountError';
}

export class ExchangeSmallAmountError extends errors.SmallAmountError {
  name = 'ExchangeSmallAmountError';
}

export class ExchangeBigAmountError extends errors.BigAmountError {
  name = 'ExchangeBigAmountError';
}

export default class ChangellyExchange {
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

  constructor({ request, account }) {
    if (!request) throw new TypeError('request is required');
    if (!account) throw new TypeError('account is required');
    this.#request = request;
    this.#account = account;
    this.#storage = new ExchangeStorage({
      request,
      name: 'changelly',
      key: account.clientStorage.getDetailsKey(),
    });
  }

  async init() {
    await this.#storage.init();
  }

  async loadExchanges() {
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
        url: '/api/v4/exchange/changelly/transactions',
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
      url: '/api/v4/exchange/changelly/transactions',
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
      throw new errors.AmountError('Invalid amount');
    }
    let estimation;
    try {
      estimation = await this.#request({
        url: '/api/v4/exchange/changelly/estimate',
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
        throw new InternalExchangeError('Unable to estimate', { cause: err });
      }
      throw err;
    }
    const cryptoFrom = this.#account.cryptoDB.get(from);
    if (estimation.error) {
      if (estimation.error === 'AmountError') {
        throw new ExchangeAmountError('Invalid amount');
      }
      if (estimation.error === 'SmallAmountError') {
        throw new ExchangeSmallAmountError(Amount.fromString(estimation.amount || '0', cryptoFrom.decimals));
      }
      if (estimation.error === 'BigAmountError') {
        throw new ExchangeBigAmountError(Amount.fromString(estimation.amount || '0', cryptoFrom.decimals));
      }
      if (estimation.error === 'ExchangeDisabled') {
        throw new ExchangeDisabledError();
      }
      throw new InternalExchangeError(estimation.error);
    }
    const cryptoTo = this.#account.cryptoDB.get(to);
    return {
      rate: Amount.fromString(estimation.rate, cryptoTo.decimals),
      result: Amount.fromString(estimation.result, cryptoTo.decimals),
    };
  }

  async createExchange({ from, to, amount, address, extraId, refundAddress }) {
    try {
      const exchange = await this.#request({
        url: '/api/v4/exchange/changelly/transaction',
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
        throw new InternalExchangeError('Unable to create exchange', { cause: err });
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
    const data = await this.#request({
      url: '/api/v4/exchange/changelly/validate',
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
    }
    throw new errors.InvalidAddressError(address);
  }

  #assignExchange(transaction, exchange) {
    transaction.exchange = {
      id: exchange.id,
      trackUrl: exchange.trackUrl,
      status: this.#mapExchangeStatus(exchange),
      originalStatus: exchange.status,
      to: exchange.internal === true ? 'your wallet' : exchange.payoutAddress,
      payoutHash: exchange?.payoutHash?.toLowerCase(),
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

  async exchangifyTransaction(transaction, crypto) {
    const exchange = this.#exchanges
      .filter((item) => item.cryptoFrom === crypto._id || item.cryptoTo === crypto._id)
      .find((item) => {
        if (crypto._id === 'toncoin@toncoin') {
          if (item.cryptoFrom === 'toncoin@toncoin') {
            return transaction.to?.toLowerCase() === item.payinAddress?.toLowerCase();
          }
          if (item.cryptoTo === 'toncoin@toncoin') {
            const amountTo = item.amountTo !== '0' ? item.amountTo : item.amountExpectedTo;
            return transaction.to?.toLowerCase() === item.payoutAddress?.toLowerCase()
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

  async exchangifyTransactions(transactions, crypto) {
    return Promise.all(transactions.map((transaction) => this.exchangifyTransaction(transaction, crypto)));
  }

  async reexchangifyTransaction(transaction) {
    if (['finished', 'failed', 'refunded', 'overdue', 'expired'].includes(transaction.exchange.originalStatus)) {
      const exchange = await this.loadExchange(transaction.exchange.id);
      return this.#assignExchange(transaction, exchange);
    } else {
      return transaction;
    }
  }

  #mapExchangeStatus(exchange) {
    switch (exchange.status) {
      case 'waiting':
      case 'confirming':
        return ChangellyExchange.STATUS_PENDING;
      case 'exchanging':
      case 'sending':
        return ChangellyExchange.STATUS_EXCHANGING;
      case 'finished':
        if (this.#isRequiredToAccept(exchange)) {
          return ChangellyExchange.STATUS_REQUIRED_TO_ACCEPT;
        } else {
          return ChangellyExchange.STATUS_SUCCESS;
        }
      case 'failed':
      case 'overdue':
      case 'expired':
        return ChangellyExchange.STATUS_FAILED;
      case 'refunded':
        return ChangellyExchange.STATUS_REFUNDED;
      case 'hold':
        return ChangellyExchange.STATUS_HOLD;
      default:
        return ChangellyExchange.STATUS_FAILED;
    }
  }

  #isRequiredToAccept({ internal, cryptoTo, payoutHash = '' }) {
    if (cryptoTo !== 'monero@monero') return false;
    if (!internal) return false;
    const txsIds = this.#account.wallet('monero@monero')?.storage?.get('txIds') || [];
    return !txsIds.includes(payoutHash.toLowerCase());
  }
}
