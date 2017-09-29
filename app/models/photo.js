'use strict';

const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');

class Photo {
  constructor() {
    this.id = uuid.v1();
  }

  save() {
    const params = {
      TableName: 'photos',
      Item: {
        id: this.id,
        image_url: this.image_url,
        created_at: new Date().getTime()
      }
    };
    return new Promise((resolve, reject) => {
      dynamoDb.put(params, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}

module.exports = Photo;
