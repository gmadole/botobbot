'use strict';

var assert = require('power-assert');
var sinon = require('sinon');
var handler =  require('../handler.js');

describe('#challenge', () => {
  var event;
  beforeEach(() => {
    event = {
      'queryStringParameters': {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'echo_back_token',
        'hub.challenge': 'abcd1234'
      }
    };
  });

  it('callbacks with success response', () => {
    const callback = sinon.spy();
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
      const callback = sinon.spy();
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
      const callback = sinon.spy();
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
