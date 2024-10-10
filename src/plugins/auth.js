'use strict';

const supertokens = require('supertokens-node');
const { plugin } = require('supertokens-node/framework/fastify');
const { verifySession } = require('supertokens-node/recipe/session/framework/fastify');
const { getSession } = require('supertokens-node/recipe/session/framework/fastify');

const Session = require('supertokens-node/recipe/session');
const EmailPassword = require('supertokens-node/recipe/emailpassword');
const ThirdParty = require('supertokens-node/recipe/thirdparty');
const Dashboard = require('supertokens-node/recipe/dashboard');
const UserRoles = require('supertokens-node/recipe/userroles');
const { UserRoleClaim, PermissionClaim } = require('supertokens-node/recipe/userroles');

/**
 * Spoof / Debugging functions
 */

async function getUserProfile (userId) {
  // TODO: Implement fetching user profile from your database
  return { userId /* other profile information */ };
}

async function getUserSettings (userId) {
  // TODO: Implement fetching user settings from your database
  return { userId /* user settings */ };
}

async function createUserProfile (userId, email) {
  // TODO: Implement user profile creation in your database
  logger.info(`Creating user profile for ${userId} with email ${email}`);
}

async function initializeGameData (userId) {
  // TODO: Implement game data initialization
  logger.info(`Initializing game data for user ${userId}`);
}

async function sendWelcomeEmail (email) {
  // TODO: Implement welcome email sending
  logger.info(`Sending welcome email to ${email}`);
}

/**
 * Application Roles
 */
const APP_ROLES = {
  USER: 'user',
  PLAYER: 'player',
  MODERATOR: 'moderator',
  ADMIN: 'admin'
};

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
  const res0 = await UserRoles.addRoleToUser('public', userId, APP_ROLES.USER);
  const res1 = await UserRoles.addRoleToUser('public', userId, APP_ROLES.PLAYER);

  [res0, res1].forEach(async (r) => {
    if (r.status === 'UNKNOWN_ROLE_ERROR') {
      logger.warn(['UNKNOWN ROLE ERROR', JSON.stringify(r, null, 2)]);
      return;
    }
    if (r.didUserAlreadyHaveRole === true) {
      logger.warn(['USER ALREADY HAD ROLE', JSON.stringify(r, null, 2)]);
    }
  });
}

async function addRolesAndPermissionsToSession (session) {
  // we add the user's roles to the user's session
  await session.fetchAndSetClaim(UserRoleClaim);

  // we add the permissions of a user to the user's session
  await session.fetchAndSetClaim(PermissionClaim);
}

async function removeRoleFromUserAndTheirSession (session) {
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
      // first call the original implementation of signUp.
      const response = await originalImplementation.signUp(input);

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
        await createUserProfile(response.user.id, response.user.emails[0]);
        await initializeGameData(response.user.id);
        await sendWelcomeEmail(response.user.emails[0]);
      }
      return response;
    }
  };
};

const schemaSignInUpThirdParty = (originalImplementation) => {
  return {
    ...originalImplementation,
    signInUp: async function (req) {
      // First we call the original implementation of signInUp.
      const response = await originalImplementation.signInUp(req);

      // Post sign up response, we check if it was successful
      if (response.status === 'OK') {
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
        const { id, emails } = response.user;

        // This is the response from the OAuth 2 provider that contains their tokens or user info.
        const providerAccessToken = response?.oAuthTokens?.access_token ?? null;
        const firstName = response?.rawUserInfoFromProvider?.fromUserInfoAPI?.first_name ?? null;

        console.log(id, emails, providerAccessToken, firstName);

        if (req.session === undefined) {
          if (response.createdNewRecipeUser && response.user.loginMethods.length === 1) {
            // Implement post sign up logic
            await createUserProfile(id, emails[0]);
            await initializeGameData(id);
            await sendWelcomeEmail(emails[0]);
          } else {
            // TODO: Implement post sign in logic if needed
            logger.info(`User ${id} signed in`);
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

  // Supertokens : Session Handler
  fastify.addHook('preHandler', async (request, reply) => {
    await getSession(request, reply);
  });

  /**
   * PUBLIC ROUTES
   */
  fastify.post('/auth/signin', async (request, reply) => {
    // ... sign-in logic ...
    await addRolesAndPermissionsToSession(request.session);
  });

  // Implement sign out from all devices endpoint // todo do i need this?
  fastify.post('/auth/signout-all', verifySession(), async (request, reply) => {
    if (request.session) {
      await Session.revokeAllSessionsForUser(request.session.getUserId());
      return { status: 'OK' };
    }
    return reply.code(401).send({ error: 'No active session' });
  });

  fastify.post('/auth/signout', verifySession(), async (request, reply) => {
    if (request.session) {
      await removeRoleFromUserAndTheirSession(request.session);
      await request.session.revokeSession();
      return { status: 'OK' };
    }
    return reply.code(401).send({ error: 'No active session' });
  });

  fastify.get('/online', async (request, reply) => {
    const session = request.session;
    const response = { onlineUsers: [] }; // Fetch this from your database
    if (session) {
      response.currentUser = {
        id: session.getUserId()
        // Add other relevant user data
      };
    }
    return response;
  });

  fastify.get('/play', async (request, reply) => {
    const session = request.session;
    const gameData = { availableGames: [] }; // Fetch from your database
    if (session) {
      // gameData.userGames = await getUserGames(session.getUserId());
    }
    return gameData;
  });

  /**
   * PROTECTED ROUTES
   */

  fastify.get('/profile', { preHandler: verifySession() }, async (request, reply) => {
    const session = request.session;
    // TODO: Implement view user profile logic
    const userProfile = await getUserProfile(session.getUserId());
    return userProfile;
  });

  fastify.get('/settings', { preHandler: verifySession() }, async (request, reply) => {
    const session = request.session;
    // TODO: Implement view user settings logic
    const userSettings = await getUserSettings(session.getUserId());
    return userSettings;
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
