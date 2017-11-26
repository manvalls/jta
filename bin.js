#! /usr/bin/env node
var jta = require('./main');

switch(process.argv[2]){

  case 'serve': {
    const port = parseInt(process.argv[3] || 80);

    jta.serve( process.cwd(), port, (err, server) => {
      if(err) {
        console.error(err);
      }
    } );

    break;
  }

  default:
    jta.build( process.cwd() );
    break;

}
