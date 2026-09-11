// Meerdere <vat>-elementen per boekingsregel.
//
// De XAF-XSD staat er nul tot negenennegentig per trLine toe:
//   <xsd:element name="vat" minOccurs="0" maxOccurs="99">
// in XmlAuditfileFinancieel3.2.xsd (namespace http://www.auditfiles.nl/XAF/3.2) en
// ongewijzigd in XmlAuditfileFinancieel4.0.xsd uit XAF 4.0.3 van Belastingdienst/ODB.
// Tot deze wijziging las de tool alleen het eerste element en verdween de rest
// zonder melding. Alle XAF-fragmenten hieronder zijn verzonnen.
import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { laadKern, runWorker, runWorkerFiles } from './worker-kern.mjs';

const core = laadKern();

const BASIS = [
  'Journaal ID', 'Journaal omschrijving', 'Journaal type',
  'Transactie nr.', 'Transactie omschrijving', 'Periode', 'Datum',
  'Regelnr.', 'Rekening', 'Omschrijving rekening', 'Doc. referentie', 'Effectieve datum',
  'Boekingsomschrijving', 'Bedrag (abs)', 'D/C', 'Bedrag',
  'BTW-code', 'BTW-bedrag', 'BTW-%',
  'Relatie ID', 'Relatie naam',
  'BTW D/C', 'BTW-bedrag getekend',
];

// De vijf koppen die een tweede en volgend btw-element achteraan krijgt.
const extra = n => ['BTW-code ' + n, 'BTW-bedrag ' + n, 'BTW-% ' + n, 'BTW D/C ' + n, 'BTW-bedrag getekend ' + n];

const VAT_HOOG = '<vat><vatID>H</vatID><vatPerc>21</vatPerc><vatAmnt>21.00</vatAmnt><vatAmntTp>C</vatAmntTp></vat>';
const VAT_LAAG = '<vat><vatID>L</vatID><vatPerc>9</vatPerc><vatAmnt>9.00</vatAmnt><vatAmntTp>C</vatAmntTp></vat>';
const VAT_NUL = '<vat><vatID>N</vatID><vatPerc>0</vatPerc><vatAmnt>0.00</vatAmnt><vatAmntTp>C</vatAmntTp></vat>';
// Debet, zoals een voorbelasting op een inkoopfactuur.
const VAT_DEBET = '<vat><vatID>V</vatID><vatPerc>21</vatPerc><vatAmnt>42.00</vatAmnt><vatAmntTp>D</vatAmntTp></vat>';
// Zonder aanduiding. Dat mag niet van de XSD, maar de tool moet er niet op raden.
const VAT_ZONDER_TP = '<vat><vatID>X</vatID><vatPerc>21</vatPerc><vatAmnt>15.00</vatAmnt></vat>';

// Een journaal met een boekingsregel die de opgegeven vat-elementen draagt.
function journaal(vatXml, opts = {}) {
  const amnt = opts.amnt || '1000.00';
  const tp = opts.tp || 'D';
  return '<journal><jrnID>V</jrnID><desc>Verkoop</desc><jrnTp>S</jrnTp>'
    + '<transaction><nr>T1</nr><desc>Factuur 1</desc><periodNumber>3</periodNumber><trDt>2026-03-04</trDt>'
    + '<trLine><nr>1</nr><accID>1300</accID><docRef>F-1</docRef><effDate>2026-03-04</effDate>'
    + '<desc>Gemengde factuur</desc><amnt>' + amnt + '</amnt><amntTp>' + tp + '</amntTp>'
    + vatXml
    + '<custSupID>D001</custSupID></trLine></transaction></journal>';
}

function parse(vatXml, opts) {
  const rows = [];
  core.parseJournal(journaal(vatXml, opts), rows, { 1300: 'Debiteuren' }, { D001: 'Afnemer BV' });
  return rows;
}

// De zestien kolommen voor de btw-kolommen, die geen enkel btw-element mag raken.
const VAST = ['V', 'Verkoop', 'S', 'T1', 'Factuur 1', '3', '2026-03-04',
  '1', '1300', 'Debiteuren', 'F-1', '2026-03-04', 'Gemengde factuur', 1000, 'D', 1000];

test('de vaste kolomkoppen staan onveranderd op hun positie', () => {
  assert.deepEqual(Array.from(core.LINE_H), BASIS);
  assert.equal(core.LINE_H.length, 23);
  // IDX_PERIOD en IDX_BEDRAG in de hoofdcode adresseren deze twee posities.
  assert.equal(core.LINE_H[5], 'Periode');
  assert.equal(core.LINE_H[15], 'Bedrag');
  // De nabewerking vult row[9] en row[20] bij aan de hand van row[8] en row[19].
  assert.equal(core.LINE_H[8], 'Rekening');
  assert.equal(core.LINE_H[9], 'Omschrijving rekening');
  assert.equal(core.LINE_H[19], 'Relatie ID');
  assert.equal(core.LINE_H[20], 'Relatie naam');
  // De twee btw-tekenkolommen staan achteraan, zodat geen bestaande positie schuift.
  assert.equal(core.LINE_H[21], 'BTW D/C');
  assert.equal(core.LINE_H[22], 'BTW-bedrag getekend');
});

