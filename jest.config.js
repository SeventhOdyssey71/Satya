module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/integrations'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'integrations/**/*.ts',
    '!integrations/**/*.test.ts',
    '!integrations/**/index.ts',
    '!integrations/**/*.config.ts',
    '!integrations/**/types.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  testTimeout: 10000,
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true
      }
    }]
  }
};