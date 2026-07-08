/**
 * Jest config for the pure ingestion core (src/ingestion).
 *
 * Uses ts-jest in a plain Node (CommonJS) environment -- these are node-side
 * PDF parsing tests, not React Native component tests, so we deliberately do
 * not use jest-expo here. unpdf resolves to its CommonJS build under require().
 */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src/ingestion'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
  },
};
