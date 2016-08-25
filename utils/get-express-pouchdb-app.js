'use strict';

const express = require('express');
const expressPouchDB = require('express-pouchdb');
const PouchDB = require('./pouchdb');

module.exports = function getPouchDBExpressApp() {
  const app = express();

  app.use('/', expressPouchDB(PouchDB));

  return app;
};

