'use strict';

const json = require('../../data/json/status.json');

module.exports = async function (fastify, opts) {
  fastify.get('/status', async (request, reply) => {
    return reply
      .code(200)
      .header('Content-Type', 'application/json')
      .header('Cache-Control', 'no-store')
      .header('X-Custom-Header', 'Some-Value')
      .send(json);
  });

  // fastify.post('/users', async (request, reply) => {
  //   // Handle POST /users
  // });
};
