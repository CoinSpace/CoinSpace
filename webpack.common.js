const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: {
    loader: './app/loader/index.js',
  },
  output: {
    filename: 'assets/js/[name].[hash:8].js',
    chunkFilename: 'assets/js/[name].[hash:8].js',
    path: path.resolve(__dirname, 'build'),
  },
  resolve: {
    alias: {
      lib: path.resolve(__dirname, 'app/lib'),
      pages: path.resolve(__dirname, 'app/pages'),
      widgets: path.resolve(__dirname, 'app/widgets'),
      modernizr$: path.resolve(__dirname, '.modernizrrc')
    }
  },
  module: {
    rules: [
      {
        test: /\.(png|svg|jpg|gif|ico|woff|woff2|eot|ttf|otf)$/,
        loader: 'file-loader',
        options: {
          name: '[path][name].[hash:8].[ext]',
          context: './app/'
        }
      },
      {
        test:/\.ract$/,
        use: ['ractive-loader']
      },
      {
        test: /\.modernizrrc$/,
        use: ['modernizr-loader', 'json-loader']
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      chunks: ['loader'],
      template: 'app/index.ejs'
    }),
    new HtmlWebpackPlugin({
      inject: false,
      template: 'app/apple-app-site-association.ejs',
      filename: 'apple-app-site-association'
    }),
    new webpack.ProvidePlugin({
      'Promise': 'es6-promise'
    })
  ]
};
