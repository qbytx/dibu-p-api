'use strict';

const supertokens = require('supertokens-node');
const { plugin } = require('supertokens-node/framework/fastify');
const { errorHandler } = require('supertokens-node/framework/fastify');
const { verifySession } = require('supertokens-node/recipe/session/framework/fastify');
const { getSession } = require('supertokens-node/recipe/session/framework/fastify');

const Session = require('supertokens-node/recipe/session');
const EmailPassword = require('supertokens-node/recipe/emailpassword');
const ThirdParty = require('supertokens-node/recipe/thirdparty');
const Dashboard = require('supertokens-node/recipe/dashboard');
const UserRoles = require('supertokens-node/recipe/userroles');
const { UserRoleClaim, PermissionClaim } = require('supertokens-node/recipe/userroles');
const { SessionContainer } = require('supertokens-node/recipe/session');

/**
 * Fastify Plugin
 */
const fp = require('fastify-plugin');
const config = require('config');
const PLUGINS = require('../data/json/plugins.json');

/**
 * Logging
 */
const logger = require('../utils/logger');

async function addRoleToUser (userId) {
  const response = await UserRoles.addRoleToUser('public', userId, 'user');

  if (response.status === 'UNKNOWN_ROLE_ERROR') {
    logger.warn(['UNKNOWN ROLE ERROR', JSON.stringify(response, null, 2)]);
    return;
  }

  if (response.didUserAlreadyHaveRole === true) {
    logger.warn(['USER ALREADY HAD ROLE', JSON.stringify(response, null, 2)]);
  }
}

async function addRolesAndPermissionsToSession (session) {
  if (typeof session !== typeof SessionContainer) return;
  // we add the user's roles to the user's session
  await session.fetchAndSetClaim(UserRoleClaim);

  // we add the permissions of a user to the user's session
  await session.fetchAndSetClaim(PermissionClaim);
}

async function removeRoleFromUserAndTheirSession (session) {
  if (typeof session !== typeof SessionContainer) return;

  const response = await UserRoles.removeUserRole(session.getTenantId(), session.getUserId(), 'user');

  if (response.status === 'UNKNOWN_ROLE_ERROR') {
    // No such role exists
    return;
  }

  if (response.didUserHaveRole === false) {
    // The user was never assigned the role
  } else {
    // We also want to update the session of this user to reflect this change.
    await session.fetchAndSetClaim(UserRoles.UserRoleClaim);
    await session.fetchAndSetClaim(UserRoles.PermissionClaim);
  }
}

const schemaSignInUpEmailPassword = (originalImplementation) => {
  return {
    ...originalImplementation,
    signUp: async function (input) {
      // First we call the original implementation of signUp.
      const response = await originalImplementation.signUp(input);

      // Post sign up response, we check if it was successful
      if (response.status === 'OK' && response.user.loginMethods.length === 1 && input.session === undefined) {
        await addRoleToUser(response.user.id);
        /**
                *
                * response.user contains the following info:
                * - emails
                * - id
                * - timeJoined
                * - tenantIds
                * - phone numbers
                * - third party login info
                * - all the login methods associated with this user.
                * - information about if the user's email is verified or not.
                *
                */
        // TODO: post sign up logic
      }
      return response;
    }
  };
};

const schemaSignInUpThirdParty = (originalImplementation) => {
  return {
    ...originalImplementation,
    signInUp: async function (input) {
      // First we call the original implementation of signInUp.
      const response = await originalImplementation.signInUp(input);

      // Post sign up response, we check if it was successful
      if (response.status === 'OK') {
        await addRoleToUser(response.user.id);

        const { id, emails } = response.user;

        // This is the response from the OAuth 2 provider that contains their tokens or user info.
        const providerAccessToken = response?.oAuthTokens?.access_token ?? null;
        const firstName = response?.rawUserInfoFromProvider?.fromUserInfoAPI?.first_name ?? null;

        console.log(id, emails, providerAccessToken, firstName);

        if (input.session === undefined) {
          if (response.createdNewRecipeUser && response.user.loginMethods.length === 1) {
            // TODO: Post sign up logic
          } else {
            // TODO: Post sign in logic
          }
        }
      }
      return response;
    }
  };
};

