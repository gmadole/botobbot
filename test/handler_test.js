'use strict';

var assert = require('power-assert');
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru();
var helper = require('./test_helper.js');

describe('#challenge', () => {
  var handler, event, callback;
  var dynamoDb;
  beforeEach(() => {
    dynamoDb = sinon.stub();
    handler = proxyquire('../app/handler',
                         {
                           'aws-sdk': {
                             DynamoDB: { DocumentClient: dynamoDb },
                             '@global': true
                           }
                         });
    event = {
      'queryStringParameters': {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'echo_back_token',
        'hub.challenge': 'abcd1234'
      }
    };
    callback = sinon.stub();
  });

  it('callbacks with success response', () => {
    handler.challenge(event, {}, callback);
    assert(callback.calledOnce);

    const args = callback.args[0];
    assert(args[0] === null);

    const res = args[1];
    assert(res.statusCode === 200);
    assert(res.body === 'abcd1234');
  });

  context('when hub.mode is not subscribe', () => {
    it('callbacks with failed response', () => {
      event['queryStringParameters']['hub.mode'] = 'bad_mode';
      handler.challenge(event, {}, callback);
      assert(callback.calledOnce);

      const args = callback.args[0];
      assert(args[0] === null);

      const res = args[1];
      assert(res.statusCode === 403);
    });
  });

  context('when hub.verify_token is not correct', () => {
    it('callbacks with failed response', () => {
      event['queryStringParameters']['hub.verify_token'] = 'bad_token';
      handler.challenge(event, {}, callback);
      assert(callback.calledOnce);

      const args = callback.args[0];
      assert(args[0] === null);

      const res = args[1];
      assert(res.statusCode === 403);
    });
  });
});


describe('#receive', () => {
  var handler, event, callback;
  var dynamoDb, messenger;
  beforeEach(() => {
    dynamoDb = sinon.stub();
    messenger = {
      send: sinon.stub()
    }
    handler = proxyquire('../app/handler',
                         {
                           'aws-sdk': {
                             DynamoDB: { DocumentClient: dynamoDb },
                             '@global': true
                           },
                           './messenger': messenger
                         });
    callback = sinon.stub();
  });

  context('with text message', () => {
    beforeEach(() => {
      event = {
        body: JSON.stringify(helper.fixture.read('receive_event'))
      };
    });

    it('callbacks with success response', () => {
      handler.receive(event, {}, callback);
      assert(callback.calledOnce);

      const args = callback.args[0];
      assert(args[0] === null);

      const res = args[1];
      assert(res.statusCode === 200);
    });

    it('calls messenger.send with given text', () => {
      handler.receive(event, {}, callback);
      assert(messenger.send.calledOnce);
      assert(messenger.send.getCall(0).args[0] === '6789012345678901');
      assert(messenger.send.getCall(0).args[1].includes('Hello!'));
    });
  });

  context('with image message', () => {
    beforeEach(() => {
      event = {
        body: JSON.stringify(helper.fixture.read('receive_event_image'))
      };
    });

    it('calls messenger.send with some text and with image url', () => {
      handler.receive(event, {}, callback);
      assert(messenger.send.calledTwice);
      assert(messenger.send.getCall(0).args[0] === '6789012345678901');
      assert(messenger.send.getCall(0).args[1].length > 0);
      assert(messenger.send.getCall(1).args[0] === '6789012345678901');
      assert(messenger.send.getCall(1).args[1].includes('https:\\/\\/botobbot.test\\/path\\/to\\/image.jpg?xxx=abcdef'));
    });
  });
});
