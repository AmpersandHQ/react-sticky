/* eslint-disable */
/* global require process module __dirname */
const path = require('path');
const webpack = require('webpack');

const isLive = process.env.NODE_ENV === 'production';

module.exports = {
    mode: isLive ? 'production' : 'development',
    devtool: isLive ? 'source-map' : 'cheap-eval-source-map',
    entry: {
        demos: path.resolve('examples', 'index.js'),
    },
    output: {
        path: path.join(__dirname, 'examples'),
        filename: 'bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
            },
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'eslint-loader',
                    options: {
                        enforce: 'pre',
                    },
                },
            },
        ],
    },
    devServer: {
        contentBase: path.join(__dirname, 'examples'),
        publicPath: '/',
        compress: true,
        port: 9000,
        historyApiFallback: true,
    },
};
