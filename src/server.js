require('dotenv').config();
require('make-promises-safe');
const Fastify = require('fastify');
const env = require('@fastify/env');
const App = require('./app.js');
const S = require('fluent-json-schema');

const envSchema = S.object()
    .prop('PORT', S.string().default('4000')) 
    .required(['PORT']);

const envOptions = {
    confKey: 'config', 
    schema: envSchema,
    dotenv: true
}

async function start () {
    
    const fastify = Fastify({
      trustProxy: true,
      logger: { level: 'info' }
    });

    // register configuration variables here, at root
    await fastify.register(env, envOptions);

    try {
        await fastify.register(App);
    } catch (err) {
        console.error('Error registering App:', err);
        process.exit(1);
    }

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

// Use an IIFE to call start and handle errors
(async () => {
    try {
        await start();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();