'use strict';
const { InfisicalSDK } = require('@infisical/sdk');
const config = require('config');
const logger = require('../utils/logger');

const secretsManager = {
  secrets: {},
  secretKeys: {
    pgConnectionString: 'SUPABASE_CONNECTION_STRING',
    pgPassword: 'SUPABASE_PASSWORD',
    pgHost: 'SUPABASE_HOST',
    pgName: 'SUPABASE_NAME',
    pgPort: 'SUPABASE_PORT',
    pgUser: 'SUPABASE_USER',
    pgCaFn: 'SUPABASE_CA_FILENAME'
  }
};

const getConfiguration = (source) => ({
  environment: source.SECRETS_ENVIRONMENT,
  projectId: source.SECRETS_PROJECT_ID,
  clientId: source.SECRETS_MACHINE0_CLIENT_ID,
  clientSecret: source.SECRETS_MACHINE0_CLIENT_SECRET
});

const loadSecrets = async (configuration) => {
  if (!configuration) {
    logger.error('Missing configuration for secrets manager');
    return false;
  }

  const client = new InfisicalSDK({});
  await client.auth().universalAuth.login({
    clientId: configuration.clientId,
    clientSecret: configuration.clientSecret
  });

  const secretsConfig = config.get('secrets');

  for (const [key, secretName] of Object.entries(secretsManager.secretKeys)) {
    try {
      const secret = await client.secrets().getSecret({
        environment: configuration.environment,
        projectId: configuration.projectId,
        secretName,
        secretPath: secretsConfig.pgPath,
        type: secretsConfig.pgType
      });
      if (secret) {
        secretsManager.secrets[key] = secret;
      }
    } catch (error) {
      logger.error(`Failed to load secret ${secretName}:`, error);
    }
  }

  return Object.keys(secretsManager.secrets).length === Object.keys(secretsManager.secretKeys).length;
};

const getSecrets = () => secretsManager.secrets;

const getFastifyConfiguration = (fastify) => 
  fastify && typeof fastify.config === 'object' ? getConfiguration(fastify.config) : null;

const getEnvConfiguration = () => getConfiguration(process.env);

module.exports = {
  loadSecrets,
  getSecrets,
  getEnvConfiguration,
  getFastifyConfiguration
};
