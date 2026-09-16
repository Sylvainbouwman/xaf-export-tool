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

// De rijlimiet van het Mutaties-tabblad staat in de hoofdcode, niet in de worker. Sinds
// 16 september 2026 (avond) rekent zij in werkelijke tekens, niet meer in cellen: het
// celaantal bleek zelf geen betrouwbare voorspeller (zie update-bram-xaf-export-tool.md,
// §2.7 en de toelichting bij CHAR_BUDGET in index.html). De declaraties worden er
// letterlijk uit gehaald en los gedraaid, zodat wat hier getest wordt ook echt de code is
// die de tool gebruikt.
function laadExcelRowCap() {
  const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
  const stukken = [
    /var CHAR_BUDGET\s*=\s*\d+;/,
    /var MIN_ROWS_PER_PART\s*=\s*\d+;/,
    /var CHAR_SAMPLE_SIZE\s*=\s*\d+;/,
    /function rijTekens\(row\) \{[\s\S]*?\n {4}\}/,
    /function schatTotaalTekens\(rows\) \{[\s\S]*?\n {4}\}/,
    /function excelRowCap\(rows\) \{[\s\S]*?\n {4}\}/,
  ].map(re => {
    const treffer = html.match(re);
    assert.ok(treffer, 'declaratie niet gevonden: ' + re);
    return treffer[0];
  });
  const context = vm.createContext(Object.create(null), { codeGeneration: { strings: false, wasm: false } });
  vm.runInContext(stukken.join('\n'), context, { timeout: 1000 });
  return context;
}

// Rijen met een precies gecontroleerde tekenlengte per rij, zodat excelRowCap tegen een
// exacte, met de hand na te rekenen verwachting getoetst kan worden in plaats van tegen
// realistische maar moeilijker te verifiëren testdata.
function maakRijenVanLengte(aantal, tekensPerRij) {
  // Eén kolom met een string van precies tekensPerRij tekens: rijTekens(rij) === tekensPerRij.
  const veld = 'x'.repeat(tekensPerRij);
  return Array.from({ length: aantal }, () => [veld]);
}

test('CHAR_BUDGET en MIN_ROWS_PER_PART staan op de gemeten en besloten waarden', () => {
  const { CHAR_BUDGET, MIN_ROWS_PER_PART, CHAR_SAMPLE_SIZE } = laadExcelRowCap();
  // Gemeten op 16 september 2026: het omslagpunt lag rond 35 miljoen tekens (23 kolommen,
  // gangbare tekst). CHAR_BUDGET is met bijna 3x marge daaronder gekozen; zie index.html.
  assert.equal(CHAR_BUDGET, 12000000);
  assert.equal(MIN_ROWS_PER_PART, 500);
  assert.ok(CHAR_SAMPLE_SIZE > 0);
});

test('excelRowCap rekent het budget exact om naar rijen bij een bekende tekenlengte', () => {
  const { excelRowCap, CHAR_BUDGET, MIN_ROWS_PER_PART } = laadExcelRowCap();
  // 252 tekens/rij is de gemeten gemiddelde lengte uit de browsermeting (zie
  // update-bram-xaf-export-tool.md, §2.7): CHAR_BUDGET / 252 ligt in dezelfde orde als de
  // eerdere 50.000-rijengrens, wat bevestigt dat de nieuwe grens bij gangbare tekst niet
  // ineens iets heel anders oplevert.
  const rijen252 = maakRijenVanLengte(1000, 252);
  assert.equal(excelRowCap(rijen252), Math.floor(CHAR_BUDGET / 252));
  assert.ok(excelRowCap(rijen252) > 40000 && excelRowCap(rijen252) < 55000,
    'in dezelfde orde als de eerdere, inmiddels vervangen 50.000-rijengrens');

  // Dubbele tekenlengte geeft (afgerond) de halve rijencap: het is werkelijk de tekens die
  // tellen, niet het aantal rijen of kolommen.
  const rijen504 = maakRijenVanLengte(1000, 504);
  assert.equal(excelRowCap(rijen504), Math.floor(CHAR_BUDGET / 504));
  assert.ok(Math.abs(excelRowCap(rijen252) / 2 - excelRowCap(rijen504)) <= 1);
});

