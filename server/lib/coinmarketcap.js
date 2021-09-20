import axios from 'axios';
import axiosRetry from 'axios-retry';

const { COINMARKETCAP_API_KEY } = process.env;

const coinmarketcap = axios.create({
  baseURL: 'https://pro-api.coinmarketcap.com/',
  timeout: 60 * 1000,
  headers: {
    'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY,
  },
});

axiosRetry(coinmarketcap, {
  retries: 3,
  retryDelay: () => 30 * 1000,
  retryCondition: (err) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(err) || (err.response && err.response.status === 429);
  },
  shouldResetTimeout: true,
});

export default coinmarketcap;
