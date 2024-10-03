'use strict';

const logger = require('../../utils/logger');
const SqlString = require('sqlstring');

async function listConnections (db, usename = null) {
  if (db?.any === null || db?.any === undefined || typeof db?.any !== 'function') {
    logger.error('Null database instance, cannot list connections');
  }

  let query = 'SELECT pid, usename, application_name, client_addr, backend_start, state FROM pg_stat_activity';

  if (usename !== null) {
    const formattedQuery = SqlString.format(`${query} WHERE usename = ?`, [usename]);
    query = formattedQuery;
  }

  // Execute the query with parameterized input
  try {
    const connections = await db.any(query);
    logger.info(connections);
  } catch (error) {
    logger.error(`Error fetching connections: ${error.message}, SQL State: ${error.code}`);
  }
}

module.exports = {
  listConnections
};