test('excelRowCap zakt nooit onder MIN_ROWS_PER_PART, ook bij extreem lange tekst', () => {
  const { excelRowCap, MIN_ROWS_PER_PART } = laadExcelRowCap();
  const rijenExtreemLang = maakRijenVanLengte(10, 5000000); // 5 miljoen tekens in één rij
  assert.equal(excelRowCap(rijenExtreemLang), MIN_ROWS_PER_PART);
});

test('excelRowCap geeft nooit meer rijen terug dan er zijn, en gaat netjes om met lege invoer', () => {
  const { excelRowCap, MIN_ROWS_PER_PART } = laadExcelRowCap();
  assert.equal(excelRowCap([]), MIN_ROWS_PER_PART, 'niets te exporteren: geen grens nodig, maar ook geen crash');
  // Rijen zonder enige tekst (alleen null/undefined) mogen niet op een deling door nul
  // stuklopen; excelRowCap valt dan terug op het werkelijke aantal rijen.
  const legeRijen = [[null, undefined], [null, undefined]];
  assert.equal(excelRowCap(legeRijen), legeRijen.length);
  // Een handvol echte rijen (ver onder MIN_ROWS_PER_PART) blijft gewoon als geheel passen.
  const paarRijen = maakRijenVanLengte(5, 252);
  assert.equal(excelRowCap(paarRijen), Math.max(MIN_ROWS_PER_PART, Math.floor(12000000 / 252)));
});

test('schatTotaalTekens telt exact bij weinig rijen en blijft dicht bij de waarheid bij een steekproef', () => {
  const { schatTotaalTekens, CHAR_SAMPLE_SIZE } = laadExcelRowCap();
  // Onder CHAR_SAMPLE_SIZE rijen wordt alles geteld: dit moet dus exact kloppen, geen
  // schatting.
  const klein = maakRijenVanLengte(37, 100);
  assert.equal(schatTotaalTekens(klein), 3700);

  // Boven CHAR_SAMPLE_SIZE rijen schaalt een steekproef naar het totaal. Bij identieke
  // rijen (zoals hier) moet dat, op afrondingsverschillen na, exact uitkomen.
  const groot = maakRijenVanLengte(CHAR_SAMPLE_SIZE * 3 + 1, 100);
  const geschat = schatTotaalTekens(groot);
  const werkelijk = groot.length * 100;
  assert.ok(Math.abs(geschat - werkelijk) / werkelijk < 0.01,
    'steekproef mag hooguit 1% afwijken bij identieke rijen');
});

// partCount is het enige rekenwerk dat nog puur op aantallen zit: hoeveel
// Excel-deelbestanden het adviesblok aankondigt (zie exportBtn-klikhandler). Het
// werkelijk verdelen gebeurt sinds de terugval van 16 september 2026 (avond) niet meer
// vooraf in vaste stukken (dat deed de inmiddels verwijderde splitRows), maar stap voor
// stap in buildExcelSplit zelf, dat ook op een mislukt deel kan reageren door te
// halveren. Dat stapsgewijze deel van buildExcelSplit hangt te veel samen met de
// DOM/XLSX-omgeving om hier los te draaien; zie de meting in
// update-bram-xaf-export-tool.md, §2.7 voor hoe dat is getoetst.
function laadPartCount() {
  const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
  const treffer = html.match(/function partCount\(n, cap\) \{[\s\S]*?\n {4}\}/);
  assert.ok(treffer, 'declaratie niet gevonden: function partCount');
  const context = vm.createContext(Object.create(null), { codeGeneration: { strings: false, wasm: false } });
  vm.runInContext(treffer[0], context, { timeout: 1000 });
  return context;
}

test('partCount rekent het aantal Excel-deelbestanden voorspelbaar uit', () => {
  const { partCount } = laadPartCount();
  assert.equal(partCount(0, 50000), 0, 'niets te exporteren is nul bestanden');
  assert.equal(partCount(1, 50000), 1);
  assert.equal(partCount(50000, 50000), 1, 'precies op de grens: nog altijd één bestand');
  assert.equal(partCount(50001, 50000), 2, 'één regel boven de grens: al een tweede bestand');
  assert.equal(partCount(100000, 50000), 2);
  assert.equal(partCount(100001, 50000), 3);
  assert.equal(partCount(1000000, 50000), 20, 'de omvang uit de meting in §2.7');
});
