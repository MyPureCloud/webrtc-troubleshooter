# webrtc-troubleshooter

[![Build Status](https://travis-ci.org/MyPureCloud/webrtc-troubleshooter.svg?branch=master)](https://travis-ci.org/MyPureCloud/webrtc-troubleshooter)
[![Coverage Status](https://coveralls.io/repos/github/MyPureCloud/webrtc-troubleshooter/badge.svg?branch=master)](https://coveralls.io/github/MyPureCloud/webrtc-troubleshooter?branch=master)


# Develop

* `git clone` this repository
* `npm install`
* Serve with your favorite [stupid server](https://www.npmjs.com/package/stupid-server)
* `npm test`

# Scripts 

* `FILE=advanced-camera-test.js npm run unit-test-file` to run a single test file
  * Alternatively run `./node_modules/.bin/ava test/unit/advanced-camera-test.js` for an individual test
* `npm run coverage` runs the code coverage report
  * `npm test` will run both lint and all the unit-test and report coverage in text form in command line

# Test Page

test-page/index.html
for console output of 6 tests to ensure webrtc is properly functioning
