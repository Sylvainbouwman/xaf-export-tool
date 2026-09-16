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

### 2.5 De rijgrens in Excel opnieuw gemeten (16 september 2026, zie §6)

De grens waarboven het Mutaties-tabblad niet meer in één Excel-bestand past, stond tot
16 september 2026 op 500.000 rijen, afgeleid van een aanname dat SheetJS boven ongeveer
vijftien miljoen cellen per tabblad vastloopt. Die aanname is gemeten en bleek onjuist —
zie §6. De grens is nu 50.000 rijen bij de basis van 23 kolommen, met dezelfde rekenwijze
als voorheen: het laagste van een vast aantal rijen (ROW_CAP) en een cellenbudget
(CELL_CAP) gedeeld door het gemeten aantal kolommen. Omdat het cellenbudget nu op
1.150.000 staat (23 × 50.000), verlaagt elk extra btw-element de grens al meteen, in
plaats van pas na twee of vier elementen zoals voorheen: bij drie btw-elementen op de
breedste regel (33 kolommen) is de grens 34.848 rijen, bij het theoretische maximum van
99 elementen (513 kolommen) 2.241 rijen.

### 2.6 Boven de rijgrens: CSV geadviseerd, Excel gesplitst als bewuste tweede keuze (16 september 2026)

Vervolg op 2.5, op verzoek van Sylvain. Twee uitgangspunten die hij expliciet heeft
vastgelegd: de 50.000-grens raakt uitsluitend één Excel-exportbestand van de huidige
SheetJS-opzet, nooit het inlezen van de auditfile of de CSV-export (die blijven altijd
volledig, ook boven de grens); en het opsplitsen van een groot bestand mag niet
automatisch gebeuren zodra de grens wordt overschreden.

Het gedrag boven 50.000 mutatieregels is daarom:

1. De knop **Download Excel** downloadt niet meteen, maar toont een adviesblok met het
   werkelijke aantal regels, de grens en het aantal bestanden dat Excel nodig zou hebben.
2. Klikt de gebruiker op **Download CSV** in dat adviesblok, dan krijgt hij het volledige
   bestand in één stuk — de aanbevolen route.
3. Klikt hij op **Toch Excel gebruiken**, dan wordt de export alsnog gemaakt, verdeeld
   over meerdere `.xlsx`-bestanden van elk maximaal 50.000 mutatieregels
   (`[bestandsnaam]_deel1_van_N.xlsx`, `_deel2_van_N.xlsx`, …). Elk deelbestand krijgt
   dezelfde Bedrijfsgegevens-, Grootboekrekeningen-, BTW-codes-, Beginsaldi-, Deb_Cred-,
   Kolommenbalans- en Aansluitcheck-tabbladen als het ongesplitste bestand; alleen het
   Mutaties-tabblad verschilt per deel.
4. Onder de 50.000 regels verandert er niets: één druk op **Download Excel** geeft
   meteen één bestand, zoals altijd.

Waarom niet gewoon meerdere tabbladen in één werkboek? Dat is eerst gemeten en bleek
geen oplossing: SheetJS schrijft het hele werkboek in één keer weg, dus het
geheugenprobleem van §6 geldt over alle tabbladen samen. Alleen losse bestanden, elk met
hun eigen schrijfactie en een korte pauze ertussen, houden het geheugengebruik laag —
getest tot 1.000.000 regels in 20 bestanden, zonder dat het opliep. Dit is dezelfde
aanpak die "Download per rekening (losse bestanden)" al gebruikte, nu toegepast op
blokken regels in plaats van op rekeningen.

### 2.7 Van celbudget naar tekenbudget, met terugval tijdens het exporteren (16 september 2026, avond)

Vervolg op 2.5/2.6, op verzoek van Sylvain, aangedragen via een andere sessie en in dit
gesprek bevestigd voordat er iets is gebouwd. De 50.000-rijengrens uit 2.5 rekende nog
in cellen (rijen × kolommen). Diezelfde dag was echter al vastgesteld dat het celaantal
zelf geen betrouwbare voorspeller is: bij 33 kolommen (2 extra, korte en numerieke
btw-kolommen) haalde de tool 137.500 regels probleemloos, met meer cellen dan de
140.000-regelsgrens bij 23 kolommen die al vastliep (zie 2.5). Eén vast getal moest dus
altijd rekening houden met het zwaarste geval, waardoor elk bestand de prijs van de
langste omschrijvingen betaalde, ook als het zelf uit korte, uniforme velden bestond.