test('een regel zonder btw-element blijft precies zoals hij was', () => {
  const rows = parse('');
  assert.equal(rows.length, 1);
  assert.deepEqual(Array.from(rows[0]), VAST.concat(['', 0, '', 'D001', 'Afnemer BV', '', '']));
  assert.equal(rows[0].length, 23);
});

test('een regel met een btw-element blijft precies zoals hij was', () => {
  const rows = parse(VAT_HOOG);
  assert.equal(rows.length, 1);
  assert.deepEqual(Array.from(rows[0]), VAST.concat(['H', 21, '21', 'D001', 'Afnemer BV', 'C', -21]));
  assert.equal(rows[0].length, 23);
});

test('een regel met twee btw-elementen levert beide op, elk in eigen kolommen', () => {
  const rows = parse(VAT_HOOG + VAT_LAAG);
  assert.equal(rows.length, 1, 'twee btw-elementen blijven een boekingsregel');
  assert.deepEqual(Array.from(rows[0]),
    VAST.concat(['H', 21, '21', 'D001', 'Afnemer BV', 'C', -21, 'L', 9, '9', 'C', -9]));
  assert.equal(rows[0].length, 28);
  // Het eerste element staat nog op dezelfde plek als voor de reparatie.
  assert.equal(rows[0][16], 'H');
  assert.equal(rows[0][17], 21);
  assert.equal(rows[0][18], '21');
  // En het tweede verdwijnt niet langer.
  assert.equal(rows[0][23], 'L');
  assert.equal(rows[0][24], 9);
  assert.equal(rows[0][25], '9');
});

test('drie btw-elementen leveren drie drietallen, ook met een nultarief erbij', () => {
  const rows = parse(VAT_HOOG + VAT_LAAG + VAT_NUL);
  assert.equal(rows[0].length, 33);
  // Het nultarief levert 0 op en niet -0, ook al is de aanduiding C.
  assert.deepEqual(Array.from(rows[0].slice(23)), ['L', 9, '9', 'C', -9, 'N', 0, '0', 'C', 0]);
});

// ── De debet/creditaanduiding bij het btw-bedrag ─────────────────────────────
//
// vatAmntTp is binnen <vat> verplicht en kent maar twee waarden:
//   <xsd:element name="vatAmntTp" type="str:TypeDebitcredittype"/>
//   <xsd:simpleType name="TypeDebitcredittype"> <xsd:length value="1"/>
//   <xsd:enumeration value="C"/> <xsd:enumeration value="D"/>
// XmlAuditfileFinancieel4.0.xsd uit XAF 4.0.3 van Belastingdienst/ODB, en
// gelijkluidend in XmlAuditfileFinancieel3.2.xsd (type Debitcredittype). De
// functionele hierarchie XMLAuditfileFinancieel_4.0_FunHie.pdf, versie 4.0 van
// 6 februari 2025, pagina 10, omschrijft het als "Indicatie of het btw bedrag Debet
// of Credit is" met de codelijst DebitCredit, C Credit en D Debit.

test('een creditelement krijgt een negatief getekend bedrag', () => {
  const rij = parse(VAT_HOOG)[0];
  assert.equal(rij[16], 'H', 'de bestaande BTW-code blijft staan');
  assert.equal(rij[17], 21, 'de bestaande BTW-bedrag-kolom blijft het bedrag zonder teken');
  assert.equal(rij[21], 'C', 'de aanduiding komt uit het bestand');
  assert.equal(rij[22], -21, 'credit is negatief, net als bij het regelbedrag');
});

test('een debetelement krijgt een positief getekend bedrag', () => {
  const rij = parse(VAT_DEBET)[0];
  assert.equal(rij[17], 42, 'het bedrag zonder teken blijft zoals het in het bestand staat');
  assert.equal(rij[21], 'D');
  assert.equal(rij[22], 42);
});

