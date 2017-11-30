const path = require('path');
const fs = require('fs');

module.exports = (p, production, es5, port) => {
  const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
  const CleanWebpackPlugin = require('clean-webpack-plugin');
  const CompressionPlugin = require("compression-webpack-plugin");
  const ExtractTextPlugin = require("extract-text-webpack-plugin");
  const webpack = require('webpack');
  const dotenv = require('dotenv');

  return {
    context: __dirname,
    entry: {
      index: (() => {
        const entry = [require.resolve(p)];

        if(!production) entry.unshift(
          `${require.resolve('webpack-dev-server/client')}?http://localhost:${port}`,
          require.resolve('webpack/hot/dev-server')
        );

        if(es5) entry.unshift( require.resolve('babel-polyfill') );

        return entry;
      })()
    },
    devtool: production ? false : 'source-map',
    plugins: (() => {
      const definitions = {};
      let plugins = [];

      for(const [key,value] of Object.entries(process.env)){
        definitions[`process.env.${key}`] = value;
      }

      if(production) definitions['process.env.NODE_ENV'] = 'production';

      const envfiles = ['.env'];
      const configfiles = ['configuration.json'];

      if(production){
        configfiles.push('configuration.dist.json');
        envfiles.push('dist.env');
      }else{
        configfiles.push('configuration.dev.json');
        envfiles.push('dev.env');
      }

      for(const file of envfiles){
        try{
          const env = dotenv.parse( fs.readFileSync( path.resolve(p, file) ) );

          for(const [key,value] of Object.entries(env)){
            definitions[`process.env.${key}`] = value;
          }
        }catch(err){ }
      }

      for(const file of configfiles){
        try{
          const conf = JSON.parse( fs.readFileSync( path.resolve(p, file) ) );

          for(const [key,value] of Object.entries(conf)){
            definitions[key] = value;
          }
        }catch(err){ }
      }

      for(const key of Object.keys(definitions)){
        definitions[key] = JSON.stringify(definitions[key]);
      }

      plugins.push( new webpack.DefinePlugin(definitions) );

      if(es5) plugins.push( new webpack.ProvidePlugin({
        'fetch': require.resolve('whatwg-fetch')
      }) );

      if(production){
        plugins = plugins.concat([
          new CleanWebpackPlugin(['dist'], {root: p, verbose: false}),
          new CompressionPlugin({
            asset: "[path].gz",
            algorithm: "gzip",
            test: /./,
            minRatio: 0.8
          }),
          new UglifyJsPlugin({
            sourceMap: true,
            uglifyOptions: {
              ecma: es5 ? 5 : 8
            }
          }),
          new ExtractTextPlugin('[contenthash].css')
        ]);
      }else{
        plugins = plugins.concat([
          new webpack.HotModuleReplacementPlugin(),
          new webpack.NamedModulesPlugin()
        ]);
      }

      return plugins;
    })(),
    output: {
      filename: production ? '[hash].js' : '[name].js',
      chunkFilename: '[chunkhash].js',
      sourceMapFilename: '[file].map',
      path: path.resolve(p, 'dist')
    },
    module: {
      rules: (() => {
        const rules = [];

        rules.push({
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
        });

        const styles = [
          [/\.css$/, /\.global\.css$/],
          [/\.less$/, /\.global\.less$/, {
            loader: "less-loader",
            options: {
              sourceMap: production ? false : true,
              relativeUrls: false
            }
          }],
          [/\.(scss|sass)$/, /\.global\.(scss|sass)$/, {
            loader: "sass-loader",
            options: {
              sourceMap: production ? false : true
            }
          }]
        ];

        for(const [localRE, globalRE, ...loaders] of styles){
          for(const useModules of [true, false]){
            let use = [{
              loader: 'css-loader',
              options: {
                modules: useModules,
                minimize: true,
                sourceMap: production ? false : true
              }
            }];

            if(loaders.length){
              use = use.concat([ { loader: 'resolve-url-loader' }, ...loaders ]);
            }

            if(production){
              use = ExtractTextPlugin.extract({ use, fallback: 'style-loader' });
            }else{
              use = [{loader: 'style-loader'}].concat(use);
            }

            if(useModules){
              rules.push({
                test(filename){
                  return !!(filename.match(localRE) && !filename.match(globalRE));
                },
                use
              });
            }else{
              rules.push({
                test: globalRE,
                use
              });
            }
          }
        }

        const workers = [
          [/\.ww\.js$/, '[hash].ww.js'],
          [/\.sw\.js$/, '[name].js', 'service'],
          [/\.sww\.js$/, '[hash].sww.js', 'shared']
        ];

        for(const [test, name, mode] of workers){
          const options = {name};
          const use = [];

          // if(mode) options.mode = mode;
          use.push({loader: 'worker-loader', options});

          if(es5) use.push({
            loader: 'text-transform-loader',
            options: {
              prependText: `require(${JSON.stringify(require.resolve('babel-polyfill'))});\n\n`,
            }
          });

          rules.push({test, use});
        }

        if(es5) rules.push({
          test: /\.jsx?$/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [require('babel-preset-env')],
              cacheDirectory: true,
              cacheIdentifier: 'jta-es5',
              compact: false
            }
          }
        });

        rules.push({
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
        });

        return rules;
      })()
    }
  };
};
