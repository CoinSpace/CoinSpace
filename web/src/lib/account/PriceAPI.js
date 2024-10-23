import ExpiryMap from 'expiry-map';
import { chunks } from '../helpers.js';
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
        baseURL: import.meta.env.VITE_API_PRICE_URL + 'api/v1/',
      });
    }, {
      cache: new ExpiryMap(1 * 60 * 1000),
      cacheKey(args) {
        return JSON.stringify(args);
      },
    });
  }

  async market(ids, currency) {
    if (ids.length === 0) return [];
    return (await Promise.all(chunks(ids, 50).map((chunk) => {
      return this.#request({
        url: 'prices',
        params: {
          cryptoIds: chunk.join(),
          fiat: currency,
        },
      });
    }))).flat();
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
