'use strict';

const supertokens = require('supertokens-node');
const { plugin } = require('supertokens-node/framework/fastify');
const { verifySession } = require('supertokens-node/recipe/session/framework/fastify');
const Session = require('supertokens-node/recipe/session');
const EmailPassword = require('supertokens-node/recipe/emailpassword');
const ThirdParty = require('supertokens-node/recipe/thirdparty');
const Dashboard = require('supertokens-node/recipe/dashboard');
const UserRoles = require('supertokens-node/recipe/userroles');
const { UserRoleClaim, PermissionClaim } = require('supertokens-node/recipe/userroles');

const fp = require('fastify-plugin');
const config = require('config');
const PLUGINS = require('../data/json/plugins.json');
const logger = require('../utils/logger');

// Application Roles
const APP_ROLES = {
  VISITOR: 'visitor',
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin'
};

// Placeholder functions (to be implemented)
async function getUserProfile (userId) {
  return { userId /* other profile information */ };
}

async function getUserSettings (userId) {
  return { userId /* user settings */ };
}

async function createUserProfile (userId, email) {
  logger.info(`Creating user profile for ${userId} with email ${email}`);
}

async function initializeGameData (userId) {
  logger.info(`Initializing game data for user ${userId}`);
}

async function sendWelcomeEmail (email) {
  logger.info(`Sending welcome email to ${email}`);
}

async function addRolesAndPermissionsToSession (session) {
  await session.fetchAndSetClaim(UserRoleClaim);
  await session.fetchAndSetClaim(PermissionClaim);
}

async function addRoleToUser (userId) {
  const roles = [APP_ROLES.VISITOR, APP_ROLES.USER];
  const results = await Promise.all(
    roles.map(role => UserRoles.addRoleToUser('public', userId, role))
  );

  results.forEach(role => {
    if (role.status === 'UNKNOWN_ROLE_ERROR') {
      logger.warn(['UNKNOWN ROLE ERROR', JSON.stringify(role, null, 2)]);
    } else if (role.didUserAlreadyHaveRole) {
      logger.warn(['USER ALREADY HAD ROLE', JSON.stringify(role, null, 2)]);
    }
  });
}

async function removeRoleFromUserAndTheirSession (session) {
  const roles = [APP_ROLES.VISITOR, APP_ROLES.USER];
  const results = await Promise.all(
    roles.map(role => UserRoles.removeUserRole(session.getTenantId(), session.getUserId(), role))
  );

  results.forEach(async response => {
    if (response.status === 'UNKNOWN_ROLE_ERROR') {
      logger.warn(['UNKNOWN ROLE ERROR', JSON.stringify(response, null, 2)]);
    } else if (response.didUserHaveRole) {
      logger.info(['USER ROLE REMOVED', JSON.stringify(response, null, 2)]);
    }
  });
}

const schemaSignInUpEmailPassword = (originalImplementation) => ({
  ...originalImplementation,
  signUp: async function (input) {
    const response = await originalImplementation.signUp(input);

    if (response.status === 'OK' && response.user.loginMethods.length === 1 && !input.session) {
      await addRoleToUser(response.user.id);
      await createUserProfile(response.user.id, response.user.email);
      await initializeGameData(response.user.id);
      await sendWelcomeEmail(response.user.email);
    }
    return response;
  }
});

const schemaSignInUpThirdParty = (originalImplementation) => ({
  ...originalImplementation,
  signInUp: async function (req) {
    const response = await originalImplementation.signInUp(req);

    if (response.status === 'OK') {
      await addRoleToUser(response.user.id);
      const { id, emails } = response.user;

      if (!req.session) {
        if (response.createdNewRecipeUser && response.user.loginMethods.length === 1) {
          await createUserProfile(id, emails[0]);
          await initializeGameData(id);
          await sendWelcomeEmail(emails[0]);
        } else {
          logger.info(`User ${id} signed in`);
        }
      }
    }
    return response;
  }
});

/**
* Plugin Code
*/

