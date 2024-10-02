'use strict';

const databaseConfig = require('config').get('database');
const SqlString = require('sqlstring');

const pgp = require('pg-promise')({
  capSQL: true // capitalize all generated SQL
});

const dbManager = {
  db: null,
  cn: '',
  fastify: null
};

const log = (i) => {
  if (dbManager?.fastify != null) {
    dbManager.fastify.log.info(i);
  } else {
    console.log(i);
  }
};

const initialized = () => {
  return dbManager != null && dbManager.db != null && dbManager.fastify != null;
};

const throwInitializationError = () => {
  throw new Error('Database not initialized. Call connectDatabase first.');
};

const getDatabase = () => {
  if (!initialized()) {
    throwInitializationError();
  } else return dbManager?.db;
};

const getConnectionString = () => {
  if (!initialized()) {
    throwInitializationError();
  } else return dbManager?.cn;
};

async function listConnections (usename = null) {
  if (!initialized()) {
    throwInitializationError();
  }

  let query = 'SELECT pid, usename, application_name, client_addr, backend_start, state FROM pg_stat_activity';

  if (usename !== null) {
    const formattedQuery = SqlString.format(`${query} WHERE usename = ?`, [usename]);
    query = formattedQuery;
  }

  // Execute the query with parameterized input
  try {
    const connections = await dbManager.db.any(query);
    log(connections);
  } catch (error) {
    log(`Error fetching connections: ${error.message}, SQL State: ${error.code}`);
  }
}

const closeDatabase = async () => {
  if (!initialized()) {
    throwInitializationError();
  }

  log('Closing db');
  try {
    // end connection pool
    await dbManager.db.$pool.end();
    log('All database connections closed');
  } catch (error) {
    log('Error closing database connections:', error);
  } finally {
    pgp.end(); // End pg-promise instance
  }
};

const connectDatabase = async (fastify, secrets) => {
  dbManager.fastify = fastify;

  if (dbManager.db != null) {
    log('Database already initialized');
    return false;
  }

  const cn = secrets.pgConnectionString.secretValue;
  const maxConnections = parseInt(databaseConfig.poolSize || 20, 10); // 10 is base

  try {
    dbManager.db = pgp({
      connectionString: cn,
      max: maxConnections
    });
    dbManager.cn = cn;

    // connect
    await dbManager.db.connect();
    log('Successfully connected to the database');
    log(`Max connections set to: ${maxConnections}`);

    return true;
  } catch (error) {
    log(`Error initializing database: ${error}`);
    throw error;
  }
};

const linkDatabase = (fastify) => {
  // Attach the db instance to fastify (Note, cannot do this after server start)
  fastify.decorate('getDatabase', getDatabase);

  // Add a hook to close the database connection when Fastify closes
  fastify.addHook('onClose', async (instance) => {
    await closeDatabase(instance);
  });
};

module.exports = { connectDatabase, getDatabase, getConnectionString, listConnections, linkDatabase };
