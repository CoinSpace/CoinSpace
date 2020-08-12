'use strict';

const Dotenv = require('dotenv-webpack');
const webpack = require('webpack');
const merge = require('webpack-merge');
const autoprefixer = require('autoprefixer');
const common = require('./webpack.common.js');
const pkg = require('./package.json');

const dotEnv = new Dotenv({
  path: '.env.loc',
  safe: true,
  defaults: true,
});

module.exports = merge(common, {
  output: {
    publicPath: '/',
  },
  devServer: {
    disableHostCheck: true,
    contentBase: false,
    hot: true,
    port: 8000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        pathRewrite: {
          '^/api/v1' : '/api/v1',
          '^/api' : '',
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
              plugins: [
                autoprefixer,
              ],
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
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),
    dotEnv,
    new webpack.DefinePlugin({
      'process.env.BUILD_TYPE': JSON.stringify('web'),
      'process.env.SENTRY_RELEASE': JSON.stringify(`${pkg.name}.web@${pkg.version}`),
      'process.env.SENTRY_DSN': dotEnv.definitions['process.env.SENTRY_DSN'],
    }),
  ],
});
