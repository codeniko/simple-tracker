Simple Tracker
===============
[![NPM version](https://img.shields.io/npm/v/simple-tracker.svg)](https://npmjs.org/package/simple-tracker)
[![Build Status](https://travis-ci.com/codeniko/simple-tracker.svg?branch=master)](https://travis-ci.com/codeniko/simple-tracker)
[![codecov](https://codecov.io/gh/codeniko/simple-tracker/branch/master/graph/badge.svg)](https://codecov.io/gh/codeniko/simple-tracker)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/codeniko/simple-tracker/blob/master/LICENSE)

Easy javascript tracking library to log events, metrics, errors, and messages

You can use Simple Tracker one of two ways. You can install through [npm and use it as a module](#installation-through-npm-as-module), or you can [include the uglified script file in your HTML page](#installation-in-html).

Inspiration
------------
If you run an adblocker or a trackerblocker plugin in your browser, page requests to google analytics and other well known tracking libraries get blocked causing you to lose valuable metrics/logs from your websites. To circumvent these blockers, you'd have to write some javascript on your pages to send tracking data to an endpoint that won't be blocked and configure a server or cloud function to proxy this data to a service of your choice. Simple Tracker is the first piece to that solution. It's a light-weight client library that makes sending tracking data simple.

If you're looking to connect your tracking data sent from Simple Tracker to a cloud function, [check out this project that uses AWS Lambda](https://github.com/codeniko/log.nfeld.com/blob/master/src/track.js) to proxy data to a free log management service called [Loggly](https://www.loggly.com/).


Installation through NPM as module
------------
In command line, run:
```sh
npm install simple-tracker
```
In code:
```javascript
import tracker from 'simple-tracker' // or const tracker = require('simple-tracker')

// initialize tracker endpoint and settings
tracker.push({
  endpoint: '/my/tracker/server/endpoint', // Endpoint to send tracking data to
  attachClientContext: true, // Attach various client context, such as useragent, platform, and page url
});
```

You only need to initialize endpoint and settings as above once. After initializing, simply import `tracker` in other modules or components:
```javascript
import tracker from 'simple-tracker' // or const tracker = require('simple-tracker')

tracker.push({ event: 'pageview' })
```


Installation in HTML
------------
Place the following on your page
```html
<script type="text/javascript" src="https://codeniko.github.io/simple-tracker/dist/simple-tracker.min.js"></script>
<script>
  // initialize tracker endpoint and settings
  tracker.push({
    endpoint: '/my/tracker/server/endpoint', // Endpoint to send tracking data to
    attachClientContext: true, // Attach various client context, such as useragent, platform, and page url
  });
</script>
```

Here is a live example page: [https://codeniko.github.io/simple-tracker/examplepage.html](https://codeniko.github.io/simple-tracker/examplepage.html)

Quick Usage
-----
Logging text:
```javascript
tracker.push('some text to track');
```

Logging JSON:
```javascript
tracker.push({
  message: 'my tracking string',
  values: [1, 2, 3, 'a', 'b', 'c']
});
```

This will send a POST request containing a sessionId, and client context if enabled (enabled by default). An example request payload:
```json
{
  "sessionId": "11bf5b37-e0b8-42e0-8dcf-dc8c4aefc000",
  "message": "my tracking string",
  "values": [1, 2, 3, "a", "b", "c"],
  "context": {
    "url": "https://nfeld.com/",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36",
    "platform": "MacIntel"
  }
}
```

There are also several helper methods defined to push common tracking data such as `tracker.logEvent(event)`, `tracker.logMessage('message')`, and `tracker.logMetric('metric', 'value')`. [You can find examples of these and more below.](#examples)

Session Id
-----
Simple Tracker makes use of cookies to persist the sessionId that accompanies all tracking data. If the sessionId is not explicitly set in [configuration](#all-configurations), one will be generated as a UUIDv4 string. Regardless if explicitly set or generated, the sessionId will be stored in a cookie named `trcksesh` and will be destroyed when session ends (browser closes)

All Configurations
-----
```javascript
tracker.push({
  endpoint: '/ENDPOINT', // Endpoint to send tracking data to
  sessionId: 'SESSION_ID', // Explicitly set a session id
  sendCaughtExceptions: true/false, // Send exceptions caught by browser. DEFAULT: false
  attachClientContext: true/false, // Attach various client context, such as useragent, platform, and page url. DEFAULT: true
  devMode: true/false // Toggle dev mode. If enabled, outgoing requests are blocked and logged for debugging instead. DEFAULT: false
});
```

Examples
-----
`logEvent(event)`: Log an event that occurred
```javascript
tracker.logEvent('contact_form_submitted');

// Request: POST /endpoint
{
  "type": "event",
  "event": "contact_form_submitted",
  "sessionId": "11bf5b37-e0b8-42e0-8dcf-dc8c4aefc000"
}
```

`logMessage(message, optionalLevel)`: Log simple message, with optional level as second argument
```javascript
tracker.logMessage('some message', 'info');

// Request: POST /endpoint
{
  "type": "message",
  "message": "some message",
  "level": "info",
  "sessionId": "11bf5b37-e0b8-42e0-8dcf-dc8c4aefc000"
}
```

`logException(exceptionObject)`: Log exceptional error. Can pass an exception object, or other value
```javascript
tracker.logException(new Error('some exception').stack);

// Request: POST /endpoint
{
  "type": "exception",
  "level": "error",
  "exception": "Error: some exception at <anonymous>:1:1",
  "sessionId": "11bf5b37-e0b8-42e0-8dcf-dc8c4aefc000"
}
```

`logMetric(metricKey, metricValue)`: Log a metric and its value
```javascript
tracker.logMetric('page_load_time', 254);

// Request: POST /endpoint
{
  "type": "metric",
  "metric": "page_load_time",
  "value": 254,
  "sessionId": "11bf5b37-e0b8-42e0-8dcf-dc8c4aefc000"
}
```

Start/stop a timer to record a metric  
`startTimer(metricKey)`: Start a timer named by metricKey  
`stopTimer(metricKey, metricValue)`: Stop timer named metricKey and log result in millis as metric value
```javascript
tracker.startTimer('page_load_time');
// wait 1 second
tracker.stopTimer('page_load_time');

// Request: POST /endpoint
{
  "type": "metric",
  "metric": "page_load_time",
  "value": 1000,
  "sessionId": "11bf5b37-e0b8-42e0-8dcf-dc8c4aefc000"
}
```

`push(dataObject)`: Push any data of your choice
```javascript
tracker.push({
  message: 'my tracking string',
  values: [1, 2, 3, 'a', 'b', 'c'],
  customContext: {
    screenWidth: window.screen.width,
    url: window.location.href,
    userAgent: window.navigator.userAgent || null,
    platform: window.navigator.platform || null
  }
});

// Request: POST /endpoint
{
  "message": "my tracking string",
  "values": [1, 2, 3, "a", "b", "c"],
  "customContext": {
    "screenWidth": 1440,
    "url": "https://nfeld.com/",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36",
    "platform": "MacIntel"
  },
  "sessionId": "11bf5b37-e0b8-42e0-8dcf-dc8c4aefc000"
}
```

Bugs, feature requests, & contributing
-----
If you found a bug or want to request a feature, [create a new issue](https://github.com/codeniko/simple-tracker/issues). Contributions via pull requests are more than welcome :)

Running unit tests and code coverage
----------
```sh
npm test
```
