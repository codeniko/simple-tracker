Simple Tracker
===============
A simple javascript client side tracker to send tracking data, including events, logs, and errors.

You can use Simple Tracker one of two ways. You can install through [npm and use it as a module](##installation-through-npm-as-module), or you can [include the uglified script file in your HTML page](#installation-in-html).

Inspiration
------------
If you run an adblocker or a trackerblocker plugin in your browser, page requests to google analytics and other well known tracking libraries get blocked causing you to lose valuable metrics/logs from your websites. To solve this issue, you would have to write some javascript on the page to instead send this tracking data to an endpoint that won't be blocked by an adblocker, and then configure a server or cloud function to proxy this data to the service of your choice. Simple Tracker is the first piece to that solution. It's a small client that easily sends your tracking data to a configured endpoint.

The idea here is adblockers cannot block API requests to endpoints on your own domain since this can potentially cause bad experiences on all websites. Configure Simple Tracker to send tracking data to an API endpoint on your domain.


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
  endpoint: '/my/tracker/server/endpoint', // tracker endpoint to send requests to
  sendCaughtExceptions: true, // send exceptions caught by browser
  attachClientContext: true, // attach various client context, such as useragent, platform, and page url
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
<script type="text/javascript" src="/dist/simple-tracker.min.js" async></script>
<script>
  var tracker = tracker || [];
  
  // initialize tracker endpoint and settings
  tracker.push({
    endpoint: '/my/tracker/server/endpoint', // tracker endpoint to send requests to
    sendCaughtExceptions: true, // send exceptions caught by browser
    attachClientContext: true, // attach various client context, such as useragent, platform, and page url
  });
</script>
```

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
  values: [1, 2, 3, 'a', 'b', 'c'],
  context: {
    url: window.location.href,
    userAgent: window.navigator.userAgent || null,
    platform: window.navigator.platform || null
  }
});
```

This will send a POST request containing a sessionId, and client context if enabled. An example request payload:
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

All Configurations
-----
```javascript
tracker.push({
  endpoint: '/ENDPOINT', // tracker endpoint to send requests to
  sendCaughtExceptions: true/false, // send exceptions caught by browser
  attachClientContext: true/false, // attach various client context, such as useragent, platform, and page url
  sessionId: 'SESSION_ID', // explicitly set a session id, rather than generating one or reading from cookie
  devMode: true/false // toggle dev mode. If enabled, outgoing requests are blocked and logged for debugging instead
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
  context: {
    url: window.location.href,
    userAgent: window.navigator.userAgent || null,
    platform: window.navigator.platform || null
  }
});

// Request: POST /endpoint
{
  "message": "my tracking string",
  "values": [1, 2, 3, "a", "b", "c"],
  "context": {
    "url": "https://nfeld.com/",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36",
    "platform": "MacIntel"
  },
  "sessionId": "11bf5b37-e0b8-42e0-8dcf-dc8c4aefc000"
}
```


Contributing
-----
You can build uglified js file and its associated map file by running below commands. Files will be generated inside `/dist` dir.
```sh
npm install
grunt
```

Running unit tests
----------
```sh
npm run test
```
