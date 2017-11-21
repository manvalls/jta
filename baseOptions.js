const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const CompressionPlugin = require("compression-webpack-plugin");

module.exports = (p) => {
  return {
    context: __dirname,
    entry: {
      index: require.resolve(p)
    },
    devtool: 'source-map',
    plugins: [
      new CleanWebpackPlugin(['dist'], {root: p, verbose: false}),
      new HTMLWebpackPlugin({
        title: ''
      }),
      new CompressionPlugin({
        asset: "[path].gz",
        algorithm: "gzip",
        test: /./,
        minRatio: 0.8
      })
    ],
    output: {
      filename: '[hash].js',
      chunkFilename: '[chunkhash].js',
      sourceMapFilename: '[file].map',
      path: path.resolve(p, 'dist')
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader',
            options: {
              plugins: [require('babel-plugin-syntax-dynamic-import')],
              presets: [require('babel-preset-nite')],
              cacheDirectory: true,
              cacheIdentifier: 'jta-base'
            }
          }
        },
        {
          test(filename){
            var ext = (filename.match(/\.[^\.]*$/) || [])[0];
            switch(ext){
              case '.ejs':
              case '.js':
              case '.jsx':
              case '.css':
              case '.less':
              case '.scss':
              case '.sass':
                return false;
              default:
                return true;
            }
          },
          use: [
            {
              loader: 'file-loader'
            }
          ]
        },
        {
          test: /\.css$/,
          use: [
            {
              loader: 'style-loader'
            },
            {
              loader: 'css-loader',
              options: {
                modules: true,
                minimize: true,
                sourceMap: true
              }
            }
          ]
        },
        {
          test: /\.less$/,
          use: [
            {
              loader: 'style-loader'
            },
            {
              loader: 'css-loader',
              options: {
                modules: true,
                minimize: true,
                sourceMap: true
              }
            },
            {
              loader: 'resolve-url-loader'
            },
            {
              loader: "less-loader",
              options: {
                sourceMap: true,
                relativeUrls: false
              }
            }
          ]
        },
        {
          test: /\.(scss|sass)$/,
          use: [
            {
              loader: 'style-loader'
            },
            {
              loader: 'css-loader',
              options: {
                modules: true,
                minimize: true,
                sourceMap: true
              }
            },
            {
              loader: 'resolve-url-loader'
            },
            {
              loader: "sass-loader",
              options: {
                sourceMap: true
              }
            }
          ]
        }
      ]
    }
  };
};
