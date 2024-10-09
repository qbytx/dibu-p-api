'use strict';

require('dotenv').config();
require('make-promises-safe');

const Fastify = require('fastify');
const Env = require('@fastify/env');
const Jwt = require('@fastify/jwt');
const Autoload = require('@fastify/autoload');

// Utilities
const filePaths = require('./lib/utilities/file-paths.js');
const fileCache = require('./lib/utilities/file-cache.js');
const appAuth = require('./lib/utilities/app-auth.js');

// Configuration
const config = require('config');
const configSecrets = config.get('secrets');
const configServer = config.get('server');

// Environment
const DIRECTORIES = require('./data/json/directories.json');
const { loggingOptions } = require('./lib/logging.js');
const { environmentOptions } = require('./lib/environment.js');

// Database & Services
const { initializeSecrets, getSecrets, getFastifyConfiguration } = require('./services/secrets.js');
const { connectDatabasePool } = require('./db/database.js');

async function buildFastify () {
  const fastify = Fastify({
    trustProxy: true,
    logger: loggingOptions.logger
  });

  // Environment
  await fastify.register(Env, environmentOptions);

  // Filesystem init
  await fastify.register(filePaths);
  await fastify.register(fileCache);

  // JWT init
  await fastify.register(Jwt, {
    secret: configSecrets.jwtSecret
  });

  // Auth init
  await fastify.register(appAuth);

  // Plugins
  await fastify.register(Autoload, {
    dir: fastify.filePaths.src.directories[DIRECTORIES.srcDirPlugins],
    options: {}
  });

  // Routes
  await fastify.register(Autoload, {
    dir: fastify.filePaths.src.directories[DIRECTORIES.srcDirRoutes],
    dirNameRoutePrefix: false,
    options: {}
  });

  return fastify;
}

async function start () {
  let fastify;
  try {
    fastify = await buildFastify();

    // Server init
    const port = configServer?.port || 4000;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server listening on port ${port}`);

    // Database & Services
    await initializeSecrets(getFastifyConfiguration(fastify));
    await connectDatabasePool(getSecrets());
  } catch (err) {
    if (fastify) {
      fastify.log.error(err);
    } else {
      console.error(err);
    }
    process.exit(1);
  }
}

function setupGracefulShutdown (fastify) {
  const listeners = ['SIGINT', 'SIGTERM'];
  listeners.forEach((signal) => {
    process.on(signal, async () => {
      fastify.log.warn(`${signal} received. Shutting down gracefully...`);
      try {
        await fastify.close();
        fastify.log.info('Server closed successfully');
        process.exit(0);
      } catch (err) {
        fastify.log.error('Error during shutdown:', err);
        process.exit(1);
      }
    });
  });
}

async function run () {
  const fastify = await buildFastify();
  setupGracefulShutdown(fastify);
  await start();
}

run();
