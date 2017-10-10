'use strict';

const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');
const promisify = require('util.promisify');


class Photo {
  constructor() {
    this.id = uuid.v1();
    this.created_at = new Date().getTime();
  }

  attributes() {
    return {
      id: this.id,
      image_url: this.image_url,
      created_at: this.created_at
    };
  }

  save() {
    const params = {
      TableName: `${process.env.TABLE_PREFIX}photos`,
      Item: this.attributes()
    };

    return promisify(db.put.bind(db))(params);
  }
}

module.exports = Photo;
