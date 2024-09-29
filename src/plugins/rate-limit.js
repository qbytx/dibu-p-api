const fp = require('fastify-plugin');
const RateLimit = require('@fastify/rate-limit');
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
      .send(get429Page(error.message));
  }
  reply.send(error);
}

async function rateLimit (fastify, opts) {
  fastify.setErrorHandler(errorHandler);

  await fastify.register(RateLimit, {
    allowList: ['127.0.0.1'], // no rate limit on localhost
    store: LRUStore,
    timeWindow: '1 minute',
    max: 100
  });
}

function get429Page (message) {
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset='utf-8'>
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <meta name="robots" content="noindex, nofollow">
        <title>Too Many Requests</title>
        <link rel="preconnect" href="https://fonts.gstatic.com">
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;900&display=swap" rel="stylesheet">
        <style>
            html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            font-family: 'Montserrat', sans-serif;
            font-size: 25px;
            }
            main {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            }
            h1 {
            background: linear-gradient(90deg, #d53369 0%, #daae51 100%);
            -webkit-background-clip: text;
            -moz-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            -moz-text-fill-color: transparent;
            text-fill-color: transparent;
            color: #d53369;
            }
        </style>
    </head>
    <body>
        <main>
            <h1>Hey, slow down!</h1>
            <p>${message}</p>
        </main>
    </body>
    </html>
  `;
}

module.exports = fp(rateLimit, {
  name: 'rateLimit',
  dependencies: []
});
