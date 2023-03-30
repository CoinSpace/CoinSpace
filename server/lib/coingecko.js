import axios from 'axios';
import axiosRetry from 'axios-retry';
import rateLimit from 'axios-rate-limit';

const coingecko = axios.create({
  baseURL: 'https://api.coingecko.com/api/v3',
  timeout: 30000,
  ...process.env.COINGECKO_API_KEY ? {
    baseURL: 'https://pro-api.coingecko.com/api/v3',
    headers: {
      'x-cg-pro-api-key': process.env.COINGECKO_API_KEY,
    },
  } : {},
});

axiosRetry(coingecko, {
  retries: 3,
  retryDelay: () => 30 * 1000,
  retryCondition: (err) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(err) || (err.response && err.response.status === 429);
  },
  shouldResetTimeout: true,
});

rateLimit(coingecko, {
  maxRequests: 100,
  // per minute
  perMilliseconds: 60 * 1000,
});

export default coingecko;
