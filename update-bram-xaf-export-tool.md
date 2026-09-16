# Terugkoppeling: xaf-export-tool

**Aan** Bram, DK Accountants · **Van** Join Administraties · **Datum** 16 september 2026
**Aanleiding** Eerste terugkoppeling over deze tool. De tool draait al enige tijd, maar is
in september op vier punten inhoudelijk gecorrigeerd: een kolom droeg een verkeerde
betekenis, de XML-tekstverwerking verloor gegevens, en de btw-kant van de export was
onvolledig. Hieronder staat wat de tool doet, wat er is gewijzigd en waarop dat rust.

---

## 1. Wat de tool doet en wat die oplevert

`xaf.bouwman.tools` leest een XAF-auditfile (XML Auditfile Financieel) in en exporteert
die naar Excel of CSV. Geen installatie en geen server: alles gebeurt in de browser van de
gebruiker, het bestand verlaat de machine niet.

De winst zit in twee dingen. Ten eerste komt een auditfile er als bruikbare tabel uit in
plaats van als XML: grootboekrekeningen, beginsaldi, btw-codes, debiteuren en crediteuren,
een kolommenbalans per rekening en alle journaalregels, elk op een eigen tabblad en
gesorteerd. Ten tweede is de tool gebouwd op de bestanden zoals ze in de praktijk komen:
streaming inlezen voor bestanden van honderden MB tot enkele GB, automatische samenvoeging
van de gesplitste export van Exact Globe Next (`_0` met stamgegevens, `_1` met mutaties),
en een aansluitcheck die direct laat zien of debet en credit sluiten.

Ondersteund zijn XAF 3.1, 3.2 en 4.0.

## 2. Wijzigingen deze ronde

### 2.1 De kolom "Vervaldatum" bestond niet (2 september)

Het Mutaties-tabblad had een kolom `Vervaldatum` en vulde die met het XAF-element
`effDate`. Dat element is in geen van beide versies een vervaldatum. In XAF 3.2 is het de
mutatiedatum, in XAF 4.0 de datum waarop de factuur is uitgereikt. Wie op die kolom een
ouderdomsanalyse baseerde, rekende met de verkeerde datum.

De kop heet nu `Effectieve datum` en de README legt de betekenis per versie uit. Een
werkelijke vervaldatum bestaat alleen als `invDueDt` in de optionele subadministratie van
XAF 3.2 (`obSbLine` en `sbLine`); XAF 4.0 heeft die blokken geschrapt. `settDate` in 4.0 is
evenmin een vervaldatum, maar de leverdatum of de datum van een vooruitbetaling.

In diezelfde correctie is de overgangsdatum rechtgezet: de README zei 1 januari 2026, het
is **1 januari 2027**. Zie §3.

### 2.2 XML-tekstverwerking: gegevensverlies en verkeerde grenzen (8 september)

Twee reparaties in de kern die het bestand uitleest.

De eerste betreft het decoderen van tekst. De tool decodeert nu uitsluitend de vijf
voorgedefinieerde XML-entiteiten (`&amp;` `&lt;` `&gt;` `&quot;` `&apos;`) en geldige
XML 1.0-tekenverwijzingen, en precies één keer. Een onbekende of ongeldige verwijzing
blijft zichtbaar staan in plaats van stil te verdwijnen. Er komt geen HTML- of
DOM-parser, geen DTD-resolver en geen externe bron aan te pas: een auditfile van een derde
kan de tool dus niet aanzetten tot het ophalen van iets buiten het bestand.

De tweede betreft de grenzen van tags. Het zoeken naar het begin en einde van een element
gebeurde met een platte tekstzoekopdracht. Stond er in een CDATA-blok, een commentaar of
een verwerkingsinstructie iets dat op een tag leek, dan knipte de tool het bestand daar
door en verloor of verminkte zij regels. Dat is nu gescheiden: een tag-achtige tekst
binnen zo'n literaal blok geldt als tekst. Tegelijk is de behandeling van identificaties
gescheiden van die van vrije tekst. Rekeningnummers, dagboek- en relatiecodes
(`accID`, `offsetAccID`, `jrnID`, `custSupID`, `relationshipID`, `vatID` en verwante)
worden ontdaan van opvulspaties, zodat koppelingen tussen tabbladen blijven matchen;
omschrijvingen, namen en referenties blijven letterlijk staan zoals in het bestand.

Sinds diezelfde dag blokkeert een falende test de publicatie.

### 2.3 Meer dan één btw-element per boekingsregel verdween (11 september)

