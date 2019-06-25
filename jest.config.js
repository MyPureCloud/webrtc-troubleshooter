module.exports = {
  roots: [
    '<rootDir>/src',
    '<rootDir>/test'
  ],
  testMatch: [
    '<rootDir>/test/**/*.spec.(ts|js)'
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
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/types/**'
  ],
  coverageReporters: [
    'lcov', 'text'
  ],
  coverageDirectory: './coverage'
};
