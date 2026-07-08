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

Exact Globe Next splitst grote exports in meerdere bestanden (bijv. `_0.XAF` met stamgegevens en `_1.XAF` met mutaties). Selecteer alle bestanden tegelijk — de tool voegt ze automatisch samen.

---

## Output — tabbladen in Excel

| Tabblad | Inhoud |
|---|---|
| Bedrijfsgegevens | Naam, KvK, BTW, boekjaar, software, XAF-versie |
| Grootboekrekeningen | accID, omschrijving, type, RGScode (4.0) / leadCode (3.2) — gesorteerd op rekeningnummer |
| BTW-codes | vatID, omschrijving, rekeningen — gesorteerd |
| Beginsaldi | Openingssaldi per grootboekrekening — gesorteerd op rekeningnummer |
| Deb / Cred | Debiteur/crediteur stamgegevens (indien aanwezig) — gesorteerd |
| Kolommenbalans | Beginsaldo, mutaties en eindsaldo per rekening (D/C) — gesorteerd |
| Mutaties | Alle journaalregels met dagboek, transactie, rekening + omschrijving, relatie en BTW |
| Aansluitcheck | Alleen aanwezig bij individuele onbalans; bovenaan het bestandsniveau |

Alle tabbladen met rekeningnummers zijn gesorteerd op rekeningnummer (numeriek).

### Kolommen in het Mutaties-tabblad

`jrnID` · `jrn_desc` · `jrnTp` · `tx_nr` · `tx_desc` · `tx_periodNumber` · `tx_trDt` · `line_nr` · `line_accID` · **`line_accDesc`** · `line_docRef` · `line_effDate` · `line_desc` · `line_amnt` · `line_amntTp` · `bedrag` · `vatID` · `vatAmnt` · `vatPerc` · **`custSupID`** · **`custSupName`**

Vetgedrukt = recent toegevoegd. `line_accDesc` bevat de rekeningomschrijving; `custSupID` en `custSupName` bevatten de gekoppelde debiteur of crediteur.

---

## Grote bestanden

De tool is geoptimaliseerd voor bestanden van honderden MB tot meerdere GB:

- Verwerking in een **Web Worker** (UI blijft responsief)
- **Streaming inlezen**: het bestand wordt chunk voor chunk verwerkt — nooit het volledige bestand tegelijk in geheugen
- Automatische detectie van UTF-8 en UTF-16 (BOM)
- Voortgangsbalk toont percentage gelezen bytes + aantal dagboeken + mutatieregels

### Excel-limieten bij grote bestanden

| Regels | Gedrag |
|---|---|
| ≤ 500.000 | Normaal Excel-bestand |
| 500.001 – 1.000.000 | Mutaties gesplitst over meerdere tabs |
| > 500.000 | Waarschuwing zichtbaar + analysevenster verschijnt |
| > 1.000.000 | Na CSV-download: tip om Power Query of Power BI te gebruiken |

---

## Analysevenster (verschijnt automatisch bij grote bestanden)

Bij meer dan 500.000 mutatieregels verschijnt onder de downloadknoppen automatisch een analysevenster met twee secties.

### Samenvatting

**Download kolommenbalans** — exporteert alleen de samenvattende tabbladen (bedrijfsgegevens, rekeningen, beginsaldi, BTW-codes, deb/cred en kolommenbalans). Altijd klein, ongeacht bestandsgrootte.

### Exporteer per rekening

Maak een gerichte selectie en download alleen wat je nodig hebt:

1. Kies een rekening uit de dropdown (bevat alle rekeningen met mutaties, gesorteerd)
2. Klik **+ Voeg toe** — de rekening verschijnt als chip
3. Voeg meerdere rekeningen toe indien gewenst
4. Typ optioneel een zoekterm om te filteren op boekingsomschrijving of relatienaam
5. Combineer met de **periodefilter** bovenaan voor extra verfijning

Direct zichtbaar: aantal regels, debet/credit totalen en of de selectie aansluit (✓ / ⚠).
Een preview toont de eerste 10 regels.

**Download als 1 Excel** — alle geselecteerde rekeningen in één bestand (geblokkeerd bij > 500.000 regels).

**Download per rekening (losse bestanden)** — downloadt automatisch één Excel per geselecteerde rekening, elk benoemd als `[bestandsnaam]_rek[nummer].xlsx`. De periodefilter wordt meegenomen.

---

## Extra functies

- **Aansluitcheck**: direct na inlezen zie je of debet = credit aansluit op bestandsniveau
- **Kolommenbalans**: beginsaldo + mutaties (gefilterd op geselecteerde perioden) + eindsaldo per rekening
- **Periodefilter**: klikbare chips; live teller toont hoeveel regels de selectie oplevert
- **CSV-download**: alle mutatieregels als puntkomma-gescheiden CSV met UTF-8 BOM — opent direct correct in Nederlandse Excel

---

## XAF-versies

Ondersteunt **XAF 3.1**, **XAF 3.2** en **XAF 4.0** (verplicht vanaf 1 januari 2026).

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
