const request = require('request')

const LOGGLY_KEY = '' // replace with your loggly key
const TAG = 'simple-track' // can replace with a tag of your choice
const ENDPOINT = `http://logs-01.loggly.com/inputs/${LOGGLY_KEY}/tag/${TAG}/`

// Domains to whitelist. Replace with your own!
const originWhitelist = [] // keep this empty and append domains to whitelist using whiteListDomain()
whitelistDomain('test.com')
whitelistDomain('nfeld.com')


function whitelistDomain(domain, addWww = true) {
  const prefixes = [
    'https://',
    'http://',
  ]
  if (addWww) {
    prefixes.push('https://www.')
    prefixes.push('http://www.')
  }
  prefixes.forEach(prefix => originWhitelist.push(prefix + domain))
}


function track(event, done) {
  // event.queryStringParameters for querystring params already parsed into object
  const trackerData = JSON.parse(event.body) // data from simple-tracker request
  const headers = event.headers || {}
  const ip = headers['x-forwarded-for'] || headers['x-bb-ip'] || '' // ip address of user incase you want to append to trackerData. I do it below.

  console.info('tracker payload:', event.body)
  console.info('ip:', ip)

  // attach ip to context
  if (trackerData && trackerData.context) {
    trackerData.context.ip = ip
  }

  const reqOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    json: true,
    url: ENDPOINT,
    body: trackerData,
  }

  request(reqOptions, (error, result) => {
    if (error) {
      console.info('loggly error!', error)
    } else {
      console.info('result from loggly:', result.statusCode, result.statusMessage)
    }
  })

  done()
}


exports.handler = function(event, context, callback) {
  const origin = event.headers['origin'] || event.headers['Origin'] || ''
  console.log(`Received ${event.httpMethod} request from, origin: ${origin}`)

  const isOriginWhitelisted = originWhitelist.indexOf(origin) >= 0
  console.info('is whitelisted?', isOriginWhitelisted)

  const headers = {
    //'Access-Control-Allow-Origin': '*', // allow all domains to POST. Use for localhost development only
    'Access-Control-Allow-Origin': isOriginWhitelisted ? origin : originWhitelist[0],
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Accept',
  }

  const done = () => {
    callback(null, {
      statusCode: 200,
      headers,
      body: '',
    })
  }

  if (event.httpMethod === 'OPTIONS') { // CORS (required if you use a different subdomain to host this function, or a different domain entirely)
    done()
  } else if (event.httpMethod !== 'POST' || !isOriginWhitelisted) { // allow POST request from whitelisted domains
    callback('Not found')
  } else {
    track(event, done)
  }
}
