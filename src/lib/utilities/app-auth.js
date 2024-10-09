'use strict';
const supertokens = require('supertokens-node');
const Session = require('supertokens-node/recipe/session');
const EmailPassword = require('supertokens-node/recipe/emailpassword');
const ThirdParty = require('supertokens-node/recipe/thirdparty');
const Dashboard = require('supertokens-node/recipe/dashboard');
const config = require('config');
const fp = require('fastify-plugin');
const PLUGINS = require('../../data/json/plugins.json');

async function appAuth (fastify, options) {
  const authConfig = config.get('auth');
  const authGoogleConfig = config.get('authGoogle');
  const authGithubConfig = config.get('authGithub');
  const authDiscordConfig = config.get('authDiscord');
  const authSupertokensConfig = config.get('authSupertokens');

  // Validate required fields
  if (!authConfig.apiDomain) {
    console.log(authConfig);
    throw new Error('apiDomain is not set in the auth configuration!');
  }

  // Initialize SuperTokens
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
      Dashboard.init(),
      EmailPassword.init(),
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
        }
      }),
      Session.init()
    ]
  });

  // fastify.addHook('onRequest', async (request, reply) => {
  //   await supertokens.middleware()(request.raw, reply.raw);
  // });

  // fastify.addHook('preHandler', async (request, reply) => {
  //   await supertokens.middleware()(request.raw, reply.raw);
  // });

  // Error handler
  fastify.setErrorHandler(async (error, request, reply) => {
    // First, check if it's a SuperTokens error
    if (supertokens.errorHandler(error, request.raw, reply.raw)) {
    // If SuperTokens handled the error, we're done
      return;
    }

    // If it's not a SuperTokens error, use sensible's error handling
    if (error.statusCode) {
      // If the error has a status code, use it
      reply.status(error.statusCode);
    } else if (error.status) {
      // Some errors use 'status' instead of 'statusCode'
      reply.status(error.status);
    } else {
      // Default to 500 if no status is provided
      reply.status(500);
    }

    // Use sensible's error serializer
    return reply.send(fastify.httpErrors.errorHandler(error, request, reply));
  });

  /**
   * @ Decorate
   */
  fastify.decorate(PLUGINS.appAuth.options.name, {
    verifySession: Session.verifySession
  });
}

// Export the plugin using fastify-plugin
module.exports = fp(appAuth, PLUGINS.appAuth.options);