**Nagerekend op tekens in plaats van cellen.** Met dezelfde synthetische rijen als de
meting in 2.5:

| Geval | Rijen | Kolommen | Totaal tekens | Uitkomst |
|---|---|---|---|---|
| Gangbare tekst | 137.500 | 23 | ≈ 34,63 miljoen | Goed |
| Gangbare tekst | 137.500 | 33 (2 extra btw) | ≈ 34,63 miljoen | Goed |
| Gangbare tekst | 140.000 | 23 | ≈ 35,26 miljoen | Fout |
| Drie tekstvelden 200 tekens langer | 100.000 | 23 | ≈ 85,4 miljoen | Fout |

De twee 137.500-regelsgevallen (23 én 33 kolommen, allebei goed) komen op vrijwel
hetzelfde tekental uit, ook al verschilt het celaantal fors. Tekens voorspellen het
omslagpunt dus consistent over verschillende kolombreedtes, cellen niet.

**Nieuwe grens: een tekenbudget van 12.000.000 tekens per Excel-bestand** (`CHAR_BUDGET`
in `index.html`), met bijna 3× marge onder het gemeten omslagpunt van ~35 miljoen — dezelfde
orde van marge als het 50.000-besluit in 2.5. De tool telt de werkelijke tekenlengte van de
rijen die daadwerkelijk geëxporteerd worden (bij 20.000 regels of minder volledig, anders een
steekproef verspreid over het hele bestand) en leidt daaruit de rijencap af. Bij de gemeten
gangbare tekstlengte (≈ 252 tekens/regel) komt dat neer op ≈ 47.600 regels per bestand — in
dezelfde orde als de eerdere 50.000, maar nu schaalt de grens mee met de werkelijke inhoud
van elk specifiek bestand in plaats van met een vast aantal kolommen.

**Terugval tijdens het exporteren.** Mislukt het schrijven van een deelbestand toch
(minder werkgeheugen op de machine van de gebruiker dan de testbrowser, of tekst die nog
veel langer is dan hier gemeten), dan vangt de tool die fout op, halveert de omvang van
dát ene deel en probeert opnieuw, tot een ondergrens van 500 regels (`MIN_ROWS_PER_PART`).
Een eenmaal verkleinde omvang blijft ook voor de volgende delen gelden, in plaats van
telkens weer op de oorspronkelijke schatting te proberen. Zo past de grens zich tijdens
de export aan de machine van de gebruiker aan, in plaats van vooraf op de testbrowser te
gokken. Elke poging en elke halvering is zichtbaar in de statusmelding; er is geen stille
vertraging. Omdat het uiteindelijke aantal delen hierdoor niet meer vooraf vaststaat,
heten de bestanden voortaan `_deel1.xlsx`, `_deel2.xlsx`, … zonder aangekondigd totaal
(voorheen `_deel1_van_N.xlsx`).

Uitdrukkelijk niet gedaan: de schrijver vervangen door een streaming-bibliotheek zoals
ExcelJS. Dat is een eigen traject, niet deze opdracht.

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

Gemeten op 16 september 2026, met node v24.14.0:

```
node --test tests/*.test.mjs   ->   tests 41, pass 41, fail 0
```

