'use strict';

const secrets = {};

const keys = {
  pgConnectionString: 'pgConnectionString',
  pgPassword: 'pgPassword',
  pgHost: 'pgHost',
  pgName: 'pgName',
  pgPort: 'pgPort',
  pgUser: 'pgUser'
};

const secretsType = 'shared';

// Infisical migrated to v2 but has no changelog, consult github
// swap out infisical in the future
// https://adamcoster.com/blog/commonjs-and-esm-importexport-compatibility-examples
const loadSecrets = async (fastify) => {
  let InfisicalSDK;
  await (async () => {
    try {
      InfisicalSDK = require('@infisical/sdk').InfisicalSDK;
    } catch (err) {
      return err.code;
    }
  })();
  const clientId = fastify.config.MACHINE0_IDENTITY_CLIENT_ID;
  const clientSecret = fastify.config.MACHINE0_IDENTITY_CLIENT_SECRET;
  const projectId = fastify.config.DIBUMON_SECRETS_PROJECT_ID;
  const environment = fastify.config.DIBUMON_SECRETS_ENVIRONMENT;

  // infiscal names
  const nameSupabaseConnectionString = 'SUPABASE_CONNECTION_STRING';
  const nameSupabasePassword = 'SUPABASE_PASSWORD';
  const nameSupabaseHost = 'SUPABASE_HOST';
  const nameSupabaseName = 'SUPABASE_NAME';
  const nameSupabasePort = 'SUPABASE_PORT';
  const nameSupabaseUser = 'SUPABASE_USER';

  const secretsMap = new Map([
    [nameSupabaseConnectionString, keys.pgConnectionString],
    [nameSupabasePassword, keys.pgPassword],
    [nameSupabaseHost, keys.pgHost],
    [nameSupabaseName, keys.pgName],
    [nameSupabasePort, keys.pgPort],
    [nameSupabaseUser, keys.pgUser]
  ]);

  const infiscalPathPostGres = '/pg';

  const client = new InfisicalSDK({});

  // Authenticate with Infisical
  await client.auth().universalAuth.login({
    clientId,
    clientSecret
  });

  let secretsLoaded = 0;

  if (client != null) {
    for (const [k, v] of secretsMap) {
      const s = await client.secrets().getSecret({
        environment,
        projectId,
        secretName: k,
        secretPath: infiscalPathPostGres, // Optional unless secrets exist at path other than '\'
        type: secretsType // Optional
        // version: 1  // Optional
      });
      if (s != null) {
        secrets[v] = s;
        secretsLoaded += 1;
      }
    }
  }

  // report success
  return secretsLoaded === secretsMap.size;
};

module.exports = { secrets, keys, loadSecrets };
