/**
 * Jest config for the pure COA ingestion core
 * (supabase/functions/_shared/coa) and the pure Insights aggregation
 * library (src/lib/insights).
 *
 * Uses ts-jest in a plain Node (CommonJS) environment -- these are node-side
 * pure-logic tests, not React Native component tests, so we deliberately do
 * not use jest-expo here. unpdf resolves to its CommonJS build under require().
 *
 * src/lib/insights is discoverable on the same terms as the parser tree:
 * pure TypeScript only, no React Native or Expo imports anywhere in its
 * dependency graph (lexicon.ts qualifies). Component tests remain
 * impossible under this config by design -- see CLAUDE.md [ADAPT] item 1.
 *
 * The parser source carries explicit `.ts` extensions on relative imports
 * because `supabase functions deploy` (Deno) cannot resolve extensionless
 * specifiers. Node's CommonJS resolver cannot resolve them either, so
 * moduleNameMapper strips the extension back off for Jest.
 */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/supabase/functions/_shared/coa', '<rootDir>/src/lib/insights'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.ts$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
  },
};
