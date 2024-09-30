'use strict';

const UnderPressure = require('@fastify/under-pressure');
const Autoload = require('@fastify/autoload');
const Sensible = require('@fastify/sensible');
const Helmet = require('@fastify/helmet');
const Static = require('@fastify/static');
const Cors = require('@fastify/cors');
const { fileCache, loadFileCache } = require('./config/fileCache');
const { paths, FILES, DIRECTORIES } = require('./config/paths');

module.exports = async function (fastify, opts) {
  // `fastify-sensible` adds many  small utilities, such as nice http errors.
  await fastify.register(Sensible);

  // This plugin is especially useful if you expect a high load
  // on your application, it measures the process load and returns
  // a 503 if the process is undergoing too much stress.
  await fastify.register(UnderPressure, {
    maxEventLoopDelay: 1000,
    maxHeapUsedBytes: 1000000000,
    maxRssBytes: 1000000000,
    maxEventLoopUtilization: 0.98
  });

  // Enables the use of CORS in a Fastify application.
  // https://en.wikipedia.org/wiki/Cross-origin_resource_sharing
  await fastify.register(Cors, {
    origin: false
  });

  // `fastify-helmet` helps you secure your application
  // with important security headers. It's not a silver bullet™,
  // but security is an orchestraton of multiple tools that work
  // together to reduce the attack surface of your application.

  await fastify.register(Helmet, {
    crossOriginEmbedderPolicy: false,

    // Here we are telling to the browser to only
    // accept content from the following sources.
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
          'https://unpkg.com'
        ],
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

  /* Static */
  await fastify.register(Static, {
    root: paths.public.path,
    prefix: paths.public.pathPrefix
  });

  /* Load files into memory */
  await loadFileCache(fastify);

  /* not found decorator & handler */
  fastify.decorate('sendNotFound', (request, reply) => {
    const file = fileCache[FILES.file404]?.file;
    if (file != null) {
      reply.code(404).type('text/html').send(file);
    } else {
      reply.notFound();
    }
  });

  fastify.setNotFoundHandler(fastify.sendNotFound);

  // Normally you would need to load by hand each plugin. `fastify-autoload` is an utility
  // we wrote to solve this specific problems. It loads all the content from the specified
  // folder, even the subfolders. Take at look at its documentation, as it's doing a lot more!

  // load plugins
  await fastify.register(Autoload, {
    // dir: join(__dirname, 'plugins'),
    dir: paths.src.directories[DIRECTORIES.srcDirPlugins],
    options: Object.assign({}, opts)
  });

  // load routes
  await fastify.register(Autoload, {
    // dir: join(__dirname, 'routes'),
    dir: paths.src.directories[DIRECTORIES.srcDirRoutes],
    dirNameRoutePrefix: false,
    options: Object.assign({}, opts)
  });
};
