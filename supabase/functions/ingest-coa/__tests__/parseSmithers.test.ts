import { assertEquals, assertNotStrictEquals } from 'jsr:@std/assert@^1';

import { dominantTerpene } from '../../_shared/coa/normalize.ts';
import type { CoaResult } from '../../_shared/coa/types.ts';
import { ingestCoa } from '../index.ts';

// Every expected value below was executed by the architect against the
// operator's real Smithers documents before this file existed
// (documentation/design/smithers-parser.md, D161). Nothing is predicted.

const BLUE_RASPBERRY = new URL(
  '../../_shared/coa/__fixtures__/blue-raspberry.pdf',
  import.meta.url,
);
const AMNESIA_HAZE = new URL(
  '../../_shared/coa/__fixtures__/amnesia-haze.pdf',
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

Deno.test('blue-raspberry.pdf: parses and returns 200', async () => {
  const coa = await ingestFixture(BLUE_RASPBERRY);
  assertEquals(coa.sourceLab, 'smithers');
  assertEquals(coa.totalThcPct, 86.096);
  assertEquals(coa.totalCbdPct, 0.17904);
  assertEquals(coa.totalTerpenesPct, 1.523);
  assertEquals(coa.batch, '002-D08');
  assertEquals(coa.sampledDate, '2025-10-20');
  assertEquals(coa.testedDate, '2025-10-28');
});

Deno.test('blue-raspberry.pdf: strain is the printed product title, verbatim (D161a)', async () => {
  const coa = await ingestFixture(BLUE_RASPBERRY);
  assertEquals(coa.strain, 'Blue Raspberry 2g Vape AIO');
});

Deno.test('blue-raspberry.pdf: all nine printed detections captured', async () => {
  const coa = await ingestFixture(BLUE_RASPBERRY);
  assertEquals(coa.terpenes.filter((t) => t.pct !== null).length, 9);
  assertEquals(dominantTerpene(coa.terpenes), 'Limonene');
  assertEquals(coa.terpenes.find((t) => t.name === 'Sabinene')?.pct, 0.2867);
});

Deno.test('amnesia-haze.pdf: parses and returns 200', async () => {
  const coa = await ingestFixture(AMNESIA_HAZE);
  assertEquals(coa.sourceLab, 'smithers');
  assertEquals(coa.totalThcPct, 76.6);
  assertEquals(coa.totalTerpenesPct, 3.597);
  assertEquals(coa.batch, '006-084');
  assertEquals(dominantTerpene(coa.terpenes), 'Terpinolene');
});

Deno.test('amnesia-haze.pdf: same-canonical isomer rows sum within the document (D161b)', async () => {
  const coa = await ingestFixture(AMNESIA_HAZE);
  // cis-Ocimene 0.0166 + trans-b-Ocimene 0.1182, both printed rows.
  assertEquals(coa.terpenes.find((t) => t.name === 'Ocimene')?.pct, 0.1348);
});

Deno.test('amnesia-haze.pdf: trans-Caryophyllene reaches canonical Caryophyllene (D161c)', async () => {
  const coa = await ingestFixture(AMNESIA_HAZE);
  assertEquals(coa.terpenes.find((t) => t.name === 'Caryophyllene')?.pct, 0.4512);
});

Deno.test('amnesia-haze.pdf: Limonene is <LOQ and stays null, never 0', async () => {
  const coa = await ingestFixture(AMNESIA_HAZE);
  const limonene = coa.terpenes.find((t) => t.name === 'Limonene');
  assertEquals(limonene?.name, 'Limonene');
  // D2: a fabricated zero would corrupt the one signal the product predicts on.
  assertEquals(limonene!.pct, null);
  assertNotStrictEquals(limonene!.pct as unknown, 0);
});
