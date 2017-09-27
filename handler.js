'use strict';

const request = require('request');

module.exports.challenge = (event, context, callback) => {
  const params = event['queryStringParameters'];
  if (params['hub.mode'] === 'subscribe' &&
      params['hub.verify_token'] === 'echo_back_token' ) {
    const response = {
      statusCode: 200,
      body: params['hub.challenge']
    };
    callback(null, response);
  } else {
    const response = {
      statusCode: 403,
      body: 'Failed validation.'
    };
    callback(null, response);
  }
};

const sendTo = (recipientId, texts) => {
  const text = texts.join('');
  const options = {
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    headers: {
      'Content-Type': 'application/json'
    },
    json: {
      'recipient': {
        'id': recipientId
      },
      'message': {
        'text': text
      },
      'access_token': process.env.FACEBOOK_PAGE_ACCESS_TOKEN
    }
  };

  request.post(options, (err, res, body) => {
    console.log(err);
    console.log(body);
  });
};

module.exports.receive = (event, context, callback) => {
  console.log(event);

  const body = JSON.parse(event['body']);
  const messaging = body.entry[0].messaging[0];
  const senderId = messaging.sender.id;
  const text = messaging.message.text || '何';

  sendTo(senderId, ['えっ？', text, '？？']);

  const attachments = messaging.message.attachments;
  if (attachments) {
    sendTo(senderId, ['これ？', attachments[0].payload.url]);
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'OK',
      input: event
    })
  };

  callback(null, response);
};
