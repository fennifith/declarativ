const path = require('path');
const pkg = require('./package.json');

module.exports = (env, argv) => [
	{ name: "declarativ.min.js", target: "umd" },
	{ name: "index.js", target: "commonjs2" }
].map(opts => ({
	devtool: "source-map",
    entry: './src/index.js',
    output: {
		path: path.resolve(__dirname, 'dist'),
		filename: opts.name,
		library: 'declarativ',
		libraryTarget: opts.target
	},
    externals: {
        jquery: {
            commonjs: 'jquery',
            commonjs2: 'jquery',
            amd: 'jquery',
            root: 'jQuery'
        }
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				include: path.resolve(__dirname, 'src'),
				loader: 'ts-loader',
				options: { transpileOnly: argv.mode === 'production' }
			}
		]
	},
	resolve: {
		extensions: [ '.tsx', '.ts', '.js' ]
	}
}));
