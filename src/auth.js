const supertokens = require('supertokens-node');
const Session = require('supertokens-node/recipe/session');
const EmailPassword = require('supertokens-node/recipe/emailpassword');
const ThirdParty = require('supertokens-node/recipe/thirdparty');
const Dashboard = require('supertokens-node/recipe/dashboard');

/**
 * Auth Configuration
 */
const config = require('config');
const authConfig = config.get('auth');
const authGoogleConfig = config.get('authGoogle');

const auth = supertokens.init({
  framework: 'fastify',
  supertokens: {
    connectionURI: authConfig.apiDomain
    // apiKey: <API_KEY(if configured)>,
  },
  appInfo: {
    // learn more about this on https://supertokens.com/docs/session/appinfo
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
      // We have provided you with development keys which you can use for testing.
      // IMPORTANT: Please replace them with your own OAuth keys for production use.
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
          // this is still testing env below
          config: {
            thirdPartyId: 'github',
            clients: [{
              clientId: '467101b197249757c71f',
              clientSecret: 'e97051221f4b6426e8fe8d51486396703012f5bd'
            }]
          }
        }]
      }
    }),
    Session.init() // initializes session features
  ]
});

module.exports = auth;
