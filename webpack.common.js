const path = require('path');
const fs = require('fs/promises');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const webpack = require('webpack');
const pkg = require('./package.json');
const dotenv = require('dotenv');
const polyfills = ['core-js/stable', 'regenerator-runtime/runtime'];
const { RetryChunkLoadPlugin } = require('webpack-retry-chunk-load-plugin');

dotenv.config({ path: '.env.defaults' });
process.env.BUILD_TYPE = process.env.BUILD_TYPE || 'web';

const COMMIT = (
  process.env.GITHUB_SHA ||
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
    webassemblyModuleFilename: 'assets/wasm/[hash].module.wasm',
  },
  externals: {
    electron: 'commonjs electron',
  },
  experiments: {
    futureDefaults: true,
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
      https: false,
      http: false,
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
            let base = path.dirname(pathData.filename);
            base = base.replace(/^app\//, '');
            base = base.replace(/^node_modules\/@coinspace\/crypto-db\/logo/, 'assets/crypto');
            return `${base}/[name].[hash:8][ext]`;
          },
        },
      },
      {
        test: /MoneroCoreJS\.wasm$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/wasm/[name].[hash:8][ext]',
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
      }),
      new CopyWebpackPlugin({
        patterns: [{
          from: 'node_modules/@coinspace/crypto-db/logo/',
          to: './assets/crypto/',
        }],
      })] : []
    ),
    ...(process.env.BUILD_TYPE === 'electron' ?
      [new CopyWebpackPlugin({
        patterns: [{
          from: 'node_modules/@coinspace/crypto-db/crypto/',
          to: '../electron/lib/crypto/',
          filter: async (resourcePath) => {
            const data = JSON.parse(await fs.readFile(resourcePath, 'utf8'));
            return !!data.scheme;
          },
        }],
      })] : []
    ),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'app/security.txt', to: './' },
        { from: 'app/assets/icons/android-chrome-192x192.png', to: './' },
        { from: 'app/assets/icons/android-chrome-512x512.png', to: './' },
        { from: 'app/assets/icons/apple-touch-icon.png', to: './' },
        { from: 'app/assets/icons/browserconfig.xml', to: './' },
        { from: 'app/assets/icons/favicon-16x16.png', to: './' },
        { from: 'app/assets/icons/favicon-32x32.png', to: './' },
        { from: 'app/assets/icons/favicon.ico', to: './' },
        { from: 'app/assets/icons/mstile-150x150.png', to: './' },
        { from: 'app/assets/icons/safari-pinned-tab.svg', to: './' },
        { from: 'app/assets/icons/site.webmanifest', to: './' },
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
    new RetryChunkLoadPlugin({
      cacheBust: 'function() { return Date.now(); }',
      retryDelay: 1000,
      maxRetries: 3,
    }),
  ],
  optimization: {
    splitChunks: false,
  },
};
