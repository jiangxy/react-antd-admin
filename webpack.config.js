var webpack = require('webpack');

module.exports = {
  entry: [
    'webpack/hot/dev-server',  // 调试时需要
    'babel-polyfill',  // 可以使用完整的ES6特性, 大概增加100KB
    './src/index.js',  // 编译的入口
  ],

  output: {  // 输出的目录和文件名
    path: __dirname + '/dist',
    filename: 'bundle.js',
    publicPath: 'http://mycdn.com/', // require图片时返回地址的前缀
  },

  resolve: {
    modulesDirectories: ['node_modules', './src'],  // import时到哪些地方去寻找模块
    extensions: ['', '.js', '.jsx'],  // require的时候可以直接使用require('file')，不用require('file.js')
    alias: {
      antdcss: 'antd/dist/antd.min.css',  // import时的别名
    },
  },

  module: {
    loaders: [  // 定义各种loader
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'stage-0', 'react'],  // 开启ES6、部分ES7、react特性, preset相当于预置的插件集合
          plugins: [['antd', {'style': true}]],  // antd模块化加载, https://github.com/ant-design/babel-plugin-antd
        },
        exclude: /node_modules/,
      }, {
        test: /\.css$/,
        loader: 'style!css',
      }, {
        test: /\.less$/,
        loader: 'style!css!less',  // 用!去链式调用loader
      }, {
        test: /\.(png|jpg|svg)$/,
        loader: 'url?limit=25000',  // 图片小于一定值的话转成base64
      },
    ],
  },

  plugins: [
    new webpack.BannerPlugin('This file is created by jxy'),   // 生成文件时加上注释
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(JSON.parse(process.env.NODE_ENV === 'production' ? 'false' : 'true')),  // magic globals, 用于打印一些调试的日志, webpack -p时会删除
    }),
  ],
};
