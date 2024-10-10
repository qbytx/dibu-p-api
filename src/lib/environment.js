const S = require('fluent-json-schema');
const config = require('config');

const server = config.get('server');
const serverConfig = server != null
  ? server
  : {
      origin: 'http://127.0.0.1',
      port: 3000
    };

const environmentSchema = S.object()
  .prop('MAXIMUM_DATABASE_CONNECTIONS', S.number().default(30))
  .prop('CORS_ORIGIN_URL', S.string().default(`${serverConfig.origin}:${serverConfig.port}`))
  .prop('NODE_CONFIG_DIR', S.string().default('./src/config'))
  .prop('NODE_ENV', S.string().required().default('development'))
  .prop('SECRETS_ENVIRONMENT', S.string().required())
  .prop('SECRETS_PROJECT_ID', S.string().required())
  .prop('SECRETS_MACHINE0_IDENTITY_CLIENT_ID', S.string().required())
  .prop('SECRETS_MACHINE0_IDENTITY_CLIENT_SECRET', S.string().required())
  .prop('SECRETS_NAME_SUPABASE_PASSWORD', S.string().required())
  .prop('SECRETS_NAME_SUPABASE_HOST', S.string().required())
  .prop('SECRETS_NAME_SUPABASE_NAME', S.string().required())
  .prop('SECRETS_NAME_SUPABASE_PORT', S.string().required())
  .prop('SECRETS_NAME_SUPABASE_ROLE', S.string().required())
  .prop('SECRETS_NAME_SUPABASE_REFERENCE_ID', S.string().required())
  .prop('SECRETS_NAME_SUPABASE_CA_FILENAME', S.string().required());

// for fastify
const fastifyEnvironmentOptions = {
  confKey: 'config',
  schema: environmentSchema,
  dotenv: true
};

module.exports = { environmentOptions: fastifyEnvironmentOptions };
