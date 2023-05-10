import csFee from '../csFee.js';
import storage from '../storage.js';

export async function getCsFee(req, res) {
  const fee = await csFee.getCsFeeV4(req.query.crypto);
  res.status(200).send(fee);
}

export async function getCsFeeAddresses(req, res) {
  const addresses = await csFee.getCsFeeAddressesV4(req.query.crypto);
  res.status(200).send(addresses);
}

export async function getStorage(req, res) {
  const device = await req.getDevice();
  const data = await storage.getStorage(device, req.params.storageName);
  res.status(200).send({ data });
}

export async function setStorage(req, res) {
  const device = await req.getDevice();
  const data = await storage.setStorage(device, req.params.storageName, req.body.data);
  res.status(200).send({ data });
}
