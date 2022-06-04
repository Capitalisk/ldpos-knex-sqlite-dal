let {isNullOrUndefined} = require('../utils');

let applyParserForEach = (objects, ...parsers) => {
  return objects.map(obj => parsers.reduce((parsedObj, parser) => parser(parsedObj), obj));
};

// boolean parser for sqlite
let booleanParser = (obj, keys) => {
  for (key of keys) {
    if (key in obj && !isNullOrUndefined(obj[key])) {
      obj[key] = obj[key] === "1"
    }
  }
  return obj;
};

// responsible for parsing string into integer values
let numberParser = (obj, keys) => {
  for (key of keys) {
    if (key in obj && !isNullOrUndefined(obj[key])) {
      obj[key] = parseInt(obj[key], 10);
    }
  }
  return obj;
};

let base64ObjParser = (obj, keys) => {
  for (key of keys) {
    if (key in obj && !isNullOrUndefined(obj[key])) {
      obj[key] = JSON.parse(
        Buffer.from(obj[key], 'base64').toString('utf8')
      );
    }
  }
  return obj;
};

let sanitizeTransaction = (txn) => {
  let props = Object.keys(txn);
  for (let prop of props) {
    if (txn[prop] == null) {
      delete txn[prop];
    }
  }
  return txn;
};

let removePrivateBlockField = (block) => {
  delete block.synched;
  return block;
};

let textToArray = (obj, keys) => {
  for (key of keys) {
    if (key in obj && !isNullOrUndefined(obj[key])) {
      obj[key] = obj[key].split(',');
    }
  }
  return obj;
};

module.exports = {
  applyParserForEach,
  booleanParser,
  numberParser,
  base64ObjParser,
  sanitizeTransaction,
  removePrivateBlockField,
  textToArray,
};
