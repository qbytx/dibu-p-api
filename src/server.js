'use strict';
require('dotenv').config();
require('make-promises-safe');
const Fastify = require('fastify');
const Env = require('@fastify/env');
const Jwt = require('@fastify/jwt');
const Autoload = require('@fastify/autoload');
const DIRECTORIES = require('./data/json/directories.json');

/**
 * Lib: Utilities
 */
const filePaths = require('./lib/utilities/file-paths.js');
const fileCache = require('./lib/utilities/file-cache.js');
const appAuth = require('./lib/utilities/app-auth.js');

/**
 * Configuration
 */
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
     * [ENVIRONMENT]
     */
    await fastify.register(Env, environmentOptions);

    /**
     * [FILESYSTEM INIT]
     */
    await fastify.register(filePaths);
    await fastify.register(fileCache);

    /**
     * [JWT INIT]
     * */
    await fastify.register(Jwt, {
      secret: secrets.jwtSecret
    });

    /**
     * [AUTH INIT]
     */
    await fastify.register(appAuth);

    /**
     * [PLUGINS]
     */
    await fastify.register(Autoload, {
      dir: fastify.filePaths.src.directories[DIRECTORIES.srcDirPlugins],
      options: {}
    });

    /**
     * [ROUTES]
     */
    await fastify.register(Autoload, {
      dir: fastify.filePaths.src.directories[DIRECTORIES.srcDirRoutes],
      dirNameRoutePrefix: false,
      options: {}
    });

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
     * [Database & Services]
     */
    await initializeSecrets(getFastifyConfiguration(fastify));
    await connectDatabasePool(getSecrets());
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
