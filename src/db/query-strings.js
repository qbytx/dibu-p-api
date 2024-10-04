const { isDefined } = require('../utils/params');

const throwUndefinedError = (index) => {
  throw new Error('critical error: undefined value in query string, exiting...');
};

const queries = {
  createUser: async ({ username, email, password, createdBy }, pgPromiseDB) => {
    if (!isDefined([username, email, password, createdBy])) {
      throwUndefinedError();
    }
    const query = `
        INSERT INTO users (username, email, password, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING user_id, username, email, created_at
      `;
    return pgPromiseDB.one(query, [username, email, password, createdBy]);
  },

  getUserById: async ({ userId }, pgPromiseDB) => {
    if (!isDefined([userId])) {
      throwUndefinedError();
    }
    const query = 'SELECT * FROM users WHERE user_id = $1';
    return pgPromiseDB.oneOrNone(query, [userId]);
  },

  updateUser: async ({ username, email, userId }, pgPromiseDB) => {
    if (!isDefined([username, email, userId])) {
      throwUndefinedError();
    }
    const query = `
        UPDATE users
        SET username = $1, email = $2, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $3
      `;
    return pgPromiseDB.none(query, [username, email, userId]);
  },

  deleteUser: async ({ userId }, pgPromiseDB) => {
    if (!isDefined([userId])) {
      throwUndefinedError();
    }
    const query = 'DELETE FROM users WHERE user_id = $1';
    return pgPromiseDB.none(query, [userId]);
  }
};

module.exports = queries;
