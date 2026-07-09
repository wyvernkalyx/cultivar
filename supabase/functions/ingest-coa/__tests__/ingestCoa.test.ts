import { assertEquals, assertNotStrictEquals } from 'jsr:@std/assert@^1';

import { dominantTerpene } from '../../_shared/coa/normalize.ts';
import type { CoaResult } from '../../_shared/coa/types.ts';
import { ingestCoa } from '../index.ts';

// `ingestCoa` is imported directly rather than through the default export,
// which is wrapped in withSupabase({ auth: 'user' }) and would demand a JWT.

const FIXTURE = new URL(
  '../../_shared/coa/__fixtures__/animal-face.pdf',
  import.meta.url,
);

function pdfRequest(body: BodyInit): Request {
  return new Request('http://localhost/ingest-coa', {
    method: 'POST',
    headers: { 'content-type': 'application/pdf' },
    body,
  });
}

async function ingestFixture(): Promise<CoaResult> {
  const res = await ingestCoa(pdfRequest(await Deno.readFile(FIXTURE)));
  assertEquals(res.status, 200);
  const { data } = (await res.json()) as { data: CoaResult };
  return data;
}

Deno.test('animal-face.pdf: parses and returns 200', async () => {
  const coa = await ingestFixture();
  assertEquals(coa.sourceLab, 'drs-confident');
  assertEquals(coa.totalThcPct, 32.69);
  assertEquals(coa.batch, 'ANFA-003-FL8');
  assertEquals(dominantTerpene(coa.terpenes), 'Myrcene');
});

Deno.test('animal-face.pdf: Limonene is ND and stays null, never 0', async () => {
  const coa = await ingestFixture();
  const limonene = coa.terpenes.find((t) => t.name === 'Limonene');
  assertEquals(limonene?.name, 'Limonene');
  // D2: a fabricated zero would corrupt the one signal the product predicts on.
  assertEquals(limonene!.pct, null);
  assertNotStrictEquals(limonene!.pct as unknown, 0);
});

Deno.test('GET is rejected with 405', async () => {
  const res = await ingestCoa(
    new Request('http://localhost/ingest-coa', { method: 'GET' }),
  );
  assertEquals(res.status, 405);
  assertEquals(typeof (await res.json()).error, 'string');
});

Deno.test('non-PDF Content-Type is rejected with 415', async () => {
  const res = await ingestCoa(
    new Request('http://localhost/ingest-coa', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    }),
  );
  assertEquals(res.status, 415);
  assertEquals(typeof (await res.json()).error, 'string');
});

Deno.test('empty body is rejected with 400', async () => {
  const res = await ingestCoa(pdfRequest(new Uint8Array()));
  assertEquals(res.status, 400);
  assertEquals(typeof (await res.json()).error, 'string');
});
