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

  db.bulkDocs([{
    _id: 'doc1',
    title: 'Space Oddity',
  }, {
    _id: 'doc2',
    title: 'Changes',
  }, {
    _id: 'doc3',
    title: 'The Man Who Sold The World',
  }]).then(() => {

    process.send({
      pid: process.pid,
      ready: true,
    });
  });
});

