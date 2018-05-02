/*!
  Copyright (c) 2018 Nikolay Feldman.
  Licensed under the MIT License (MIT), see
  https://github.com/codeniko/simple-tracker
*/

(function() {
  'use strict'

  function simpleTracker(window, document) {
    var SESSION_KEY = 'trcksesh'
    var SESSION_KEY_LENGTH = SESSION_KEY.length + 1

    function uuidv4(a) {
      return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,uuidv4)
    }

    // override to call own onerror function, followed by original onerror
    function setOnError(tracker, f) {
      var _onerror = window.onerror
      // msg, url, line, col, err
      window.onerror = function() {
        f.apply(tracker, arguments)
        if (typeof _onerror === 'function') {
          _onerror.apply(window, arguments)
        }
      }
    }

    function getClientContext(tracker) {
      // get cached context, or create one
      if (!tracker.clientContext) {
        var context = {
          url: window.location.href,
          userAgent: window.navigator.userAgent || null,
          platform: window.navigator.platform || null
        }
        tracker.clientContext = context
      }
      return tracker.clientContext
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

    function Tracker() {
      this.sendConsoleErrors = false
      this.attachClientContext = true
    }

    Tracker.prototype = {

      // accessible to those have this tracker object so they can create their own onerror functions and still able to invoke default onerror behavior for our tracker. Useful if user has another tracking library like google analytics
      onerror: function(msg, url, line, col, err) {
        var exception = {
          message: msg,
          lineno: line,
          colno: col,
          stack: err ? err.stack : 'n/a'
        }

        this.push({
          exception: exception
        })
      },

      setSession: function(sessionId) {
        this.sessionId = sessionId || this.sessionId || readCookie() || uuidv4()
        setCookie(this.sessionId)
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
          if (data.attachClientContext !== undefined) {
            this.attachClientContext = !!data.attachClientContext
            delete data.attachClientContext
          }

          if (data.sessionId) {
            this.setSession(data.sessionId)
            delete data.sessionId
          }

          if (data.endpoint) {
            // other initializations should go here since endpoint is the only required property that needs to be set
            if (!this.sessionId) {
              this.setSession()
            }
            this.endpoint = data.endpoint
            delete data.endpoint
          }

          if (data.sendConsoleErrors !== undefined) {
            var shouldSend = !!data.sendConsoleErrors
            this.sendConsoleErrors = shouldSend
            if (shouldSend) {
              setOnError(this, this.onerror)
            }
            delete data.sendConsoleErrors
          }
        }

        this.track(data)
      },

      track: function(data) {
        if (this.endpoint && Object.keys(data).length > 0) {
          data.sessionId = this.sessionId
          if (this.attachClientContext) {
            data.context = getClientContext(this)
          }

          try {
            // let's not use fetch to avoid a polyfill
            var xmlHttp = new window.XMLHttpRequest()
            xmlHttp.open('POST', this.endpoint, true) // true for async
            xmlHttp.setRequestHeader('Content-Type', 'application/json')
            xmlHttp.send(data)
          } catch(ex) {
            if (window.console && typeof window.console.log === 'function') {
              console.log('Failed to send tracking request because of this exception:\n' + ex)
              console.log('Failed tracking data:', data)
            }
          }
        }
      }
    }

    var existingTracker = window.tracker // existing array of events to log that were added while this script was being fetched
    var tracker = new Tracker()

    // move all from existing and push into our tracker object
    if (existingTracker && existingTracker.length) {
      var i = 0
      var length = existingTracker.length
      for (i = 0; i < length; i++) {
        tracker.push(existingTracker[i])
      }
    }

    window.tracker = tracker
  }


  if (typeof module !== 'undefined' && module.exports) {
    simpleTracker.default = simpleTracker
    module.exports = simpleTracker
  } else {
    simpleTracker(window, window.document)
  }
})()

