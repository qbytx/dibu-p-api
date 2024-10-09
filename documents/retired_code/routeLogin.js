'use strict';

const logger = require('../../utils/logger');
const Joi = require('joi');
const ROUTES = require('../../lib/routes');

// const bcrypt = require('bcrypt');

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

module.exports = async function (fastify, opts) {
  fastify.post(ROUTES.LOGIN, {
    schema: {
      body: loginSchema
    }
  }, async (request, reply) => {
    try {
      const { username, password } = request.body;
      logger.info({ username, password });

      // TODO: Retrieve user from database
      // const user = await fastify.db.getUserByUsername(username);
      // if (!user) {
      //   throw new Error('Invalid username or password');
      // }

      // TODO: Compare passwords
      // const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

      // if (!isPasswordValid) {
      //   throw new Error('Invalid username or password');
      // }

      // TODO: Generate and return JWT token
      // const token = fastify.jwt.sign({ id: user.id, username: user.username });

      reply.code(200).send({ message: 'Login successful' /* , token */ });
    } catch (error) {
      reply.code(400).send({ status: 'error', message: error.message });
    }
  });
};
