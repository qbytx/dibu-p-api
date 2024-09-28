const autoload = require('@fastify/autoload');
const sensible = require('@fastify/sensible');
const env = require('@fastify/env');
const cors = require('@fastify/cors');
const underPressure = require('@fastify/under-pressure');
const S = require('fluent-json-schema');
const { join } = require('node:path');

module.exports = async function (fastify, opts) {

    // configure environment variables
    require('dotenv').config();

    // It's very common to pass secrets and configuration
    // to your application via environment variables.
    // The `fastify-env` plugin will expose those configuration
    // under `fastify.config` and validate those at startup.

    const schema = S.object()
    .prop('PORT', S.string().default('4000')) // Default value as a string
    .required(['PORT']);

    const envOptions = {
        confKey: 'config', // optional, default: 'config'
        schema: schema,
        dotenv: true
        // data: data // optional, default: process.env
    }

    await fastify.register(env, envOptions);

    // Fastify is an extremely lightweight framework, it does very little for you.
    // Every feature you might need, such as cookies or database coonnectors
    // is provided by external plugins.
    // See the list of recognized plugins  by the core team! https://www.fastify.io/ecosystem/
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

    // Normally you would need to load by hand each plugin. `fastify-autoload` is an utility
    // we wrote to solve this specific problems. It loads all the content from the specified
    // folder, even the subfolders. Take at look at its documentation, as it's doing a lot more!
    // First of all, we require all the plugins that we'll need in our application.
    await fastify.register(autoload, {
        dir: join(__dirname, 'plugins'),
        options: Object.assign({}, opts)
    });

    // Then, we'll load all of our routes.
    await fastify.register(autoload, {
        dir: join(__dirname, 'routes'),
        dirNameRoutePrefix: false,
        options: Object.assign({}, opts)
    });

    // assumes Env module was loaded
    const port = fastify.config.PORT || 4001;

    await fastify.listen({ port }, function (err, address) {
        if (err) {
            fastify.log.error(err);
            console.error(err);
            process.exit(1);
        }
    });
}