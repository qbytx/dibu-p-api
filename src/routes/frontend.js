'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const Static = require('@fastify/static');

const publicPath = path.resolve(path.join(__dirname, '..', 'public'));
const indexPath = path.join(publicPath, 'index.html');

module.exports = async function frontend (fastify, opts) {
  
    // You are welcome to serve static files from Fastify
    // with the `fastify-static` plugin, but in the real-world™
    // you should definitely use a CDN!
    
    await fastify.register(Static, {
        root: publicPath,
        prefix: '/'
    });

    let indexHtml = null;
    try {
        indexHtml = await fs.readFile(indexPath, 'utf-8');
    } catch (error) {
        fastify.log.error(`Failed to read index.html: ${error.message}`);
        process.exit(1);
    }

    fastify.get('/', async (request, reply) => {
        reply
            .code(200)
            .header('X-Robots-Tag', 'noindex, nofollow')
            .type('text/html')
            .send(indexHtml);
    });

    // A single route that serves the index.html file,
    // `fastify-static` will take care of the rest.
    // fastify.route({
    //     method: 'GET',
    //     path: '/',
    //     handler: onBundle
    // });

    // function onBundle (req, reply) {
    //     // Robots go away! https://developers.google.com/search/reference/robots_meta_tag
    //     reply.header('X-Robots-Tag', 'noindex, nofollow');

    //     // `.sendFile` is a decorator added by `fastify-static`
    //     // reply.sendFile('index.html');
    //     reply.code(202).type('text/html').send(indexHtml);
    // }
}
