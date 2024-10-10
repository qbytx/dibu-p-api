'use strict';

const fp = require('fastify-plugin');
const Sensible = require('@fastify/sensible');
const { errorHandler } = require('supertokens-node/framework/fastify');
const PLUGINS = require('../data/json/plugins.json');

async function security (fastify, options) {
  await fastify.register(Sensible);

  fastify.setErrorHandler(async (error, request, reply) => {
    // Call the SuperTokens error handler first
    const supertokensResponse = errorHandler()(error, request, reply);

    // If SuperTokens handled the error, return its response
    if (supertokensResponse) {
      return supertokensResponse;
    }

    // Handle other errors
    if (error.validation) {
      throw fastify.httpErrors.badRequest('Invalid input', { details: error.validation });
    }

    switch (error.type) {
      case 'UNAUTHORIZED':
        throw fastify.httpErrors.unauthorized('Authentication required');
      case 'FORBIDDEN':
        throw fastify.httpErrors.forbidden('Access is Forbidden');
      case 'NOT_FOUND':
        throw fastify.httpErrors.notFound('Resource not found');
      default:
        throw fastify.httpErrors.internalServerError('Internal server error');
    }
  });
}

module.exports = fp(security, PLUGINS.httpErrors.options);
