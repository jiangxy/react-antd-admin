const webpack = require('webpack');

module.exports = {
  entry: [
    // 可能需要polyfill
    './src/index.js',
  ],

  output: {
    path: __dirname + '/dist',
    filename: 'bundle.min.js',
    publicPath: 'http://mycdn.com/', // require时用来生成图片的地址
  },

  resolve: {
    modulesDirectories: ['node_modules', './src'],
    extensions: ['', '.js', '.jsx'],
  },

  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'stage-0', 'react'],
          plugins: [['antd', {'style': true}]],
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
    new webpack.optimize.UglifyJsPlugin({
      minimize: true,
      compress: {warnings: false},
    }),

    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.AggressiveMergingPlugin(),
    new webpack.NoErrorsPlugin(),

    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      __DEV__: JSON.stringify(JSON.parse(process.env.NODE_ENV === 'production' ? 'false' : 'true')),
    }),
  ],
};
