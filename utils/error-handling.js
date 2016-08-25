'use strict';

process.on('uncaughtException', error => {
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
  process.exit(1);
});

