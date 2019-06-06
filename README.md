# webrtc-troubleshooter

[![Build Status](https://travis-ci.org/MyPureCloud/webrtc-troubleshooter.svg?branch=master)](https://travis-ci.org/MyPureCloud/webrtc-troubleshooter)
[![Coverage Status](https://coveralls.io/repos/github/MyPureCloud/webrtc-troubleshooter/badge.svg?branch=master)](https://coveralls.io/github/MyPureCloud/webrtc-troubleshooter?branch=master)


# Develop

* `git clone` this repository
* `npm install`
* Serve with your favorite [stupid server](https://www.npmjs.com/package/stupid-server)
* `npm test`

# Scripts 

* Useful for running individual test files ~~`FILE=advanced-camera-test.js npm run unit-test-file` to run a single test file~~
  * Personal favorite is with `watch` enabled: `npx ava --watch --fail-fast=false test/unit/video-bandwidth-test.js`
  * Alternatively run `./node_modules/.bin/ava test/unit/advanced-camera-test.js` for an individual test
* `npm run coverage` runs the code coverage report
  * `npm test` will run both lint and all the unit-test and report coverage in text form in command line
* `npm start` will run webpack with the `--watch` flag and serve the test-page using stupid server. 
  * This is super helpful when you are writing new tests. You will still need to refrash the browser to pick up any new changes, but at least webpack will rebuild the app when you save a file :) 

# Test Page

test-page/index.html
for console output of 6 tests to ensure webrtc is properly functioning

Here is a stringified version of google's STUN servers for quick reference: 

```
[{"type":"stun","urls":"stun:stun.l.google.com:19302"}]
```
