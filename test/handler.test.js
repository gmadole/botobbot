'use strict';

var promisify = require('util.promisify');
var assert = require('power-assert');
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru();
var helper = require('./test-helper');
var Localstack = require('./localstack');


describe('#challenge', () => {
  let event;
  let handle;

  beforeEach(() => {
    const stub = {
      'aws-sdk': {
        DynamoDB: Localstack.DynamoDB,
        '@global': true
      }
    };
    const handler = proxyquire('../app/handler', stub);
    event = {
      'queryStringParameters': {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'echo_back_token',
        'hub.challenge': 'abcd1234'
      }
    };
    handle = promisify(handler.challenge.bind(handler));
  });

  it('callbacks with success response', () => {
    return handle(event, {}).then((res) => {
      assert(res.statusCode === 200);
      assert(res.body === 'abcd1234');
    });
  });

  context('when hub.mode is not subscribe', () => {
    it('callbacks with failed response', () => {
      event['queryStringParameters']['hub.mode'] = 'bad_mode';
      return handle(event, {}).then((res) => {
        assert(res.statusCode === 403);
      });
    });
  });

  context('when hub.verify_token is not correct', () => {
    it('callbacks with failed response', () => {
      event['queryStringParameters']['hub.verify_token'] = 'bad_token';
      return handle(event, {}).then((res) => {
        assert(res.statusCode === 403);
      });
    });
  });
});


describe('#receive', () => {
  let event;
  let handle;
  let messenger;

  beforeEach(() => {
    messenger = {
      send: sinon.stub()
    }
    const stub = {
      'aws-sdk': {
        DynamoDB: Localstack.DynamoDB,
        '@global': true
      },
      './messenger': messenger
    };
    const handler = proxyquire('../app/handler', stub);
    handle = promisify(handler.receive.bind(handler));
  });

  context('with text message', () => {
    beforeEach(() => {
      event = {
        body: JSON.stringify(helper.fixture.read('receive_event'))
      };
    });

    it('callbacks with success response', () => {
      return handle(event, {}).then((res) => {
        assert(res.statusCode === 200);
      });
    });

    it('calls messenger.send with given text', () => {
      return handle(event, {}).then((res) => {
        assert(messenger.send.calledOnce);
        assert(messenger.send.getCall(0).args[0] === '6789012345678901');
        assert(messenger.send.getCall(0).args[1].includes('Hello!'));
      });
    });
  });

  context('with image message', () => {
    beforeEach(() => {
      event = {
        body: JSON.stringify(helper.fixture.read('receive_event_image'))
      };
    });

    it('calls messenger.send twice with some text and with image url', () => {
      return handle(event, {}).then(() => {
        assert(messenger.send.calledTwice);
        assert(messenger.send.getCall(0).args[0] === '6789012345678901');
        assert(messenger.send.getCall(0).args[1].length > 0);
        assert(messenger.send.getCall(1).args[0] === '6789012345678901');
        assert(messenger.send.getCall(1).args[1].includes('https:\\/\\/botobbot.test\\/path\\/to\\/image.jpg?xxx=abcdef'));
      });
    });

    it('creates photo record', () => {
      const db = new Localstack.DynamoDB.DocumentClient();
      const params = { TableName: 'photos', Select: 'COUNT' };
      let org;
      return promisify(db.scan.bind(db))(params).then((data) => {
        org = data.Count;
        return handle(event, {});
      }).then(() => {
        return promisify(db.scan.bind(db))(params);
      }).then((data) => {
        assert(data.Count - org === 1);
      });
    });
  });
});