async function appAuth (fastify, options) {
  /**
   * Get Configuration Variables
   */
  const authConfig = config.get('auth');
  const authGoogleConfig = config.get('authGoogle');
  const authGithubConfig = config.get('authGithub');
  const authDiscordConfig = config.get('authDiscord');
  const authSupertokensConfig = config.get('authSupertokens');

  /**
   * Validate Configuration
   */
  const requiredConfigs = ['appName', 'apiDomain', 'websiteDomain', 'apiBasePath', 'websiteBasePath'];
  requiredConfigs.forEach(configItem => {
    if (!authConfig[configItem]) {
      throw new Error(`Missing required configuration: ${configItem}`);
    }
  });

  /**
   * Admin Emails
   */
  const adminEmails = config.get('supertokenAdmins');

  /**
   * Init Supertokens
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
      Session.init(),
      UserRoles.init(),
      Dashboard.init({ admins: adminEmails }),
      EmailPassword.init({
        override: {
          functions: schemaSignInUpEmailPassword
        }
      }),
      ThirdParty.init({
        signInAndUpFeature: {
          providers: [
            { config: { thirdPartyId: 'google', clients: [{ clientId: authGoogleConfig.clientId, clientSecret: authGoogleConfig.clientSecret }] } },
            { config: { thirdPartyId: 'github', clients: [{ clientId: authGithubConfig.clientId, clientSecret: authGithubConfig.clientSecret }] } },
            { config: { thirdPartyId: 'discord', clients: [{ clientId: authDiscordConfig.clientId, clientSecret: authDiscordConfig.clientSecret }] } }
          ]
        },
        override: {
          functions: schemaSignInUpThirdParty
        }
      })
    ]
  });

  /**
   * Formbody allows easier parsing of webrequests ?
   */
  await fastify.register(require('@fastify/formbody'));

  /**
   * Supertokens Auth Endpoints Registered
   */
  await fastify.register(plugin);

  /**
   * Public routes
   */

  fastify.post('/auth/signin', async (request, reply) => {
    const session = await Session.getSession(request, reply);
    const userId = session.getUserId();
    logger.info(userId);

    await addRolesAndPermissionsToSession(session);
  });

  fastify.get('/online', async (request, reply) => {
    const session = await Session.getSession(request, reply);
    const userId = session.getUserId();
    logger.info(userId);

    const response = { onlineUsers: [] };
    if (request.session) {
      response.currentUser = { id: request.session.getUserId() };
    }
    return response;
  });

  fastify.get('/play', async (request, reply) => {
    const session = await Session.getSession(request, reply);
    const userId = session.getUserId();
    logger.info(userId);

    const gameData = { availableGames: [] };
    if (request.session) {
      // gameData.userGames = await getUserGames(request.session.getUserId());
    }
    return gameData;
  });

  /**
   * Protected Routes
   */

  fastify.get('/profile', { preHandler: verifySession() }, async (request, reply) => {
    return getUserProfile(request.session.getUserId());
  });

  fastify.get('/settings', { preHandler: verifySession() }, async (request, reply) => {
    return getUserSettings(request.session.getUserId());
  });

  fastify.get('/auth/admin', { preHandler: verifySession() }, async (request, reply) => {
    const roles = await request.session.getClaimValue(UserRoleClaim);
    if (!roles.includes('admin')) {
      return reply.code(403).send({ error: 'Access denied' });
    }
    // Admin panel logic here
  });

  fastify.post('/auth/signout-all', { preHandler: verifySession() }, async (request, reply) => {
    if (request.session) {
      await Session.revokeAllSessionsForUser(request.session.getUserId());
      return { status: 'OK' };
    }
    return reply.code(401).send({ error: 'No active session' });
  });

  fastify.post('/auth/signout', { preHandler: verifySession() }, async (request, reply) => {
    if (request.session) {
      await removeRoleFromUserAndTheirSession(request.session);
      await request.session.revokeSession();
      return { status: 'OK' };
    }
    return reply.code(401).send({ error: 'No active session' });
  });
  fastify.decorate(PLUGINS.auth.options.name, {
    verifySession: Session.verifySession
  });
}

module.exports = fp(appAuth, PLUGINS.auth.options);
