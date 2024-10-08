'use strict';

const ROUTES = require('../../lib/routes');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const axios = require('axios');

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

      // Check if username or email already exists in the database
      // const existingUser = await fastify.db.findUser({ $or: [{ username }, { email }] });
      // if (existingUser) {
      //   return reply.code(400).send({ status: 'error', message: 'Username or email already exists' });
      // }

      // Hash the password for database storage
      const hashedPassword = await hashPassword(password);

      // Create user in Auth0 using the Authentication API
      const auth0Response = await axios.post(`https://${process.env.AUTH0_DOMAIN}/dbconnections/signup`, {
        client_id: process.env.AUTH0_CLIENT_ID,
        email,
        password,
        connection: 'Username-Password-Authentication',
        username,
        user_metadata: { username }
      });

      if (!auth0Response.data || !auth0Response.data._id) {
        throw new Error('Failed to create user in Auth0');
      }

      // Save user to database
      const dbUser = await fastify.db.createUser({
        username,
        email,
        password: hashedPassword,
        auth0Id: auth0Response.data._id
      });

      reply.code(201).send({ message: 'User created successfully', userId: dbUser.id });
    } catch (error) {
      request.log.error(error);

      // If user was created in Auth0 but not in the database, we can't easily delete it
      // You might want to implement a cleanup process or manual intervention for such cases

      reply.code(500).send({ status: 'error', message: 'An error occurred during signup' });
    }
  });
};
