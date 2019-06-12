module.exports = {
  roots: [
    "src",
    "test",
  ],
  testPathIgnorePatterns: [
    "test/helpers/*"
  ],
  transform: {
    "^.+\\.jsx?$": "babel-jest",
    "^.+\\.tsx?$": "ts-jest"
  },
  setupFilesAfterEnv: [
    "<rootDir>/test/helpers/setup-browser-env.js",
  ],
}
