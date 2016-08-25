'use strict';

require('./utils/error-handling');

const cp = require('child_process');
const path = require('path');

const CLIENT_COUNT = 3;

const server = cp.fork(path.join(__dirname, 'server.js'));
const clients = [];

function getMessageHandler(childProcess) {
  return function messageHandler(message) {
    console.log(message);
  };
}

for (let i = 0; i < CLIENT_COUNT; i++) {
  const client = cp.fork(path.join(__dirname, 'client.js'));
  client.on('message', getMessageHandler(client));
  clients.push(client);
}

server.on('message', getMessageHandler(server));

// Kill all forked processes on exit
process.on('exit', () => {
  server && server.kill();

  clients.forEach(client => client && client.kill());
});

