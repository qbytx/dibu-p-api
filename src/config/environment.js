const S = require('fluent-json-schema');

const environmentSchema = S.object()
    .prop('PORT', S.string().default('4000')) 
    .required(['PORT']);

const environmentOptions = {
    confKey: 'config', 
    schema: environmentSchema,
    dotenv: true
}

module.exports = { environmentOptions };
