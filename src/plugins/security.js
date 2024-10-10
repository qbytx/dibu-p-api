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

  await fastify.register(Helmet, {
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"], // Use 'self' correctly
        frameSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-eval'",
          "'unsafe-inline'", // Allow inline scripts
          'https://unpkg.com',
          'https://cdn.jsdelivr.net'
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
          'https://unpkg.com'
        ],
        imgSrc: [
          "'self'",
          'https://cdn.jsdelivr.net' // Allow images from the CDN
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Allow inline styles
          'https://www.gstatic.com',
          'https://fonts.googleapis.com',
          'https://unpkg.com',
          'https://cdn.jsdelivr.net' // Allow styles from the CDN
        ]
      }
    }
  });
}

module.exports = fp(security, PLUGINS.security.options);
