
module.exports = {

  serve: (path) => {},

  build: (path) => {
    const p = require('path');
    const fs = require('fs');
    const nijm = require('nijm');
    const webpack = require("webpack");
    const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
    const ProgressPlugin = require('progress-webpack-plugin');

    const es6 = require('./baseOptions')(path);
    const es5 = require('./baseOptions')(path);

    es5.entry.index = [
      require.resolve('babel-polyfill'),
      es5.entry.index
    ];

    const babelRule = es5.module.rules[es5.module.rules.length - 1];

    delete babelRule.exclude;
    babelRule.use.options.presets.push( require('babel-preset-env') );
    babelRule.use.options.cacheIdentifier = 'jta-es5';
    babelRule.use.options.compact = false;

    for(const rule of es5.module.rules.slice(-4, -1)){
      rule.use.push({
        loader: 'text-transform-loader',
        options: {
          prependText: `require(${JSON.stringify(require.resolve('babel-polyfill'))});\n\n`,
        }
      });
    }

    for(const opt of [es5, es6]) opt.plugins.push(
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
