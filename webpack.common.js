

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const webpack = require('webpack');
const pkg = require('./package.json');
const dotenv = require('dotenv');
const polyfills = ['core-js/stable', 'regenerator-runtime/runtime'];

dotenv.config({ path: '.env.defaults' });
process.env.BUILD_TYPE = process.env.BUILD_TYPE || 'web';

const COMMIT = (
  process.env.TRAVIS_COMMIT ||
  process.env.APPVEYOR_REPO_COMMIT ||
  process.env.COMMIT_SHA ||
  'local'
).substring(0, 7);

module.exports = {
  // we should use web build for electron too
  //target: process.env.BUILD_TYPE === 'electron' ? 'electron-renderer' : 'web',
  target: ['web', 'es5'],
  entry: {
    loader: polyfills.concat('./app/loader/index.js'),
    ...(process.env.BUILD_TYPE === 'web' ? {
      fido: polyfills.concat('./app/fido/index.js'),
    } : {}),
  },
  output: {
    filename: 'assets/js/[name].[fullhash:8].js',
    chunkFilename: 'assets/js/[name].[fullhash:8].js',
    path: path.resolve(__dirname, 'build'),
    clean: true,
  },
  externals: {
    electron: 'commonjs electron',
  },
  resolve: {
    symlinks: false,
    alias: {
      lib: path.resolve(__dirname, 'app/lib'),
      pages: path.resolve(__dirname, 'app/pages'),
      widgets: path.resolve(__dirname, 'app/widgets'),
      partials: path.resolve(__dirname, 'app/partials'),
    },
    fallback: {
      assert: require.resolve('assert/'),
      buffer: require.resolve('buffer/'),
      events: require.resolve('events/'),
      querystring: require.resolve('querystring-es3'),
      stream: require.resolve('stream-browserify'),
      crypto: require.resolve('crypto-browserify'),
      path: require.resolve('path-browserify'),
      fs: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.(png|svg|jpg|gif|ico|woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: (pathData) => {
            return `${path.dirname(pathData.filename).substr(4)}/[name].[hash:8][ext]`;
          },
        },
      },
      {
        test:/\.ract$/,
        use: ['ractive-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      chunks: ['loader'],
      template: 'app/index.ejs',
    }),
    ...(process.env.BUILD_TYPE === 'web' ?
      [new HtmlWebpackPlugin({
        chunks: ['fido'],
        template: 'app/fido/index.ejs',
        filename: 'fido/index.html',
      })] : []
    ),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'node_modules/@coinspace/monero-core-js/monero_utils/',
          to: 'assets/js/mymonero_core_js/monero_utils/',
        },
        { from: 'app/security.txt', to: './' },
        { from: 'app/assets/icons/favicon.ico', to: './' },
      ],
    }),
    new CircularDependencyPlugin({
      exclude: /node_modules/,
      failOnError: true,
      allowAsyncCycles: false,
      cwd: process.cwd(),
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer/', 'Buffer'],
    }),
    new webpack.DefinePlugin({
      'process.env.VERSION': JSON.stringify(`v${pkg.version}`),
      'process.env.COMMIT': JSON.stringify(COMMIT),
    }),
  ],
  optimization: {
    splitChunks: false,
  },
};
