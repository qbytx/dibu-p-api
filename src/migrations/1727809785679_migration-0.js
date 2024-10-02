exports.up = (pgm) => {
  pgm.createTable('users', {
    user_id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    username: { type: 'varchar(255)', notNull: true, unique: true },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password: { type: 'varchar(255)', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    last_login: { type: 'timestamp' },
    email_verified: { type: 'boolean', notNull: true, default: false },
    is_active: { type: 'boolean', notNull: true, default: true },
    is_online: { type: 'boolean', notNull: true, default: false },
    created_by: { type: 'integer', notNull: true },
    friends: { type: 'jsonb' },
    log_activity: { type: 'jsonb' },
    data_acccount: { type: 'jsonb' },
    data_settings: { type: 'jsonb' },
    data_discord: { type: 'jsonb' },
    data_google: { type: 'jsonb' },
    data_user: { type: 'jsonb' },
    data_dibumon: { type: 'jsonb' },
    oauth_token_discord: { type: 'text' },
    oauth_token_google: { type: 'text' }
  });

  // Add any necessary indexes
  pgm.createIndex('users', 'username');
  pgm.createIndex('users', 'email');
  pgm.createIndex('users', 'is_active');
  pgm.createIndex('users', 'is_online');
};

exports.down = (pgm) => {
  pgm.dropTable('users');
};
