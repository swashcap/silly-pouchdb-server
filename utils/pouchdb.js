'use strict';

const memdown = require('memdown');
const PouchDB = require('pouchdb-node');
const PouchDBAdapterMemory = require('pouchdb-adapter-memory');

PouchDB.plugin(PouchDBAdapterMemory);

PouchDB.defaults({ db: memdown });

module.exports = PouchDB;

