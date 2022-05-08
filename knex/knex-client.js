const {isLocal} = require('../src/utils');
const environment = process.env.ENVIRONMENT || 'development';
const defaultConfig = require('../knexfile.js');
const knex = require('knex');

const tableSchema = require('../knex/ldpos-table-schema');

const {
  firstOrDefault,
  isNullOrUndefined,
  isNullOrUndefinedOrEmpty,
} = require('../src/utils');

const SQLITE_ERROR_CODE = 'SQLITE_ERROR';

const KNEX_CLIENTS = {
  SQLITE_CLIENT: 'sqlite3',
};

class KnexClient {
  constructor(dalConfig) {
    dalConfig = dalConfig || {};
    this.logger = dalConfig.logger || console;
    this.knexConfig = {
      ...defaultConfig,
      client: dalConfig.client || defaultConfig.client,
      connection: {
        ...defaultConfig.connection,
        ...dalConfig.connection,
      },
      pool: {
        ...defaultConfig.pool,
        ...dalConfig.pool,
      },
      migrations: {
        ...defaultConfig.migrations,
        ...dalConfig.migrations,
      },
      seeds: {
        ...defaultConfig.seeds,
        ...dalConfig.seeds,
      },
      useNullAsDefault: true,
    };
    this.knex = knex(this.knexConfig);
    if (isLocal(environment)) {
      this.knex.on('query', (...args) => {
        if (process.env.KNEX_DEBUG) {
          this.logger.info(args);
        }
      });
    }
    this.tableNames = Object.entries(tableSchema).map(([_, value]) => value.name);
  }

  async migrateLatest() {
    return this.knex.migrate.latest();
  }

  async upsert(tableName, data, byColumns) {
    let insert = this.knex(tableName)
      .insert(data)
      .toString();

    let update = this.knex.queryBuilder()
      .update(data)
      .toString();

    let conflictColumns = byColumns.map((c) => `"${c.toString()}"`).join(',');

    return this.knex.raw(`${insert} ON CONFLICT(${conflictColumns}) DO ${update}`);
  }

  async insert(tableName, data) {
    return this.knex(tableName).insert(data);
  }

  buildEqualityMatcherQuery(tableName, matcher, parser) {
    let baseQuery = this.knex(tableName).select();
    let query = Object.entries(matcher).reduce((query, [key, value]) => query.where(key, value), baseQuery);
    if (isNullOrUndefined(parser)) {
      return query;
    }
    return query.on('query-response', parser);
  }

  async findMatchingRecords(tableName, matcher, parser) {
    return this.buildEqualityMatcherQuery(tableName, matcher, parser);
  }

  async updateMatchingRecords(tableName, matcher, updatedData) {
    return this.buildEqualityMatcherQuery(tableName, matcher).update(updatedData);
  }

  async findMatchingRecordsCount(tableName, matcher) {
    return this.buildEqualityMatcherQuery(tableName, matcher)
      .count('*', {as : 'count'})
      .then((rows) => firstOrDefault(rows, {count: '0'})).then(({count}) => parseInt(count, 10));
  }

  async noMatchFound(tableName, matcher) {
    return this.findMatchingRecordsCount(tableName, matcher).then((cnt) => cnt === 0);
  }

  async matchFound(tableName, matcher) {
    return this.noMatchFound(tableName, matcher).then(noMatchFound => !noMatchFound);
  }

  async truncate(tableName) {
    return this.knex(tableName).truncate();
  }

  async truncateAllTables() {
    return Promise.all(this.tableNames.map(tableName => this.truncate(tableName)));
  }

  async truncateAllExistingTables() {
    let isUnknownError = (error) => {
      return error.code !== SQLITE_ERROR_CODE && !error.message.includes('SQLITE_ERROR: no such table');
    }

    return Promise.all(
      this.tableNames.map(async (tableName) => {
        try {
          await this.truncate(tableName);
        } catch (error) {
          // Ignore table does not exist error.
          if (isUnknownError(error)) {
            throw error;
          }
        }
      })
    );
  }

  async destroy() {
    return this.knex.destroy();
  }
}

module.exports = KnexClient;