test('een debet- en een creditelement op een regel tellen niet langer dezelfde kant op', () => {
  // Dit is de fout die de kolommen oplossen. Zonder teken lijkt de regel 42 + 21 = 63
  // aan btw te dragen, terwijl het saldo 42 - 21 = 21 is.
  const rij = parse(VAT_DEBET + VAT_HOOG)[0];
  assert.equal(rij.length, 28, 'twee elementen op een rij');
  assert.deepEqual(Array.from(rij.slice(16, 19)), ['V', 42, '21'], 'element een, ongewijzigd');
  assert.deepEqual(Array.from(rij.slice(21, 23)), ['D', 42], 'element een, met teken');
  assert.deepEqual(Array.from(rij.slice(23)), ['H', 21, '21', 'C', -21], 'element twee, met teken');
  assert.equal(rij[17] + rij[24], 63, 'zonder teken telt de export ze op');
  assert.equal(rij[22] + rij[27], 21, 'met teken komt het saldo eruit');
});

test('een btw-element zonder aanduiding wordt niet geraden', () => {
  // De XSD laat dit niet toe, maar een pakket kan het toch leveren. De tool mag het
  // dan niet stil als debet meetellen: de aanduidingskolom toont wat er staat, en dat
  // is niets, en de getekende kolom blijft leeg.
  const rij = parse(VAT_ZONDER_TP)[0];
  assert.equal(rij[16], 'X');
  assert.equal(rij[17], 15, 'het bedrag zelf gaat gewoon mee');
  assert.equal(rij[21], '', 'geen verzonnen D of C');
  assert.equal(rij[22], '', 'en dus ook geen getekend bedrag');
});

test('signedVat tekent alleen op C en D, en raadt nooit', () => {
  const { signedVat } = core;
  assert.equal(signedVat('42.00', 'D'), 42);
  assert.equal(signedVat('42.00', 'C'), -42);
  // Hoofdletterongevoelig en bestand tegen witruimte, net als signed() voor het regelbedrag.
  assert.equal(signedVat('42.00', ' c '), -42);
  assert.equal(signedVat('42.00', 'd'), 42);
  // Alles wat geen C of D is, levert een lege cel op: ontbrekend, leeg of onzin.
  assert.equal(signedVat('42.00', undefined), '');
  assert.equal(signedVat('42.00', ''), '');
  assert.equal(signedVat('42.00', 'X'), '');
  assert.equal(signedVat('42.00', '0'), '');
  // Een creditbedrag van nul blijft 0 en wordt geen -0.
  assert.ok(Object.is(signedVat('0.00', 'C'), 0));
  // En het regelbedrag blijft rekenen zoals het rekende: daar is D de terugval.
  assert.equal(core.signed('42.00', ''), 42);
});

test('het bedrag van de boekingsregel verandert niet door een tweede btw-element', () => {
  const een = parse(VAT_HOOG)[0];
  const twee = parse(VAT_HOOG + VAT_LAAG)[0];
  assert.deepEqual(Array.from(twee.slice(0, 16)), Array.from(een.slice(0, 16)));
  assert.equal(twee[15], 1000, 'de aansluitcheck telt kolom 15 op over alle rijen');
});

test('buildLineH nummert de extra kolommen vanaf twee', () => {
  assert.deepEqual(Array.from(core.buildLineH(23)), BASIS);
  assert.deepEqual(Array.from(core.buildLineH(28)), BASIS.concat(extra(2)));
  assert.deepEqual(Array.from(core.buildLineH(33)), BASIS.concat(extra(2), extra(3)));
  // maxOccurs="99" is de bovengrens van de XSD: 23 + 5 x 98 = 513 kolommen.
  assert.equal(core.buildLineH(23 + 5 * 98).length, 513);
});

function auditfile(journals) {
  return '<auditfile><header><fiscalYear>2026</fiscalYear></header><company><transactions>'
    + journals.join('') + '</transactions></company></auditfile>';
}

test('de echte worker geeft alle btw-elementen door met een kop die past', async () => {
  const done = await runWorker(auditfile([
    journaal(VAT_HOOG + VAT_LAAG),
    journaal(VAT_HOOG, { amnt: '500.00' }),
  ]));
  assert.equal(done.rows.length, 2, 'twee trLines blijven twee rijen');
  assert.deepEqual(Array.from(done.lineH), BASIS.concat(extra(2)));
  done.rows.forEach(row => assert.equal(row.length, done.lineH.length, 'elke rij is even breed als de kop'));
  assert.deepEqual(Array.from(done.rows[0].slice(16)),
    ['H', 21, '21', 'D001', '', 'C', -21, 'L', 9, '9', 'C', -9]);
  // De regel met een btw-element krijgt lege cellen, geen verzonnen nul.
  assert.deepEqual(Array.from(done.rows[1].slice(16)),
    ['H', 21, '21', 'D001', '', 'C', -21, '', '', '', '', '']);
});

