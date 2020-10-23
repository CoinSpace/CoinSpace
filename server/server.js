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

const db = require('./lib/v1/db');

middleware.init(app);

// API routes
app.use('/api/v1', apiV1);
app.use('/api/v2', apiV2);
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
}).catch((error) => {
  console.error('error', error);
});
