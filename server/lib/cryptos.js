import cryptoDB from '@coinspace/crypto-db';

const CRYPTOS = cryptoDB.filter((item) => item.deprecated !== true);

async function getAll() {
  return CRYPTOS;
}

export default {
  getAll,
};
