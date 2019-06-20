# webrtc-troubleshooter

[![Build Status](https://travis-ci.org/MyPureCloud/webrtc-troubleshooter.svg?branch=master)](https://travis-ci.org/MyPureCloud/webrtc-troubleshooter)
[![Coverage Status](https://coveralls.io/repos/github/MyPureCloud/webrtc-troubleshooter/badge.svg?branch=master)](https://coveralls.io/github/MyPureCloud/webrtc-troubleshooter?branch=master)

This provides diagnostic tests for basic WebRTC functionality. See the [test-page](./test-page/) directory for usage. 

# Getting Started

* `git clone` this repository
* `npm install`
* Run [unit-tests](#Testing) using `npm test`
* [Develop](#Develop) against the diagnostic tests using `npm start` and navigating to [http://localhost:8080/test-page](http://localhost:8080/test-page)


# Develop

To develop diagnostic tests this repo has a utility [./test-page/index.html](./test-page/index.html) that pulls in the tests and runs them in the browser. For WebRTC connections, most of the tests force the use of `relay` since the tests make peer connections to the same host. 

* `npm start` will run webpack with the `--watch` flag and serve the test-page using stupid server. 
  * This is super helpful when you are writing new tests. You will still need to refrash the browser to pick up any new changes, but at least webpack will rebuild the app when you save a file :) 

test-page/index.html
for console output of 6 tests to ensure webrtc is properly functioning

Here is a stringified version of google's STUN servers for quick reference. Granted, you will still need an active TURN server for some of these tests to pass, but this will get the tests started. 

```
[{"type":"stun","urls":"stun:stun.l.google.com:19302"}]
```

# Testing
The tests now use [Jest](https://jestjs.io/)!

> Test names must match the `*.spec.ts` or `*.spec.js` naming convention. This is configured in [jest.config.js](./jest.config.js)

* `npm test` will run both linting, all the unit-test, and report coverage in text form in the command line.
* `npm run test:watch` will run only the unit-tests and watch the files for changes. 
* `npm run coverage` runs the code coverage report
