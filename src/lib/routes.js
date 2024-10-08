const API = require('config').get('api').name;

const ROUTES = Object.freeze({
  CONFIG: `/${API}/config`,
  LOGIN: `/${API}/login`,
  LOGOUT: `/${API}/logout`,
  SIGNUP: `/${API}/signup`,
  SECRETS: `/${API}/secrets`,
  STATUS: `/${API}/status`,
  USERS: `/${API}/users`,
  VERSION: `/${API}/version`
});

module.exports = ROUTES;
