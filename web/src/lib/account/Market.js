import CoingeckoAPI from './CoingeckoAPI.js';

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
  #coingeckoAPI;
  #coingeckoIDs = [];

  constructor({ cryptoDB }) {
    if (!cryptoDB) {
      throw new TypeError('cryptoDB is required');
    }
    this.#cryptoDB = cryptoDB;
    this.#coingeckoAPI = new CoingeckoAPI();
  }

  async init({ cryptos }) {
    this.#coingeckoIDs = [...new Set(cryptos
      .map((crypto) => crypto.coingecko?.id)
      .filter((crypto) => !!crypto)
    )];
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
    if (!this.#coingeckoIDs.includes(crypto.coingecko.id)) {
      this.#coingeckoIDs.push(crypto.coingecko.id);
    }
    const data = await this.#coingeckoAPI.market(this.#coingeckoIDs, currency);
    const item = data.find((item) => item.id === crypto.coingecko.id);
    if (!item) return;
    return {
      price: item.current_price,
      change: {
        '1d': item.price_change_percentage_24h_in_currency,
        '7d': item.price_change_percentage_7d_in_currency,
        '14d': item.price_change_percentage_14d_in_currency,
        '30d': item.price_change_percentage_30d_in_currency,
        '365d': item.price_change_percentage_1y_in_currency,
      },
    };
  }

  async getChartData(id, days, currency) {
    const crypto = this.#cryptoDB.get(id);
    if (!crypto || !crypto.coingecko?.id) {
      return [];
    }
    const data = await this.#coingeckoAPI.chart(crypto.coingecko.id, days, currency);
    if (!data?.prices) {
      return [];
    }
    return data.prices.map(([, price]) => price);
  }

  clearCache() {
    this.#coingeckoAPI.clearCache();
  }
}
