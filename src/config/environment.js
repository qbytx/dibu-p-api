const S = require('fluent-json-schema');

const environmentSchema = S.object()
  .prop('PORT', S.string().default('4000'))
  .prop('MAXIMUM_DATABASE_CONNECTIONS', S.number().default(30))
  .prop('MACHINE0_IDENTITY_CLIENT_ID', S.string().required())
  .prop('MACHINE0_IDENTITY_CLIENT_SECRET', S.string().required())
  .prop('DIBUMON_SECRETS_PROJECT_ID', S.string().required())
  .prop('NAME_SUPABASE_CONNECTION_STRING', S.string().required())
  .prop('NAME_SUPABASE_PASSWORD', S.string().required())
  .prop('NAME_SUPABASE_HOST', S.string().required())
  .prop('NAME_SUPABASE_NAME', S.string().required())
  .prop('NAME_SUPABASE_PORT', S.string().required())
  .prop('NAME_SUPABASE_USER', S.string().required())
  .prop('ENVIRONMENT', S.string().required());

const environmentOptions = {
  confKey: 'config',
  schema: environmentSchema,
  dotenv: true
};

module.exports = { environmentOptions };
