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
  /**
   * JWT
   */
  await fastify.register(Jwt, {
    secret: configSecrets.jwtSecret
  });

  /**
   * Under Pressure
   */
  await fastify.register(UnderPressure, {
    maxEventLoopDelay: 1000,
    maxHeapUsedBytes: 1000000000,
    maxRssBytes: 1000000000,
    maxEventLoopUtilization: 0.98
  });

  /**
   * CORS
   */
  await fastify.register(Cors, {
    // origin: authConfig.websiteDomain,
    origin: 'http://localhost:4002',
    allowedHeaders: ['Content-Type', ...supertokens.getAllCORSHeaders()],
    methods: ['GET', 'PUT', 'POST', 'DELETE'],
    credentials: true
  });

  /**
   * Helmet
   */
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
