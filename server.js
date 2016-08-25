'use strict';

require('./utils/error-handling');

const config = require('./utils/config');
const getExpressPouchDBApp = require('./utils/get-express-pouchdb-app');
const PouchDB = require('./utils/pouchdb');

const app = getExpressPouchDBApp();

app.listen(config.port, (error) => {
  if (error) {
    throw error;
  }

  const db = new PouchDB(config.pathname);

  console.log(`PouchDB server running at localhost:${config.port}`);

  db.put({
    _id: 'mydoc',
    title: 'Heroes',
  }).then(() => {
    process.send({
      pid: process.pid,
      ready: true,
    });
  });
});

