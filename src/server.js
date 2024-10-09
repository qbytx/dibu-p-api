'use strict';
require('dotenv').config();
require('make-promises-safe');
const Fastify = require('fastify');
const env = require('@fastify/env');
const Auth = require('./auth.js');
const App = require('./app.js');
const Jwt = require('@fastify/jwt');
const FilePaths = require('./plugins/file-paths.js');
const FileCache = require('./plugins/file-cache.js');

// config
const config = require('config');
const secrets = config.get('secrets');
const server = config.get('server');

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
    /**
     * [FILESYSTEM INIT]
     */
    await fastify.register(FilePaths);
    await fastify.register(FileCache);

    /**
     * [AUTH INIT]
     * */
    await fastify.register(Jwt, {
      secret: secrets.jwtSecret
    });
    Auth.init(fastify);

    /**
     * [ENVIRONMENT]
     */
    await fastify.register(env, environmentOptions);

    /**
     * [APPLICATION]
    */
    await fastify.register(App);

    /**
     * [SERVER INIT]
     */
    const port = server?.port || 4000;
    await fastify.listen({ port });
    fastify.log.info(`Server listening on port ${port}`);

    /**
     * [NODE JS]
     */
    const listeners = ['SIGINT', 'SIGTERM'];
    listeners.forEach((signal) => {
      process.on(signal, async () => {
        fastify.log.warn('Terminated Server');
        await fastify.close();
        process.exit(0);
      });
    });

    /**
     * Connect DB & Services
     */
    await initializeSecrets(getFastifyConfiguration(fastify));
    await connectDatabasePool(getSecrets());
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