Dit is de zwaarste van de vier. Droeg een boekingsregel meer dan één `<vat>`-element, dan
nam de tool alleen het eerste over en verdwenen de overige btw-code en het overige
btw-bedrag zonder melding. De gebruiker kreeg een bestand dat compleet leek maar dat niet
was, precies op de gegevens die voor een btw-aansluiting nodig zijn. Dit komt voor zodra
het hoge en het lage tarief op dezelfde regel staan, of voorbelasting en af te dragen btw
naast elkaar.

De gekozen vorm is: extra kolommen, geen extra rijen en niets samengevoegd in één cel. Het
eerste element vult de bestaande kolommen; elk volgend element krijgt een eigen blok
achteraan, genummerd vanaf 2. Daarmee blijft elke waarde atomair en numeriek, en blijft de
boekingsregel één rij, zodat de rijtelling, de aansluitcheck en de kolommenbalans
onveranderd blijven. Extra rijen zouden het regelbedrag dupliceren en de aansluitcheck
breken; samenvoegen in één cel zou het btw-bedrag van getal in tekst veranderen.

Heeft geen enkele regel in het bestand meer dan één btw-element, dan is de export exact als
voorheen en verandert er niets.

### 2.4 Het teken bij het btw-bedrag (11 september)

Bij het vorige punt kwam aan het licht dat `vatAmntTp` helemaal niet werd geëxporteerd.
`BTW-bedrag` was daarmee een bedrag zonder teken, terwijl het regelbedrag er wel een heeft.
Op een regel met een debet- en een creditelement naast elkaar telde de export ze op alsof
ze dezelfde kant op wijzen.

Er zijn twee kolommen bij gekomen: `BTW D/C` met de aanduiding zoals zij in het bestand
staat, en `BTW-bedrag getekend` met het bedrag met teken, credit negatief. Dat volgt het
patroon dat `Bedrag (abs)`, `D/C` en `Bedrag` al hadden bij het regelbedrag.

De twee nieuwe kolommen staan achter `Relatie naam` en niet naast `BTW-bedrag`, zodat geen
enkele bestaande kolom van plaats verandert. Een verwijzing naar kolom T of U in een
spreadsheet die op een eerdere export is gebouwd, blijft dus kloppen.

Een ontbrekende of ongeldige aanduiding wordt **niet geraden**: `BTW D/C` toont wat er
werkelijk staat, desnoods niets, en `BTW-bedrag getekend` blijft dan leeg. Stil als debet
meetellen zou een creditbedrag laten optellen alsof het debet was, en juist dat moeten deze
kolommen voorkomen.

### 2.5 Gevolg voor de rijgrens in Excel

Het Mutaties-tabblad wordt boven een grens afgekapt, niet gesplitst; de CSV blijft altijd
volledig. Die grens komt niet uit Excel maar uit SheetJS, dat boven ongeveer vijftien
miljoen cellen per tabblad vastloopt. Het commentaar in de code rekende met 18 kolommen
terwijl het er 21 waren; dat is nageteld en de grens is nu het laagste van 500.000 rijen en
het cellenbudget gedeeld door het gemeten aantal kolommen.

Met de basis op 23 kolommen is 500.000 × 23 = 11.500.000 cellen, een marge van 23,3% op het
budget. Het kantelpunt ligt bij 31 kolommen. Omdat een extra btw-element vijf kolommen kost,
geldt de grens van 500.000 tot en met twee btw-elementen op de breedste regel; bij drie
elementen zakt zij naar 454.545 rijen en bij het theoretische maximum van 99 elementen naar
29.239. Het cellenbudget van ~15 miljoen is een overgenomen aanname uit de oude code en niet
zelf gemeten; zie §6.

## 3. Bronnen en conclusies

| Punt | Conclusie | Vindplaats |
|---|---|---|
| Meerdere btw-elementen per regel | Toegestaan, `minOccurs="0" maxOccurs="99"` op `vat` binnen `trLine`, gelijk in beide versies | `XmlAuditfileFinancieel3.2.xsd` (namespace `http://www.auditfiles.nl/XAF/3.2`) en `XmlAuditfileFinancieel4.0.xsd` uit `XMLAuditfile-Financieel-XAF-v-4.0.3.zip`, Belastingdienst/ODB. Functionele hiërarchie `XMLAuditfileFinancieel_4.0_FunHie.pdf`, XML Platform, 6 februari 2025: pad *company – transactions – journal – transaction – transaction line – VAT*, `0..99, O` |
| `vatAmntTp` | Verplicht binnen `vat`, precies twee waarden `C` en `D`, lengte 1 | Beide XSD's, resp. `TypeDebitcredittype` en `Debitcredittype`; functionele hiërarchie 4.0 van 6 februari 2025, p. 10: "Indicatie of het btw bedrag Debet of Credit is", codelijst DebitCredit. Inhoudelijk geen verschil tussen 3.2 en 4.0; 4.0 voegt alleen een `pattern \D*` toe |
| `effDate` | Geen vervaldatum. XAF 3.2: mutatiedatum. XAF 4.0: datum van uitreiking van de factuur | XMLAuditfile Financieel 4.0.3, functionele hiërarchie en het revisiedocument naar 3.2, Belastingdienst/ODB |
| Vervaldatum | Bestaat alleen als `invDueDt` in de optionele subadministratie van XAF 3.2 (`obSbLine`, `sbLine`), in 4.0 geschrapt | idem |
| Overgang naar XAF 4.0 | Vanaf **1 januari 2027** accepteert de Belastingdienst uitsluitend XAF 4.0 voor aanlevering | Aankondiging ODB, 22 april 2026 |

