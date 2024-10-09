'use strict';

module.exports = async function frontend (fastify, opts) {
  const indexHTML = fastify.fileCache.getFile(fastify.filePaths.fileKeys.FILE_INDEX);

  if (indexHTML == null) {
    throw new Error('Could not serve a cached index.html file');
  }

  // Define the Fastify route
  fastify.get('/', async (request, reply) => {
    reply
      .code(200)
      .header('X-Robots-Tag', 'noindex, nofollow')
      .type('text/html')
      .send(indexHTML);
  });
};
