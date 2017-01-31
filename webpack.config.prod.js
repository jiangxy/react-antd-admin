const webpack = require('webpack');
const path = require('path');
const globalConfig = require('./src/config.js');

const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');

const babelLoaderConfig = {
  presets: ['latest', 'stage-0', 'react'],
  plugins: [['import', {libraryName: 'antd', style: true}]],
  cacheDirectory: true,
};

const lessLoaderVars = {
  sidebarCollapsible: globalConfig.sidebar.collapsible,
};

// bundle split, 尝试把这些比较独立的库单独放在一个js文件中
// 注意只有真正"公用"的库才能放这里, 否则会有各种奇怪的问题
// 而且必须在bundle.js之前加载
const vendorLibs = ['react', 'react-router',
  'redux', 'react-redux', 'redux-logger', 'redux-thunk', 'redux-promise',
  'superagent',
];

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
        loaders: ['babel-loader?' + JSON.stringify(babelLoaderConfig), 'strip-loader?strip[]=logger.info,strip[]=logger.debug,strip[]=console.log,strip[]=console.debug'],
        exclude: /node_modules/,
      }, {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('style', 'css'),
        //loader: 'style!css',
      }, {
        test: /\.less$/,
        loader: ExtractTextPlugin.extract('style', 'css!' + `less?{"sourceMap":true,"modifyVars":${JSON.stringify(lessLoaderVars)}}`),
        //loader: 'style!css!' + `less?{"sourceMap":true,"modifyVars":${JSON.stringify(lessLoaderVars)}}`,
      }, {
        test: /\.(png|jpg|svg)$/,
        loader: 'url?limit=25000',
      },
    ],
  },

  // 减小bundle size是个很大的学问...
  // https://chrisbateman.github.io/webpack-visualizer/
  // http://stackoverflow.com/questions/34239731/how-to-minimize-the-size-of-webpacks-bundle
  // https://webpack.github.io/docs/code-splitting.html
  // http://survivejs.com/webpack/building-with-webpack/splitting-bundles/

  plugins: [
    // 代码压缩
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      minimize: true,
      compress: {warnings: false},
      output: {comments: false},
    }),

    new HtmlWebpackPlugin({
      template: 'index.html.template',
      title: globalConfig.name,
      favIcon: globalConfig.favicon,
      hash: true,  // 引入js/css的时候加个hash, 防止cdn的缓存问题
      minify: {removeComments: true, collapseWhitespace: true},
    }),

    // 抽离公共部分, 要了解CommonsChunkPlugin的原理, 首先要搞清楚chunk的概念
    // CommonsChunkPlugin做的其实就是把公共模块抽出来, 可以单独生成一个新的文件, 也可以附加到已有的chunk上
    // 同时还会加上webpack的runtime相关代码
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      filename: 'vendor.min.js',
      // 这个函数决定哪些模块会被放到vender.min.js中
      minChunks: (module) => {
        // 得到资源路径
        var resource = module.resource;
        if (!resource)
          return false;
        // 坑爹的webpack, for-of里不用能const, 会有bug
        for (var libName of vendorLibs) {
          if (resource.indexOf(path.resolve(__dirname, 'node_modules', libName)) >= 0)
            return true;
        }
        return false;
      },
    }),

    new webpack.optimize.DedupePlugin(),
    // 比对id的使用频率和分布来得出最短的id分配给使用频率高的模块
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.AggressiveMergingPlugin(),
    // 允许错误不打断程序
    new webpack.NoErrorsPlugin(),

    // css单独抽出来
    new ExtractTextPlugin('bundle.min.css', {allChunks: false}),
    // 压缩成gzip格式
    new CompressionPlugin({
      asset: "[path].gz[query]",
      algorithm: "gzip",
      test: /\.js$|\.css$|\.html$/,
      threshold: 10240,
      minRatio: 0,
    }),

    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      __DEV__: JSON.stringify(JSON.parse(process.env.NODE_ENV === 'production' ? 'false' : 'true')),
    }),
  ],
};