## 4. Tests en uitkomsten

De rekenkern wordt getest zoals hij in de tool draait: de tests halen het workerscript uit
`index.html` en draaien dat in een geïsoleerde context, met synthetische bytestromen in
plaats van bestanden. Alle XAF-fragmenten in de tests zijn verzonnen; er zit geen
klantmateriaal in.

Gemeten op 16 september 2026 om 18:15 CEST, met node v24.14.0:

```
node --test tests/*.test.mjs   ->   tests 36, pass 36, fail 0
```

Twee bestanden: `tests/xml-text.test.mjs` voor de tekstverwerking (entiteiten, CDATA,
tagherkenning, en het uitdrukkelijke geval dat een DTD nooit wordt uitgevoerd, plus een test
die journaalachtige CDATA over elke mogelijke bytegrens knipt) en `tests/btw-elementen.test.mjs`
voor de btw-kolommen.

Beide reparaties zijn eerst als falende test vastgelegd. Tegen de code van vóór de wijziging
faalde `tests/btw-elementen.test.mjs` met 14 van de 17 gevallen, waaronder alle vier de
gevallen rond de debet/creditaanduiding. Het gebrek is dus aantoonbaar gereproduceerd en niet
alleen gerepareerd.

Sinds 8 september draait de publicatieworkflow de volledige testmap, dus een falende test
blokkeert de publicatie.

## 5. Testberekening

Eén verzonnen verkoopfactuur met twee btw-elementen naast elkaar, doorgerekend op
16 september 2026 met de echte kern uit `index.html` (niet met de hand nagerekend).

**Invoer** — één boekingsregel, rekening 1300, bedrag 1.030,00 debet, met twee
btw-elementen: code `H`, 21%, € 21,00 **credit**, en code `V`, 21%, € 42,00 **debet**.

**Verwacht** — beide elementen komen mee; het creditbedrag komt negatief in de
getekende kolom, het debetbedrag positief.

**Werkelijke uitkomst van de tool:**

| Kolom | Waarde |
|---|---|
| Bedrag (abs) · D/C · Bedrag | 1030 · D · 1030 |
| BTW-code · BTW-bedrag · BTW-% | H · 21 · 21 |
| BTW D/C · BTW-bedrag getekend | C · **−21** |
| BTW-code 2 · BTW-bedrag 2 · BTW-% 2 | V · 42 · 21 |
| BTW D/C 2 · BTW-bedrag getekend 2 | D · **42** |

Optellen van de kolommen zonder teken geeft hier 63; met de getekende kolommen komt het
saldo van 21 eruit. Vóór deze ronde zou het tweede element helemaal niet in de export
hebben gestaan.

## 6. Open punten

- **Het cellenbudget van ~15 miljoen is niet zelf gemeten.** Het is een aanname uit de
  oudere code over de grens waarboven SheetJS vastloopt. De afgeleide rijgrenzen kloppen
  rekenkundig, maar het uitgangspunt zelf verdient een meting met een echt groot bestand.
- **De rijgrens is een afkapping, geen splitsing.** Boven de grens bevat het
  Mutaties-tabblad de eerste N regels en waarschuwt de tool; de CSV blijft volledig. De
  vraag of afkappen met waarschuwing hier de juiste keuze is, of dat splitsen over meerdere
  tabbladen beter past bij het gebruik op jouw platform, ligt open.
- **De subadministratie van XAF 3.2 wordt niet gelezen.** Daar zit onder meer `invDueDt`,
  de enige echte vervaldatum in de standaard. Voor een ouderdomsanalyse op een 3.2-bestand
  zou dat blok nodig zijn. Bewust niet gebouwd, omdat het blok optioneel is en in 4.0
  verdwijnt.
- **Geen testbestand met meervoudige btw uit de praktijk.** De ondersteuning rust op de XSD
  en op verzonnen fragmenten. Een echt bestand van een pakket dat dit produceert zou het
  bewijs sluiten. Als jij daar via het platform aan kunt komen, houden wij ons aanbevolen.
