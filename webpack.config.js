const path = require('path');
const copyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;
const nodeExternals = require('webpack-node-externals');

const common = {
  entry: './src/index.ts',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  plugins: [new BundleAnalyzerPlugin()],
  devtool: 'source-map'
};

const serverConfig = {
  ...common,
  target: 'node',
  plugins: [
    new copyPlugin({
      patterns: [{ from: 'src/@types', to: '@types' }]
    })
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'lib.node.js',
    libraryTarget: 'umd'
  },
  externals: [nodeExternals()] // in order to ignore all modules in node_modules folder
};

const clientConfig = {
  ...common,
  target: 'web',
  resolve: {
    ...common.resolve,
    fallback: {
      assert: require.resolve('assert'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      http: require.resolve('stream-http'),
      url: require.resolve('url'),
      util: require.resolve('util'),
      zlib: require.resolve('browserify-zlib'),
      fs: false,
      https: require.resolve('https-browserify')
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser'
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    })
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'lib.js',
    libraryTarget: 'umd'
  }
};

const bundlerConfig = {
  ...common,
  target: 'web',
  resolve: {
    ...common.resolve
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'lib.cjs.js',
    libraryTarget: 'commonjs2'
  },
  externals: [nodeExternals()],
  externalsPresets: {
    node: true
  }
};

module.exports = [serverConfig, clientConfig, bundlerConfig];
