# Database Migration Guide: Using pg-promise with node-pg-migrate

This guide explains how to set up and perform database migrations using pg-promise and node-pg-migrate in a Node.js project. We'll cover installation, configuration, creating migrations, and running them.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Creating Migrations](#creating-migrations)
5. [Running Migrations](#running-migrations)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have:

- Node.js and npm installed
- A PostgreSQL database
- Basic knowledge of JavaScript and SQL

## Installation

1. Install the required packages:

```bash
   npm install pg-promise node-pg-migrate
```

2. Install node-pg-migrate globally (optional, but recommended for easier CLI usage):

```bash
   npm install -g node-pg-migrate
```

## Configuration

1. Create a `database.js` file.

```javascript
'use strict';
// note, this script is not production-ready, it is for demonstration

const pgp = require('pg-promise')();
const { secrets, loadSecrets } = require('./secrets');

const dbManager = { db: null };

const connectDatabase = async () => {
  await loadSecrets();
  const cn = secrets.pgConnectionString.secretValue;

  try {
    dbManager.db = pgp(cn);
    await dbManager.db.connect();
    console.log('Successfully connected to the database');
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    throw error;
  }
};

const getDatabase = () => {
  if (!dbManager.db) throw new Error('Database not initialized.');
  return dbManager.db;
};

module.exports = { connectDatabase, getDatabase };

```

3. Create a `migrate-config.js` file:

```javascript
const { getConnectionString } = require('./database'); 

module.exports = { 
    'migrations-dir': './src/migrations', 
    'migration-file-language': 'js', 
    'use-transaction': true, 
    'database-url': getConnectionString() // Use the connection string from database.js 
};
```

## Creating Migrations

1. To create a new migration, create an npm script ```migrate```:

```json

  // package.json

  "scripts": {
    "test": "test",
    "migrate": "node-pg-migrate -m ./src/migrations",
    "start": "node ./src/server.js"
  },

```

   This creates a new file in the `./src/migrations` directory.

2. Edit the newly created migration file. Here's an example:

```javascript
   exports.up = (pgm) => {
      pgm.createTable('users', {
        id: 'id',
        name: { type: 'varchar(1000)', notNull: true },
        createdAt: {
          type: 'timestamp',
          notNull: true,
          default: pgm.func('current_timestamp'),
    },
  });
  pgm.createTable('posts', {
    id: 'id',
    userId: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'cascade',
    },
    body: { type: 'text', notNull: true },
    createdAt: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
  pgm.createIndex('posts', 'userId');
};
```

## Running Migrations

1. To run all pending migrations:

```bash
  node-pg-migrate up --config ./src/migrations/migrate-config.js
```

2. To undo the last migration:

```bash
   node-pg-migrate down --config ./src/migrations/migrate-config.js
```

3. To migrate to a specific version:

```bash
   node-pg-migrate up 1234567890123 --config ./src/migrations/migrate-config.js
```

4. To use NPM Scripts instead:
``` json
{
    // package.json
  "scripts": {
    "test": "test",
    "migrate": "node-pg-migrate -m ./src/migrations",
    "migrate:up": "node-pg-migrate up --config ./src/migrations/migrate-config.js",
    "migrate:down": "node-pg-migrate down --config ./src/migrations/migrate-config.js",
    "start": "node ./src/server.js"
  }
}
```

## Best Practices

1. **Version Control**: Always commit your migration files to version control.

2. **Test Migrations**: Always test migrations in a non-production environment first.

3. **Idempotency**: Write migrations that are idempotent (can be run multiple times without changing the result beyond the initial application).

4. **Down Migrations**: Always provide a `down` function to revert changes.

5. **Transactions**: Use transactions for complex migrations to ensure data integrity.

## Troubleshooting

- **Connection Issues**: Ensure your database credentials are correct and the database is accessible.
- **Permission Errors**: Check that your database user has the necessary permissions to create/alter tables.
- **Migration Conflicts**: If you get conflicts, ensure all developers are working with the latest migration files.

Remember, database migrations are powerful tools but should be used carefully, especially in production environments. Always backup your data before running migrations.

For more detailed information, refer to the [node-pg-migrate documentation](https://salsita.github.io/node-pg-migrate/#/) and [pg-promise documentation](https://vitaly-t.github.io/pg-promise/).
