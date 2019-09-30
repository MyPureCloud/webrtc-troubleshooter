'use strict';

const path = require('path');

module.exports = {
  target: 'web',
  entry: './src/index.ts',
  devtool: 'source-map',
  mode: process.env.MINIMIZE ? 'production' : 'development',
  optimization: {
    minimize: !!process.env.MINIMIZE
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: process.env.MINIMIZE ? 'webrtc-troubleshooter.min.js' : 'webrtc-troubleshooter.js',
    library: 'WebrtcTroubleshooter',
    libraryTarget: 'umd'
  },
  resolve: {
    extensions: ['.ts', '.js', '.json']
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env']
        }
      },
      {
        test: /\.ts$/,
        loader: 'awesome-typescript-loader'
      }
    ]
  }
};
