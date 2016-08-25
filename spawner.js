'use strict';

require('./utils/error-handling');

const { initial, last } = require('lodash');
const config = require('./utils/config');
const cp = require('child_process');
const path = require('path');
const PouchDB = require('./utils/pouchdb');
const spawnPouchDBServer = require('spawn-pouchdb-server');

const CLIENT_COUNT = 10;
const clientPromises = [];
const clients = [];
const clientDocCounts = new Map();

let server;

function killProcesses() {
  server && server.stop(() => console.log('Server stopped'));
  clients.forEach(client => client && client.kill());
}

function getReadyClient(client) {
  return new Promise((resolve, reject) => {
    function messageHandler(message) {
      if ('ready' in message && message.ready) {
        resolve(client);
        client.removeListener('message', messageHandler);
      } else if ('error' in message) {
        reject(message.error);
        client.removeListener('message', messageHandler);
      }
    }

    client.on('message', messageHandler);
  });
}

for (let i = 0; i < CLIENT_COUNT; i++) {
  const client = cp.fork(path.join(__dirname, 'client.js'), { execArgv: [] })
  client.on('message', getMessageHandler(client));
  client.on('exit', killProcesses);
  clientPromises.push(getReadyClient(client));
}

Promise.all(clientPromises.concat(getReadyServer()))
  .then(responses => {
    initial(responses).forEach(client => clients.push(client));
    server = last(responses);

    const db = new PouchDB(`http://localhost:${config.port}/${config.pathname}`);

    return db.bulkDocs(config.docs);
  })
  .then(() => {
    clients.forEach(c => c.send({ cmd: 'run' }));
  });

function getMessageHandler(childProcess) {
  return function messageHandler(message) {
    if ('error' in message) {
      console.error(`Error from child ${childProcess.pid}`);
      throw message.error;
    }

    console.log(message);

    if ('docCount' in message) {
      clientDocCounts.set(childProcess, message.docCount); 
    }

    if (clientDocCounts.size === CLIENT_COUNT) {
      const docCount = config.docs.length;

      if (
        Array.from(clientDocCounts).every(([, count]) => count === docCount)
      ) {
        console.log(`All ${CLIENT_COUNT} clients fetched ${docCount} docs`);
        process.exit();
      } else {
        throw new Error('Not all clients received documents');
      }
    }
  };
}

function getReadyServer() {
  return new Promise((resolve, reject) => {
    spawnPouchDBServer({
      backend: false,
      config: {
        file: false,
      },
      log: {
        file: false,
        level: 'debug',
      },
      port: config.port,
      verbose: true,
    }, (error, server) => {
      if (error) {
        reject(error);
      } else {
        resolve(server);
      }
    });
  });
}

process.on('exit', killProcesses);

