// Update with your config settings.

module.exports = {
  client: 'sqlite3',
  connection: {
    filename: 'db.sqlite3'
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: __dirname + '/knex/migrations',
  },
  seeds: {
    directory: __dirname + '/knex/seeds',
  },
};
