import createError from 'http-errors';
import cryptos from '../cryptos.js';
import fee from '../fee.js';
import csFee from '../csFee.js';
import mecto from '../mecto.js';
import storage from '../storage.js';
import moonpay from '../moonpay.js';

export async function qwe(req, res) {
  return res.status(200).send('ok');
}

export async function getCryptos(req, res) {
  const list = await cryptos.getAll();
  res.status(200).send(list);
}

export async function getTicker(req, res) {
  const ticker = await cryptos.getTicker(req.query.crypto);
  if (!ticker) {
    throw createError(404, 'Crypto not found');
  }
  res.status(200).send(ticker);
}

export async function getTickers(req, res) {
  const tickers = await cryptos.getTickers(req.query.crypto);
  res.status(200).send(tickers);
}

export async function getFees(req, res) {
  const fees = await fee.getFees(req.query.crypto);
  res.status(200).send(fees);
}

export async function getCsFee(req, res) {
  const fee = await csFee.getCsFee(req.query.crypto);
  res.status(200).send(fee);
}

export async function searchMecto(req, res) {
  const results = await mecto.search(req.device, req.query);
  res.status(200).send(results);
}

export async function saveMecto(req, res) {
  await mecto.save(req.device, req.body);
  res.status(200).send({ success: true });
}

export async function removeMecto(req, res) {
  await mecto.remove(req.device);
  res.status(200).send({ success: true });
}

export async function getStorage(req, res) {
  const data = await storage.getStorage(req.device, req.params.storageName);
  res.status(200).send({ data });
}

export async function setStorage(req, res) {
  const data = await storage.setStorage(req.device, req.params.storageName, req.body.data);
  res.status(200).send({ data });
}

export async function moonpaySign(req, res) {
  const urls = moonpay.sign(req.body.urls);
  res.status(200).send({ urls });
}
