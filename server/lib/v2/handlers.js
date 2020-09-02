'use strict';

const device = require('./device');
const { asyncWrapper, verifyReq } = require('./utils');

exports.register = asyncWrapper(async (req, res) => {
  await verifyReq(req.body.walletId, req);
  const info = await device.register(req.body.walletId, req.body.deviceId, req.body.pinHash);
  console.log('registered wallet: %s device: %s', req.body.walletId, req.body.deviceId);
  res.status(201).send(info);
});

// Public

exports.tokenPublicPinVerify = asyncWrapper(async (req, res) => {
  const info = await device.tokenPublicPinVerify(req.query.id, req.body.pinHash);
  res.status(200).send(info);
});

exports.tokenPublicPlatformOptions = asyncWrapper(async (req, res) => {
  const options = await device.tokenPublicPlatformOptions(req.query.id);
  res.status(200).send(options);
});

exports.tokenPublicPlatformVerify = asyncWrapper(async (req, res) => {
  const info = await device.tokenPublicPlatformVerify(req.query.id, req.body);
  res.status(200).send(info);
});

// Private

exports.tokenPrivate = asyncWrapper(async (req, res) => {
  const info = device.tokenPrivate(req.query.id);
  res.status(200).send(info);
});

exports.tokenPrivatePinVerify = asyncWrapper(async (req, res) => {
  const info = await device.tokenPrivatePinVerify(req.query.id, req.body.pinHash);
  res.status(200).send(info);
});

exports.tokenPrivatePlatformOptions = asyncWrapper(async (req, res) => {
  const options = await device.tokenPrivatePlatformOptions(req.query.id);
  res.status(200).send(options);
});

exports.tokenPrivatePlatformVerify = asyncWrapper(async (req, res) => {
  const options = await device.tokenPrivatePlatformVerify(req.query.id);
  res.status(200).send(options);
});

exports.tokenPrivateCrossplatformOptions = asyncWrapper(async (req, res) => {
  const options = await device.tokenPrivateCrossplatformOptions(req.query.id);
  res.status(200).send(options);
});

exports.tokenPrivateCrossplatformVerify = asyncWrapper(async (req, res) => {
  const info = await device.tokenPrivateCrossplatformVerify(req.query.id, req.body);
  res.status(200).send(info);
});

// Attestation

exports.platformAttestationOptions = asyncWrapper(async (req, res) => {
  const options = await device.platformAttestationOptions(req.query.id);
  res.status(200).send(options);
});

exports.platformAttestationVerify = asyncWrapper(async (req, res) => {
  const info = await device.platformAttestationVerify(req.query.id, req.body);
  res.status(200).send(info);
});

exports.crossplatformAttestationOptions = asyncWrapper(async (req, res) => {
  const options = await device.crossplatformAttestationOptions(req.query.id);
  res.status(200).send(options);
});

exports.crossplatformAttestationVerify = asyncWrapper(async (req, res) => {
  const info = await device.crossplatformAttestationVerify(req.query.id, req.body);
  res.status(200).send(info);
});

// API

exports.listCrossplatformAuthenticators = asyncWrapper(async (req, res) => {
  const info = await device.listCrossplatformAuthenticators(req.query.id);
  res.status(200).send(info);
});

exports.removeCrossplatformAuthenticator = asyncWrapper(async (req, res) => {
  const info = await device.removeCrossplatformAuthenticator(req.query.id, req.body.credentialID);
  res.status(200).send(info);
});

exports.getDetails = asyncWrapper(async (req, res) => {
  const data = await device.getDetails(req.query.id);
  res.status(200).send({ data });
});

exports.setDetails = asyncWrapper(async (req, res) => {
  const data = await device.setDetails(req.query.id, req.body.data);
  res.status(200).send({ data });
});

exports.setUsername = asyncWrapper(async (req, res) => {
  const username = await device.setUsername(req.query.id, req.body.username);
  res.status(200).send({ username });
});

exports.removeDevice = asyncWrapper(async (req, res) => {
  const info = await device.removeDevice(req.query.id);
  res.status(200).send(info);
});

exports.removeWallet = asyncWrapper(async (req, res) => {
  const info = await device.removeWallet(req.query.id);
  res.status(200).send(info);
});
