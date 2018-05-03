/* global describe, it, beforeEach */

const assert = require('chai').assert
const sinon = require('sinon')

const simpleTracker = require('../../index.js')

function silenceConsoleLogs() {
  // dont silence console.log as that will hide test results
  console.info = () => {}
  console.error = () => {}
  console.warn = () => {}
  console.debug = () => {}
}

describe('simple-tracker', function() {
  silenceConsoleLogs()

  let window, document, tracker, mockRequest
  const mockEndpoint = '**ENDPOINT**'
  const mockSessionId = '**SESSION_ID**'
  const mockData1 = '**DATA1**'
  const mockData2 = '**DATA2**'
  const mockHref = '**HREF**'
  const mockUserAgent = '**USER_AGENT**'
  const mockPlatform = '**PLATFORM**'
  const mockCookieValue = 'MOCK_COOKIE'
  const cookieKey = 'trcksesh'
  const mockCookies = `${cookieKey}=${mockCookieValue}`

  // mock XMLHttpRequest. Its prototype functions will be stubbed in reset() with createStubInstance
  function MockXMLHttpRequest() {}
  MockXMLHttpRequest.prototype = {
    open: function() {},
    setRequestHeader: function() {},
    send: function() {},
  }

  let onerrorSpy

  function reset() {
    onerrorSpy = sinon.spy()
    window = {
      XMLHttpRequest: MockXMLHttpRequest,
      location: {
        href: mockHref,
      },
      navigator: {
        userAgent: mockUserAgent,
        platform: mockPlatform,
      },
      onerror: onerrorSpy,
      performance: {
        now: sinon.stub(),
      }
    }
    document = {
      cookie: '',
    }
    simpleTracker(window, document) // sets tracker to window object
    mockRequest = sinon.createStubInstance(MockXMLHttpRequest)
    sinon.stub(window, 'XMLHttpRequest').returns(mockRequest)
    tracker = window.tracker
  }

  function assertSentRequest(expectedEndpoint, expectedData, requestIndex) {
    if (mockRequest.open.callCount === 0) {
      assert(false, 'No outgoing request made')
      return
    }

    const lastRequestIndex = mockRequest.open.callCount - 1
    const callIndex = requestIndex !== undefined ? requestIndex : lastRequestIndex // ternary op because requestIndex could be 0, which would then use last invocation
    const openSpy = mockRequest.open.getCall(callIndex) // assert specific request or assert last invocation.
    assert.equal(openSpy.args[0], 'POST')
    assert.equal(openSpy.args[1], expectedEndpoint)
    assert.isTrue(openSpy.args[2])

    const sendSpy = mockRequest.send.getCall(callIndex)
    assert.deepEqual(JSON.parse(sendSpy.args[0]), expectedData)

    assert.isTrue(mockRequest.setRequestHeader.getCall(callIndex).calledWith('Content-Type', 'application/json'))
  }

  beforeEach(function() {
    reset()
  })


  it('Initialized correctly', function(done) {
    assert.isFalse(tracker.sendCaughtExceptions)
    assert.isFunction(tracker.onerror)
    done()
  })

  it('should not send request if no data to send', function(done) {
    tracker.push({
      endpoint: mockEndpoint,
      sendCaughtExceptions: true,
      sessionId:  mockSessionId,
    })

    assert.isTrue(mockRequest.open.notCalled)
    assert.isTrue(mockRequest.send.notCalled)
    done()
  })

  it('should send request if there is data to send', function(done) {
    tracker.push({
      endpoint: mockEndpoint,
      sendCaughtExceptions: true,
      sessionId:  mockSessionId,
      attachClientContext: false,
      mockData1,
    })

    assert.isTrue(mockRequest.open.calledOnce)
    assert.isTrue(mockRequest.send.calledOnce)
    assertSentRequest(mockEndpoint, {
      mockData1,
      sessionId: mockSessionId,
    })
    done()
  })

  it('should send request for each push', function(done) {
    // first push
    tracker.push({
      endpoint: mockEndpoint,
      sessionId:  mockSessionId,
      attachClientContext: false,
      mockData1,
    })

    assert.isTrue(mockRequest.open.calledOnce)
    assert.isTrue(mockRequest.send.calledOnce)
    assertSentRequest(mockEndpoint, {
      mockData1,
      sessionId: mockSessionId,
    })

    // second push
    tracker.push({
      mockData2,
      sessionId: mockSessionId,
    })

    assert.isTrue(mockRequest.open.calledTwice)
    assert.isTrue(mockRequest.send.calledTwice)
    assertSentRequest(mockEndpoint, {
      mockData2,
      sessionId: mockSessionId,
    })
    done()
  })

  it('should set and read sessionId to/from cookies', function(done) {
    document.cookie = mockCookies
    assert.equal(document.cookie, mockCookies)

    // first push sets endpoint, which triggers set session and will read cookie
    tracker.push({
      endpoint: mockEndpoint,
      mockData1,
      attachClientContext: false,
    })

    assert.equal(document.cookie, mockCookies) // should remain unchanged
    assertSentRequest(mockEndpoint, {
      mockData1,
      sessionId: mockCookieValue, // sessionId sent containing value from cookie
    })

    // second push sets session id, which will set new cookie
    tracker.push({
      sessionId:  mockSessionId,
      mockData2,
    })

    assert.equal(document.cookie, `trcksesh=${mockSessionId}`) // cookie should change
    assertSentRequest(mockEndpoint, {
      mockData2,
      sessionId: mockSessionId, // new sessionId sent
    })
    done()
  })

  it('should generate new sessionId if one does not exist, and store in cookie', function(done) {
    assert.equal(document.cookie, '')

    tracker.push({
      endpoint: mockEndpoint,
      mockData1,
      attachClientContext: false,
    })

    assert.notEqual(document.cookie, '') // should change
    // get newly generated sessionId from cookie
    const splitCookie = document.cookie.split('=')
    const newSessionId = splitCookie[1]
    assert.equal(splitCookie[0], cookieKey)
    assert.notEqual(newSessionId, '')
    assertSentRequest(mockEndpoint, {
      mockData1,
      sessionId: newSessionId,
    })
    done()
  })

  it('should accept data of type "text"', function(done) {
    tracker.push({
      endpoint: mockEndpoint,
      sessionId:  mockSessionId,
      attachClientContext: false,
    })
    tracker.push(mockData1) // push a string

    assert.isTrue(mockRequest.open.calledOnce)
    assert.isTrue(mockRequest.send.calledOnce)
    assertSentRequest(mockEndpoint, {
      text: mockData1,
      sessionId: mockSessionId,
    })
    done()
  })

  it('should track exceptions if enabled', function(done) {
    tracker.push({
      endpoint: mockEndpoint,
      sessionId:  mockSessionId,
      sendCaughtExceptions: true,
      attachClientContext: false,
    })
    const mockError = Error(mockData2)

    window.onerror(mockData1, mockEndpoint, 1, 1, mockError)

    assert.isTrue(onerrorSpy.calledWith(mockData1, mockEndpoint, 1, 1, mockError))
    assert.isTrue(mockRequest.open.calledOnce)
    assert.isTrue(mockRequest.send.calledOnce)
    assertSentRequest(mockEndpoint, {
      type: 'exception',
      level: 'error',
      exception: {
        colno: 1,
        lineno: 1,
        message: mockData1,
        stack: mockError.stack,
      },
      sessionId: mockSessionId,
    })
    done()
  })

  it('should not track exceptions if disabled', function(done) {
    tracker.push({
      endpoint: mockEndpoint,
      sessionId:  mockSessionId,
      sendCaughtExceptions: false,
      attachClientContext: false,
    })
    const mockError = Error(mockData2)

    window.onerror(mockData1, mockEndpoint, 1, 1, mockError)

    assert.isTrue(onerrorSpy.calledWith(mockData1, mockEndpoint, 1, 1, mockError))
    assert.isTrue(mockRequest.open.notCalled)
    assert.isTrue(mockRequest.send.notCalled)
    done()
  })

  it('should send client context', function(done) {
    tracker.push({
      endpoint: mockEndpoint,
      sessionId:  mockSessionId,
      attachClientContext: true,
      mockData1,
      mockData2,
    })

    assertSentRequest(mockEndpoint, {
      mockData1,
      mockData2,
      sessionId: mockSessionId,
      context: {
        platform: mockPlatform,
        url: mockHref,
        userAgent: mockUserAgent,
      },
    })
    done()
  })

  it('should send data that was pushed prior to loading tracker', function(done) {
    const initialTracker = []
    window.tracker = initialTracker

    // tracker is not yet loaded, 3 pushes: one config, 2 data
    initialTracker.push({
      endpoint: mockEndpoint,
      sessionId:  mockSessionId,
      attachClientContext: false,
    })
    initialTracker.push({ mockData1 })
    initialTracker.push({ mockData2, mockCookieValue })

    assert.isTrue(mockRequest.open.notCalled)
    assert.isTrue(mockRequest.send.notCalled)

    // let's load our tracker
    simpleTracker(window, document)

    assert.isTrue(mockRequest.open.calledTwice)
    assert.isTrue(mockRequest.send.calledTwice)

    assertSentRequest(mockEndpoint, {
      mockData1,
      sessionId: mockSessionId,
    }, 0)
    assertSentRequest(mockEndpoint, {
      mockData2,
      mockCookieValue,
      sessionId: mockSessionId,
    })
    done()
  })

  it('should log events', function(done) {
    tracker.push({
      endpoint: mockEndpoint,
      sessionId:  mockSessionId,
      attachClientContext: false,
    })
    tracker.logEvent(mockData1)

    assertSentRequest(mockEndpoint, {
      type: 'event',
      event: mockData1,
      sessionId: mockSessionId,
    })
    done()
  })

  it('should log message', function(done) {
    tracker.push({
      endpoint: mockEndpoint,
      sessionId:  mockSessionId,
      attachClientContext: false,
    })
    const level = 'info'
    tracker.logMessage(mockData1, level)

    assertSentRequest(mockEndpoint, {
      level,
      type: 'message',
      message: mockData1,
      sessionId: mockSessionId,
    })
    done()
  })

  it('should log metric', function(done) {
    tracker.push({
      endpoint: mockEndpoint,
      sessionId:  mockSessionId,
      attachClientContext: false,
    })
    tracker.logMetric(mockData1, mockData2)

    assertSentRequest(mockEndpoint, {
      type: 'metric',
      metric: mockData1,
      value: mockData2,
      sessionId: mockSessionId,
    })
    done()
  })

  it('should log timing metric', function(done) {
    const perfStub = window.performance.now
    perfStub.onCall(0).returns(1000.000005)
    perfStub.onCall(1).returns(5000.700001)

    tracker.push({
      endpoint: mockEndpoint,
      sessionId:  mockSessionId,
      attachClientContext: false,
    })
    tracker.startTimer(mockData1)
    tracker.stopTimer(mockData1)

    assertSentRequest(mockEndpoint, {
      type: 'metric',
      metric: mockData1,
      value: 4001,
      sessionId: mockSessionId,
    })
    done()
  })

  it('should persist singleton tracker across multiple loads', function(done) {
    // 1st load
    tracker.push({
      endpoint: mockEndpoint,
      sessionId:  mockSessionId,
      attachClientContext: false,
    })

    tracker.push({ mockData1 })

    assert.isTrue(mockRequest.open.calledOnce)
    assert.isTrue(mockRequest.send.calledOnce)
    assertSentRequest(mockEndpoint, {
      sessionId: mockSessionId,
      mockData1,
    })

    // second load, same window obj
    simpleTracker(window, document)
    tracker.push({ mockData2 })

    assert.isTrue(mockRequest.open.calledTwice)
    assert.isTrue(mockRequest.send.calledTwice)
    assertSentRequest(mockEndpoint, {
      sessionId: mockSessionId,
      mockData2,
    })

    done()
  })

  it('dont send request out in devMode', function(done) {
    tracker.push({
      endpoint: mockEndpoint,
      sessionId:  mockSessionId,
      devMode: true,
    })

    tracker.push({ mockData1 })

    assert.isTrue(mockRequest.open.notCalled)
    assert.isTrue(mockRequest.send.notCalled)

    done()
  })

})
