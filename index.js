/*! simple-tracker | MIT *
 * https://github.com/codeniko/simple-tracker !*/

(function() {
  'use strict'

  function simpleTracker(window) {
    var SESSION_KEY = 'trcksesh'
    var SESSION_KEY_LENGTH = SESSION_KEY.length + 1
    var GET_REQUEST_DATA_KEY = 'data'
    var GET = 'GET'
    var POST = 'POST'

    var document = window.document
    var sendCaughtExceptions = false
    var attachClientContext = true
    var devMode = false
    var endpoint
    var sessionId
    var tracker
    var timer = {}
    var httpMethod = POST
    var persistingQueryParams = {} // user added query params for GET requests only

    function uuidv4(a) {
      return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,uuidv4)
    }

    // override to call own onerror function, followed by original onerror
    function setOnError(f) {
      var _onerror = window.onerror
      // msg, url, line, col, err
      window.onerror = function() {
        f.apply(tracker, arguments)
        if (typeof _onerror === 'function') {
          _onerror.apply(window, arguments)
        }
      }
    }

    function getClientContext() {
      return {
        url: window.location.href,
        userAgent: window.navigator.userAgent || null,
        platform: window.navigator.platform || null
      }
    }

    function readCookie() {
      var cookie = document.cookie
      var i = cookie.indexOf(SESSION_KEY)
      if (i >= 0) {
        var end = cookie.indexOf(';', i + 1)
        end = end < 0 ? cookie.length : end
        return cookie.slice(i + SESSION_KEY_LENGTH, end)
      }
    }

    function setCookie(value) {
      document.cookie = SESSION_KEY + '=' + value
    }

    function setSession(newSessionId) {
      sessionId = newSessionId || sessionId || readCookie() || uuidv4()
      setCookie(sessionId)
    }

    // own shallow variant of Object.assign since not all browsers support it.
    function objectAssign(dest, src) {
      for (var prop in src) {
        if (src.hasOwnProperty(prop)) {
          dest[prop] = src[prop]
        }
      }
    }

    function endpointWithQs(data) {
      var queryParams = [ GET_REQUEST_DATA_KEY+'='+encodeURIComponent(JSON.stringify(data)) ]
      // append user set query params
      for (var key in persistingQueryParams) {
        persistingQueryParams.hasOwnProperty(key) && queryParams.push(key+'='+encodeURIComponent(persistingQueryParams[key]))
      }
      return endpoint + '?' + queryParams.join('&')
    }

    function track(data) {
      if (endpoint && Object.keys(data).length > 0) {
        data.sessionId = sessionId
        if (attachClientContext) {
          data.context = tracker.clientContext
        }

        if (!devMode) {
          try {
            var isGetRequest = httpMethod === GET

            // let's not use fetch to avoid a polyfill
            var xmlHttp = new window.XMLHttpRequest()
            xmlHttp.open(httpMethod, isGetRequest ? endpointWithQs(data) : endpoint, true) // true for async
            if (isGetRequest) {
              xmlHttp.send()
            } else {
              xmlHttp.setRequestHeader('Content-Type', 'application/json')
              xmlHttp.send(JSON.stringify(data))
            }
          } catch(ex) { }
        } else {
          if (httpMethod === POST) {
            console.debug('SimpleTracker: POST ' + endpoint, data)
          } else {
            console.debug('SimpleTracker: GET ' + endpointWithQs(data))
          }
        }
      }
    }

    function SimpleTracker() {
      this.clientContext = getClientContext()
    }

    SimpleTracker.prototype = {

      // accessible to those have this tracker object so they can create their own onerror functions and still able to invoke default onerror behavior for our tracker.
      onerror: function(msg, url, line, col, err) {
        var exception = {
          message: msg,
          lineno: line,
          colno: col,
          stack: err ? err.stack : 'n/a'
        }

        this.logException(exception)
      },

      logEvent: function(event, additionalParams) {
        var data = {
          type: 'event',
          event: event
        }

        // if additional params defined, copy them over
        typeof additionalParams == 'object' && objectAssign(data, additionalParams)

        this.push(data)
      },

      logException: function(exception) {
        this.push({
          level: 'error',
          type: 'exception',
          exception: exception
        })
      },

      logMessage: function(message, level) {
        var data = {
          type: 'message',
          message: message
        }

        // add optional level if defined, not included otherwise
        if (level) {
          data.level = level
        }

        this.push(data)
      },

      logMetric: function(metric, value) {
        this.push({
          type: 'metric',
          metric: metric,
          value: value
        })
      },

      startTimer: function(metric) {
        var performance = window.performance
        if (performance.now) {
          /* istanbul ignore if */
          if (timer[metric] && devMode) {
            console.warn("Timing metric '" + metric + "' already started")
          }
          devMode && console.debug('timer started for:', metric)
          timer[metric] = performance.now()
        }
      },

      stopTimer: function(metric) {
        var performance = window.performance
        if (performance.now) {
          var stopTime = performance.now()
          var startTime = timer[metric]
          /* istanbul ignore else */
          if (startTime !== undefined) {
            var diff = Math.round(stopTime - startTime)
            timer[metric] = undefined
            devMode && console.debug('timer stopped for:', metric, 'time=' + diff)
            this.logMetric(metric, diff)
          } else {
            devMode && console.warn("Timing metric '" + metric + "' wasn't started")
          }
        }
      },

      addQueryParam: function(key, value) {
        persistingQueryParams[key] = value
      },

      push: function(data) {
        var type = typeof data

        if (type !== 'object' && type !== 'string') {
          return
        }

        if (type === 'string') {
          data = {
            text: data
          }
        } else {
          // toggle devmode, where requests wont be sent, but logged in console for debugging instead
          if (data.devMode !== undefined) {
            devMode = !!data.devMode
            delete data.devMode
          }

          if (data.attachClientContext !== undefined) {
            attachClientContext = !!data.attachClientContext
            delete data.attachClientContext
          }

          if (data.sessionId) {
            setSession(data.sessionId)
            delete data.sessionId
          }

          if (data.endpoint) {
            // other initializations should go here since endpoint is the only required property that needs to be set
            if (!sessionId) {
              setSession()
            }
            endpoint = data.endpoint
            delete data.endpoint
          }

          if (typeof data.httpMethod === 'string') {
            httpMethod = data.httpMethod.toUpperCase() === GET ? GET : POST // only support GET or POST
            delete data.httpMethod
          }

          if (data.sendCaughtExceptions !== undefined) {
            sendCaughtExceptions = !!data.sendCaughtExceptions
            if (sendCaughtExceptions) {
              setOnError(this.onerror)
            }
            delete data.sendCaughtExceptions
          }
        }

        track(data)
      }
    }

    var existingTracker = window.tracker // either instance of SimpleTracker or existing array of events to log that were added while this script was being loaded asyncronously

    if (existingTracker && existingTracker.length) {
      // move all from existing and push into our tracker object
      tracker = new SimpleTracker()
      var i = 0
      var length = existingTracker.length
      for (i = 0; i < length; i++) {
        tracker.push(existingTracker[i])
      }
    } else {
      tracker = new SimpleTracker()
    }

    window.tracker = tracker
    window.SimpleTracker = SimpleTracker
    return tracker
  }

  var isModule = typeof module !== 'undefined' && module.exports
  /* istanbul ignore else */
  if (typeof window !== 'undefined') {
    var tracker = simpleTracker(window) // sets window.tracker
    if (isModule) {
      simpleTracker.default = tracker
      module.exports = tracker
    }
  } else if (isModule) {
    // for testing
    simpleTracker.default = simpleTracker
    module.exports = simpleTracker
  } else {
    throw new Error('')
  }
})()

