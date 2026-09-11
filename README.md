# XAF Raw Export Tool

Een standalone HTML-tool die XAF-auditfiles (XML Auditfile Financieel) inleest en exporteert naar Excel of CSV. Geen installatie, geen server — gewoon de browser.

**Live op [xaf.bouwman.tools](https://xaf.bouwman.tools)** — onderdeel van het [bouwman.tools](https://bouwman.tools) platform.

---

## Gebruik

1. Open de tool via [xaf.bouwman.tools](https://xaf.bouwman.tools)
2. Sleep één of meerdere `.xaf` / `.xml` bestanden op het dropgebied (of klik om te bladeren)
3. Wacht tot de voortgangsbalk klaar is — de tool toont het aantal rekeningen, mutatieregels en of debet = credit aansluit
4. Kies optioneel welke **perioden** je wilt exporteren via de klikbare chips
5. Klik **Download Excel** of **Download CSV**

### Gesplitste bestanden (Exact Globe Next)

Exact Globe Next splitst grote exports in meerdere bestanden (bijv. `_0.XAF` met stamgegevens en `_1.XAF` met mutaties). Selecteer alle bestanden tegelijk — de tool voegt ze automatisch samen. Rekening­omschrijvingen en relaties uit het stamgegevens­bestand worden ook correct toegepast op mutaties uit de vervolgbestanden.

---

## Output — tabbladen in Excel

| Tabblad | Inhoud |
|---|---|
| Bedrijfsgegevens | Naam, KvK, BTW, boekjaar, software, XAF-versie |
| Grootboekrekeningen | accID, omschrijving, type, RGScode (4.0) / leadCode (3.2) — gesorteerd op rekeningnummer |
| BTW-codes | vatID, omschrijving, rekeningen — gesorteerd |
| Beginsaldi | Openingssaldi per grootboekrekening — gesorteerd op rekeningnummer |
| Deb / Cred | Debiteur/crediteur stamgegevens (indien aanwezig) — gesorteerd |
| Kolommenbalans | Beg.saldo Debet/Credit, Mutaties Debet/Credit, Eindsaldo Debet/Credit en **Saldo** per rekening — gesorteerd |
| Mutaties | Alle journaalregels met dagboek, transactie, rekening + omschrijving, relatie en BTW |
| Aansluitcheck | Alleen aanwezig bij individuele onbalans; bovenaan het bestandsniveau |

Alle tabbladen met rekeningnummers zijn gesorteerd op rekeningnummer (numeriek).

### Kolommen in het Mutaties-tabblad

`Journaal ID` · `Journaal omschrijving` · `Journaal type` · `Transactie nr.` · `Transactie omschrijving` · `Periode` · `Datum` · `Regelnr.` · `Rekening` · `Omschrijving rekening` · `Doc. referentie` · `Effectieve datum` · `Boekingsomschrijving` · `Bedrag (abs)` · `D/C` · `Bedrag` · `BTW-code` · `BTW-bedrag` · `BTW-%` · `Relatie ID` · `Relatie naam` · `BTW D/C` · `BTW-bedrag getekend`

`Omschrijving rekening` bevat de naam van de grootboekrekening; `Relatie ID` en `Relatie naam` bevatten de gekoppelde debiteur of crediteur (indien aanwezig op die boekingsregel).

### Meerdere btw-elementen op een boekingsregel

Een boekingsregel mag volgens de XAF-standaard meer dan een btw-element dragen: op
`vat` binnen `trLine` staat `minOccurs="0" maxOccurs="99"`. Dat geldt in beide versies
die de tool leest, en het komt voor zodra het hoge en het lage tarief op dezelfde regel
staan.

> **Vindplaats.** XAF 3.2: `XmlAuditfileFinancieel3.2.xsd`, namespace
> `http://www.auditfiles.nl/XAF/3.2`, `vat` binnen `trLine`. XAF 4.0:
> `XmlAuditfileFinancieel4.0.xsd` uit `XMLAuditfile-Financieel-XAF-v-4.0.3.zip`
> van Belastingdienst/ODB, zelfde cardinaliteit. De functionele hiërarchie bij die
> uitgave, `XMLAuditfileFinancieel_4.0_FunHie.pdf` van het XML Platform, 6 februari
> 2025, noemt het pad `company - transactions - journal - transaction - transaction
> line - VAT` met `0..99, O` en de omschrijving "Geeft de mogelijkheid om de BTW te
> specificeren van een journaalpost".

Het eerste btw-element vult de kolommen `BTW-code`, `BTW-bedrag`, `BTW-%`, `BTW D/C` en
`BTW-bedrag getekend`. Bevat een regel in het bestand meer elementen, dan komen daar per
extra element vijf kolommen achter: `BTW-code 2`, `BTW-bedrag 2`, `BTW-% 2`,
`BTW D/C 2`, `BTW-bedrag getekend 2`, vervolgens `BTW-code 3` enzovoort. Het aantal
extra kolommen volgt de breedste regel in het bestand; regels met minder elementen
houden daar lege cellen. Heeft geen enkele regel meer dan een btw-element, dan zijn de
kolommen exact die hierboven en verandert er niets aan de export.

De boekingsregel blijft een rij. Het aantal mutatieregels, de aansluitcheck en de
kolommenbalans veranderen dus niet door meervoudige btw.

### Het teken bij het btw-bedrag

`BTW-bedrag` is het bedrag zoals het in het bestand staat, zonder teken. Het XAF-element
`vatAmntTp` zegt of dat bedrag debet of credit is, en dat staat sinds deze versie in twee
eigen kolommen: `BTW D/C` toont de aanduiding ongewijzigd zoals zij in het bestand staat,
en `BTW-bedrag getekend` is het bedrag met teken, credit negatief. Dat is hetzelfde
patroon als `Bedrag (abs)`, `D/C` en `Bedrag` bij het regelbedrag.

Dat maakt verschil op een regel die een debet- en een creditelement naast elkaar draagt.
Optellen van de kolommen zonder teken telt die twee dan dezelfde kant op; met
`BTW-bedrag getekend` komt het saldo eruit.

> **Vindplaats.** `vatAmntTp` is binnen `vat` verplicht en kent precies twee waarden:
> `<xsd:element name="vatAmntTp" type="str:TypeDebitcredittype"/>`, zonder `minOccurs`,
> met `<xsd:length value="1"/>` en de opsomming `C` en `D`. Zo staat het in
> `XmlAuditfileFinancieel4.0.xsd` uit `XMLAuditfile-Financieel-XAF-v-4.0.3.zip` van
> Belastingdienst/ODB, en gelijkluidend in `XmlAuditfileFinancieel3.2.xsd` (namespace
> `http://www.auditfiles.nl/XAF/3.2`, type `Debitcredittype`). De functionele hiërarchie
> `XMLAuditfileFinancieel_4.0_FunHie.pdf`, versie 4.0 van 6 februari 2025, pagina 10,
> omschrijft het als "Indicatie of het btw bedrag Debet of Credit is" met de codelijst
> DebitCredit, `C` Credit en `D` Debit. Tussen XAF 3.2 en 4.0 verschilt het element
> inhoudelijk niet.

Omdat de aanduiding verplicht is, hoort zij er altijd te staan. Doet een pakket dat toch
niet, of staat er iets anders dan `C` of `D`, dan raadt de tool niet: `BTW D/C` toont wat
er werkelijk in het bestand stond, desnoods niets, en `BTW-bedrag getekend` blijft leeg.
Een ontbrekende aanduiding stil als debet meetellen zou een creditbedrag laten optellen
alsof het debet was, en juist dat moeten deze kolommen voorkomen.

---

## Beginsaldi niet in auditfile

Sommige pakketten (waaronder Microsoft Dynamics NAV) leveren geen beginsaldi mee in de auditfile. De tool detecteert dit automatisch:

- De stat-card **Beginsaldi** toont `— / Niet in auditfile`
- Een gele waarschuwing verschijnt direct onder de stat-cards
- In de Excel staat in het tabblad **Bedrijfsgegevens** een extra rij: `Beginsaldi | Niet opgenomen in auditfile`
- Het tabblad **Beginsaldi** bevat een tekstmelding in plaats van een lege tabel

---

## Grote bestanden

De tool is geoptimaliseerd voor bestanden van honderden MB tot meerdere GB:

- Verwerking in een **Web Worker** (UI blijft responsief)
- **Streaming inlezen**: het bestand wordt chunk voor chunk verwerkt — nooit het volledige bestand tegelijk in geheugen
- Automatische detectie van UTF-8 en UTF-16 (BOM)
- Voortgangsbalk toont percentage gelezen bytes + aantal dagboeken + mutatieregels

### Excel-limieten bij grote bestanden

Het Mutaties-tabblad wordt boven de grens **afgekapt, niet gesplitst**. De CSV blijft
altijd volledig.

| Regels | Gedrag |
|---|---|
| ≤ 500.000 | Volledige export naar Excel |
| > 500.000 | Excel bevat de eerste 500.000 mutatieregels; waarschuwing zichtbaar, analysevenster verschijnt en de melding na de download noemt hoeveel regels zijn weggelaten. Gebruik CSV voor het volledige bestand |
| > 1.000.000 | Na CSV-download: tip om Power Query of Power BI te gebruiken |

De grens van 500.000 komt niet uit Excel zelf maar uit SheetJS, dat boven ongeveer
vijftien miljoen cellen per tabblad vastloopt. Een mutatieregel heeft drieëntwintig
kolommen, dus 500.000 regels is 11,5 miljoen cellen. Draagt een bestand extra
btw-kolommen (zie hierboven), dan schuift de grens mee omlaag zodra de regel breder
wordt dan dertig kolommen, zodat het cellenbudget gelijk blijft. In de praktijk betekent
dat: tot en met twee btw-elementen op de breedste regel blijft de grens 500.000, bij drie
elementen zakt zij naar 454.545 regels.

---

## Analysevenster (verschijnt automatisch bij grote bestanden)

Bij meer dan 500.000 mutatieregels verschijnt onder de downloadknoppen automatisch een analysevenster met twee secties.

### Samenvatting

**Download kolommenbalans** — exporteert alleen de samenvattende tabbladen (bedrijfsgegevens, rekeningen, beginsaldi, BTW-codes, deb/cred en kolommenbalans). Altijd klein, ongeacht bestandsgrootte.

### Exporteer per rekening

Maak een gerichte selectie en download alleen wat je nodig hebt:

1. Kies één of meer rekeningen uit de lijst — **Ctrl+klik** selecteert meerdere tegelijk, **Shift+klik** een aaneengesloten reeks
2. Klik **+ Voeg toe** — alle geselecteerde rekeningen verschijnen als chips
3. Voeg indien gewenst meer rekeningen toe
4. Typ optioneel een zoekterm om te filteren op boekingsomschrijving of relatienaam
5. Combineer met de **periodefilter** bovenaan voor extra verfijning

Direct zichtbaar: een mini-kolommenbalans per rekening met beg.saldo, mutaties debet/credit, eindsaldo en **saldo**, gevolgd door een preview van de eerste 10 mutatieregels.

**Download als 1 Excel** — alle geselecteerde rekeningen in één bestand (geblokkeerd bij > 500.000 regels).

**Download per rekening (losse bestanden)** — downloadt automatisch één Excel per geselecteerde rekening, elk benoemd als `[bestandsnaam]_rek[nummer].xlsx`. De periodefilter wordt meegenomen. Elk bestand bevat een Bedrijfsgegevens-tab (inclusief eventuele beginsaldi-opmerking).

---

## Extra functies

- **Aansluitcheck**: direct na inlezen zie je of debet = credit aansluit op bestandsniveau
- **Kolommenbalans**: beg.saldo + mutaties + eindsaldo + saldo per rekening, gefilterd op geselecteerde perioden
- **Periodefilter**: klikbare chips; live teller toont hoeveel regels de selectie oplevert
- **CSV-download**: alle mutatieregels als puntkomma-gescheiden CSV met UTF-8 BOM — opent direct correct in Nederlandse Excel

---

## XAF-versies

Ondersteunt **XAF 3.1**, **XAF 3.2** en **XAF 4.0**. Vanaf **1 januari 2027**
accepteert de Belastingdienst uitsluitend XAF 4.0 voor aanlevering; dat is
aangekondigd door ODB op 22 april 2026. Oudere versies blijven relevant voor
historische dossiers, en voor analyse zelfs rijker: zie de datumsemantiek
hieronder.

> **Datums per versie.** De kolom `Effectieve datum` bevat het XAF-element
> `effDate`, en dat betekent niet in beide versies hetzelfde: in XAF 3.2 is het de
> mutatiedatum (de datum waarop het evenement plaatsvond), in XAF 4.0 de datum
> waarop de factuur is uitgereikt. Het is in geen van beide versies een
> vervaldatum. Een vervaldatum bestaat alleen in de optionele subadministratie van
> XAF 3.2 (`invDueDt` in `obSbLine` en `sbLine`), die XAF 4.0 heeft geschrapt.
> `settDate` in 4.0 is ook geen vervaldatum maar de leverdatum of de datum van een
> vooruitbetaling. Bron: XMLAuditfile Financieel 4.0.3, functionele hiërarchie en
> het revisiedocument naar 3.2, Belastingdienst/ODB.

> **XAF 3.1 (Exact Globe Next)**: in bank- en verkoopboeken exporteert Exact de tegenrekening niet als afzonderlijke boekingsregel maar via `offsetAccID`. Individuele transacties lijken daardoor niet in balans, maar het bestand als geheel sluit wel. De tool detecteert dit correct.

---

## Privacy

Volledig client-side: geen data wordt verstuurd naar een server. Het bestand blijft in de browser.

---

## Technisch

- Puur client-side HTML/JS — geen backend, geen installatie
- Afhankelijkheid: [SheetJS (xlsx)](https://sheetjs.com/) via CDN
- Compatibel met Chrome, Edge en Firefox
- Gehost via Cloudflare op [xaf.bouwman.tools](https://xaf.bouwman.tools)
