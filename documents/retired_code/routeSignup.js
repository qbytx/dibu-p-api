'use strict';
const ROUTES = require('../../lib/routes');
const Joi = require('joi');
const bcrypt = require('bcrypt');

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 32;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 64;
const SPECIAL_CHARACTERS = '!@#$%^&*';
const PASSWORD_REGEX = new RegExp(`^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[${SPECIAL_CHARACTERS}])[A-Za-z\\d${SPECIAL_CHARACTERS}]{${PASSWORD_MIN_LENGTH},${PASSWORD_MAX_LENGTH}}$`);

const signupSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(USERNAME_MIN_LENGTH)
    .max(USERNAME_MAX_LENGTH)
    .required()
    .messages({
      'string.empty': 'Username is required',
      'string.alphanum': 'Username must be alphanumeric',
      'string.min': `Username must be at least ${USERNAME_MIN_LENGTH} characters long`,
      'string.max': `Username must be less than or equal to ${USERNAME_MAX_LENGTH} characters long`
    }),
  email: Joi.string()
    .email()
    .required(),
  password: Joi.string()
    .pattern(PASSWORD_REGEX)
    .required(),
  confirmPassword: Joi.ref('password')
}).with('password', 'confirmPassword');

const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

module.exports = async function (fastify, opts) {
  fastify.post(ROUTES.SIGNUP, {
    schema: {
      body: signupSchema
    }
  }, async (request, reply) => {
    try {
      const { username, email, password } = request.body;

      // TODO: Check if username or email already exists in the database

      const hashedPassword = await hashPassword(password);

      // TODO: Save user to database

      reply.code(201).send({ message: 'User created successfully' });
    } catch (error) {
      reply.code(400).send({ status: 'error', message: error.message });
    }
  });
};
