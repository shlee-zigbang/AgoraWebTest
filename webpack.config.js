const path = require('path')
const webpack = require('webpack')
const fs = require('fs')

const prod = process.env.NODE_ENV === 'production'

module.exports = {
  entry: './src/index.tsx',
  mode: prod ? 'production' : 'development',
  devtool: prod ? 'hidden-source-map' : 'eval',
  module: {
    rules: [
      {
          test: /\.(js|jsx|ts|tsx)$/,
          exclude: /node_modules/,
          use: ['babel-loader'],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: { extensions: ['*', '.js', '.jsx', '.ts', '.tsx'] },
  output: {
    path: path.resolve(__dirname, 'dist/'),
    publicPath: '/dist/',
    filename: 'bundle.js'
  },
  devServer: {
    contentBase: path.join(__dirname, 'public/'),
    port: 8080,
    hotOnly: true,
    host: '0.0.0.0',
    publicPath: '/dist',
  },
  plugins: [new webpack.HotModuleReplacementPlugin()]
}