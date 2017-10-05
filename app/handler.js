'use strict';

const Photo = require('./models/photo');
const Messenger = require('./messenger');

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

module.exports.receive = (event, context, callback) => {
  const body = JSON.parse(event['body']);
  const messaging = body.entry[0].messaging[0];
  const senderId = messaging.sender.id;
  const text = messaging.message.text || '何';

  Messenger.send(senderId, ['えっ？', text, '？？'].join(''));

  const attachments = messaging.message.attachments;
  const promises = [];
  if (attachments) {
    Messenger.send(senderId, ['これ？', attachments[0].payload.url].join(''));
    const photo = new Photo();
    photo.image_url = attachments[0].payload.url;
    promises.push(photo.save());
  }
  Promise.all(promises).then(() => {
    callback(null, {statusCode: 200});
  }).catch((error) => {
    callback(null, {statusCode: 403, body: error});
  });
};
