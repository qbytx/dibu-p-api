'use strict';

const supertokens = require('supertokens-node');
const Session = require('supertokens-node/recipe/session');
const EmailPassword = require('supertokens-node/recipe/emailpassword');
const ThirdParty = require('supertokens-node/recipe/thirdparty');
const Dashboard = require('supertokens-node/recipe/dashboard');
const config = require('config');
const fp = require('fastify-plugin');
const PLUGINS = require('../../data/json/plugins.json');

const initialized = false;

const auth = {
  client: null,
  initialized () {
    const value = initialized;
    return value;
  }
};

async function appAuth (fastify, options) {
  const authConfig = config.get('auth');
  const authGoogleConfig = config.get('authGoogle');
  const authGithubConfig = config.get('authGithub');
  const authDiscordConfig = config.get('authDiscord');
  const authSupertokensConfig = config.get('authSupertokens');

  // Initialize SuperTokens
  supertokens.init({
    framework: 'fastify',
    supertokens: {
      connectionURI: authSupertokensConfig.connectionUri,
      apiKey: authSupertokensConfig.apiKey
    },
    appInfo: {
      appName: authConfig.appName, // The name of your app
      apiDomain: authConfig.apiDomain, // Backend API domain (e.g., http://localhost:5002)
      websiteDomain: authConfig.websiteDomain, // Frontend domain (e.g., http://localhost:3000)
      apiBasePath: authConfig.apiBasePath, // Path for API routes (default is '/auth')
      websiteBasePath: authConfig.websiteBasePath // Path for frontend routes (default is '/auth')
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
      Session.init() // Initializes session features
    ]
  });

  /**
   * @ Decorate
   */
  fastify.decorate(PLUGINS.appAuth.options.name, auth);
}

// Export the plugin using fastify-plugin
module.exports = fp(appAuth, PLUGINS.appAuth.options);
