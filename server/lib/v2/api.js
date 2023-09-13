import OpenApiValidator from 'express-openapi-validator';
import esmresolver from '../esmresolver.js';
import express from 'express';
import { fileURLToPath } from 'url';
import wallets from '../v3/wallets.js';
import { asyncWrapper, verifyReq } from '../utils.js';

const api = express.Router();

api.use(asyncWrapper(async (req, res, next) => {
  if (req.query.id) {
    req.device = await wallets.getDevice(req.query.id);
  }
  next();
}));

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
      walletSignature(req) {
        if (req.device) {
          return verifyReq(req.device.wallet._id, req);
        }
        return false;
      },
      deviceSignature(req) {
        if (req.device) {
          return verifyReq(req.device._id, req);
        }
        return false;
      },
    },
  },
}));

export default api;
