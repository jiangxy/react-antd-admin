var webpack = require('webpack');
module.exports = {
  entry: [
    'babel-polyfill',
    './src/index.js',
  ],

  output: {
    path: __dirname + '/dist',
    filename: 'bundle.min.js',
  },

  resolve: {
    modulesDirectories: ['node_modules', './src'],
    extensions: ['', '.js', '.jsx'],
    alias: {
      antd_css: 'antd/dist/antd.min.css',
    },
  },

  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'stage-0', 'react'],
          plugins: [['antd', {'style': 'css'}]],
        },
        exclude: /node_modules/,
      }, {
        test: /\.css$/,
        loader: 'style!css',
      }, {
        test: /\.less$/,
        loader: 'style!css!less',
      }, {
        test: /\.(png|jpg|svg)$/,
        loader: 'url?limit=25000',
      },
    ],
  },

  plugins: [
    new webpack.optimize.UglifyJsPlugin({minimize: true, compress: {warnings: false}}),
  ],
};
