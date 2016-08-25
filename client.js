'use strict';

require('./utils/error-handling');

const config = require('./utils/config');
const PouchDB = require('./utils/pouchdb');

const db = PouchDB(`http://localhost:${config.port}/${config.pathname}`)

process.send({
  pid: process.pid,
  ready: true,
});

