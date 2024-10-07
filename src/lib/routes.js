const API = require('config').get('api').name;

const ROUTES = Object.freeze({
  CONFIG: `/${API}/config`,
  VALIDATE: `/${API}/validate`,
  SECRETS: `/${API}/secrets`,
  STATUS: `/${API}/status`,
  USERS: `/${API}/users`,
  VERSION: `/${API}/version`
});

module.exports = ROUTES;
