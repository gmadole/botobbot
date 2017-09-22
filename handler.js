'use strict';

module.exports.challenge = (event, context, callback) => {
  console.log(JSON.stringify(event));

  const params = event['queryStringParameters'];
  console.log(JSON.stringify(params));
  if (params['hub.mode'] === 'subscribe' &&
      params['hub.verify_token'] === 'echo_back_token' ) {
    const response = {
      statusCode: 200,
      body: params['hub.challenge']
    };
    callback(null, response);
  } else {
    console.error('Failed validation.');
    const response = {
      statusCode: 403,
      body: 'Failed validation.'
    };
    callback(null, response);
  }
};


module.exports.receive = (event, context, callback) => {
  console.log(event['body']);
  const body = JSON.parse(event['body']);

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }),
  };

  callback(null, response);

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};
