import Axios from 'axios';
import ExpiryMap from 'expiry-map';
import axiosRetry from 'axios-retry';
import pMemoize, { pMemoizeClear } from 'p-memoize';

const MARKET_PER_PAGE = 250;
const PRICE_PER_PAGE = 500;

export default class CoingeckoAPI {
  #axios;
  #api;
  #request;

  constructor({ request }) {
    const axios = Axios.create({
      baseURL: 'https://api.coingecko.com/api/v3/',
      timeout: 30000,
    });
    axiosRetry(axios, {
      retries: 3,
      retryDelay: (retryCount) => {
        return axiosRetry.exponentialDelay(retryCount);
      },
      retryCondition: (err) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(err) && err.code !== 'ERR_NETWORK';
      },
      shouldResetTimeout: true,
    });
    this.#axios = axios;
    this.#api = pMemoize(async (config) => {
      const response = await this.#axios.request(config);
      return response.data;
    }, {
      cache: new ExpiryMap(5 * 60 * 1000),
      cacheKey(args) {
        return JSON.stringify(args);
      },
    });

    this.#request = pMemoize(async (config) => {
      return await request(config);
    }, {
      cache: new ExpiryMap(5 * 60 * 1000),
      cacheKey(args) {
        return JSON.stringify(args);
      },
    });
  }

  async #market(ids, currency) {
    try {
      return await this.#api({
        url: 'coins/markets',
        params: {
          ids,
          vs_currency: currency,
          price_change_percentage: '24h,7d,14d,30d,1y',
        },
      });
    } catch (err) {
      return await this.#request({
        url: 'api/v4/market',
        method: 'get',
        seed: 'device',
        params: {
          ids,
          currency,
        },
      });
    }
  }

  async market(ids, currency) {
    const data = [];
    for (let i = 0; i < Math.ceil(ids.length / MARKET_PER_PAGE); i++) {
      data.push(...await this.#market(ids.slice(MARKET_PER_PAGE * i, MARKET_PER_PAGE * (i + 1)).join(','), currency));
    }
    return data;
  }

  async chart(id, days, currency) {
    return await this.#api({
      url: `coins/${id}/market_chart`,
      params: {
        vs_currency: currency,
        days,
        precision: 'auto',
      },
    });
  }

  clearCache() {
    pMemoizeClear(this.#api);
    pMemoizeClear(this.#request);
  }
}