test('een bestand zonder meervoudige btw houdt exact de oude kolommen', async () => {
  const done = await runWorker(auditfile([
    journaal(VAT_HOOG),
    journaal('', { amnt: '250.00' }),
  ]));
  assert.deepEqual(Array.from(done.lineH), BASIS);
  assert.equal(done.lineH.length, 23);
  done.rows.forEach(row => assert.equal(row.length, 23));
  assert.deepEqual(Array.from(done.rows[0].slice(16)), ['H', 21, '21', 'D001', '', 'C', -21]);
  assert.deepEqual(Array.from(done.rows[1].slice(16)), ['', 0, '', 'D001', '', '', '']);
});

test('debet en credit blijven aansluiten met meervoudige btw op een regel', async () => {
  const done = await runWorker(auditfile([
    journaal(VAT_HOOG + VAT_LAAG, { amnt: '1000.00', tp: 'D' }),
    journaal(VAT_HOOG, { amnt: '1000.00', tp: 'C' }),
  ]));
  const totaal = done.rows.reduce((som, row) => som + row[15], 0);
  assert.equal(Math.round(totaal * 100) / 100, 0, 'debet = credit');
});

test('een gesplitste export meet de breedste regel over alle bestanden samen', async () => {
  // Exact Globe Next splitst een grote export over meerdere bestanden. De kolomkop
  // moet dan de breedste regel van het geheel volgen, niet die van het eerste
  // bestand: anders zou een tweede btw-element uit bestand twee alsnog wegvallen.
  const done = await runWorkerFiles([
    auditfile([journaal(VAT_HOOG, { amnt: '100.00' })]),
    auditfile([journaal(VAT_HOOG + VAT_LAAG, { amnt: '200.00' })]),
  ]);
  assert.equal(done.rows.length, 2, 'de bestanden worden samengevoegd, niet los gemeld');
  assert.deepEqual(Array.from(done.lineH), BASIS.concat(extra(2)));
  done.rows.forEach(row => assert.equal(row.length, done.lineH.length, 'elke rij is even breed als de kop'));
  // De regel uit het eerste bestand wordt opgevuld met lege cellen.
  assert.deepEqual(Array.from(done.rows[0].slice(23)), ['', '', '', '', '']);
  // En het tweede btw-element uit het tweede bestand staat er wel.
  assert.deepEqual(Array.from(done.rows[1].slice(23)), ['L', 9, '9', 'C', -9]);
});

// De rijlimiet van het Mutaties-tabblad staat in de hoofdcode, niet in de worker.
// De drie declaraties worden er letterlijk uit gehaald en los gedraaid, zodat de
// rekensom in het commentaar erbij ook echt gemeten is.
function laadMutCap() {
  const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
  const stukken = [
    /var ROW_CAP\s*=\s*\d+;/,
    /var CELL_CAP\s*=\s*\d+;/,
    /function mutCap\(headers\) \{[\s\S]*?\n {4}\}/,
  ].map(re => {
    const treffer = html.match(re);
    assert.ok(treffer, 'declaratie niet gevonden: ' + re);
    return treffer[0];
  });
  const context = vm.createContext(Object.create(null), { codeGeneration: { strings: false, wasm: false } });
  vm.runInContext(stukken.join('\n'), context, { timeout: 1000 });
  return context;
}

test('de rijlimiet volgt het cellenbudget en het gemeten aantal kolommen', () => {
  const { mutCap, ROW_CAP, CELL_CAP } = laadMutCap();
  assert.equal(ROW_CAP, 500000);
  assert.equal(CELL_CAP, 15000000);
  // Bij de drieentwintig vaste kolommen blijft de grens ongewijzigd op 500.000.
  assert.equal(BASIS.length, 23);
  assert.equal(mutCap(BASIS), 500000);
  assert.equal(23 * 500000, 11500000, 'dat is 11,5 miljoen cellen, onder het budget');
  assert.equal(CELL_CAP - 23 * 500000, 3500000, 'de marge is 3,5 miljoen cellen');
  // Een extra btw-element kost nu vijf kolommen in plaats van drie. Tot en met dertig
  // kolommen verandert er niets, en dat reikt tot twee btw-elementen (28 kolommen).
  assert.equal(mutCap(new Array(28)), 500000);
  assert.equal(mutCap(new Array(30)), 500000);
  // Daarboven schaalt de grens mee zodat het cellenbudget niet wordt overschreden.
  assert.equal(mutCap(new Array(31)), 483870);
  assert.equal(mutCap(new Array(33)), 454545, 'drie btw-elementen: 23 + 5 x 2 kolommen');
  assert.equal(mutCap(new Array(513)), 29239, 'negenennegentig btw-elementen');
  for (const kolommen of [23, 28, 30, 31, 33, 60, 513]) {
    assert.ok(mutCap(new Array(kolommen)) * kolommen <= CELL_CAP,
      kolommen + ' kolommen blijft binnen het cellenbudget');
  }
});
