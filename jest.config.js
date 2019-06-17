module.exports = {
  roots: [
    '<rootDir>/src',
    '<rootDir>/test'
  ],
  testMatch: [
    '<rootDir>/test/**/*test.(ts|js)'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/test/helpers/*'
  ],
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.tsx?$': 'ts-jest'
  },
  setupFilesAfterEnv: [
    '<rootDir>/test/helpers/setup-browser-env.js'
  ]
};
