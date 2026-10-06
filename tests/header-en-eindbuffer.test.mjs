// Synthetische bestanden voor twee randgevallen van de stroomverwerking:
// een letterlijke <transactions>-tag in een CDATA-blok vóór het echte element,
// en een afgekapt bestand waarvan het laatste <journal> niet is afgesloten.
import assert from 'node:assert/strict';
import test from 'node:test';
import { runWorker, runWorkerFiles } from './worker-kern.mjs';

const kop = (bedrijf) => `<?xml version="1.0"?><auditfile xmlns="http://www.auditfiles.nl/XAF/3.2"><header><fiscalYear>2026</fiscalYear></header><company><companyName>${bedrijf}</companyName><generalLedger><ledgerAccount><accID>1000</accID><accDesc>Kas</accDesc></ledgerAccount></generalLedger>`;
const journaal = (id) => `<journal><jrnID>${id}</jrnID><desc>Dagboek ${id}</desc><jrnTp>B</jrnTp><transaction><nr>T${id}</nr><desc>Boeking</desc><periodNumber>1</periodNumber><trDt>2026-01-01</trDt><trLine><nr>1</nr><accID>1000</accID><desc>Regel</desc><amnt>10.00</amnt><amntTp>D</amntTp></trLine></transaction></journal>`;

test('letterlijke transactions-tag in CDATA snijdt de header niet af', async () => {
  const xml = kop('<![CDATA[Test <transactions> BV]]>') + `<transactions><linesCount>1</linesCount>${journaal('J1')}</transactions></company></auditfile>`;
  for (const cuts of [[], [150], [260, 300]]) {
    const done = await runWorker(xml, cuts);
    assert.equal(done.rows.length, 1);
    assert.equal(done.bedrijf.find(r => r[0] === 'Bedrijfsnaam')[1], 'Test <transactions> BV');
    assert.equal(done.accs.length, 2);
    assert.deepEqual(Array.from(done.afgekapt), []);
  }
});

test('afgekapt bestand: ingelezen dagboeken blijven, het restant wordt gemeld', async () => {
  const volledig = kop('Test BV') + `<transactions>${journaal('J1')}${journaal('J2')}</transactions></company></auditfile>`;
  const afgekapt = volledig.slice(0, volledig.lastIndexOf('</transaction></journal>'));
  const done = await runWorker(afgekapt);
  assert.equal(done.rows.length, 1);
  assert.deepEqual(Array.from(done.afgekapt), [1]);
});

test('compleet bestand meldt niets', async () => {
  const volledig = kop('Test BV') + `<transactions>${journaal('J1')}${journaal('J2')}</transactions></company></auditfile>`;
  const done = await runWorker(volledig);
  assert.equal(done.rows.length, 2);
  assert.deepEqual(Array.from(done.afgekapt), []);
});

test('bij meerdere bestanden staat het nummer van het afgekapte bestand in de melding', async () => {
  const een = kop('Test BV') + `<transactions>${journaal('J1')}</transactions></company></auditfile>`;
  const twee = kop('Test BV') + `<transactions>${journaal('J2')}${journaal('J3')}</transactions></company></auditfile>`;
  const afgekapt = twee.slice(0, twee.lastIndexOf('</transaction></journal>'));
  const done = await runWorkerFiles([een, afgekapt]);
  assert.equal(done.rows.length, 2);
  assert.deepEqual(Array.from(done.afgekapt), [2]);
  assert.equal(done.aantalBestanden, 2);
});
