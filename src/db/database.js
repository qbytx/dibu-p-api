const knex = require('knex');
const logger = require('../utils/logger');
const dbConfig = require('config').get('db');
const { pgDatabaseUser } = require('./databaseUtilities');
const { join, resolve } = require('node:path');
const { readFileSync } = require('fs');

const db = {
  pool: null
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
    } else {
      conn.query('SELECT 1', function (err) {
        done(err, conn);
      });
    }
  });
};

const connectDatabasePool = async (secrets) => {
  const {
    host,
    name,
    port,
    role,
    refId,
    password,
    caFilename
  } = secrets;

  const user = pgDatabaseUser(role, refId);

  const sslConfig = {
    rejectUnauthorized: true,
    ca: readFileSync(resolve(join(__dirname, `../config/certs/${caFilename}`)))
  };

  db.pool = knex({
    client: dbConfig.driver, // e.g., 'pg', 'mysql'
    connection: {
      host,
      port,
      user,
      password,
      database: name,
      ssl: sslConfig
    },
    searchPath: ['users', 'app'], // which schemas to search during queries
    pool: {
      min: dbConfig.minPool,
      max: dbConfig.maxPool,
      afterCreate: (conn, done) => {
        onAfterCreate(conn, done);
      }
    },
    acquireConnectionTimeout: 10000,
    compileSqlOnError: false,
    migrations: {
      tableName: 'migrations'
    },
    log: {
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
    }
  });

  // try {
  //   // Test the connection
  //   await db.pool.raw('SELECT 1');
  //   logger.info('Database connected successfully');
  //   logger.info(JSON.stringify(db.pool.client.config, null, 2));
  // } catch (error) {
  //   logger.error('Database connection failed:', error);
  //   throw error;
  // }

  return db.pool;
};

module.exports = { connectDatabasePool };
