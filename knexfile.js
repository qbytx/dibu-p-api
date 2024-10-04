require('dotenve').config();
const config = require('config');
const logger = require('./src/utils/logger');
const { pgDatabaseUser } = require('./src/db/databaseUtilities');
const { join, resolve } = require('node:path');
const { readFileSync } = require('node:fs');
const { initializeSecrets, getSecrets, getEnvConfiguration } = require('./src/services/secrets');

const s = {};
const dbConfig = config.get('db');

await (async () => {
  await initializeSecrets(getEnvConfiguration());
  const secrets = getSecrets();

  Object.assign(s, secrets);

  s.user = pgDatabaseUser(s.role, s.refId);
  s.sslConfig = {
    rejectUnauthorized: true,
    ca: readFileSync(resolve(join(__dirname, `../config/certs/${s.caFilename}`)))
  };
})();

if ((s?.host === null) || (s?.host === undefined)) {
  logger.error('Could not initialize secrets using knexfile');
  process.exit(1);
}

const connection = {
  host: s.host,
  port: s.port,
  user: s.user,
  password: s.password,
  database: s.name,
  ssl: s.sslConfig
};

const pool = {
  min: dbConfig.minPool,
  max: dbConfig.maxPool,
  afterCreate: (conn, done) => {
    onAfterCreate(conn, done);
  }
};

const migrations = {
  tableName: 'migrations.pgmigrations', // Specify schema and table name for migrations
  directory: './src/migrations' // Path to your migrations directory
};

const searchPath = ['users', 'app'];
const acquireConnectionTimeout = 10000;
const compileSqlOnError = false;

const log = {
  warn (message) {
    logger.warn(message);
  },
  error (message) {
    logger.error(message);
  },
  deprecate (message) {
    logger.deprecate(message);
  },
  debug (message) {
    logger.debug(message);
  }
};

const onAfterCreate = (conn, done) => {
  /**
   * [ Note: This fn assumes the 'pg' connection API ]
   *
   * ['SET timezone="UTC";']
   * This command sets the timezone of the current database connection to UTC.
   * This is crucial for applications that need consistent time handling.
   * */
  logger.info('Connected to database');
  conn.query('SET timezone="UTC";', function (err) {
    if (err) {
      done(err, conn);
    }
  });
};

const knexConfig = {
  client: dbConfig.driver,
  connection,
  pool,
  migrations,
  searchPath,
  acquireConnectionTimeout,
  compileSqlOnError,
  log
};

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  development: knexConfig,
  staging: knexConfig,
  production: knexConfig
};
