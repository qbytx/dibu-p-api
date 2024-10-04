const { resolve } = require('node:path');

const pgDatabaseUser = (role, refId) => {
  return `${role}.${refId}`;
};

const pgDatabaseURL = ({ host, name, port, role, refId, password, caDirectory, caFilename }) => {
  const caFilepath = resolve(__dirname, '..', caDirectory, caFilename);
  const user = pgDatabaseUser(role, refId);
  return `postgres://${user}:${password}@${host}:${port}/${name}?sslmode=verify-full&sslrootcert=${caFilepath}`;
};

module.exports = { pgDatabaseUser, pgDatabaseURL };