async function appAuth (fastify, options) {
  const authConfig = config.get('auth');
  const authGoogleConfig = config.get('authGoogle');
  const authGithubConfig = config.get('authGithub');
  const authDiscordConfig = config.get('authDiscord');
  const authSupertokensConfig = config.get('authSupertokens');

  // Do not attempt initialization without proper configuration
  const requiredConfigs = ['appName', 'apiDomain', 'websiteDomain', 'apiBasePath', 'websiteBasePath'];
  for (const configItem of requiredConfigs) {
    if (!authConfig[configItem]) {
      throw new Error(`Missing required configuration: ${configItem}`);
    }
  }

  /**
   * Admin Emails
   */
  const adminEmails = config.get('supertokenAdmins');

  /**
   * Init SuperTokens
   */
  supertokens.init({
    framework: 'fastify',
    supertokens: {
      connectionURI: authSupertokensConfig.connectionUri,
      apiKey: authSupertokensConfig.apiKey
    },
    appInfo: {
      appName: authConfig.appName,
      apiDomain: authConfig.apiDomain,
      websiteDomain: authConfig.websiteDomain,
      apiBasePath: authConfig.apiBasePath,
      websiteBasePath: authConfig.websiteBasePath
    },
    recipeList: [
      UserRoles.init(),
      Dashboard.init({
        admins: adminEmails
      }),
      EmailPassword.init({
        override: {
          functions: (originalImplementation) => {
            return schemaSignInUpEmailPassword(originalImplementation);
          }
        }
      }),
      ThirdParty.init({
        signInAndUpFeature: {
          providers: [
            {
              config: {
                thirdPartyId: 'google',
                clients: [{
                  clientId: authGoogleConfig.clientId,
                  clientSecret: authGoogleConfig.clientSecret
                }]
              }
            },
            {
              config: {
                thirdPartyId: 'github',
                clients: [{
                  clientId: authGithubConfig.clientId,
                  clientSecret: authGithubConfig.clientSecret
                }]
              }
            },
            {
              config: {
                thirdPartyId: 'discord',
                clients: [{
                  clientId: authDiscordConfig.clientId,
                  clientSecret: authDiscordConfig.clientSecret
                }]
              }
            }
          ]
        },
        override: {
          functions: (originalImplementation) => {
            return schemaSignInUpThirdParty(originalImplementation);
          }
        }
      }),
      Session.init()
    ]
  });

  // Form Body Helps with parsing requests
  await fastify.register(require('@fastify/formbody'));

  // (Does this) add supertokens routes to the server (e.g., /auth/signin/, /auth/signup/) ?
  await fastify.register(plugin);

  // Custom error handler that incorporates SuperTokens error handling
  fastify.setErrorHandler((error, request, reply) => {
  // Call the SuperTokens error handler first
    const supertokensResponse = errorHandler()(error, request, reply);
    if (supertokensResponse) {
      return supertokensResponse;
    }

    // Your custom error handling logic
    switch (error.type) {
      case 'UNAUTHORIZED':
        return reply.code(401).send({ error: 'Authentication required' });
      case 'FORBIDDEN':
        return reply.code(403).send({ error: 'Access denied' });
      case 'NOT_FOUND':
        return reply.code(404).send({ error: 'Resource not found' });
      default:
        return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Supertokens : Session Handler
  fastify.addHook('preHandler', async (request, reply) => {
    await getSession(request, reply);
  });

  /**
   * PUBLIC ROUTES
   */
  fastify.get('/online', async (request, reply) => {
    // const session = request.session;
    // View all users online (unless hidden)
  });

  fastify.get('/play', async (request, reply) => {
    // const session = request.session;
    // View all users online (unless hidden)
  });

  /**
   * PROTECTED ROUTES
   */
  fastify.get('/profile', { preHandler: verifySession() }, async (request, reply) => {
    // const session = request.session;
    // View user profile
  });

  fastify.get('/settings', { preHandler: verifySession() }, async (request, reply) => {
    // const session = request.session;
    // View user profile
  });

  fastify.get('/auth/admin', { preHandler: verifySession() }, async (request, reply) => {
    const session = request.session;
    const roles = await session.getClaimValue(UserRoleClaim);
    if (!roles.includes('admin')) {
      return reply.code(403).send({ error: 'Access denied' });
    }
    // Admin panel logic here
  });

  /**
   * @ Decorate
   */
  fastify.decorate(PLUGINS.auth.options.name, {
    verifySession: Session.verifySession
  });
}

module.exports = fp(appAuth, PLUGINS.auth.options);
