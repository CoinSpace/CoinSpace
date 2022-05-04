const Dotenv = require('dotenv-webpack');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const autoprefixer = require('autoprefixer');
const common = require('./webpack.common.js');
const pkg = require('./package.json');
const path = require('path');

const dotEnv = new Dotenv({
  path: '.env.loc',
  safe: true,
  defaults: true,
});

module.exports = merge(common, {
  mode: 'development',
  snapshot: {
    managedPaths: [path.resolve(__dirname, '../node_modules')],
  },
  target: 'web',
  output: {
    publicPath: '/',
  },
  devServer: {
    open: true,
    allowedHosts: 'all',
    static: false,
    hot: true,
    port: 8000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        pathRewrite: {
          '^/api/v3': '/api/v3',
          '^/api/v2': '/api/v2',
          '^/api/v1': '/api/v1',
          '^/api': '',
        },
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.(sass|scss)$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  autoprefixer,
                ],
              },
            },
          },
          {
            loader: 'sass-loader',
          },
        ],
      },
    ],
  },
  plugins: [
    dotEnv,
    new webpack.DefinePlugin({
      'process.env.BUILD_TYPE': JSON.stringify('web'),
      'process.env.BUILD_PLATFORM': JSON.stringify('web'),
      'process.env.PLATFORM': JSON.stringify('web-web'),
      'process.env.RELEASE': JSON.stringify(`${pkg.name}.web-web@${pkg.version}`),
      'process.env.SENTRY_DSN': JSON.stringify(dotEnv.getEnvs().env.SENTRY_DSN),
    }),
  ],
});
