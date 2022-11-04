import request from 'lib/request';

async function load(countryCode, crypto, address) {
  if (!countryCode) {
    return { buy: [], sell: [] };
  }
  const result = await request({
    url: `${process.env.SITE_URL}api/v3/ramps`,
    params: {
      countryCode,
      crypto: crypto._id,
      address,
    },
    seed: 'public',
  });
  return result;
}

export default {
  load,
};
