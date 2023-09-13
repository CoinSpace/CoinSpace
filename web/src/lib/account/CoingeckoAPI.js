import Axios from 'axios';
import ExpiryMap from 'expiry-map';
import axiosRetry from 'axios-retry';
import pMemoize, { pMemoizeClear } from 'p-memoize';

const MARKET_PER_PAGE = 250;
const PRICE_PER_PAGE = 500;

export default class CoingeckoAPI {
  #axios;
  #request;

  constructor() {
    const axios = Axios.create({
      baseURL: 'https://api.coingecko.com/api/v3/',
      timeout: 30000,
    });
    axiosRetry(axios, {
      retries: 3,
      retryDelay: (retryCount, err) => {
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After
        if (err?.response?.headers['retry-after']) {
          const retryAfter = err.response.headers['retry-after'];
          let after = Number(retryAfter);
          if (Number.isNaN(after)) {
            // Retry-After: <http-date>
            after = Date.parse(retryAfter) - Date.now();
          } else {
            // Retry-After: <delay-seconds>
            after *= 1000;
          }
          return after;
        }
        return axiosRetry.exponentialDelay(retryCount);
      },
      retryCondition: (err) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(err) || (err.response && err.response.status === 429);
      },
      shouldResetTimeout: true,
    });
    this.#axios = axios;
    this.#request = pMemoize(async (config) => {
      const response = await this.#axios.request(config);
      return response.data;
    }, {
      cache: new ExpiryMap(5 * 60 * 1000),
      cacheKey(args) {
        return JSON.stringify(args);
      },
    });
  }

  async price(ids, currencies) {
    let data = {};
    for (let i = 0; i < Math.ceil(ids.length / PRICE_PER_PAGE); i++) {
      data = {
        ...data,
        ...await this.#request({
          url: 'simple/price',
          params: {
            ids: ids.slice(PRICE_PER_PAGE * i, PRICE_PER_PAGE * (i + 1)).join(','),
            vs_currencies: currencies.join(','),
          },
        }),
      };
    }
    return data;
  }

  async market(ids, currency) {
    const data = [];
    for (let i = 0; i < Math.ceil(ids.length / MARKET_PER_PAGE); i++) {
      data.push(...await this.#request({
        url: 'coins/markets',
        params: {
          ids: ids.slice(MARKET_PER_PAGE * i, MARKET_PER_PAGE * (i + 1)).join(','),
          vs_currency: currency,
          price_change_percentage: '24h,7d,14d,30d,1y',
        },
      }));
    }
    return data;
  }

  async chart(id, days, currency) {
    return await this.#request({
      url: `coins/${id}/market_chart`,
      params: {
        vs_currency: currency,
        days,
        precision: 'auto',
      },
    });
  }

  clearCache() {
    pMemoizeClear(this.#request);
  }
}
