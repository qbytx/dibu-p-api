const S = require('fluent-json-schema');

const environmentSchema = S.object()
  .prop('MAXIMUM_DATABASE_CONNECTIONS', S.number().default(30))
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

const environmentOptions = {
  confKey: 'config',
  schema: environmentSchema,
  dotenv: true
};

module.exports = { environmentOptions };
