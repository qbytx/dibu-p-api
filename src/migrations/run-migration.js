const yargs = require('yargs');
const { run } = require('node-pg-migrate');
const { getDatabase } = require('../services/db/database');
const { isDefined } = require('../utils/params');

const DIRECTIONS = Object.freeze(['up', 'down']);

const MIGRATION_DIRECTORIES = Object.freeze({
  user: './migrations-user',
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
    default: 'up',
    choices: DIRECTIONS
  })
  .option('count', {
    alias: 'c',
    description: 'Number of migrations to run',
    type: 'number',
    default: Infinity
  })
  .help()
  .alias('help', 'h')
  .argv;

async function runMigration (schemaName, direction, count) {
  try {
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
  } catch (error) {
    throw new Error(`Migration failed: ${error.message}`);
  }
}

function validateParams (params) {
  const undefinedParams = Object.entries(params)
    .filter(([_, value]) => !isDefined(value))
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

const s = (schema != null) && (typeof schema === 'string') ? schema : '';
const d = (direction != null) && (typeof direction === 'string') ? direction : '';
const c = (count != null) && (typeof count === 'number') && (count > 0) ? count : Infinity;

if (validateParams({ s, d, c })) {
  runMigration(s, d, c)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
} else {
  yargs.showHelp();
  process.exit(1);
}
