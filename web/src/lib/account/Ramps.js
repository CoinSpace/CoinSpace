import Axios from 'axios';
import CountryList from 'country-list';
import axiosRetry from 'axios-retry';

export default class Ramps {
  #moonpay;
  #countries = [];
  #request;
  #countryCode;

  get countries() {
    return this.#countries;
  }

  constructor({ request }) {
    if (!request) {
      throw new TypeError('request is required');
    }
    this.#request = request;

    const moonpay = Axios.create({
      timeout: 30000,
      baseURL: 'https://api.moonpay.com/',
      params: { apiKey: import.meta.env.VITE_MOONPAY_API_KEY },
    });
    axiosRetry(moonpay, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      shouldResetTimeout: true,
    });
    this.#moonpay = moonpay;

    this.#countries = [{ value: '', name: '–' }, ...CountryList.getData().sort((a, b) => {
      return a.name.localeCompare(b.name);
    }).map((item) => {
      return {
        value: item.code,
        name: item.name,
      };
    })];
  }

  async getCountryCode() {
    if (this.#countryCode !== undefined) return this.#countryCode;
    try {
      const { data: ip } = await this.#moonpay.request({ url: 'v4/ip_address' });
      return CountryList.getName(ip.alpha2 || '') && ip.alpha2;
    } catch (err) {
      console.error(err);
    }
  }

  setCountryCode(value) {
    this.#countryCode = value;
  }

  async buy(countryCode, wallet) {
    if (wallet.crypto.custom) {
      return [];
    }
    const ramps = await this.#request({
      url: 'api/v4/ramps/buy',
      params: {
        countryCode: countryCode || null,
        crypto: wallet.crypto._id,
        address: wallet.address,
      },
      method: 'get',
      seed: 'device',
    });
    return ramps;
  }

  async sell(countryCode, wallet) {
    if (wallet.crypto.custom) {
      return [];
    }
    const ramps = await this.#request({
      url: 'api/v4/ramps/sell',
      params: {
        countryCode: countryCode || null,
        crypto: wallet.crypto._id,
        address: wallet.address,
      },
      method: 'get',
      seed: 'device',
    });
    return ramps;
  }
}
