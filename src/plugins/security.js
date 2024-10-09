'use strict';

const fp = require('fastify-plugin');
const UnderPressure = require('@fastify/under-pressure');
const Sensible = require('@fastify/sensible');
const Helmet = require('@fastify/helmet');
const Cors = require('@fastify/cors');
const PLUGINS = require('../data/json/plugins.json');
const supertokens = require('supertokens-node');

// for getting auth configuration
const authConfig = require('config').get('auth');

async function security (fastify, options) {
  await fastify.register(Sensible);

  await fastify.register(UnderPressure, {
    maxEventLoopDelay: 1000,
    maxHeapUsedBytes: 1000000000,
    maxRssBytes: 1000000000,
    maxEventLoopUtilization: 0.98
  });

  // Add [SuperTokens Auth] middleware to Fastify
  await fastify.register(Cors, {
    origin: authConfig.websiteDomain,
    allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()],
    credentials: true
  });

  await fastify.register(Helmet, {
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        frameSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-eval'",
          'https://unpkg.com'
        ],
        fontSrc: [
          "'self'",
          'data:',
          'https://www.gstatic.com',
          'https://fonts.gstatic.com',
          'https://fonts.googleapis.com'
        ],
        connectSrc: [
          "'self'",
          'https://unpkg.com'],
        imgSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://www.gstatic.com',
          'https://fonts.googleapis.com',
          'https://unpkg.com'
        ]
      }
    }
  });
}

module.exports = fp(security, PLUGINS.security.options);
