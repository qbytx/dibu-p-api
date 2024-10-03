require('dotenv').config();
const yargs = require('yargs');
const { run } = require('node-pg-migrate');
const { loadSecrets, getSecrets, getEnvConfiguration } = require('../services/secrets');
const { connectDatabase, getDatabase } = require('../services/db/database');
const { isDefined } = require('../utils/params');

const DIRECTIONS = Object.freeze(['up', 'down']);

const MIGRATION_DIRECTORIES = Object.freeze({
  users: './migrations-users',
  app: './migrations-app'
});

const argv = yargs
  .option('schema', {
    alias: 's',
    description: 'Schema to migrate',
    type: 'string',
    default: '',
    choices: Object.keys(MIGRATION_DIRECTORIES),
    demandOption: true
  })
  .option('direction', {
    alias: 'd',
    description: 'Migration direction (up or down)',
    type: 'string',
    default: '',
    choices: DIRECTIONS,
    demandOption: true
  })
  .option('count', {
    alias: 'c',
    description: 'Number of migrations to run',
    type: 'number',
    default: 0,
    demandOption: true
  })
  .help()
  .alias('help', 'h')
  .argv;

async function runMigration (schemaName, direction, count) {
  try {
    await loadSecrets(getEnvConfiguration());
    await connectDatabase(getSecrets(), null);

    const db = getDatabase();

    if (db == null) {
      throw new Error('Failed to get database connection');
    }

    const config = {
      dbClient: db,
      migrationsTable: 'pgmigrations',
      migrationsSchema: 'migrations',
      schema: schemaName,
      dir: MIGRATION_DIRECTORIES[schemaName],
      checkOrder: true,
      direction,
      count,
      createSchema: false,
      createMigrationsSchema: false,
      noLock: false,
      decamelize: true
    };

    // Run migration
    await run(config);
    console.log(`Migration for schema '${schemaName}' completed successfully.`);
    return true;
  } catch (error) {
    console.error(`Migration failed: ${error.message}`);
    return false;
  }
}

function validateParams (params) {
  const undefinedParams = Object.entries(params)
    .filter(([_, value]) => !isDefined([value]))
    .map(([key, _]) => key);

  if (undefinedParams.length > 0) {
    console.error(`Error: The following parameters are undefined: ${undefinedParams.join(', ')}`);
    return false;
  }

  if (!Object.keys(MIGRATION_DIRECTORIES).includes(params.schema)) {
    console.error(`Error: Invalid schema. Must be one of: ${Object.keys(MIGRATION_DIRECTORIES).join(', ')}`);
    return false;
  }

  if (!DIRECTIONS.includes(params.direction)) {
    console.error(`Error: Direction must be either: ${DIRECTIONS.join(', ')}`);
    return false;
  }

  if (typeof params.count !== 'number' || params.count < 1) {
    console.error('Error: Count must be a positive number or Infinity');
    return false;
  }

  return true;
}

const { schema, direction, count } = argv;

if (validateParams({ schema, direction, count })) {
  runMigration(schema, direction, count)
    .then((success) => {
      if (success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    });
} else {
  yargs.showHelp();
  process.exit(1);
}
