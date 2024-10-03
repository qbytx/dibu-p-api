exports.up = (pgm) => {
  // Enable uuid-ossp extension if not already enabled
  // note: uuid-ossp exists on supabase by default
  pgm.createExtension('uuid-ossp', { ifNotExists: true });

  pgm.createTable('users', {
    user_id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    username: { type: 'varchar(255)', notNull: true, unique: true },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password: { type: 'varchar(255)', notNull: true },
    created_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('current_timestamp') },
    last_login: { type: 'timestamp with time zone' },
    email_verified: { type: 'boolean', notNull: true, default: false },
    is_active: { type: 'boolean', notNull: true, default: true },
    is_online: { type: 'boolean', notNull: true, default: false },
    created_by: { type: 'smallint', notNull: true, check: 'created_by IN (0, 1)' },
    friends: { type: 'jsonb' },
    log_activity: { type: 'jsonb' },
    data_account: { type: 'jsonb' },
    data_settings: { type: 'jsonb' },
    data_discord: { type: 'jsonb' },
    data_google: { type: 'jsonb' },
    data_user: { type: 'jsonb' },
    data_dibumon: { type: 'jsonb' },
    oauth_token_discord: { type: 'text' },
    oauth_token_google: { type: 'text' }
  });

  // Add indexes
  pgm.createIndex('users', 'username');
  pgm.createIndex('users', 'email');
  pgm.createIndex('users', 'is_active');
  pgm.createIndex('users', 'is_online');
  pgm.createIndex('users', 'created_at');
  pgm.createIndex('users', 'last_login');

  // Add a trigger to update the updated_at column
  pgm.createFunction(
    'update_updated_at',
    [],
    {
      returns: 'trigger',
      language: 'plpgsql'
    },
    `
    BEGIN
      NEW.updated_at = current_timestamp;
      RETURN NEW;
    END;
    `
  );

  pgm.createTrigger('users', 'update_updated_at_trigger', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at',
    level: 'ROW',
    language: 'plpgsql'
  });
};

exports.down = (pgm) => {
  pgm.dropTrigger('users', 'update_updated_at_trigger', { ifExists: true });
  pgm.dropFunction('update_updated_at', [], { ifExists: true });
  pgm.dropTable('users', { ifExists: true, cascade: true });
};
