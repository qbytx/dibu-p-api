'use strict';

const json = require('../../data/json/status.json');
const routes = require('../../lib/routes');

module.exports = async function (fastify, opts) {
  fastify.get(routes.STATUS, async (request, reply) => {
    return reply
      .code(200)
      .header('Content-Type', 'application/json')
      .header('Cache-Control', 'no-store')
      .header('X-Custom-Header', 'Some-Value')
      .send(json);
  });
};
