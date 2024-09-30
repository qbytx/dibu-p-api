const serverSettings = require('./server-settings.json');
const API = serverSettings.API;

const ROUTES = Object.freeze({
  CONFIG: `/${API}/config`,
  SECRETS: `/${API}/secrets`,
  STATUS: `/${API}/status`,
  USERS: `/${API}/users`,
  VERSION: `/${API}/version`
});

module.exports = ROUTES;
