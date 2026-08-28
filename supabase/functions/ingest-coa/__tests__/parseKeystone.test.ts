import { assertEquals, assertNotStrictEquals } from 'jsr:@std/assert@^1';

import { dominantTerpene } from '../../_shared/coa/normalize.ts';
import type { CoaResult } from '../../_shared/coa/types.ts';
import { ingestCoa } from '../index.ts';

// Every expected value below was executed by the architect against the
// operator's real Keystone documents through the full ingestCoa path
// before this file existed (documentation/design/keystone-parser.md,
// D162). Nothing is predicted.

const ACAPULCO_GOLD = new URL(
  '../../_shared/coa/__fixtures__/acapulco-gold.pdf',
  import.meta.url,
);
const ALL_GAS_PREROLL = new URL(
  '../../_shared/coa/__fixtures__/all-gas-preroll.pdf',
  import.meta.url,
);
const COCONUT_CREAM = new URL(
  '../../_shared/coa/__fixtures__/coconut-cream.pdf',
  import.meta.url,
);

function pdfRequest(body: BodyInit): Request {
  return new Request('http://localhost/ingest-coa', {
    method: 'POST',
    headers: { 'content-type': 'application/pdf' },
    body,
  });
}

async function ingestFixture(fixture: URL): Promise<CoaResult> {
  const res = await ingestCoa(pdfRequest(await Deno.readFile(fixture)));
  assertEquals(res.status, 200);
  const { data } = (await res.json()) as { data: CoaResult };
  return data;
}

Deno.test('acapulco-gold.pdf: parses and returns 200', async () => {
  const coa = await ingestFixture(ACAPULCO_GOLD);
  assertEquals(coa.sourceLab, 'keystone');
  assertEquals(coa.totalThcPct, 20.98);
  assertEquals(coa.totalCbdPct, 0.05767);
  assertEquals(coa.totalTerpenesPct, 0.42);
  assertEquals(coa.batch, 'DP121815');
  assertEquals(coa.sampledDate, '2025-04-28');
  assertEquals(coa.testedDate, '2025-05-06');
});

Deno.test('acapulco-gold.pdf: strain is the printed product title, verbatim (D162c)', async () => {
  const coa = await ingestFixture(ACAPULCO_GOLD);
  assertEquals(coa.strain, 'Acapulco Gold 1/4 Oz Pouch');
});

Deno.test('acapulco-gold.pdf: CAS-fused terpene rows split by constant (D162a)', async () => {
  const coa = await ingestFixture(ACAPULCO_GOLD);
  assertEquals(coa.terpenes.filter((t) => t.pct !== null).length, 2);
  assertEquals(dominantTerpene(coa.terpenes), 'Myrcene');
  // "0.2199123-35-3" has two valid regex splits; the CAS constant settles it.
  assertEquals(coa.terpenes.find((t) => t.name === 'Myrcene')?.pct, 0.2199);
  assertEquals(coa.terpenes.find((t) => t.name === 'alpha-Pinene')?.pct, 0.2004);
  assertEquals(coa.cannabinoids.find((c) => c.name === 'THCa')?.pct, 22.32);
});

Deno.test('acapulco-gold.pdf: flower safety headers, seven Pass (D162e)', async () => {
  const coa = await ingestFixture(ACAPULCO_GOLD);
  assertEquals(coa.safety.length, 7);
  assertEquals(coa.safety.every((s) => s.status === 'Pass'), true);
  assertEquals(coa.safety[1].category, 'Moisture by Analyzer');
});

Deno.test('all-gas-preroll.pdf: printed zero total stays 0; every analyte null, never 0 (D162b)', async () => {
  const coa = await ingestFixture(ALL_GAS_PREROLL);
  assertEquals(coa.sourceLab, 'keystone');
  assertEquals(coa.totalThcPct, 24.25);
  assertEquals(coa.batch, 'AG081009PR');
  // The document PRINTS "0.000 %": a lab-stated zero, stored as 0 -- while
  // the 20 ND analyte rows stay null. Neither direction fabricates (D2).
  assertEquals(coa.totalTerpenesPct, 0);
  assertEquals(coa.terpenes.length, 20);
  assertEquals(coa.terpenes.every((t) => t.pct === null), true);
  assertNotStrictEquals(coa.terpenes[0].pct as unknown, 0);
  assertEquals(dominantTerpene(coa.terpenes), null);
});

Deno.test('all-gas-preroll.pdf: variant safety headers captured (D162e)', async () => {
  const coa = await ingestFixture(ALL_GAS_PREROLL);
  assertEquals(coa.safety.length, 7);
  assertEquals(coa.safety[1].category, 'Moisture LWG');
  assertEquals(coa.safety[2].category, 'Water Activity');
});

Deno.test('coconut-cream.pdf: infused preroll -- solvents present, foreign matter absent', async () => {
  const coa = await ingestFixture(COCONUT_CREAM);
  assertEquals(coa.sourceLab, 'keystone');
  assertEquals(coa.totalThcPct, 47.83);
  assertEquals(coa.totalTerpenesPct, 1.22);
  assertEquals(coa.terpenes.filter((t) => t.pct !== null).length, 4);
  assertEquals(dominantTerpene(coa.terpenes), 'Caryophyllene');
  assertEquals(coa.terpenes.find((t) => t.name === 'Caryophyllene')?.pct, 0.6704);
  assertEquals(coa.safety.length, 7);
  assertEquals(coa.safety.some((s) => s.category === 'Residual Solvents by HS-GC-MS'), true);
  // The document prints no Foreign Matter section; absent stays absent (D162e).
  assertEquals(coa.safety.some((s) => s.category === 'Foreign Matter by Microscopy'), false);
});
