const db = require('../../services/db/database');
const queries = require('./query-strings');

// Function to create a user
async function createUser (username, email, password, createdBy) {
  return queries.createUser({ username, email, password, createdBy }, db);
}

// Function to get a user by ID
async function getUserById (userId) {
  return queries.getUserById({ userId }, db);
}

// Function to update a user
async function updateUser (username, email, userId) {
  return queries.updateUser({ username, email, userId }, db);
}

// Function to delete a user
async function deleteUser (userId) {
  return queries.deleteUser({ userId }, db);
}

// Export the functions for use in other files
module.exports = {
  createUser,
  getUserById,
  updateUser,
  deleteUser
};
