const knex = require('knex');

const db = {
  knex: null
};

const connectDatabase = async (config) => {
  db.knex = knex({
    client: 'pg',
    connection: {
      host: '127.0.0.1',
      port: 3306,
      user: 'your_database_user',
      password: 'your_database_password',
      database: 'myapp_test'
    }
  });
};

module.exports = { connectDatabase };
