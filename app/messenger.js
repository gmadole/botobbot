const request = require('request');

module.exports = {
  send: (recipientId, text) => {
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
  }
}
