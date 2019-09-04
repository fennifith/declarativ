const path = require('path');

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'declarativ.js',
        library: 'declarativ'
    },
    externals: {
        jquery: {
            commonjs: 'jquery',
            commonjs2: 'jquery',
            amd: 'jquery',
            root: '_'
        }
    }
};
