import CountryList from 'country-list';

export default class Ramps {
  #countries = [];
  #account;
  #request;
  #rampRequest;
  #countryCode;

  get countries() {
    return this.#countries;
  }

  constructor({ request, account }) {
    if (!request) {
      throw new TypeError('request is required');
    }
    this.#account = account;
    this.#request = request;
    this.#rampRequest = (config) => request({
      ...config,
      baseURL: this.#account.getBaseURL('ramp'),
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

  #mapProviders(items) {
    return items.map((info) => {
      return {
        ...info,
        logo: new URL(
          `/logo/${info.logo}?ver=${import.meta.env.VITE_VERSION}`,
          this.#account.getBaseURL('ramp')
        ).toString(),
      };
    });
  }

  async buy(countryCode, wallet) {
    if (wallet.crypto.custom) {
      return [];
    }
    const ramps = await this.#rampRequest({
      url: 'api/v1/buy',
      params: {
        country: countryCode || null,
        crypto: wallet.crypto._id,
        address: wallet.address,
      },
      method: 'get',
      seed: 'device',
    });
    return this.#mapProviders(ramps);
  }

  async sell(countryCode, wallet) {
    if (wallet.crypto.custom) {
      return [];
    }
    const ramps = await this.#rampRequest({
      url: 'api/v1/sell',
      params: {
        country: countryCode || null,
        crypto: wallet.crypto._id,
        address: wallet.address,
      },
      method: 'get',
      seed: 'device',
    });
    return this.#mapProviders(ramps);
  }
}
