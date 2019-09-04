const path = require('path');

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'declarativ.js',
        library: 'declarativ',
        libraryTarget: 'umd'
    },
    externals: {
        jquery: {
            commonjs: 'jquery',
            commonjs2: 'jquery',
            amd: 'jquery',
            root: 'jQuery'
        }
    }
};
