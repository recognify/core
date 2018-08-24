/* global __dirname, require, module*/

const path = require('path')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const env = require('yargs').argv.env

let libraryName = 'recognify'

let outputFile, mode

if (env === 'build') {
    mode = 'production'
    outputFile = libraryName + '.min.js'
} else {
    mode = 'development'
    outputFile = libraryName + '.js'
}

const config = {
    mode: mode,
    entry: __dirname + '/src/index.js',
    devtool: 'source-map',
    output: {
        path: __dirname + '/lib',
        filename: outputFile,
        library: libraryName,
        libraryTarget: 'umd',
        umdNamedDefine: true,
    },
    module: {
        rules: [
            {
                test: /(\.jsx|\.js)$/,
                loader: 'babel-loader',
                exclude: /(node_modules|bower_components|haar)/,
            },
        ],
    },
    resolve: {
        modules: [path.resolve('./node_modules'), path.resolve('./src')],
        extensions: ['.json', '.js'],
    },
}

if (env === 'dev') config.plugins = [
    new HTMLWebpackPlugin({
        template: 'src/sandbox.html',
    }),
]

module.exports = config
