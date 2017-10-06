'use strict';

const fs = require('fs');
const yaml = require('js-yaml');
const sinon = require('sinon');
const promisify = require('util.promisify');

const AWS = require('aws-sdk');
const Localstack = require('./localstack');

module.exports.fixture = {
  read(name) {
    return JSON.parse(fs.readFileSync(`${__dirname}/fixtures/${name}.json`, 'utf8'));
  }
}

function readResources() {
  const config = yaml.safeLoad(fs.readFileSync('serverless.yml', 'utf8'));
  return config.resources && config.resources.Resources;
}

function initDb() {
  const resources = readResources();
  if (resources) {
    const tables = Object.keys(resources)
          .filter(x => resources[x].Type == 'AWS::DynamoDB::Table');
    const db = new Localstack.DynamoDB();
    const createTable = promisify(db.createTable.bind(db));
    const deleteTable = promisify(db.deleteTable.bind(db));
    const ps = tables.map(x => {
      const params = resources[x].Properties
      deleteTable({TableName: params.TableName})
        .catch(() => {})
        .then(() => createTable(params))
    })
    return Promise.all(ps);
  }
  return Promise.resolve();
}


before((done) => {
  initDb().then(data => {
  }).then(done, done);
})
