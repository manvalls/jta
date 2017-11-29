
module.exports = {

  serve: (path, port = 80, cb = () => {}) => {
    const WebpackDevServer = require('webpack-dev-server');
    const webpack = require("webpack");
    const p = require('path');
    const opt = require('./baseOptions')(path, false, false, port);
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
    const ProgressPlugin = require('progress-webpack-plugin');

    const es6 = require('./baseOptions')(path, true);
    const es5 = require('./baseOptions')(path, true, true);

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

      const tpl = nijm(`

        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <script type="text/javascript">
              __webpack_public_path__ = "{BASE_PATH}";
            </script>
            <link rel="stylesheet" type="text/css" href="{BASE_PATH}${
              info.children[1].assetsByChunkName.index.filter(file => file.match(/\.css$/))[0]
            }">
            {HEAD}
          </head>
          <body>
            {BODY}
            <script type="text/javascript">

              try{

                eval(${ JSON.stringify(
                  nijm(`(function(){
                    ${ fs.readFileSync(p.resolve(__dirname, 'browserTest.js')) }
                  })()`, true)
                ) });

                document.write('<script src="{BASE_PATH}${
                  info.children[0].assetsByChunkName.index.filter(file => file.match(/\.js$/))[0]
                }"></s'+'cript>');

              }catch(err){

                document.write('<script src="{BASE_PATH}${
                  info.children[1].assetsByChunkName.index.filter(file => file.match(/\.js$/))[0]
                }"></s'+'cript>');

              }

            </script>
          </body>
        </html>

      `, true);

      fs.writeFileSync(p.resolve('dist', 'index.tpl.html'), tpl);
      fs.writeFileSync(
        p.resolve('dist', 'index.html'),
        tpl.replace(/\{(BASE_PATH|HEAD|BODY)\}/g, '')
      );
    });
  }

};
