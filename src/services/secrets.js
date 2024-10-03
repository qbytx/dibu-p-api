'use strict';

const secretsConfig = require('config').get('secrets');
const logger = require('../utils/logger');
const { isDefined } = require('../utils/params');

const secretsManager = {
  secrets: {},
  keys: 0
};

secretsManager.reset = () => {
  secretsManager.keys = 0;
};

secretsManager.foundAll = (count) => {
  return secretsManager.keys === count;
};

const SecretKeys = {
  pgConnectionString: 'pgConnectionString',
  pgPassword: 'pgPassword',
  pgHost: 'pgHost',
  pgName: 'pgName',
  pgPort: 'pgPort',
  pgUser: 'pgUser'
};

const SecretNames = Object.freeze({
  CONNECTION_STRING: 'SUPABASE_CONNECTION_STRING',
  PASSWORD: 'SUPABASE_PASSWORD',
  HOST: 'SUPABASE_HOST',
  NAME: 'SUPABASE_NAME',
  PORT: 'SUPABASE_PORT',
  USER: 'SUPABASE_USER'
});

// Abstracted configuration retrieval
const getConfiguration = (configSource) => {
  const environment = configSource.DIBUMON_SECRETS_ENVIRONMENT ?? null;
  const clientSecret = configSource.MACHINE0_IDENTITY_CLIENT_SECRET ?? null;
  const clientId = configSource.MACHINE0_IDENTITY_CLIENT_ID ?? null;
  const projectId = configSource.DIBUMON_SECRETS_PROJECT_ID ?? null;

  if (!isDefined([environment, clientSecret, clientId, projectId])) {
    logger.error('Missing or undefined configuration values for secrets manager');
    return null;
  }
  return { environment, clientSecret, clientId, projectId };
};

const getFastifyConfiguration = (fastify) => {
  if (fastify && typeof fastify?.config === 'object') {
    const configuration = getConfiguration(fastify.config);
    return configuration;
  } else return null;
};

const getEnvConfiguration = () => {
  return getConfiguration(process.env);
};

const importInfisicalSDK = async () => {
  try {
    return require('@infisical/sdk').InfisicalSDK;
  } catch (err) {
    logger.error('Error loading Infisical SDK:', err);
    return null;
  }
};

// Infisical migrated to v2 but has no changelog, consult github
// swap out infisical in the future?
// https://adamcoster.com/blog/commonjs-and-esm-importexport-compatibility-examples

const loadSecrets = async (configuration) => {
  const InfisicalSDK = await importInfisicalSDK();

  if (!isDefined([InfisicalSDK])) {
    logger.error('Could not load Infiniscal Secrets Manager');
    return false;
  }

  const { environment, clientSecret, clientId, projectId } = configuration;

  const secretsMap = new Map([
    [SecretNames.CONNECTION_STRING, SecretKeys.pgConnectionString],
    [SecretNames.PASSWORD, SecretKeys.pgPassword],
    [SecretNames.HOST, SecretKeys.pgHost],
    [SecretNames.NAME, SecretKeys.pgName],
    [SecretNames.PORT, SecretKeys.pgPort],
    [SecretNames.USER, SecretKeys.pgUser]
  ]);

  const secretsPath = secretsConfig.pgPath;
  const secretsType = secretsConfig.pgType;

  // empty object is to remind me of options
  const client = new InfisicalSDK({});

  // Authenticate with Infisical
  await client.auth().universalAuth.login({
    clientId,
    clientSecret
  });

  // reset manager
  secretsManager.reset();

  if (client != null) {
    for (const [k, v] of secretsMap) {
      const s = await client.secrets().getSecret({
        environment,
        projectId,
        secretName: k,
        secretPath: secretsPath, // Optional unless secrets exist at path other than '\'
        type: secretsType // Optional
        // version: 1  // Optional
      });
      if (s != null) {
        secretsManager.secrets[v] = s;
        secretsManager.keys += 1;
      }
    }
  }

  // report success
  return secretsManager.foundAll(secretsMap.size);
};

const getSecrets = () => {
  return secretsManager?.secrets;
};

module.exports = { SecretKeys, loadSecrets, getSecrets, getEnvConfiguration, getFastifyConfiguration };
