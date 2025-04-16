module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'routes/**/*.js',
    '!**/node_modules/**'
  ],
  coverageReporters: ['text', 'lcov'],
  testTimeout: 10000
}; 