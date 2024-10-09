const supertokens = require('supertokens-node');
const Session = require('supertokens-node/recipe/session');
const EmailPassword = require('supertokens-node/recipe/emailpassword');
const ThirdParty = require('supertokens-node/recipe/thirdparty');
const Dashboard = require('supertokens-node/recipe/dashboard');

const auth = {
  client: null,
  initialized: false
};

const init = async (fastify) => {
  /**
 * Auth Configuration
 */
  const config = require('config');
  const authConfig = config.get('auth');
  const authGoogleConfig = config.get('authGoogle');
  const authGithubConfig = config.get('authGithub');
  const authDiscordConfig = config.get('authDiscord');
  const authSupertokensConfig = config.get('authSupertokens');

  auth.client = supertokens.init({
    framework: 'fastify',
    supertokens: {
      connectionURI: authSupertokensConfig.connectionUri,
      apiKey: authSupertokensConfig.apiKey
    },
    appInfo: {
      appName: authConfig.appName, // app name
      apiDomain: authConfig.apiDomain, // api domain
      websiteDomain: authConfig.websiteDomain, // website domain
      apiBasePath: authConfig.apiBasePath, // api base path
      websiteBasePath: authConfig.apiBasePath // api base path (same)
    },
    recipeList: [
      Dashboard.init(),
      EmailPassword.init(),
      ThirdParty.init({
        signInAndUpFeature: {
          providers: [{
            config: {
              thirdPartyId: 'google',
              clients: [{
                clientId: authGoogleConfig.clientId,
                clientSecret: authGoogleConfig.clientSecret
              }]
            }
          }, {
            config: {
              thirdPartyId: 'github',
              clients: [{
                clientId: authGithubConfig.clientId,
                clientSecret: authGithubConfig.clientSecret
              }]
            }
          }, {
            config: {
              thirdPartyId: 'discord',
              clients: [{
                clientId: authDiscordConfig.clientId,
                clientSecret: authDiscordConfig.clientSecret
              }]
            }
          }]
        }
      }),
      Session.init() // initializes session features
    ]
  });
};

module.exports = { init, auth };
