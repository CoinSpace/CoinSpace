import PriceAPI from './PriceAPI.js';

export const currencies = [
  'AED', 'ARS', 'AUD', 'BDT', 'BHD',
  'BMD', 'BRL', 'CAD', 'CHF', 'CLP',
  'CNY', 'CZK', 'DKK', 'EUR', 'GBP',
  'HKD', 'HUF', 'IDR', 'ILS', 'INR',
  'JPY', 'KRW', 'KWD', 'LKR', 'MMK',
  'MXN', 'MYR', 'NGN', 'NOK', 'NZD',
  'PHP', 'PKR', 'PLN', 'RUB', 'SAR',
  'SEK', 'SGD', 'THB', 'TRY', 'TWD',
  'UAH', 'USD', 'VEF', 'VND', 'ZAR',
];

export default class Market {
  #cryptoDB;
  #priceAPI;
  #cryptoIds = [];

  constructor({ cryptoDB, request, account }) {
    if (!cryptoDB) {
      throw new TypeError('cryptoDB is required');
    }
    this.#cryptoDB = cryptoDB;
    this.#priceAPI = new PriceAPI({ request, account });
  }

  async init({ cryptos, currency }) {
    this.#cryptoIds = [...new Set(cryptos
      .filter((crypto) => crypto.coingecko?.id)
      .map((crypto) => crypto._id)
    )];
    // cache market
    await this.#priceAPI.market(this.#cryptoIds, currency);
  }

  async getPrice(id, currency) {
    const market = await this.getMarket(id, currency);
    if (market) {
      return market.price;
    }
  }

  async getMarket(id, currency) {
    const crypto = this.#cryptoDB.get(id);
    if (!crypto || !crypto.coingecko?.id) return;
    if (!currencies.includes(currency)) return;
    if (!this.#cryptoIds.includes(crypto._id)) {
      this.#cryptoIds.push(crypto._id);
    }
    const data = await this.#priceAPI.market(this.#cryptoIds, currency);
    const item = data.find((item) => item.cryptoId === crypto._id);
    if (!item) return;
    return {
      price: item.price,
      change: {
        '1D': item.price_change_1d,
        '7D': item.price_change_7d,
        '14D': item.price_change_14d,
        '1M': item.price_change_1m,
        '1Y': item.price_change_1y,
      },
    };
  }

  async getChartData(id, period, currency) {
    const crypto = this.#cryptoDB.get(id);
    if (!crypto || !crypto.coingecko?.id) {
      return [];
    }
    const data = await this.#priceAPI.chart(crypto._id, period, currency);
    return data.map((item) => item.price).reverse();
  }
}
