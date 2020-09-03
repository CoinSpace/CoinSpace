'use strict';

const path = require('path');
const express = require('express');
const OpenApiValidator = require('express-openapi-validator');
const { verifyReq, asyncWrapper } = require('./utils');
const wallets = require('./wallets');

// TODO https://github.com/cdimascio/express-openapi-validator/pull/351#issuecomment-684743497
//const router = express.Router();
const router = express();

router.use('/api/v2/*', asyncWrapper(async (req, res, next) => {
  if (req.query.id) {
    req.device = await wallets.getDevice(req.query.id);
  }
  next();
}));

router.use(OpenApiValidator.middleware({
  apiSpec: path.join(__dirname, 'api.yaml'),
  // Validate responses only in dev environment
  validateResponses: process.NODE_ENV !== 'production',
  operationHandlers: path.join(__dirname),
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

module.exports = router;
