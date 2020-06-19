const path = require('path');
const DeclarationBundlerPlugin = require('bundle-dts-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const pkg = require('./package.json');

module.exports = (env, argv) => [
	{ name: "declarativ.min.js", target: "umd", bundleDependencies: true },
	{ name: "index.js", target: "commonjs2" }
].map(opts => ({
	entry: './src/index.ts',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: opts.name,
		library: 'declarativ',
		libraryTarget: opts.target
	},
	externals: opts.bundleDependencies ? [] : [nodeExternals()],
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				include: path.resolve(__dirname, 'src'),
				loader: 'ts-loader'
			}
		]
	},
	resolve: {
		extensions: [ '.tsx', '.ts', '.js' ]
	},
	plugins: [
		new DeclarationBundlerPlugin({
			moduleName: 'declarativ',
			out: 'index.d.ts'
		})
	]
}));
