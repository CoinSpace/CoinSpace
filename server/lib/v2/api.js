'use strict';

const path = require('path');
const express = require('express');
const OpenApiValidator = require('express-openapi-validator');
const { verifyReq } = require('./utils');
const device = require('./device');

// TODO https://github.com/cdimascio/express-openapi-validator/pull/351#issuecomment-684743497
//const router = express.Router();
const router = express();

router.use(OpenApiValidator.middleware({
  apiSpec: path.join(__dirname, 'api.yaml'),
  // Validate responses only in dev environment
  validateResponses: process.NODE_ENV !== 'production',
  operationHandlers: path.join(__dirname),
  validateSecurity: {
    handlers: {
      async walletSignature(req) {
        const wallet = await device.getWallet(req.query.id);
        return verifyReq(wallet._id, req);
      },
      async deviceSignature(req) {
        return verifyReq(req.query.id, req);
      },
    },
  },
}));

module.exports = router;
