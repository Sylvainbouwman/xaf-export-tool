import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import test from 'node:test';

// Read only the actual worker core; never run the app, imports, or worker handler.
// An optional source path allows the same regressions to run against the old core.
const source = process.env.XAF_TEST_SOURCE || fileURLToPath(new URL('../index.html', import.meta.url));
const html = readFileSync(source, 'utf8');
const worker = html.match(/<script\b[^>]*id="worker-src"[^>]*>([\s\S]*?)<\/script>/);
assert.ok(worker, 'worker-src must exist');
const handler = worker[1].indexOf('self.onmessage =');
assert.ok(handler > 0, 'worker handler boundary must exist');
const core = vm.createContext(Object.create(null), { codeGeneration: { strings: false, wasm: false } });
vm.runInContext(worker[1].slice(0, handler), core, { timeout: 1000 });

const cases = [
  ['plain Unicode', 'Café € 漢字 😀', 'Café € 漢字 😀'],
  ['empty', '', ''],
  ['whitespace and multiline', ' \t regel 1\nregel 2\r\n ', ' \t regel 1\nregel 2\r\n '],
  ['XML named entities', '&lt;&gt;&amp;&quot;&apos;', '<>&"\''],
  ['numeric entities', '&#65;&#x20AC;&#x1F600;&#9;&#10;&#13;', 'A€😀\t\n\r'],
  ['single decoding pass', '&amp;lt; &#38;#65; &amp;amp;', '&lt; &#65; &amp;'],
  ['CDATA is literal', '<![CDATA[ <b>&amp; &#65; é</b> ]]>', ' <b>&amp; &#65; é</b> '],
  ['mixed and adjacent CDATA', ' a&amp;<![CDATA[&amp;]]><![CDATA[<x>]]>b&#33; ', ' a&&amp;<x>b! '],
  ['closing tag in CDATA', '<![CDATA[a</desc>b]]>c', 'a</desc>bc'],
  ['comments and processing instructions', 'a<!-- ignored -->b<?ignored value?>c', 'abc'],
  ['no HTML or custom entity expansion', '&nbsp; &external; &AMP;', '&nbsp; &external; &AMP;'],
  ['invalid numeric references remain visible', '&#0; &#xD800; &#x110000; &#-1; &#xZZ; &#;', '&#0; &#xD800; &#x110000; &#-1; &#xZZ; &#;'],
];
for (const [name, input, expected] of cases) {
  test(name, () => {
    const xml = `<row><desc>${input}</desc></row>`;
    assert.equal(core.childTextsStr(xml).desc, expected);
    assert.equal(core.getText(xml, 'desc'), expected);
  });
}

test('only direct leaf children; empty/self-closing and first occurrence', () => {
  const result = core.childTextsStr('<row><desc/><desc>second</desc><empty></empty><nested><desc>hidden</desc></nested><n:label xmlns:n="urn:test">A&amp;B</n:label></row>');
  assert.equal(result.desc, '');
  assert.equal(result.empty, '');
  assert.equal(result.nested, undefined);
  assert.equal(result.label, 'A&B');
  assert.equal(core.getText('<row><desc/><desc>second</desc></row>', 'desc'), '');
  assert.equal(core.getText('<row><desc\n label="test">A&amp;B</desc></row>', 'desc'), 'A&B');
});

test('CDATA cannot inject structural rows or truncate its containing row', () => {
  const literal = '</trLine><trLine><desc>fake</desc></trLine>';
  const rows = [];
  core.parseJournal(`<journal><transaction><trLine><desc><![CDATA[${literal}]]></desc><amnt>5</amnt><amntTp>D</amntTp></trLine></transaction></journal>`, rows, {}, {});
  assert.equal(rows.length, 1);
  assert.equal(rows[0][12], literal);
  assert.equal(rows[0][15], 5);
  assert.equal(core.getAll('<root><![CDATA[<trLine>fake</trLine>]]><trLine>real</trLine></root>', 'trLine').length, 1);
});

test('DTD-like content is never expanded or executed', () => {
  const result = core.childTextsStr('<row><desc><!DOCTYPE x [<!ENTITY external SYSTEM "file:///synthetic-never-read">]>&external;</desc><label>&external;</label></row>');
  assert.equal(result.desc, undefined);
  assert.equal(result.label, '&external;');
  assert.equal(typeof core.fetch, 'undefined');
  assert.equal(typeof core.require, 'undefined');
});

test('real journal rows decode descriptions and leave amounts/columns intact', () => {
  const rows = [];
  core.parseJournal('<journal><jrnID>J1</jrnID><desc>Journaal &amp; test</desc><jrnTp>B</jrnTp><transaction><nr>T1</nr><desc><![CDATA[Transactie <test>]]></desc><periodNumber>1</periodNumber><trDt>2026-01-01</trDt><trLine><nr>1</nr><accID>1000</accID><docRef>&amp;lt;</docRef><desc>Boeking &#x20AC; &amp; test</desc><amnt>123.45</amnt><amntTp>C</amntTp><vat><vatID>V1</vatID><vatAmnt>21.00</vatAmnt><vatPerc>21</vatPerc></vat><custSupID>R1</custSupID></trLine></transaction></journal>', rows, {1000: 'Rekening & test'}, {R1: 'Relatie & test'});
  assert.equal(rows.length, 1);
  assert.deepEqual(Array.from(rows[0]), ['J1', 'Journaal & test', 'B', 'T1', 'Transactie <test>', '1', '2026-01-01', '1', '1000', 'Rekening & test', '&lt;', '', 'Boeking € & test', 123.45, 'C', -123.45, 'V1', 21, '21', 'R1', 'Relatie & test']);
});

