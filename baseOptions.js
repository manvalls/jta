const path = require('path');

module.exports = (p) => {
  return {
    context: __dirname,
    entry: {
      index: require.resolve(p)
    },
    devtool: 'source-map',
    plugins: [],
    output: {
      filename: '[hash].js',
      chunkFilename: '[chunkhash].js',
      sourceMapFilename: '[file].map',
      path: path.resolve(p, 'dist')
    },
    module: {
      rules: [
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
          test(filename){
            if(!filename.match(/\.css$/)) return false;
            if(filename.match(/\.global\.css$/)) return false;
            return true;
          },
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
          test(filename){
            if(!filename.match(/\.less$/)) return false;
            if(filename.match(/\.global\.less$/)) return false;
            return true;
          },
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
          test(filename){
            if(!filename.match(/\.(scss|sass)$/)) return false;
            if(filename.match(/\.global\.(scss|sass)$/)) return false;
            return true;
          },
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
        },
        {
          test: /\.global\.css$/,
          use: [
            {
              loader: 'style-loader'
            },
            {
              loader: 'css-loader',
              options: {
                minimize: true,
                sourceMap: true
              }
            }
          ]
        },
        {
          test: /\.global\.less$/,
          use: [
            {
              loader: 'style-loader'
            },
            {
              loader: 'css-loader',
              options: {
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
          test: /\.global\.(scss|sass)$/,
          use: [
            {
              loader: 'style-loader'
            },
            {
              loader: 'css-loader',
              options: {
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
        },
        {
          test: /\.ww\.js$/,
          use: [
            {
              loader: 'worker-loader',
              options: {
                name: '[hash].ww.js'
              }
            }
          ]
        },
        {
          test: /\.sw\.js$/,
          use: [
            {
              loader: 'worker-loader',
              options: {
                name: '[name].js',
                // mode: 'service'
              }
            }
          ]
        },
        {
          test: /\.sww\.js$/,
          use: [
            {
              loader: 'worker-loader',
              options: {
                name: '[hash].sww.js',
                // mode: 'shared'
              }
            }
          ]
        },
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              plugins: [
                require('babel-plugin-syntax-dynamic-import'),
                require('babel-plugin-transform-es2015-modules-commonjs')
              ],
              presets: [],
              cacheDirectory: true,
              cacheIdentifier: 'jta-base'
            }
          }
        }
      ]
    }
  };
};
