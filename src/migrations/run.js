require('dotenv').config();
const yargs = require('yargs');
const logger = require('../utils/logger');
const { runner } = require('node-pg-migrate');
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
    choices: Object.keys(MIGRATION_DIRECTORIES),
    demandOption: true
  })
  .option('direction', {
    alias: 'd',
    description: 'Migration direction (up or down)',
    type: 'string',
    choices: DIRECTIONS,
    demandOption: true
  })
  .option('count', {
    alias: 'c',
    description: 'Number of migrations to run',
    type: 'number',
    default: 0
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
    const dir = MIGRATION_DIRECTORIES[schemaName];
    const config = {
      dbClient: db.pg,
      migrationsTable: 'pgmigrations',
      migrationsSchema: 'migrations',
      schemas: [schemaName],
      dir,
      checkOrder: true,
      direction,
      count,
      createSchema: false,
      createMigrationsSchema: false,
      noLock: false,
      decamelize: true,
      logger
    };

    // Run migration
    await runner(config);
    logger.info(`Migration for schema '${schemaName}' completed successfully.`);
    return true;
  } catch (error) {
    logger.error(`Migration failed: ${error.message}`);
    return false;
  }
}

function validateParams (params) {
  if (!isDefined([params.schema, params.direction, params.count])) {
    logger.error('Error: One or more required parameters are undefined');
    return false;
  }

  if (!Object.keys(MIGRATION_DIRECTORIES).includes(params.schema)) {
    logger.error(`Error: Invalid schema. Must be one of: ${Object.keys(MIGRATION_DIRECTORIES).join(', ')}`);
    return false;
  }

  if (!DIRECTIONS.includes(params.direction)) {
    logger.error(`Error: Direction must be either: ${DIRECTIONS.join(', ')}`);
    return false;
  }

  if (typeof params.count !== 'number' || params.count < 1) {
    logger.error('Error: Count must be a positive number or Infinity');
    return false;
  }

  return true;
}

const { schema, direction, count } = argv;

if (validateParams({ schema, direction, count })) {
  runMigration(schema, direction, count)
    .then((success) => {
      process.exit(success ? 0 : 1);
    });
} else {
  yargs.showHelp();
  process.exit(1);
}
