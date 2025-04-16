# API Routes Testing

This directory contains tests for the server API routes. The tests use Jest as the testing framework along with Supertest for API endpoint testing.

## Test Structure

- `routes/`: Tests for API routes
  - `auth.test.js`: Tests for authentication routes
  - `tweets.test.js`: Tests for tweet routes
- `middlewares/`: Tests for middleware functions
  - `auth.test.js`: Tests for authentication middleware
- `utils/`: Helper utilities for testing
  - `testUtils.js`: Common utility functions for testing

## Running Tests

To run all tests:

```bash
npm test
```

To run specific test files:

```bash
npm test -- routes/auth.test.js
npm test -- routes/tweets.test.js
```

To run tests with coverage:

```bash
npm test -- --coverage
```

## Test Strategy

The tests follow these principles:

1. **Unit Testing**: Testing individual components in isolation
2. **Mocking**: Using Jest mocks to isolate the code being tested
3. **Clean Before Each Test**: Resetting mocks before each test
4. **Complete Coverage**: Testing both success and failure paths

## Adding New Tests

When adding new route tests:

1. Create a new test file in the appropriate directory
2. Import necessary modules and mock dependencies
3. Set up the test app with Express
4. Write tests for each endpoint with both success and failure scenarios

## Mock Implementation

Tests use the following mocking strategies:

- **Controllers**: Mocked to test route handling without executing controller logic
- **Middleware**: Mocked to test routes with or without authentication
- **Models**: Mocked to prevent database access during testing
- **JWT**: Mocked to test token verification without using real tokens

## Test Environment

Tests run in a Node.js environment without connecting to actual databases or services. 