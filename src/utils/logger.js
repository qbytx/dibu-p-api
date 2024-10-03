'use strict';

const pino = require('pino');
const pretty = require('pino-pretty');

const prettyStream = pretty({
  colorize: true,
  translateTime: 'SYS:standard',
  ignore: 'pid,hostname'
});

// Create a logger instance
const logger = pino(prettyStream);

module.exports = logger;
