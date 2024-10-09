'use strict';

const supertokens = require('supertokens-node');
const Session = require('supertokens-node/recipe/session');
const EmailPassword = require('supertokens-node/recipe/emailpassword');
const ThirdParty = require('supertokens-node/recipe/thirdparty');
const Dashboard = require('supertokens-node/recipe/dashboard');
const config = require('config');
const fp = require('fastify-plugin');

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
      appName: authConfig.appName, // Name of your app
      apiDomain: authConfig.apiDomain, // API domain (backend)
      websiteDomain: authConfig.websiteDomain, // Website domain (frontend)
      apiBasePath: authConfig.apiBasePath, // API base path for SuperTokens
      websiteBasePath: authConfig.websiteBasePath // Website base path for SuperTokens
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
}

// Export the plugin using fastify-plugin
module.exports = fp(appAuth, {
  name: 'appAuth',
  dependencies: [] // If there are dependencies, they can be added here
});
