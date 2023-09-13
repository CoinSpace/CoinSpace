import OpenApiValidator from 'express-openapi-validator';
import esmresolver from '../esmresolver.js';
import express from 'express';
import { fileURLToPath } from 'url';
import { verifyReq } from '../utils.js';
import wallets from '../wallets.js';

const { API_KEY } = process.env;

if (!API_KEY) {
  throw new Error('API_KEY is required');
}

const api = express.Router();

api.use((req, res, next) => {
  req.getDevice = () => {
    if (!req._device) {
      req._device = wallets.getDevice(req.query.id);
    }
    return req._device;
  };
  next();
});

api.use(OpenApiValidator.middleware({
  apiSpec: fileURLToPath(new URL('./api.yaml', import.meta.url)),
  // Validate responses only in dev environment
  validateResponses: process.env.NODE_ENV !== 'production',
  operationHandlers: {
    basePath: fileURLToPath(new URL('.', import.meta.url)),
    resolver: esmresolver,
  },
  validateSecurity: {
    handlers: {
      async walletSignature(req) {
        const device = await req.getDevice();
        return verifyReq(device.wallet._id, req);
      },
      async deviceSignature(req) {
        const device = await req.getDevice();
        return verifyReq(device._id, req);
      },
      apiKey(req) {
        return req.query.apikey === API_KEY;
      },
    },
  },
}));

export default api;
