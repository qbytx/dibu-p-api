'use strict';

require('dotenv').config();
require('make-promises-safe');
const Fastify = require('fastify');
const env = require('@fastify/env');
const App = require('./app.js');

// config
const { loadFilePaths } = require('./config/filePaths.js');
const { loggingOptions } = require('./config/logging.js');
const { environmentOptions } = require('./config/environment.js');

// services
const { secrets, loadSecrets } = require('./services/secrets.js');
const { connectDatabase, linkDatabase } = require('./services/database');

async function start () {
  const fastify = Fastify({
    trustProxy: true,
    logger: loggingOptions.logger
  });

  try {
    await loadFilePaths(fastify);
    await fastify.register(env, environmentOptions);
    await fastify.register(App);

    /**
     * Setup hooks to services
     */

    linkDatabase(fastify);

    /**
     * Start Server
     */

    const port = fastify.config.PORT;
    await fastify.listen({ port });
    fastify.log.info(`Server listening on port ${port}`);

    /**
    * Connect to services:
    * Secrets
    * Database
    */

    await loadSecrets(fastify);
    await connectDatabase(fastify, secrets);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
