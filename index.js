'use strict';

require('./utils/error-handling');

const config = require('./utils/config');
const cp = require('child_process');
const path = require('path');

const CLIENT_COUNT = 20;
let serverReady = false;
let clientReadyCount = 0;
const server = cp.fork(path.join(__dirname, 'server.js'), {
  execArgv: [],
});
const clients = [];
const clientsDocCount = new Map();

server.on('message', getMessageHandler(server));
server.on('message', getReadyHandler(server));
server.on('exit', killProcesses);

for (let i = 0; i < CLIENT_COUNT; i++) {
  const client = cp.fork(path.join(__dirname, 'client.js'), {
    execArgv: [],
  });
  client.on('message', getMessageHandler(client));
  client.on('message', getReadyHandler(client));
  client.on('message', getDocHandler(client));
  client.on('exit', killProcesses);
  clientsDocCount.set(client, 0);
  clients.push(client);
}

// Kill on child processes on exit
process.on('exit', killProcesses);

function getDocHandler(client) {
  return function docHandler(message) {
    const docCount = config.docs.length;

    if ('docCount' in message) {
      Object.defineProperty(client, '_hasDocCount', {
        configurable: false,
        enumberable: false,
        value: true,
      });
      clientsDocCount.set(client, message.docCount);
    }

    if (clients.every(c => c._hasDocCount)) {
      if (Array.from(clientsDocCount).every(([, key]) => key === docCount)) {
        console.log(`All ${CLIENT_COUNT} clients fetched ${docCount} documents`);
        process.exit();
      } else {
        throw new Error('Not all clients received documents');
      }
    }
  };
}

function getMessageHandler(childProcess) {
  return function messageHandler(message) {
    if ('error' in message) {
      console.error(`Child process ${childProcess.pid} errored:`);
      console.error(message.error);
    } else {
      console.log(message);
    }
  };
}

function getReadyHandler(childProcess) {
  return function readyHandler(message) {
    if ('ready' in message && message.ready) {
      if (childProcess === server) {
        serverReady = true;
        server.removeListener('message', readyHandler);
      } else {
        clientReadyCount++;
        childProcess.removeListener('message', readyHandler);
      }
    }

    if (serverReady && clientReadyCount === CLIENT_COUNT) {
      clients.forEach(client => {
        client.send({
          cmd: 'run',
        });
      });
    }
  };
}

function killProcesses() {
  server && server.kill();

  clients.forEach(client => client && client.kill());
}


