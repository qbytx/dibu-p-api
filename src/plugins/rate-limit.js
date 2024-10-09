'use strict';

const fp = require('fastify-plugin');
const RateLimit = require('@fastify/rate-limit');
const page429 = require('../data/templates/page429');
const { LRUCache } = require('lru-cache');

/**
 * NOTE TO EVA / SELF: USING LRU CACHE
 * When exposing an application to the public internet, it's a good
 * approach to add a rate limiter to disallow excessive usage.
 * A rate limiter will save resources and based on the configuration
 * help you identify malicious users.
 *
 * Usually one of the best suited databases for storing rate limit data
 * is Redis, due to its speed and the simple nature of the store data.
 * In this case we will reuse lru-cache, to avoid increase the complexity
 * of the codebase and the cost of the infrastructure.
 *
 * Fastify offers a simple yet powerful plugin for handling rate limiting,
 * named `fastify-rate-limit`. Unfortunately lru-cache is not part
 * of the officially supported stores, so we'll write a custom one.
 */

const defaultCacheOptions = {
  max: 100000, // Increase max number of items
  maxSize: 50000000, // 50MB max size
  sizeCalculation: (value, key) => {
    // Estimate size: 4 bytes for current (integer), 8 bytes for ttl (timestamp)
    // Plus length of the key (IP address) * 2 bytes per character
    return 12 + (key.length * 2);
  },
  ttl: 1000 * 60 * 5, // Time-to-live in milliseconds (5 minutes)
  updateAgeOnGet: false,
  allowStale: false
  // dispose: (value, key) => {
  //     // Optional: Perform any cleanup if needed when an item is removed
  // },
};

class LRUStore {
  constructor (options) {
    this.options = options;
    this.cache = new LRUCache({ ...defaultCacheOptions, ...options.cacheOptions });
  }

  // (incr) method will be called each time a new request comes in.
  incr (key, callback) {
    const { timeWindow } = this.options;

    if (timeWindow == null) {
      return callback(new Error('timeWindow option is required'), null);
    }

    const now = Date.now();
    const record = this.cache.get(key) || { current: 0, ttl: now + timeWindow };

    if (record.ttl <= now) {
      record.current = 1;
      record.ttl = now + timeWindow;
    } else {
      record.current += 1;
    }

    this.cache.set(key, record);
    callback(null, record);
  }

  // (child) handles creating a store per-route
  child (routeOptions) {
    return new LRUStore({ ...this.options, ...routeOptions });
  }
}

// `fastify-rate-limit` does not allow to configure a custom response
// that is not a JSON, which means that if we want to send something
// different, say an html page, we need to intercept the error and
// change the response. This can be achieved by using the `.setErrorHandler`
// method. It will intercept all errored responses and allow you to update
// the response to what you need. In this case, since we are serving a
// frontend application, we want to send back an html page.

function errorHandler (error, request, reply) {
  if (error.statusCode === 429) {
    return reply
      .code(429)
      .type('text/html')
      .send(page429(error.message));
  }
  reply.send(error);
}

async function rateLimit (fastify, opts) {
  fastify.setErrorHandler(errorHandler);

  await fastify.register(RateLimit, {
    allowList: ['127.0.0.1'], // no rate limit on localhost
    store: LRUStore,
    timeWindow: '1 minute',
    max: 50
  });
}

module.exports = fp(rateLimit, {
  name: 'rateLimit',
  dependencies: []
});
