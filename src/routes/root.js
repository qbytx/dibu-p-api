'use strict';

const buffers = require('../config/buffers');
const { file } = buffers.files.fileIndex;

module.exports = async function frontend (fastify, opts) {
  fastify.get('/', async (request, reply) => {
    if (!file || file == null) {
      reply.notFound();
    } else {
      reply
        .code(200)
        .header('X-Robots-Tag', 'noindex, nofollow')
        .type('text/html')
        .send(file);
    }
  });
};
