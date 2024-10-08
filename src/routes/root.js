'use strict';

const { fileCache } = require('../lib/fileCache');
const { FILES } = require('../lib/filePaths');

const file = fileCache[FILES.HTML_INDEX]?.file;

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
