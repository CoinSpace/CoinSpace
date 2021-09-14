import tokens from '../tokens.js';
import cryptos from '../cryptos.js';

export async function qwe(req, res) {
  return res.status(200).send('ok');
}

export async function getCryptos(req, res) {
  const list = await cryptos.getAll();
  res.status(200).send(list);
}

export async function getTickers(req, res) {
  // TODO: move to crypto collection
  const tickers = await tokens.getTickersV3(req.query.crypto);
  res.status(200).send(tickers);
}
