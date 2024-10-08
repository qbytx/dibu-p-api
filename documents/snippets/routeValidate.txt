'use strict';

const sanitizeHtml = require('sanitize-html');

const Joi = require('joi');

const _400Prefix = '400::';
const _400Postfix = ' 😔';
const _specialCharacters = '!@#$%^&*';
const _minPasswordLength = 8;
const _maxPasswordLength = 64;
const _minUsernameLength = 3;
const _maxUsernameLength = 32;
const _passwordRegex = new RegExp(`^[a-zA-Z0-9${_specialCharacters}]{${_minPasswordLength},${_maxPasswordLength}}$`);

const _headers = {
  'Content-Security-Policy': "default-src 'self'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block'
};

const loginSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(_minUsernameLength)
    .max(_maxUsernameLength)
    .required()
    .messages({
      'string.empty': 'Username is required',
      'string.alphanum': 'Username must be alphanumeric'
    }),

  email: Joi.string()
    .email()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Invalid email format'
    }),

  password: Joi.string()
    .min(_minPasswordLength)
    .max(_maxPasswordLength)
    .pattern(_passwordRegex)
    .required()
    .messages({
      'string.empty': 'Password is required'
    })
});

// Validation schema for signup endpoint
const signupSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(_minUsernameLength)
    .max(_maxUsernameLength)
    .required()
    .messages({
      'string.empty': 'Username is required',
      'string.alphanum': 'Username must be alphanumeric',
      'string.min': `Username must be at least ${_minUsernameLength} characters long`,
      'string.max': `Username must be less than or equal to ${_maxUsernameLength} characters long`
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Invalid email format'
    }),

  password: Joi.string()
    .min(_minPasswordLength)
    .max(_maxPasswordLength)
    .pattern(_passwordRegex)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.pattern.base': `Password must be ${_minPasswordLength}-${_maxPasswordLength} characters. Can include letters, numbers, and these characters: ${_specialCharacters}`,
      'string.min': `Password must be at least ${_minPasswordLength} characters long`,
      'string.max': `Password must be less than or equal to ${_maxPasswordLength} characters long`
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords must match'
    })
});

const routes = require('../../lib/routes');

const msg400 = (str) => {
  return `${_400Prefix}${str}${_400Postfix}`;
};

module.exports = async function (fastify, opts) {
  fastify.post(`${routes.VALIDATE}/:type`, async (request, reply) => {
    const { type } = request.params;

    let schema;

    if (type === 'signup') {
      schema = signupSchema;
    } else if (type === 'login') {
      schema = loginSchema;
    } else {
      return reply.status(400).send({ status: 'fail', message: `${msg400('End point does not exist')}` });
    }

    const { error, value } = schema.validate(request.body, { abortEarly: false });

    // If validation fails, return a 400 response with error details
    if (error) {
      const details = error.details.map(detail => detail.message);
      const response = JSON.stringify(Array.from(details));
      return reply
        .status(400)
        .headers(_headers)
        .send({
          status: 'fail',
          data: response
        });
    }

    // Optionally sanitize inputs here
    const sanitizedData = {
      name: sanitizeHtml(value.name),
      email: sanitizeHtml(value.email),
      message: sanitizeHtml(value.message)
    };

    // if valid, return, set appropriate headers for security
    reply
      .status(200)
      .headers(_headers)
      .send({
        status: 'success',
        data: sanitizedData
      });
  });
};
