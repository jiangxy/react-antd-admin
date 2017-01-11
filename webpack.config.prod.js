const webpack = require('webpack');

const babelLoaderConfig = {
  presets: ['latest', 'stage-0', 'react'],
  plugins: [['import', {libraryName: 'antd', style: true}]],
  cacheDirectory: true,
};

module.exports = {
  devtool: 'cheap-module-source-map',

  entry: [
    'babel-polyfill',
    './src/index.js',
  ],

  output: {
    path: __dirname + '/dist',
    filename: 'bundle.min.js',
    // publicPath: 'http://mycdn.com/', // require时用来生成图片的地址
  },

  resolve: {
    modulesDirectories: ['node_modules', './src'],
    extensions: ['', '.js', '.jsx'],
  },

  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        // 删除一些debug语句
        loaders: ['babel-loader?' + JSON.stringify(babelLoaderConfig), 'strip-loader?strip[]=logger.debug,strip[]=console.log,strip[]=console.debug'],
        exclude: /node_modules/,
      }, {
        test: /\.css$/,
        loader: 'style!css',
      }, {
        test: /\.less$/,
        loader: 'style!css!less?{"sourceMap":true}',
      }, {
        test: /\.(png|jpg|svg)$/,
        loader: 'url?limit=25000',
      },
    ],
  },

  plugins: [
    // 代码压缩
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      minimize: true,
      compress: {warnings: false},
    }),

    // 抽离公共部分
    // webpack.optimize.CommonsChunkPlugin

    new webpack.optimize.DedupePlugin(),
    // 比对id的使用频率和分布来得出最短的id分配给使用频率高的模块
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.AggressiveMergingPlugin(),
    // 允许错误不打断程序
    new webpack.NoErrorsPlugin(),

    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      __DEV__: JSON.stringify(JSON.parse(process.env.NODE_ENV === 'production' ? 'false' : 'true')),
    }),
  ],
};
