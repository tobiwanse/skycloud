const webpack = require( 'webpack' );
const path = require( 'path' );
const HtmlWebpackPlugin = require( 'html-webpack-plugin' );
const MiniCssExtractPlugin = require( "mini-css-extract-plugin" );
module.exports = {
	entry: [
		'./src/main.js',
	],
	watch: true,
	watchOptions: {
		ignored: '**/node_modules',
	},
	performance: {
		hints: false,
		maxEntrypointSize: 512000,
		maxAssetSize: 512000
	},
	plugins: [
		new MiniCssExtractPlugin(),
		new HtmlWebpackPlugin( {
			title: 'Skycloud',
			favicon: "./src/images/favicon.png",
			filename: 'index.html',
			template: './src/index.html',
			inject: true,
		} ),
		new webpack.ProvidePlugin( {
			$: 'jquery',
			jQuery: 'jquery',
		} )
	],
	module: {
		rules: [ {
				test: /\.(js)$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: [
							[ '@babel/preset-env', { targets: "defaults" } ]
						],
						plugins: [ '@babel/plugin-proposal-class-properties' ]
					}
				}
			},
			{
				test: /\.(sa|sc|c)ss$/,
				use: [ {
						loader: MiniCssExtractPlugin.loader
					},
					{
						loader: 'css-loader'
					},
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: {
								plugins: ( ) => [
									autoprefixer
								]
							}
						}
					},
					{
						loader: 'sass-loader'
					}
				]
			},
			{
				test: /\.json$/,
				type: 'json'
			},
			{
				test: /\.(png|svg|jpg|jpeg|gif)$/i,
				type: 'asset/resource',
			},
		]
	},
	resolve: {
		extensions: [ '.tsx', '.ts', '.js', '.json' ]
	},
	output: {
		path: path.resolve( __dirname, 'dist' ),
		filename: "bundle.js",
		clean: true,
		assetModuleFilename: 'images/[hash][ext][query]'
	}
};
