'use strict';

const express = require('express');
const Sentry = require('@sentry/node');
const Integrations = require('@sentry/integrations');
const middleware = require('./middleware');
const { isHttpError } = require('http-errors');

const apiV1 = require('./lib/v1/api');
const apiV2 = require('./lib/v2/api');
const app = express();

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT,
  release: `coin.server@${process.env.npm_package_version}`,
  integrations: [
    new Integrations.CaptureConsole({
      levels: ['error'],
    }),
  ],
});
app.use(Sentry.Handlers.requestHandler());

const master = require('./lib/v1/master');
const db = require('./lib/v1/db');

middleware.init(app);

// API routes
app.use('/api/v1', apiV1);
// TODO https://github.com/cdimascio/express-openapi-validator/pull/351#issuecomment-684743497
//app.use('/api/v2', apiV2);
app.use(apiV2);
app.set('views', './server/views');
app.set('view engine', 'ejs');

app.use(Sentry.Handlers.errorHandler());

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack || err.message || err);
  const status = err.status || 500;

  res.status(status);

  if (isHttpError(err)) {
    res.send({
      error: err.expose === true ? err.message : err.name,
      code: status,
    });
  } else {
    res.send({
      error: 'Oops! something went wrong.',
      code: status,
    });
  }
});

// eslint-disable-next-line no-unused-vars
app.use((req, res, next) => {
  res.status(404).send({ error: 'Oops! page not found.' });
});

db().then(() => {
  const port = process.env.PORT || 8080;
  const server = app.listen(port, () => {
    console.info('server listening on http://localhost:' + server.address().port);
    server.timeout = 30000; // 30 sec
  });

  if (process.env.MASTER === '1') {
    master.cleanGeo(60 * 60 * 1000); // 1 hour
    master.cacheFees(60 * 60 * 1000); // 1 hour
    master.cacheTicker(1 * 60 * 1000); // 1 minute
    master.cacheEthereumTokens(1 * 60 * 1000); // 1 minute
    master.cacheMoonpayCurrencies(60 * 60 * 1000); // 1 hour
    master.cacheMoonpayCountries(60 * 60 * 1000); // 1 hour
    master.cacheGithubReleases(10 * 60 * 1000); // 10 minutes
  }
}).catch((error) => {
  console.log('error', error);
});
