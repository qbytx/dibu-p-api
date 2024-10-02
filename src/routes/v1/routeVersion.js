'use strict';

const routes = require('../../lib/routes');
const apiConfig = require('config').get('api');

module.exports = async function (fastify, opts) {
  fastify.get(routes.VERSION, async (request, reply) => {
    return reply
      .code(200)
      .header('Content-Type', 'application/json')
      .header('Cache-Control', 'no-store')
      .header('X-Custom-Header', 'Some-Value')
      .send(JSON.stringify({
        api: apiConfig.name,
        version: { currentVersion: `v${apiConfig.version}` }
      }));
  });
};
