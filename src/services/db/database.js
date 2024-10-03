'use strict';

const logger = require('../../utils/logger');
const databaseConfig = require('config').get('database');

const pgp = require('pg-promise')({
  capSQL: true // capitalize all generated SQL
});

const dbManager = {
  db: null,
  cn: ''
};

const serverLink = {
  fastify: null
};

const connected = () => {
  return dbManager?.db !== null && dbManager?.db !== undefined;
};

const throwInitializationError = () => {
  throw new Error('Database not initialized. Call connectDatabase first.');
};

const getDatabase = () => {
  if (!connected()) {
    throwInitializationError();
  } else return dbManager?.db;
};

const getConnectionString = () => {
  if (!connected()) {
    throwInitializationError();
  } else return dbManager?.cn;
};

const closeDatabase = async () => {
  if (!connected()) {
    throwInitializationError();
  }

  logger.info('Closing database...');
  try {
    // end connection pool
    await dbManager.db.$pool.end();
    logger.info('All database connections closed');
  } catch (error) {
    logger.error('Error closing database connections:', error);
  } finally {
    pgp.end(); // End pg-promise instance
  }
};

const connectDatabase = async (secrets, fastify = null) => {
  if (dbManager.db != null) {
    logger.error('Database already initialized');
    return false;
  }

  const cn = secrets.pgConnectionString.secretValue;
  const maxConnections = parseInt(databaseConfig.poolSize || 15, 10); // 10 is base

  try {
    dbManager.db = pgp({
      connectionString: cn,
      max: maxConnections
    });
    dbManager.cn = cn;

    // Connect to the database
    await dbManager.db.connect();
    logger.info('Successfully connected to the database');
    logger.info(`Max connections set to: ${maxConnections}`);

    return true;
  } catch (error) {
    logger.error(`Error initializing database: ${error}`);
    throw error;
  }
};

const linkDatabase = (fastify) => {
  // cache instance
  serverLink.fastify = fastify;

  // Attach the db instance to fastify (Note, cannot do this after server start)
  fastify.decorate('getDatabase', getDatabase);

  // Add a hook to close the database connection when Fastify closes
  fastify.addHook('onClose', async (instance) => {
    await closeDatabase(instance);
  });
};

module.exports = { connectDatabase, getDatabase, getConnectionString, linkDatabase };
