import Integrations from '@sentry/integrations';
import Sentry from '@sentry/node';
import express from 'express';
import { isHttpError } from 'http-errors';
import middleware from './middleware.js';

import apiV1 from './lib/v1/api.js';
import apiV2 from './lib/v2/api.js';
import apiV3 from './lib/v3/api.js';
import apiV4 from './lib/v4/api.js';

const app = express();

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: `coin.server@${process.env.npm_package_version}`,
  integrations: [
    new Integrations.CaptureConsole({
      levels: ['error'],
    }),
  ],
});
app.use(Sentry.Handlers.requestHandler());

middleware.init(app);

// API routes
app.use('/api/v1', apiV1);
app.use('/api/v2', apiV2);
app.use('/api/v3', apiV3);
app.use('/api/v4', apiV4);
app.set('views', './server/views');
app.set('view engine', 'ejs');

app.use(Sentry.Handlers.errorHandler());

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.log(err.stack || err.message || err);
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

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  console.info('server listening on http://localhost:' + server.address().port);
  server.timeout = 30000; // 30 sec
});
