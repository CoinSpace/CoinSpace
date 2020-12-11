'use strict';

const Dotenv = require('dotenv-webpack');
const webpack = require('webpack');
const merge = require('webpack-merge');
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
  output: {
    publicPath: '/',
  },
  devServer: {
    open: true,
    disableHostCheck: true,
    contentBase: false,
    hot: true,
    host: '0.0.0.0',
    port: 8000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        pathRewrite: {
          '^/api/v2' : '/api/v2',
          '^/api/v1' : '/api/v1',
          '^/api' : '',
        },
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: [
          path.resolve(__dirname, './node_modules/@simplewebauthn/browser/'),
        ],
        use: {
          loader: 'babel-loader',
          options: {
            presets: 'env',
            parserOpts: { plugins: ['objectRestSpread'] },
            plugins: ['transform-object-rest-spread'],
          },
        },
      },
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
      'process.env.RELEASE': JSON.stringify(`${pkg.name}.web@${pkg.version}`),
      'process.env.SENTRY_DSN': dotEnv.definitions['process.env.SENTRY_DSN'],
    }),
  ],
});
