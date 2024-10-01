'use strict';

const pgp = require('pg-promise')({
  capSQL: true // capitalize all generated SQL
});

let db = null;

const getConnection = () => {
  if (db === null) {
    throw new Error('Database not initialized. Call connectDatabase first.');
  } else return db;
};

async function listConnections () {
  const query = `SELECT pid, usename, application_name, client_addr, backend_start, state
                 FROM pg_stat_activity;`;
  try {
    const connections = await db.any(query);
    console.log(connections);
  } catch (error) {
    console.error('Error fetching connections:', error);
  }
}

const closeDatabase = async (fastify) => {
  fastify.log.info('closing db');
  try {
    if (db) {
      await db.$pool.end(); // Gracefully end connection pool
      fastify.log.info('All database connections closed');
    }
  } catch (error) {
    fastify.log.error('Error closing database connections:', error);
  } finally {
    pgp.end(); // End pg-promise instance
  }
};

const connectDatabase = async (fastify, secrets) => {
  if (db !== null) {
    fastify.log.info('Database already initialized');
    return db;
  }

  const connectionString = secrets.pgConnectionString.secretValue;
  const maxConnections = fastify.config.DB_MAX_CONNECTIONS || 30;

  const cn = {
    connectionString,
    max: parseInt(maxConnections, 10)
  };

  try {
    db = pgp(cn);

    // connection
    await db.connect();
    fastify.log.info('Successfully connected to the database');
    fastify.log.info(`Max connections set to: ${maxConnections}`);

    // list all connections to db
    await listConnections();

    // Attach the db instance to fastify
    fastify.decorate('db', db);

    // Add a hook to close the database connection when Fastify closes
    fastify.addHook('onClose', async (instance) => {
      await closeDatabase(instance);
    });

    return db;
  } catch (error) {
    fastify.log.error('Error initializing database:', error);
    throw error;
  }
};

module.exports = { connectDatabase, getConnection };
