'use strict';

const memdown = require('memdown');
const path = require('path');
const PouchDB = require('pouchdb-node');
const PouchDBAdapterMemory = require('pouchdb-adapter-memory');

// PouchDB.plugin(PouchDBAdapterMemory);

PouchDB.defaults({
  db: memdown,
  prefix: path.resolve(__dirname, '..', '.tmp'),
});

module.exports = PouchDB;

