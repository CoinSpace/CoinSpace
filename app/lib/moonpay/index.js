import request from 'lib/request';
import countryList from 'country-list';
const apiKey = process.env.MOONPAY_API_KEY;
const state = { ip: {} };
let isInited = false;

async function init() {
  if (isInited) return true;
  isInited = true;
  try {
    const ip = await request({
      url: 'https://api.moonpay.com/v4/ip_address',
      params: { apiKey },
      hideFlashError: true,
    });
    state.ip = ip;
  } catch (err) {
    if (err.message !== 'Network Error') {
      console.error(err);
    }
  }
}

function getCountryCode() {
  return countryList.getName(state.ip.alpha2) && state.ip.alpha2;
}

export default {
  init,
  getCountryCode,
};
