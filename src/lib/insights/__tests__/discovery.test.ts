/**
 * Discovery canary for the src/lib/insights Jest root.
 *
 * This file exists so the wiring itself is falsifiable: it passes only if
 * (1) jest.config.js roots discovers tests under src/lib/insights, and
 * (2) ts-jest under tsconfig.jest.json can compile a cross-directory
 * relative import of the pure lexicon module. If either regresses, the
 * suite count drops and this file names the wiring, not a library bug.
 * Before this root existed, a test placed here was silently never run
 * (observed: 136 tests / 1 suite with this file absent from discovery).
 */
import { RUNGS } from '../../lexicon';

describe('insights jest root discovery', () => {
  it('runs tests under src/lib/insights and resolves ../../lexicon', () => {
    expect(RUNGS[0]).toEqual({ word: 'Loved', score: 5 });
    expect(RUNGS).toHaveLength(5);
  });
});
