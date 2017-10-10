'use strict';

const fs = require('fs');
const sinon = require('sinon');
const promisify = require('util.promisify');

const Serverless = require('serverless');
const AWS = require('aws-sdk');
const Localstack = require('./localstack');

module.exports.fixture = {
  read(name) {
    return JSON.parse(fs.readFileSync(`${__dirname}/fixtures/${name}.json`, 'utf8'));
  }
}

function readConfig() {
  const sls = new Serverless();
  return sls.service.load().then(() => {
    return sls.variables.populateService({ stage: 'test' });
  }).then(() => {
    return Promise.resolve(sls.service);
  });
}

function initResource(resource) {
  switch (resource.Type) {
  case 'AWS::DynamoDB::Table':
    return initTable(resource.Properties);
  default:
    return Promise.resolve();
  }
}

function initTable(props) {
  const db = new Localstack.DynamoDB();
  const createTable = promisify(db.createTable.bind(db));
  const deleteTable = promisify(db.deleteTable.bind(db));
  return deleteTable({TableName: props.TableName})
    .catch(() => {})
    .then(() => createTable(props));
}

function initEnv(env) {
  let org = Object.assign({}, process.env);

  before(() => {
    Object.assign(process.env, env);
  });

  after(() => {
    process.env = org;
  });
}

before((done) => {
  readConfig().then((config) => {
    initEnv(config.provider.environment);
    const resources = config.resources && config.resources.Resources || [];
    const ps = Object.keys(resources).map((x) => initResource(resources[x]));
    return Promise.all(ps);
  }).then(() => done());
});

