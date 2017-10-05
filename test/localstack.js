'use strict';

const AWS = require('aws-sdk');

const localize = (base, endpoint) => {
  return class {
    constructor(options = {}) {
      Object.assign(options, {region: 'local', endpoint: endpoint});
      return new base(options);
    }
  };
}

module.exports.DynamoDB = localize(AWS.DynamoDB, 'http://localhost:4569');
module.exports.DynamoDB.DocumentClient = localize(AWS.DynamoDB.DocumentClient, 'http://localhost:4569');
