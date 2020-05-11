'use strict';

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const autoprefixer = require('autoprefixer');
const Dotenv = require('dotenv-webpack');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

const envFile = process.env.ENV_FILE ? process.env.ENV_FILE : '.env.prod';

var config = merge(common, {
  output: {
    publicPath: '/',
  },
  devtool: 'hidden-source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [
          path.resolve(__dirname, './phonegap/deviceready'),
          path.resolve(__dirname, './app/loader'),
          path.resolve(__dirname, './app/lib/i18n'),
          /node_modules\/lodash/,
          /node_modules\/ethjs-util/,
          /node_modules\/eosjs/,
          /node_modules\/js-xdr/,
          /node_modules\/clipboard/,
          /node_modules\/@sentry/,
        ],
        use: {
          loader: 'babel-loader',
          options: {
            presets: [[
              'env', {
                useBuiltIns: 'entry',
              },
            ]],
          },
        },
      },
      {
        test: /\.(sass|scss)$/,
        use: ExtractTextPlugin.extract({
          use: [
            {
              loader: 'css-loader',
              options: {
                minimize: true,
              },
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
          fallback: 'style-loader',
          publicPath: '../../',
        }),
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(['./build'], {verbose: false}),
    new ProgressBarPlugin(),
    new Dotenv({
      path: envFile,
      safe: true,
    }),
    new UglifyJSPlugin({
      sourceMap: true,
      uglifyOptions: {
        mangle: {
          reserved: ['BigInteger','ECPair','Point', '_', 'RippleError', 'RippledError', 'UnexpectedError',
            'LedgerVersionError', 'ConnectionError', 'NotConnectedError',
            'DisconnectedError', 'TimeoutError', 'ResponseFormatError',
            'ValidationError', 'NotFoundError', 'MissingLedgerHistoryError',
            'PendingLedgerVersionError',
          ],
        },
      },
    }),
    new ExtractTextPlugin({
      filename: 'assets/css/all.[contenthash:8].css',
      allChunks: true,
    }),
    new CopyWebpackPlugin([
      {
        from: `app/apple-developer-merchantid-domain-association.${process.env.ENV}.txt`,
        to: '.well-known/apple-developer-merchantid-domain-association.txt',
      },
    ]),
  ],
});

if (process.env.BUILD_TYPE === 'phonegap') {
  var htmlPlugin = config.plugins.find(function(plugin) {
    return plugin instanceof HtmlWebpackPlugin;
  });
  htmlPlugin.options.chunks = ['deviceready'];

  config.entry['deviceready'] = './phonegap/deviceready.js';
  delete config.entry['loader'];

  config.output.publicPath = '';
} else if (process.env.BUILD_TYPE === 'electron') {
  config.output.publicPath = './';
}

module.exports = config;
