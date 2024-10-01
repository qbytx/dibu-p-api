const { getConnectionString } = require('../services/database');

// todo, verify this config is correct before attempting migration

module.exports = {
  'migrations-dir': 'migrations',
  'migration-file-language': 'js',
  'use-transaction': true,
  dynamicConnectionString: getConnectionString
};
