simple-tracker
===============
A simple javascript client side tracker to log events and errors

You can install the package one of two ways. You can install through npm and use it as a module, or you can include the script file in your HTML page. Scroll down to see exact usages for both.

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
  endpoint: '/my/tracker/server/endpoint'
  sendConsoleErrors: true,
  attachClientContext: true,
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
    endpoint: '/my/tracker/server/endpoint'
    sendConsoleErrors: true,
    attachClientContext: true,
  });
</script>
```

General Usage
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
  context = {
    url: window.location.href,
    userAgent: window.navigator.userAgent || null,
    platform: window.navigator.platform || null
  }
});
```

Development
----------
You can build minified js file and its associated map file by running below commands. Files will be generated inside `/dist` dir.
```sh
npm install
grunt
```

Running unit tests
----------
```sh
npm run test
```
