'use strict';

const fp = require('fastify-plugin');
const Static = require('@fastify/static');
const PLUGINS = require('../data/json/plugins.json');

async function staticAssets (fastify, options) {
  // Check if filePaths is defined and accessible
  if (!fastify.filePaths) {
    throw new Error('filePaths plugin is not registered or accessible.');
  }

  // Log the paths to verify they are correct
  fastify.log.info(`Registering static assets with root: ${fastify.filePaths.public.root}`);
  // fastify.log.info(`Registering static assets with prefix: ${fastify.filePaths.public.pathPrefix}`);

  await fastify.register(Static, {
    root: fastify.filePaths.public.root
    // prefix: fastify.filePaths.public.pathPrefix
  });
}

module.exports = fp(staticAssets, PLUGINS.staticAssets.options);
