'use strict';

const fp = require('fastify-plugin');
const Static = require('@fastify/static');
const PLUGINS = require('../data/json/plugins.json');

async function staticAssets (fastify, options) {
  await fastify.register(Static, {
    root: fastify.filePaths.public.path,
    prefix: fastify.filePaths.public.pathPrefix
  });
}

module.exports = fp(staticAssets, PLUGINS.staticAssets.options);
