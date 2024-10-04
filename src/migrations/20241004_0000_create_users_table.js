exports.up = function (knex) {
  return knex.schema.createTable('users', function (table) {
    table.uuid('user_id').primary();
    table.string('username').notNullable().unique();
    table.string('email').notNullable().unique();
    table.string('password').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('last_login');
    table.boolean('email_verified').defaultTo(false);
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_online').defaultTo(false);
    table.integer('created_by').defaultTo(0);
    table.json('friends');
    table.json('log_activity');
    table.json('data_account');
    table.json('data_settings');
    table.json('data_discord');
    table.json('data_google');
    table.json('data_user');
    table.json('data_dibumon');
    table.string('oauth_token_discord');
    table.string('oauth_token_google');

    // Indexes
    table.index('username');
    table.index('email');
    table.index('last_login');
    table.index('is_active');
    table.index('is_online');
    table.index('created_at');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('users.users');
};

exports.config = { transaction: false };
