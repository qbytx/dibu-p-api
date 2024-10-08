'use strict';

const ROUTES = require('../../lib/routes');
const Joi = require('joi');

module.exports = async function (fastify, opts) {
  fastify.post(ROUTES.LOGOUT, async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;

      if (!authHeader) {
        return reply
          .code(401)
          .header('Content-Type', 'application/json')
          .header('Cache-Control', 'no-store')
          .send({ status: 'error', message: 'No token provided' });
      }

      const token = authHeader.split(' ')[1];

      if (!token) {
        return reply
          .code(401)
          .header('Content-Type', 'application/json')
          .header('Cache-Control', 'no-store')
          .send({ status: 'error', message: 'Invalid token format' });
      }

      // TODO: Implement token invalidation logic
      // This could involve adding the token to a blacklist in your database
      // await fastify.db.addToBlacklist(token);

      // Clear the cookie if you're using cookie-based authentication
      reply.clearCookie('token', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      return reply
        .code(200)
        .header('Content-Type', 'application/json')
        .header('Cache-Control', 'no-store')
        .send({ status: 'success', message: 'Logged out successfully' });
    } catch (error) {
      request.log.error(error);
      return reply
        .code(500)
        .header('Content-Type', 'application/json')
        .header('Cache-Control', 'no-store')
        .send({ status: 'error', message: 'Internal server error' });
    }
  });
};
