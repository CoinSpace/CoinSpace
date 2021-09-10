'use strict';

const tokens = require('../tokens');
const cryptos = require('../cryptos');
const { asyncWrapper } = require('../v2/utils');

exports.qwe = asyncWrapper(async (req, res) => {
  return res.status(200).send('ok');
});

exports.getCryptos = asyncWrapper(async (req, res) => {
  const list = await cryptos.getAll();
  res.status(200).send(list);
});

exports.getTickers = asyncWrapper(async (req, res) => {
  // TODO: move to crypto collection
  const tickers = await tokens.getTickersV3(req.query.crypto);
  res.status(200).send(tickers);
});
