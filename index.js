'use strict';

require('./utils/error-handling');

const cp = require('child_process');
const path = require('path');

const CLIENT_COUNT = 10;
let serverReady = false;
let clientReadyCount = 0;
const server = cp.fork(path.join(__dirname, 'server.js'), {
  execArgv: [],
});
const clients = [];

server.on('message', getMessageHandler(server));
server.on('message', getReadyHandler(server));

for (let i = 0; i < CLIENT_COUNT; i++) {
  const client = cp.fork(path.join(__dirname, 'client.js'), {
    execArgv: [],
  });
  client.on('message', getMessageHandler(client));
  client.on('message', getReadyHandler(client));
  clients.push(client);
}

// Kill on processes on exit
process.on('exit', killProcesses);
server.on('exit', killProcesses);
clients.forEach(client => client.on('exit', killProcesses));

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


