const Dotenv = require('dotenv-webpack');
const webpack = require('webpack');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

const dotEnv = new Dotenv({
  path: '.env.loc',
  safe: true
});

module.exports = merge(common, {
  output: {
    publicPath: '/'
  },
  devServer: {
    contentBase: false,
    hot: true,
    port: 8000,
    proxy: {
      '/api': {
        target: 'http://localhost:' + dotEnv.definitions['process.env.PORT'],
        pathRewrite: {'^/api' : ''}
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.(sass|scss)$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader'
          },
          {
            loader: 'sass-loader'
          }
        ]
      },
    ],
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),
    dotEnv
  ]
});
