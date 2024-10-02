'use strict';

const json = require('../../data/json/secrets.json');
const routes = require('../../lib/routes');

module.exports = async function (fastify, opts) {
  fastify.get(routes.SECRETS, async (request, reply) => {
    return reply
      .code(200)
      .header('Content-Type', 'application/json')
      .header('Cache-Control', 'no-store')
      .header('X-Custom-Header', 'Some-Value')
      .send(json);
  });
};
