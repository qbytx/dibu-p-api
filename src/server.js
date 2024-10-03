'use strict';

require('dotenv').config();
require('make-promises-safe');
const config = require('config');
const Fastify = require('fastify');
const env = require('@fastify/env');
const App = require('./app.js');

// config
const { loadFilePaths } = require('./lib/filePaths.js');
const { loggingOptions } = require('./lib/logging.js');
const { environmentOptions } = require('./lib/environment.js');

// services
const { loadSecrets, getSecrets, getFastifyConfiguration } = require('./services/secrets.js');
const { connectDatabase, linkDatabase } = require('./services/db/database');

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
     *  Link fastify to db callbacks
     */

    linkDatabase(fastify);

    /**
     * Start Server
     */

    const port = config.get('server').port;
    await fastify.listen({ port });
    fastify.log.info(`Server listening on port ${port}`);

    /**
    * Connect to services:
    * Secrets
    * Database
    */

    await loadSecrets(getFastifyConfiguration(fastify));
    await connectDatabase(getSecrets(), fastify);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
