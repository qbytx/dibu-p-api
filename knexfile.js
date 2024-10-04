require('dotenv').config();
const config = require('config');
const logger = require('./src/utils/logger');
const { pgDatabaseUser } = require('./src/db/databaseUtilities');
const { join, resolve } = require('node:path');
const { readFileSync } = require('node:fs');
const { initializeSecrets, getSecrets, getEnvConfiguration } = require('./src/services/secrets');

const dbConfig = config.get('db');

const getConnection = async () => {
  try {
    await initializeSecrets(getEnvConfiguration());
    const secrets = getSecrets();
    const user = pgDatabaseUser(secrets.role, secrets.refId);
    const sslConfig = {
      rejectUnauthorized: true,
      ca: readFileSync(resolve(join(__dirname, `./src/config/certs/${secrets.caFilename}`)))
    };

    if (!secrets.host) {
      throw new Error('Could not initialize secrets using knexfile');
    }

    return {
      host: secrets.host,
      port: secrets.port,
      user,
      password: secrets.password,
      database: secrets.name,
      ssl: sslConfig
    };
  } catch (error) {
    logger.error('Error initializing knex configuration:', error);
    throw error;
  }
};

function onAfterCreate (conn, done) {
  logger.info('Connected to database');
  conn.query('SET timezone="UTC";', function (err) {
    done(err, conn);
  });
}

const knexConfig = {
  client: dbConfig.driver,
  connection: getConnection,
  pool: {
    min: dbConfig.minPool,
    max: dbConfig.maxPool,
    afterCreate: (conn, done) => {
      onAfterCreate(conn, done);
    }
  },
  migrations: {
    tableName: 'migrations.knex_migrations',
    directory: './src/migrations'
  },
  searchPath: ['users', 'app'],
  acquireConnectionTimeout: 10000,
  compileSqlOnError: false,
  log: {
    warn (message) { logger.warn(message); },
    error (message) { logger.error(message); },
    deprecate (message) { logger.deprecate(message); },
    debug (message) { logger.debug(message); }
  }
};

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  development: knexConfig,
  staging: knexConfig,
  production: knexConfig
};
