Server examples using AWS Lambda
===============

Here you'll find a project that includes two AWS Lambda functions. One is used to proxy pageviews to google analytics incase google analytics is blocked on the client side. Another is used to proxy arbitrary tracking data to a log management service I found called [Loggly](https://www.loggly.com/). These are fully functional AWS Lambda examples and I currently use these for my own websites.

Project details
---------
This project uses a service called [Netlify](https://www.netlify.com/) to continously deploy the AWS Lambda functions. Underlying, Netlify uses AWS Lambda and you can use the example lambda function code interchangeably between Netlify and AWS. What's nice about Netlify is it's easier to setup than AWS and builds/deploys your lambda functions as you make commits and push to your repository.


Proxying to Google Analytics
---------
This was the main reason I created [simple-tracker](https://github.com/codeniko/simple-tracker). If a user has an adblocker, google analytics is usually blocked and you lose metrics, including pageviews. This means that the data google analytics tool shows to you is underreported. You're getting more traffic than you think you do because [~40% of users use an adblocker](https://marketingland.com/survey-shows-us-ad-blocking-usage-40-percent-laptops-15-percent-mobile-216324), including myself. 

The example lambda function is [aws-lambda/google-analytics.js](aws-lambda/google-analytics.js). Edit the function and add your own domains the whitelist for CORS (needed for POST requests depending on how you choose to host these functions.)


Proxying to a log management service (Loggly in this case)
---------
Log management is useful to debug issues in production. During development, everything may look fine to you, but your page is probably exploding somewhere out in the world if you never had logs. There are a multitude amount of various browsers across different platforms and browser versions with varying support for features that make development for all of them difficult. You will write webpages that can have bugs for some browsers, but hopefully you'll catch them. You'll also be surprised when you see how many people are still using old and unsupported browsers/versions that may not support some features you're dependent on.

The example lambda function for this is [aws-lambda/track.js](aws-lambda/track.js). In it, you'll see I'm proxying to a free log management service called [Loggly](https://www.loggly.com). Loggly is similar to splunk, but you may choose to change this to whatever service you want. Basically, use simple-tracker to send any and all useful data to this proxy like pageviews, events, errors, and other messages to help you debug things in production. Sign up at Loggly, and edit the function to put in your Loggly Key. Don't forget to whitelist your domains in there for CORS.


Development setup
---------
If you want to modify these examples, you can test your code locally.

First install the dependencies and then run them
```shell
npm install
npm run serve
```

This will serve your lambda functions. You can find each at  
`http://localhost:9000/google-analytics`  
`http://localhost:9000/track`

Use simple-tracker to point to either of those endpoints and test away. Depending on where you send your requests from, you may need to modify the lambda functions to allow all cross origin request using`'*'`. You'll see a comment in the code for this.

Assuming you continue to use netlify, your endpoint paths in production will be `/.netlify/functions/track` and `/.netlify/functions/google-analytics`