test('real header ledger and relation fields are decoded once', () => {
  const parsed = core.parseHeader('<auditfile><header><softwareDesc>Software &amp; test</softwareDesc></header><generalLedger><ledgerAccount><accID>1000</accID><accDesc><![CDATA[Rekening &amp; test]]></accDesc></ledgerAccount></generalLedger><customersSuppliers><customerSupplier><custSupID>R1</custSupID><custSupName>Relatie &#38; test</custSupName></customerSupplier></customersSuppliers></auditfile>');
  assert.equal(parsed.bedrijf.find(row => row[0] === 'Software')[1], 'Software & test');
  assert.equal(parsed.accMap['1000'], 'Rekening &amp; test');
  assert.equal(parsed.custSupMap.R1, 'Relatie & test');
});

// Execute the complete real worker with synthetic byte streams, no main app or I/O.
async function runWorker(xml, cuts = []) {
  const bytes = new TextEncoder().encode(xml);
  const messages = [];
  const context = vm.createContext({
    self: { postMessage: value => messages.push(value) }, TextDecoderStream,
  }, { codeGeneration: { strings: false, wasm: false } });
  vm.runInContext(worker[1], context, { timeout: 1000 });
  const boundaries = [0, ...cuts, bytes.length];
  const file = {
    size: bytes.length,
    slice: (start, end) => ({ arrayBuffer: async () => bytes.slice(start, end).buffer }),
    stream: () => new ReadableStream({ start(controller) {
      for (let i = 1; i < boundaries.length; i++) controller.enqueue(bytes.slice(boundaries[i - 1], boundaries[i]));
      controller.close();
    } }),
  };
  await context.self.onmessage({ data: file });
  assert.equal(messages.find(message => message.type === 'error'), undefined);
  const done = messages.filter(message => message.type === 'done');
  assert.equal(done.length, 1);
  return done[0];
}

test('real worker preserves journal-looking CDATA across every byte boundary', async () => {
  const description = ' A</journal>B € ';
  const xml = `<auditfile><header/><transactions><journal><jrnID>J1</jrnID><transaction><trLine><desc><![CDATA[${description}]]></desc><amnt>5.00</amnt><amntTp>C</amntTp></trLine></transaction></journal></transactions></auditfile>`;
  const bytes = new TextEncoder().encode(xml);
  for (let cut = 0; cut <= bytes.length; cut++) {
    const done = await runWorker(xml, cut === 0 || cut === bytes.length ? [] : [cut]);
    assert.equal(done.rows.length, 1, `byte boundary ${cut}`);
    assert.equal(done.rows[0][12], description, `byte boundary ${cut}`);
    assert.equal(done.rows[0][15], -5);
  }
  const done = await runWorker(xml, Array.from({ length: bytes.length - 1 }, (_, i) => i + 1));
  assert.equal(done.rows.length, 1);
  assert.equal(done.rows[0][12], description);
});

test('real worker normalizes identifiers and preserves free text whitespace', async () => {
  const xml = '<auditfile><header/><generalLedger><ledgerAccount><accID> 1000 </accID><accDesc> Testrekening </accDesc></ledgerAccount></generalLedger><customersSuppliers><customerSupplier><custSupID> R1 </custSupID><custSupName> Testrelatie </custSupName></customerSupplier></customersSuppliers><transactions><journal><jrnID> J1 </jrnID><desc> Journaal </desc><transaction><nr> T1 </nr><desc> Transactie </desc><trLine><nr> 1 </nr><accID> 1000 </accID><custSupID> R1 </custSupID><desc> Boeking </desc><amnt> 5.00 </amnt><amntTp> C </amntTp><vat><vatID> V1 </vatID></vat></trLine></transaction></journal></transactions></auditfile>';
  const done = await runWorker(xml);
  const row = done.rows[0];
  assert.equal(done.accs[1][0], '1000');
  assert.equal(done.custSups[1][0], 'R1');
  assert.deepEqual([row[0], row[3], row[7], row[8], row[16], row[19]], ['J1', 'T1', '1', '1000', 'V1', 'R1']);
  assert.deepEqual([row[1], row[4], row[9], row[12], row[20]], [' Journaal ', ' Transactie ', ' Testrekening ', ' Boeking ', ' Testrelatie ']);
  assert.equal(row[15], -5);
  // Both directions of inconsistent padding must resolve to the same map key.
  const unpaddedMaster = xml.replace('<accID> 1000 </accID>', '<accID>1000</accID>').replace('<custSupID> R1 </custSupID>', '<custSupID>R1</custSupID>');
  assert.equal((await runWorker(unpaddedMaster)).rows[0][9], ' Testrekening ');
  assert.equal((await runWorker(unpaddedMaster)).rows[0][20], ' Testrelatie ');
  const unpaddedLine = xml.replace('<trLine><nr> 1 </nr><accID> 1000 </accID><custSupID> R1 </custSupID>', '<trLine><nr> 1 </nr><accID>1000</accID><custSupID>R1</custSupID>');
  const fromPaddedMaster = await runWorker(unpaddedLine);
  assert.equal(fromPaddedMaster.rows[0][9], ' Testrekening ');
  assert.equal(fromPaddedMaster.rows[0][20], ' Testrelatie ');
});
