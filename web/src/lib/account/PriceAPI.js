import ExpiryMap from 'expiry-map';
import pMemoize from 'p-memoize';

const periodToDays = {
  '1D': 1,
  '7D': 7,
  '14D': 14,
  '1M': 30,
  '1Y': 365,
};

export default class PriceAPI {
  #request;

  constructor({ request }) {
    this.#request = pMemoize(async (config) => {
      return await request({
        seed: 'device',
        ...config,
        baseURL: 'https://price.coin.space/api/v1/',
      });
    }, {
      cache: new ExpiryMap(1 * 60 * 1000),
      cacheKey(args) {
        return JSON.stringify(args);
      },
    });
  }

  async market(ids, currency) {
    return await this.#request({
      url: 'prices',
      params: {
        cryptoIds: ids.join(),
        fiat: currency,
      },
    });
  }

  async chart(id, period, currency) {
    return await this.#request({
      url: `chart/${id}`,
      params: {
        fiat: currency,
        days: periodToDays[period],
      },
    });
  }
}
