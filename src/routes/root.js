'use strict';

const { fileCache } = require('../config/fileCache');
const { FILES } = require('../config/paths');

const file = fileCache[FILES.fileIndex]?.file;

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
