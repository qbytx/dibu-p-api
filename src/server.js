'use strict';
require('dotenv').config();
require('make-promises-safe');
const config = require('config');
const Fastify = require('fastify');
const env = require('@fastify/env');
const Auth = require('./auth.js');
const App = require('./app.js');
const Jwt = require('@fastify/jwt');

// config
const { loadFilePaths } = require('./lib/filePaths.js');
const { loggingOptions } = require('./lib/logging.js');
const { environmentOptions } = require('./lib/environment.js');

// services
const { initializeSecrets, getSecrets, getFastifyConfiguration } = require('./services/secrets.js');
const { connectDatabasePool } = require('./db/database.js');

async function start () {
  const fastify = Fastify({
    trustProxy: true,
    logger: loggingOptions.logger
  });

  try {
    Auth.init(fastify);

    await loadFilePaths(fastify);
    await fastify.register(Jwt, {
      secret: config.get('secrets').jwtSecret
    });
    await fastify.register(env, environmentOptions);
    await fastify.register(App);
    /**
     *  Link fastify to db callbacks
     */

    // linkDatabase(fastify);

    /**
     * Start Server
     */

    const port = config.get('server')?.port || 4000;
    await fastify.listen({ port });
    fastify.log.info(`Server listening on port ${port}`);

    // graceful shutdown
    const listeners = ['SIGINT', 'SIGTERM'];

    listeners.forEach((signal) => {
      process.on(signal, async () => {
        await fastify.close();
        process.exit(0);
      });
    });
    /**
    * Connect to services:
    * Secrets
    * Database
    */

    await initializeSecrets(getFastifyConfiguration(fastify));
    await connectDatabasePool(getSecrets());
    // await connectDatabase(getSecrets(), fastify);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
