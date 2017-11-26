
module.exports = {

  serve: (path, port = 80, cb = () => {}) => {
    const WebpackDevServer = require('webpack-dev-server');
    const webpack = require("webpack");
    const p = require('path');
    const opt = require('./baseOptions')(path);

    opt.output.filename = '[name].js';

    opt.entry.index = [
      `${require.resolve('webpack-dev-server/client')}?http://localhost:${port}`,
      require.resolve('webpack/hot/dev-server'),
      opt.entry.index
    ];

    opt.plugins.unshift(
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NamedModulesPlugin()
    );

    const compiler = webpack(opt);

    const server = new WebpackDevServer(compiler, {
      hot: true,
      contentBase: p.resolve(__dirname, 'public'),
      historyApiFallback: true,
      stats: {
        cached: false,
        cachedAssets: false,
        colors: true
      }
    });

    server.listen(port, 'localhost', (err) => {
      console.log(`Server ready at localhost:${port}`);
      cb(err, server);
    });

  },

  build: (path) => {
    const p = require('path');
    const fs = require('fs');
    const nijm = require('nijm');
    const webpack = require("webpack");
    const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
    const ProgressPlugin = require('progress-webpack-plugin');
    const CleanWebpackPlugin = require('clean-webpack-plugin');
    const CompressionPlugin = require("compression-webpack-plugin");

    const es6 = require('./baseOptions')(path);
    const es5 = require('./baseOptions')(path);

    es5.entry.index = [
      require.resolve('babel-polyfill'),
      es5.entry.index
    ];

    for(const rule of es5.module.rules.slice(-4, -1)){
      rule.use.push({
        loader: 'text-transform-loader',
        options: {
          prependText: `require(${JSON.stringify(require.resolve('babel-polyfill'))});\n\n`,
        }
      });
    }

    es5.module.rules.splice(-1, 0, {
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

    for(const opt of [es5, es6]){
      opt.plugins.push(
        new CleanWebpackPlugin(['dist'], {root: path, verbose: false}),
        new CompressionPlugin({
          asset: "[path].gz",
          algorithm: "gzip",
          test: /./,
          minRatio: 0.8
        }),
        new UglifyJsPlugin({
          sourceMap: true,
          uglifyOptions: {
            ecma: opt == es5 ? 5 : 8
          }
        }),
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify('production')
        })
      );

      for(const rule of opt.module.rules){
        if(rule.use instanceof Array) for(const u of rule.use){
          if(u.loader == 'css-loader') u.options.sourceMap = false;
        }
      }

    }

    es5.plugins.push(
      new webpack.ProvidePlugin({
        'fetch': require.resolve('whatwg-fetch')
      })
    );

    const compiler = webpack([es6, es5]);
    compiler.apply(new ProgressPlugin());

    compiler.run((err, stats) => {

      if (err) {
        console.error(err.stack || err);
        if (err.details) {
          console.error(err.details);
        }
        return;
      }

      const info = stats.toJson();

      if (stats.hasErrors()) {
        for(const error of info.errors) console.error(error);
      }

      if (stats.hasWarnings()) {
        for(const warning of info.warnings) console.warn(warning);
      }

      fs.writeFileSync(p.resolve('dist', 'index.html'), nijm(`

        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
          </head>
          <body>
            <script type="text/javascript">

              try{

                eval(${ JSON.stringify(
                  nijm(`(function(){
                    ${ fs.readFileSync(p.resolve(__dirname, 'browserTest.js')) }
                  })()`, true)
                ) });

                document.write('<script src="${
                  info.children[0].assetsByChunkName.index.filter(file => file.match(/\.js$/))[0]
                }"></s'+'cript>');

              }catch(err){

                document.write('<script src="${
                  info.children[1].assetsByChunkName.index.filter(file => file.match(/\.js$/))[0]
                }"></s'+'cript>');

              }

            </script>
          </body>
        </html>

      `, true));

    });
  }

};
