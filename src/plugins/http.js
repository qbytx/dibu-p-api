'use strict';

const fp = require('fastify-plugin');
const Sensible = require('@fastify/sensible');
const PLUGINS = require('../data/json/plugins.json');

async function security (fastify, options) {
  await fastify.register(Sensible);
}

module.exports = fp(security, PLUGINS.http.options);
