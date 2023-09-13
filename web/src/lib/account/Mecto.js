export class GeolocationNotSupported extends Error {
  name = 'GeolocationNotSupported';
}

export class GeolocationError extends Error {
  name = 'GeolocationError';
}

export default class Mecto {
  #request;
  #account;

  get isAccountSetup() {
    return !!this.#account.user.username;
  }

  constructor({ request, account }) {
    if (!request) throw new TypeError('request is required');
    if (!account) throw new TypeError('account is required');
    this.#request = request;
    this.#account = account;
  }

  async enable(address) {
    const { latitude, longitude } = await this.#getLocation();
    return this.#request({
      url: 'api/v4/mecto',
      method: 'put',
      data: {
        username: this.#account.user.username,
        avatar: this.#account.user.avatar,
        address,
        lat: latitude,
        lon: longitude,
      },
      seed: 'device',
    });
  }

  async disable() {
    return this.#request({
      url: 'api/v4/mecto',
      method: 'delete',
      seed: 'device',
    });
  }

  async search() {
    const { latitude, longitude } = await this.#getLocation();
    const results = await this.#request({
      url: 'api/v4/mecto',
      params: {
        lat: latitude,
        lon: longitude,
      },
      method: 'get',
      seed: 'device',
    });
    return results;
  }

  async #getLocation() {
    return new Promise((resolve, reject) => {
      if (!window.navigator.geolocation) {
        return reject(new GeolocationNotSupported('Your browser does not support geolocation'));
      }

      const options = import.meta.env.VITE_BUILD_TYPE === 'electron' ? {
        enableHighAccuracy: true,
      } : {};

      const alert = navigator.notification ? navigator.notification.alert : window.alert;

      window.navigator.geolocation.getCurrentPosition(
        (position) => { resolve(position.coords); },
        (err) => {
          alert(
            'Access to the geolocation has been prohibited; please enable it in the Settings app to continue',
            () => {},
            'Coin Wallet'
          );
          reject(new GeolocationError('Unable to retrieve your location', {
            cause: err,
          }));
        },
        options
      );
    });
  }
}
