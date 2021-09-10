'use strict';

const path = require('path');
const express = require('express');
const OpenApiValidator = require('express-openapi-validator');
const { verifyReq, asyncWrapper } = require('../v2/utils');
const wallets = require('../v2/wallets');

const router = express.Router();

router.use(asyncWrapper(async (req, res, next) => {
  if (req.query.id) {
    req.device = await wallets.getDevice(req.query.id);
  }
  next();
}));
router.use(OpenApiValidator.middleware({
  apiSpec: path.join(__dirname, 'api.yaml'),
  // Validate responses only in dev environment
  validateResponses: process.env.NODE_ENV !== 'production',
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
