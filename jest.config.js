/**
 * Jest config for the pure COA ingestion core
 * (supabase/functions/_shared/coa).
 *
 * Uses ts-jest in a plain Node (CommonJS) environment -- these are node-side
 * PDF parsing tests, not React Native component tests, so we deliberately do
 * not use jest-expo here. unpdf resolves to its CommonJS build under require().
 *
 * The source carries explicit `.ts` extensions on relative imports because
 * `supabase functions deploy` (Deno) cannot resolve extensionless specifiers.
 * Node's CommonJS resolver cannot resolve them either, so moduleNameMapper
 * strips the extension back off for Jest.
 */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/supabase/functions/_shared/coa'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.ts$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
  },
};
