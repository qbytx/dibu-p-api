'use strict';

const underPressure = require('@fastify/under-pressure');
const autoload = require('@fastify/autoload');
const sensible = require('@fastify/sensible');
const helmet = require('@fastify/helmet');
const cors = require('@fastify/cors');
const { join, resolve } = require('node:path');
const fsPromises = require('node:fs').promises;

module.exports = async function (fastify, opts) {

    // `fastify-sensible` adds many  small utilities, such as nice http errors.
    await fastify.register(sensible);

    // This plugin is especially useful if you expect a high load
    // on your application, it measures the process load and returns
    // a 503 if the process is undergoing too much stress.
    await fastify.register(underPressure, {
        maxEventLoopDelay: 1000,
        maxHeapUsedBytes: 1000000000,
        maxRssBytes: 1000000000,
        maxEventLoopUtilization: 0.98
    });

    // Enables the use of CORS in a Fastify application.
    // https://en.wikipedia.org/wiki/Cross-origin_resource_sharing
    await fastify.register(cors, {
        origin: false
    });

    // `fastify-helmet` helps you secure your application
    // with important security headers. It's not a silver bullet™,
    // but security is an orchestraton of multiple tools that work
    // together to reduce the attack surface of your application.
    
    await fastify.register(helmet, {
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
    
    // I am setting the 404 handler and decorator now, so that it is available
    // to any plugins in the routes dir
    
    const buffer404 = {
        path: resolve(join(__dirname, './public/404.html')),
        file: null
    }

    try {
        buffer404.file = await fsPromises.readFile(buffer404.path);
    } catch (error) {
        fastify.log.error(`Failed to read 404 HTML file: ${error.message}`);
    }

    fastify.decorate('sendNotFound', (request, reply) => {
        if (buffer404.file != null) {
            reply.code(404).type('text/html').send(buffer404.file);
        } else {
            reply.notFound();
        }
    });

    fastify.setNotFoundHandler(fastify.sendNotFound);

    // Normally you would need to load by hand each plugin. `fastify-autoload` is an utility
    // we wrote to solve this specific problems. It loads all the content from the specified
    // folder, even the subfolders. Take at look at its documentation, as it's doing a lot more!

    // load plugins
    await fastify.register(autoload, {
        dir: join(__dirname, 'plugins'),
        options: Object.assign({}, opts)
    });

    // load routes
    await fastify.register(autoload, {
        dir: join(__dirname, 'routes'),
        dirNameRoutePrefix: false,
        options: Object.assign({}, opts)
    });
}
