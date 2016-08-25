'use strict';

require('./utils/error-handling');

const config = require('./utils/config');
const PouchDB = require('./utils/pouchdb');


process.send({
  pid: process.pid,
  ready: true,
});

process.on('message', m => {
  if (m.cmd === 'run') {
    const db = PouchDB(`http://localhost:${config.port}/${config.pathname}`);

    db.allDocs({
      include_docs: true,
    })
      .then(response => {
        process.send({
          docCount: response.total_rows,
        });
      })
      .catch(error => {
        process.send({
          pid: process.pid,
          error: error,
        });
        throw error;
      });
  }
});

