'use strict';
const { InfisicalSDK } = require('@infisical/sdk');
const config = require('config');
const logger = require('../utils/logger');

// secretKeys do not refer to .env, but to the secrets manager store
const secretsManager = {
  secrets: {},
  secretKeys: {
    Password: 'SUPABASE_PASSWORD',
    Host: 'SUPABASE_HOST',
    Name: 'SUPABASE_NAME',
    Port: 'SUPABASE_PORT',
    Role: 'SUPABASE_ROLE',
    RefId: 'SUPABASE_REFERENCE_ID',
    CaFn: 'SUPABASE_CA_FILENAME'
  }
};

// this references .env / fastify.config
const getConfiguration = (source) => ({
  environment: source.SECRETS_ENVIRONMENT,
  projectId: source.SECRETS_PROJECT_ID,
  clientId: source.SECRETS_MACHINE0_IDENTITY_CLIENT_ID,
  clientSecret: source.SECRETS_MACHINE0_IDENTITY_CLIENT_SECRET
});

const initializeSecrets = async (configuration) => {
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
      if (secret !== null && secret !== undefined) {
        secretsManager.secrets[key] = secret.secretValue;
      }
    } catch (error) {
      logger.error(`Failed to initialize a secret: ${secretName}:`, error);
      throw new Error();
    }
  }

  return true;
};

const getSecrets = () => secretsManager.secrets;

const getFastifyConfiguration = (fastify) => {
  const validFastify =
  fastify !== null &&
  fastify !== undefined &&
  typeof fastify.config === 'object';

  return validFastify ? getConfiguration(fastify.config) : null;
};

const getEnvConfiguration = () => {
  return getConfiguration(process.env);
};

module.exports = {
  initializeSecrets,
  getSecrets,
  getEnvConfiguration,
  getFastifyConfiguration
};
