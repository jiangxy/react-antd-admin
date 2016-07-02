var webpack = require('webpack');
module.exports = {
  entry: [
    'webpack/hot/dev-server',  // 调试时需要
    'babel-polyfill',  // 可以使用完整的ES6特性
    './src/index.js',  // 编译的入口
  ],

  output: {  // 输出的目录和文件名
    path: __dirname + '/dist',
    filename: 'bundle.js',
  },

  resolve: {
    modulesDirectories: ['node_modules', './src'],  // import时到哪些地方去寻找模块
    extensions: ['', '.js', '.jsx'],  // 要处理哪些文件
    alias: {
      antd_css: 'antd/dist/antd.min.css',  // import时的别名
    },
  },

  module: {
    loaders: [  // 定义各种loader
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'stage-0', 'react'],  // 开启ES6、部分ES7、react特性, preset相当于预置的插件集合
          plugins: [['antd', {'style': 'css'}]],  // antd模块化加载, https://github.com/ant-design/babel-plugin-antd
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
    new webpack.BannerPlugin('This file is created by webpack hahaha'),   // 生成文件时加上注释
  ],
};
