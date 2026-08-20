import CountryList from 'country-list';
import { Amount, errors, utils } from '@coinspace/cs-common';

export class CardSmallAmountError extends errors.SmallAmountError {
  name = 'CardSmallAmountError';
  constructor(message, options) {
    super(message, options);
  }
}

export class CardBigAmountError extends errors.BigAmountError {
  name = 'CardBigAmountError';
  constructor(message, options) {
    super(message, options);
  }
}
export class CardNoFundsError extends errors.AmountError {
  name = 'CardNoFundsError';
  constructor(message, options) {
    super(message, options);
  }
}

export class TopupDisabledError extends Error {
  name = 'TopupDisabledError';
  constructor(message, options) {
    super(message, options);
  }
}

export class BuyDisabledError extends Error {
  name = 'BuyDisabledError';
  constructor(message, options) {
    super(message, options);
  }
}

export default class Cards {
  #countries = [];
  #account;
  #cryptoDB;
  #request;
  #cardRequest;
  #countryCode;
  #enabled = false;
  #seed;
  #config;
  #supportedProductIds = ['aurum', 'azure'];
  #supportedDepositPlatforms = [
    'ethereum',
    'binance-smart-chain',
    'polygon',
    'tron',
    // make sure that wallet supports "buildTransaction" method
  ];

  get countries() {
    return this.#countries;
  }

  get seed() {
    return this.#seed;
  }

  set seed(value) {
    this.#seed = value;
  }

  get isLocked() {
    return !this.#seed;
  }

  get isEnabled() {
    return this.#enabled;
  }

  constructor({ cryptoDB, request, account }) {
    if (!cryptoDB) {
      throw new TypeError('cryptoDB is required');
    }
    this.#cryptoDB = cryptoDB;
    if (!request) {
      throw new TypeError('request is required');
    }
    this.#account = account;
    this.#request = request;
    this.#cardRequest = (config) => request({
      ...config,
      baseURL: this.#account.getBaseURL('card'),
    });

    this.#countries = [{ value: '', name: '–' }, ...CountryList.getData().sort((a, b) => {
      return a.name.localeCompare(b.name);
    }).map((item) => {
      return {
        value: item.code,
        name: item.name,
      };
    })];
  }

  async init() {
    try {
      const [{ enabled }, config] = await Promise.all([
        this.#cardRequest({
          url: 'api/v1/public/status',
          method: 'get',
        }),
        this.#seed ? this.#getConfig() : undefined,
      ]);
      this.#enabled = enabled;
      this.#config = config;
    } catch (err) {
      console.error(err);
    }
  }

  async initSeed(walletSeed) {
    await this.#account.setCardsSeed(walletSeed);
    this.#config = await this.#getConfig();
  }

  async list() {
    const list = await this.#cardRequest({
      url: '/api/v1/cards',
      method: 'get',
      seed: 'cardholder',
    });
    return list.map((card) => {
      return {
        ...card,
        balance: new Amount(card.balance || 0, card.decimals),
      };
    });
  }

  async show(id) {
    const card = await this.#cardRequest({
      url: `/api/v1/card/${id}`,
      method: 'get',
      seed: 'cardholder',
    });
    card.balance = new Amount(card.balance || 0, card.decimals);
    return card;
  }

  async getCountryCode() {
    if (!this.#countryCode) {
      try {
        const { country } = await this.#request({
          url: 'api/v4/country',
          method: 'get',
          seed: 'device',
        });
        if (CountryList.getName(country)) this.#countryCode = country;
      } catch (err) {
        console.error(err);
      }
    }
    return this.#countryCode;
  }

  setCountryCode(value) {
    this.#countryCode = value;
  }

  getProducts(countryCode) {
    if (!countryCode) return [];
    return this.#config.products
      .filter((product) => {
        return this.#supportedProductIds.includes(product.id)
          && !product.excludedCountries.includes(countryCode)
          && !product.buyDisabled;
      })
      .sort((a, b) => countryCode === 'US' ? (b.id === 'azure') - (a.id === 'azure') : 0);
  }

  getDepositCryptos() {
    return Object.keys(this.#config.deposit)
      .map((id) => this.#cryptoDB.get(id))
      .filter((item) => item.supported && !item.deprecated && this.#supportedDepositPlatforms.includes(item.platform))
      .sort((a, b) => a.meta.rank - b.meta.rank);
  }

  getDepositAddress(cryptoId) {
    return this.#config.deposit[cryptoId].addresses[0];
  }

  validateTopupAmount(amount, product) {
    const { minTopupAmount, maxTopupAmount } = this.#config.products.find((item) => item.id === product.id);
    const minTopupValue = utils.unitToAtom(minTopupAmount, amount.decimals);
    if (amount.value < minTopupValue) {
      throw new CardSmallAmountError(new Amount(minTopupValue, amount.decimals));
    }
    const maxTopupValue = utils.unitToAtom(maxTopupAmount, amount.decimals);
    if (amount.value > maxTopupValue) {
      throw new CardBigAmountError(new Amount(maxTopupValue, amount.decimals));
    }
  }

  estimateTopupAmount(amount, product) {
    const { topupFee } = this.#config.products.find((item) => item.id === product.id);
    const scale = 1000n;
    const scaledPercent = BigInt(Math.round(topupFee * Number(scale)));
    return new Amount(amount.value * (100n * scale - scaledPercent) / (100n * scale), amount.decimals);
  }

  async loadTransactions(card, cursor = 1) {
    const { transactions, limit } = await this.#cardRequest({
      url: `api/v1/card/${card.id}/transactions`,
      method: 'get',
      params: { cursor },
      seed: 'cardholder',
    });
    const hasMore = transactions.length >= limit;
    if (hasMore) cursor++;
    return {
      transactions: transactions.map((transaction) => {
        return {
          ...transaction,
          amount: new Amount(transaction.amount || 0, card.decimals),
          symbol: card.symbol,
          timestamp: new Date(transaction.timestamp),
        };
      }),
      hasMore,
      cursor,
    };
  }

  async details(id) {
    const details = await this.#cardRequest({
      url: `/api/v1/card/${id}/details`,
      method: 'get',
      seed: 'cardholder',
    });
    return details;
  }

  async lock(id) {
    try {
      await this.#cardRequest({
        url: `/api/v1/card/${id}/lock`,
        method: 'post',
        seed: 'cardholder',
      });
      return true;
    } catch (err) {
      console.error(err);
    }
  }

  async unlock(id) {
    try {
      await this.#cardRequest({
        url: `/api/v1/card/${id}/unlock`,
        method: 'post',
        seed: 'cardholder',
      });
      return true;
    } catch (err) {
      console.error(err);
    }
  }

  async topup(id, transactionId, cryptoId) {
    const result = await this.#cardRequest({
      url: `/api/v1/card/${id}/topup`,
      method: 'post',
      data: {
        transactionId,
        cryptoId,
      },
      seed: 'cardholder',
    });
    if (result.error === 'TopupDisabledError') {
      throw new TopupDisabledError();
    }
  }

  async buy(productId, transactionId, cryptoId) {
    const result = await this.#cardRequest({
      url: '/api/v1/card',
      method: 'post',
      data: {
        productId,
        transactionId,
        cryptoId,
      },
      seed: 'cardholder',
    });
    if (result.error === 'BuyDisabledError') {
      throw new BuyDisabledError();
    }
  }

  async remove(id) {
    try {
      await this.#cardRequest({
        url: `/api/v1/card/${id}`,
        method: 'delete',
        seed: 'cardholder',
      });
    } catch (err) {
      console.error(err);
    }
  }

  async submitKyc(data) {
    return this.#cardRequest({
      url: '/api/v1/kyc',
      method: 'post',
      data,
      seed: 'cardholder',
      timeout: 300000,
    });
  }

  async #getConfig() {
    return this.#cardRequest({
      url: '/api/v1/config',
      method: 'get',
      seed: 'cardholder',
    });
  }
}
