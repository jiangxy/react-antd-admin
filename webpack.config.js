var webpack = require('webpack');  
module.exports = {  
  entry: [
    "./src/index.js"
  ],
  output: {
    path: __dirname + '/dist',
    filename: "bundle.js"
  },
  resolve: {
	modulesDirectories: ['node_modules', './src'],
    extensions: ['', '.js', '.jsx']
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'react']
        },
        exclude: /node_modules/
      }, {
        test: /\.css$/,
        loader: 'style!css'
      }, {
        test: /\.less$/,
        loader: 'style!css!less'
      },{ 
        test: /\.(png|jpg)$/, 
        loader: 'url?limit=25000' 
      }
    ]
  },
  plugins: [
  ]
};
