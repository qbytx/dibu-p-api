const knex = require('knex');
const dbConfig = require('config').get('db');
const { pgDatabaseUser } = require('./databaseUtilities');

const db = {
  pool: null
};

const connectDatabasePool = async (secrets) => {
  const {
    host,
    name,
    port,
    role,
    refId,
    password
  } = secrets;

  const user = pgDatabaseUser(role, refId);

  db.pool = knex({
    client: dbConfig.driver, // e.g., 'pg', 'mysql'
    connection: {
      host,
      port,
      user,
      password,
      database: name
    },
    pool: { min: dbConfig.minPool, max: dbConfig.maxPool }
  });
};

module.exports = { connectDatabasePool };
