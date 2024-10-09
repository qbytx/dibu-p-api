'use strict';

const fp = require('fastify-plugin');
const UnderPressure = require('@fastify/under-pressure');
const Helmet = require('@fastify/helmet');
const Cors = require('@fastify/cors');
const Jwt = require('@fastify/jwt');

const PLUGINS = require('../data/json/plugins.json');
const supertokens = require('supertokens-node');

// Configuration
const authConfig = require('config').get('auth');
const configSecrets = require('config').get('secrets');

async function security (fastify, options) {
  // JWT init
  await fastify.register(Jwt, {
    secret: configSecrets.jwtSecret
  });

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
