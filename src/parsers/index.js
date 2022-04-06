const {
  applyParserForEach,
  base64ObjParser,
  booleanParser,
  numberParser,
  removePrivateBlockField,
  sanitizeTransaction,
  textToArray,
} = require('./parsers');

const {accountsTable, transactionsTable, blocksTable, delegatesTable, ballotsTable} = require('../../knex/ldpos-table-schema');

class DalParser {
  constructor(knexClient) {
    this.knexClient = knexClient;
    this.initializeParsers();
  }

  generateAccountsTableParsers() {
    let bigIntegerFields = [
      accountsTable.field.lastTransactionTimestamp,
      accountsTable.field.nextSigKeyIndex,
      accountsTable.field.nextForgingKeyIndex,
      accountsTable.field.nextMultisigKeyIndex,
      accountsTable.field.updateHeight,
    ];
    let parsers = [(account) => numberParser(account, bigIntegerFields)];

    let integerFields = [
      accountsTable.field.requiredSignatureCount,
    ];
    parsers.push((account) => numberParser(account, integerFields));

    return parsers;
  };

  generateTransactionTableParsers() {
    let bigIntegerFields = [
      transactionsTable.field.timestamp,
      transactionsTable.field.nextSigKeyIndex,
      transactionsTable.field.newNextForgingKeyIndex,
      transactionsTable.field.newNextMultisigKeyIndex,
      transactionsTable.field.newNextSigKeyIndex,
    ];

    let base64Fields = [
      transactionsTable.field.signatures,
      transactionsTable.field.error,
    ];
    let textArrayFields = [
      transactionsTable.field.memberAddresses,
    ];

    let parsers = [
      sanitizeTransaction,
      (txn) => numberParser(txn, bigIntegerFields),
      (txn) => base64ObjParser(txn, base64Fields),
      (txn) => textToArray(txn, textArrayFields),
    ];

    let integerFields = [
      transactionsTable.field.indexInBlock,
      transactionsTable.field.requiredSignatureCount,
    ];
    parsers.push((txn) => numberParser(txn, integerFields));

    return parsers;
  };

  generateBlocksTableParser() {
    let bigIntegerFields = [
      blocksTable.field.height,
      blocksTable.field.timestamp,
      blocksTable.field.nextForgingKeyIndex,
    ];

    let base64Fields = [
      blocksTable.field.signatures,
    ];

    let parsers = [
      (block) => numberParser(block, bigIntegerFields),
      (block) => base64ObjParser(block, base64Fields),
      removePrivateBlockField,
    ];

    let booleanFields = [
      blocksTable.field.active,
    ];
    let integerFields = [
      blocksTable.field.numberOfTransactions,
    ];
    parsers.push(
      (block) => numberParser(block, integerFields),
      (block) => booleanParser(block, booleanFields),
    );

    return parsers;
  };

  generateDelegatesTableParser() {
    let bigIntegerFields = [delegatesTable.field.updateHeight];
    return [
      (delegate) => numberParser(delegate, bigIntegerFields),
    ];
  };

  generateBallotsTableParser() {
    let parsers = [];
    let booleanFields = [
      ballotsTable.field.active,
    ];
    parsers.push(
      (ballot) => booleanParser(ballot, booleanFields),
    );
    return parsers;
  };

  initializeParsers() {
    this.accountTableParsers = this.generateAccountsTableParsers();
    this.transactionsTableParsers = this.generateTransactionTableParsers();
    this.blocksTableParsers = this.generateBlocksTableParser();
    this.delegatesTableParsers = this.generateDelegatesTableParser();
    this.ballotsTableParsers = this.generateBallotsTableParser();
  };

  getRecordedParsers() {
    let recordedParsers = {
      [accountsTable.name]: (accounts) => applyParserForEach(accounts, ...this.accountTableParsers),
      [transactionsTable.name]: (transactions) => applyParserForEach(transactions, ...this.transactionsTableParsers),
      [blocksTable.name]: (blocks) => applyParserForEach(blocks, ...this.blocksTableParsers),
      [delegatesTable.name]: (delegates) => applyParserForEach(delegates, ...this.delegatesTableParsers),
    };
    if (this.ballotsTableParsers.length > 0) { // extra check for sqlite based parsers
      recordedParsers[ballotsTable.name] = (ballots) => applyParserForEach(ballots, ...this.ballotsTableParsers);
    }
    return recordedParsers;
  };
}

module.exports = DalParser;