Twee bestanden: `tests/xml-text.test.mjs` voor de tekstverwerking (entiteiten, CDATA,
tagherkenning, en het uitdrukkelijke geval dat een DTD nooit wordt uitgevoerd, plus een test
die journaalachtige CDATA over elke mogelijke bytegrens knipt) en `tests/btw-elementen.test.mjs`
voor de btw-kolommen, de rijgrens en de gesplitste Excel-export. `excelRowCap`, `rijTekens` en
`schatTotaalTekens` (het tekenbudget, zie §2.7) en `partCount`/`splitRows` (het aantal
deelbestanden en de verdeling zelf) worden letterlijk uit `index.html` gehaald en los gedraaid,
met tests op: de rijencap bij een precies gecontroleerde tekenlengte (met de hand na te
rekenen), de ondergrens van 500 regels bij extreem lange tekst, lege en tekstloze invoer, het
verschil tussen volledig tellen en een steekproef, het aantal deelbestanden bij ronde en
net-over-de-grens aantallen, en het feit dat samenvoegen van de delen exact de oorspronkelijke
rijen teruggeeft, in dezelfde volgorde, zonder verlies of duplicatie.

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

- **Opgelost op 16 september 2026: het cellenbudget van ~15 miljoen was niet zelf gemeten
  en bleek onjuist.** Het was een aanname uit oudere code over de grens waarboven SheetJS
  vastloopt. Gemeten in een browser, met dezelfde SheetJS-versie (0.18.5) als de tool via
  het CDN laadt, en met synthetische mutatieregels (geen klantmateriaal): er bestaat geen
  harde celgrens in SheetJS, ook niet in de documentatie van de bibliotheek. De export
  loopt vast op het werkgeheugen van het browsertabblad, met een `RangeError` tijdens het
  wegschrijven. Bij 23 kolommen en gangbare tekstlengte lag het omslagpunt tussen 137.500
  regels (nog goed) en 140.000 regels (loopt vast) — rond de 3,2 miljoen cellen, niet 15
  miljoen. De uitkomst is bovendien contentafhankelijk en niet alleen een functie van het
  celaantal: dezelfde 100.000 regels die met gangbare tekst wel lukten, liepen alsnog vast
  toen drie tekstvelden 200 tekens langer werden gemaakt. Sylvain heeft op basis daarvan een
  nieuwe grens van 50.000 regels bij 23 kolommen gekozen — ruim (bijna 3×) onder het gemeten
  omslagpunt, als marge voor langere omschrijvingen dan de testdata en voor computers met
  minder werkgeheugen dan de testbrowser. Vastgelegd in `index.html` (ROW_CAP/CELL_CAP) en
  in de README; zie §2.5 voor het effect op de rijgrenzen bij meerdere btw-elementen.
- **Opgelost op 16 september 2026: de rijgrens was een afkapping, geen splitsing.** Eerst
  onderzocht (meerdere tabbladen in één werkboek: geen verbetering, want SheetJS schrijft
  het hele werkboek in één keer weg; meerdere losse bestanden: werkt wel, getest tot
  1.000.000 regels zonder dat het geheugengebruik opliep), daarna op verzoek van Sylvain
  gebouwd. Boven de 50.000-grens adviseert de tool nu eerst CSV; kiest de gebruiker
  bewust voor Excel, dan volgt de gesplitste export. Zie §2.6.
- **Opgelost op 16 september 2026 (avond): de grens was nog één vaste waarde die niet
  meekeek naar de werkelijke tekstlengte.** Precies het punt hierboven, en op verzoek van
  Sylvain in dezelfde avond gebouwd. De grens rekent nu in tekens (het werkelijke aantal,
  gemeten of op een steekproef geschat) in plaats van in cellen, en de tool vangt daarnaast
  een mislukt deelbestand op: hij halveert de omvang van dat deel en probeert opnieuw, tot
  een ondergrens van 500 regels, zodat de grens zich tijdens de export ook aanpast aan
  computers met minder geheugen dan de testbrowser. Zie §2.7.
- **De subadministratie van XAF 3.2 wordt niet gelezen.** Daar zit onder meer `invDueDt`,
  de enige echte vervaldatum in de standaard. Voor een ouderdomsanalyse op een 3.2-bestand
  zou dat blok nodig zijn. Bewust niet gebouwd, omdat het blok optioneel is en in 4.0
  verdwijnt.
- **Geen testbestand met meervoudige btw uit de praktijk.** De ondersteuning rust op de XSD
  en op verzonnen fragmenten. Een echt bestand van een pakket dat dit produceert zou het
  bewijs sluiten. Als jij daar via het platform aan kunt komen, houden wij ons aanbevolen.
