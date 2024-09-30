'use strict';

const routes = require('../../config/routes');
const serverSettings = require('../../config/server-settings.json');

module.exports = async function (fastify, opts) {
  fastify.get(routes.VERSION, async (request, reply) => {
    return reply
      .code(200)
      .header('Content-Type', 'application/json')
      .header('Cache-Control', 'no-store')
      .header('X-Custom-Header', 'Some-Value')
      .send(JSON.stringify({
        api: serverSettings.API,
        version: { ...serverSettings.version }
      }));
  });
};
