import Axios from 'axios';
const axios = Axios.create({ timeout: 30000 });
import buildURL from 'axios/lib/helpers/buildURL.js';
import combineURLs from 'axios/lib/helpers/combineURLs.js';
import axiosRetry from 'axios-retry';
import LS from 'lib/wallet/localStorage';
import { showError } from 'widgets/modals/flash';
import { translate } from 'lib/i18n';
import { eddsa } from 'elliptic';
const ec = new eddsa('ed25519');
import crypto from 'crypto';
import seeds from 'lib/wallet/seeds';

axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay, shouldResetTimeout: true });

axios.interceptors.request.use((config) => {
  if (config.intercepted === true) {
    return config;
  }
  if (config.baseURL) {
    config.url = combineURLs(config.baseURL, config.url);
    delete config.baseURL;
  }
  if (!config.url.startsWith(process.env.SITE_URL)) {
    config.intercepted = true;
    return config;
  }
  if (!config.method) {
    config.method = 'get';
  }

  if ((config.seed && config.id !== false) || config.id === true) {
    // object spread not supported
    config.params = Object.assign({
      id: LS.getId(),
    }, config.params);
  }

  if (config.params) {
    config.url = buildURL(config.url, config.params);
    delete config.params;
  }

  const date = (new Date()).toUTCString();
  config.headers = config.headers || {};
  config.headers['X-Release'] = process.env.RELEASE;
  config.headers['X-Date'] = date;

  if (config.seed) {
    const secret = seeds.get(config.seed);
    const privateKey = ec.keyFromSecret(secret);

    const body = config.data && JSON.stringify(config.data);
    const base = [
      config.method,
      config.url,
      date,
      process.env.RELEASE,
    ];
    if (config.method !== 'get' && body) {
      base.push(crypto.createHash('sha256').update(body).digest().toString('hex'));
    }
    const signature = privateKey.sign(Buffer.from(base.join(' '))).toHex();
    config.headers['Signature'] = signature;
  }

  config.intercepted = true;
  return config;
});

function request(config = {}) {
  return axios.request(config)
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      // TODO handle 401
      if (config.disableDefaultCatch) {
        throw err;
      }
      if (err.response) {
        const error = new Error(err.response.data.error || err.response.data.message || err.response.data);
        error.status = err.response.status;
        error.url = err.config.url;
        error.method = err.config.method;
        throw error;
      } else if (err.request) {
        if (!config.hideFlashError) {
          showError({ message: translate('Request timeout. Please check your internet connection.') });
        }
        throw err;
      } else {
        throw err;
      }
    });
}

export default request;
