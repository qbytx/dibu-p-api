'use strict';

require('dotenv').config();
require('make-promises-safe');
const Fastify = require('fastify');
const env = require('@fastify/env');
const App = require('./app.js');

const { environmentOptions } = require('./config/environment.js');

async function start () {
  const fastify = Fastify({
    trustProxy: true,
    logger: { level: 'info' }
  });

  try {
    await fastify.register(env, environmentOptions);
    await fastify.register(App);

    const port = fastify.config.PORT;

    // start server
    await fastify.listen({ port });

    fastify.log.info(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
