const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const autoprefixer = require('autoprefixer');
const Dotenv = require('dotenv-webpack');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');
const polyfills = ['core-js/stable', 'regenerator-runtime/runtime'];

const envFile = process.env.ENV_FILE ? process.env.ENV_FILE : '.env.prod';
const WASM_JS_REGEXP = [
  /@emurgo\/cardano-serialization-lib-asmjs/,
  /@emurgo\/cardano-serialization-lib-browser/,
  /@coinspace\/monero-core-js-asm/,
  /@coinspace\/monero-core-js-wasm/,
];

const config = merge(common, {
  mode: 'production',
  output: {
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: [
          path.resolve(__dirname, './node_modules/lodash/'),
          path.resolve(__dirname, './node_modules/core-js/'),
          path.resolve(__dirname, './node_modules/regenerator-runtime/'),
          path.resolve(__dirname, './node_modules/regenerator-runtime/'),
          path.resolve(__dirname, './node_modules/@tronscan/client/src/protocol/core/Tron_pb.js'),
          /\.asm\.js$/,
        ],
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { useBuiltIns: 'usage', corejs: '3.0' }],
            ],
            plugins: [
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-proposal-private-methods',
            ],
            sourceType: 'unambiguous',
          },
        },
      },
      {
        test: /\.(sass|scss)$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: false,
            },
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
          'sass-loader',
        ],
      },
    ],
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new Dotenv({
      path: envFile,
      safe: true,
      systemvars: true,
    }),
    new MiniCssExtractPlugin({
      filename: 'assets/css/all.[contenthash:8].css',
    }),
    new webpack.SourceMapDevToolPlugin({
      filename: 'assets/js/[name].[fullhash:8].js.map',
      exclude: [...WASM_JS_REGEXP],
    }),
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new CssMinimizerPlugin(),
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: false,
          },
          mangle: {
            reserved: ['BigInteger', 'ECPair', 'Point', '_', 'RippleError', 'RippledError', 'UnexpectedError',
              'LedgerVersionError', 'ConnectionError', 'NotConnectedError',
              'DisconnectedError', 'TimeoutError', 'ResponseFormatError',
              'ValidationError', 'NotFoundError', 'MissingLedgerHistoryError',
              'PendingLedgerVersionError',
            ],
          },
        },
        exclude: [...WASM_JS_REGEXP],
        extractComments: false,
      }),
    ],
  },
});

if (process.env.BUILD_TYPE === 'phonegap') {
  const htmlPlugin = config.plugins.find((plugin) => {
    return plugin instanceof HtmlWebpackPlugin;
  });
  htmlPlugin.userOptions.chunks = ['deviceready'];

  config.entry['deviceready'] = polyfills.concat('./phonegap/deviceready.js');
  delete config.entry['loader'];

  config.output.publicPath = '';
} else if (process.env.BUILD_TYPE === 'electron') {
  config.plugins.push(new HtmlWebpackPlugin({
    inject: false,
    template: 'electron/env.ejs',
    filename: 'env.json',
  }));
  config.output.publicPath = './';
}

module.exports = config;
