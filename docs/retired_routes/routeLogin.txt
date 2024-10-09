'use strict';

const logger = require('../../utils/logger');
const Joi = require('joi');
const ROUTES = require('../../lib/routes');
const bcrypt = require('bcrypt');

// Define your Joi schema
const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

// Function to get the base URL for the schema
function getSchemaBaseUrl () {
  return process.env.NGROK_URL || 'https://app.doodlemon.lol';
}

// Function to get the login schema ID
function getLoginSchemaId () {
  return `${getSchemaBaseUrl()}/login`;
}

// Function to convert Joi schema to JSON Schema
// function joiToJsonSchema (joiSchema) {
//   const { error, value } = joiSchema.validate({});
//   if (error || value == null) throw new Error('Joi schema is invalid.');

//   return {
//     $id: getLoginSchemaId(),
//     type: 'object',
//     properties: {
//       username: { type: 'string' },
//       password: { type: 'string' }
//     },
//     required: ['username', 'password']
//   };
// }

// Function to convert Joi schema to JSON Schema
function joiToJsonSchema(joiSchema) {
  // Convert Joi schema to JSON Schema manually or with a library.
  // In this case, we will extract relevant properties from the Joi schema.
  
  // This is a simplified conversion. For complex schemas, consider using a dedicated library.
  const jsonSchema = {
    type: 'object',
    properties: {},
    required: []
  };

  for (const key in joiSchema.describe().keys) {
    const keyDescription = joiSchema.describe().keys[key];
    
    jsonSchema.properties[key] = {
      type: keyDescription.type,
      // Handle Joi validation constraints if needed
    };

    if (keyDescription.flags && keyDescription.flags.presence === 'required') {
      jsonSchema.required.push(key);
    }
  }

  return {
    $id: getLoginSchemaId(),
    ...jsonSchema,
  };
}

module.exports = async function (fastify, opts) {
  fastify.addSchema(joiToJsonSchema(loginSchema));
  fastify.post(ROUTES.LOGIN, {
    schema: {
      body: { $ref: getLoginSchemaId() } // Reference the login schema ID
    }
  }, async (request, reply) => {
    try {
      const { username, password } = request.body;

      // Log the incoming credentials
      logger.info(request.body, username, password);

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
