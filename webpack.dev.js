const Dotenv = require('dotenv-webpack');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const autoprefixer = require('autoprefixer');
const common = require('./webpack.common.js');
const pkg = require('./package.json');

const dotEnv = new Dotenv({
  path: '.env.loc',
  safe: true,
  defaults: true,
});

module.exports = merge(common, {
  mode: 'development',
  cache: true, // set "false" cache while "npm link"
  target: 'web',
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
          '^/api/v3' : '/api/v3',
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
    new webpack.HotModuleReplacementPlugin(),
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
