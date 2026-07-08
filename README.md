# XAF Raw Export Tool

Een standalone HTML-tool die XAF-auditfiles (XML Auditfile Financieel) inleest en exporteert naar Excel of CSV. Geen installatie, geen server — gewoon het HTML-bestand openen in een browser.

**Live op [xaf.bouwman.tools](https://xaf.bouwman.tools)** — onderdeel van het [bouwman.tools](https://bouwman.tools) platform.

## Gebruik

1. Open de tool via [xaf.bouwman.tools](https://xaf.bouwman.tools)
2. Klik op het dropgebied of sleep één of meerdere `.xaf` / `.xml` bestanden erin
3. Wacht tot de voortgangsbalk klaar is
4. Kies optioneel welke perioden je wilt exporteren via de periodefilter
5. Klik **Download Excel** of **Download CSV**

### Gesplitste bestanden (Exact Globe Next)

Exact Globe Next splitst grote XAF-exports in meerdere bestanden (bijv. `_0.XAF` met stamgegevens en `_1.XAF` met mutaties). Selecteer beide bestanden tegelijk — de tool voegt ze automatisch samen.

## Output (tabbladen)

| Tabblad | Inhoud |
|---|---|
| Bedrijfsgegevens | Naam, KvK, BTW, boekjaar, software, XAF-versie |
| Grootboekrekeningen | accID, omschrijving, type, RGScode (4.0) / leadCode (3.2) |
| BTW-codes | vatID, omschrijving, rekeningen |
| Beginsaldi | Openingssaldi per grootboekrekening |
| Deb_Cred | Debiteur/crediteur stamgegevens (indien aanwezig) |
| Kolommenbalans | Beginsaldo, mutaties en eindsaldo per rekening (D/C) |
| Mutaties | Alle journaalregels met dagboek, transactie en BTW-info |
| Aansluitcheck | Overzicht per transactie (alleen aanwezig als er individuele verschillen zijn) |

Bij meer dan 1.000.000 mutatieregels wordt het Mutaties-tabblad automatisch gesplitst.

## Extra functies

- **Aansluitcheck**: direct na het inlezen zie je of het totaal debet = credit aansluit. De badge toont het bestandsniveau; het Aansluitcheck-tabblad in Excel toont details per transactie.
- **Kolommenbalans**: per grootboekrekening het beginsaldo (uit de beginsaldi), de mutaties (gefilterd op geselecteerde perioden) en het resulterende eindsaldo.
- **Periodefilter**: selecteer welke perioden je wilt exporteren via klikbare chips. Een live teller toont hoeveel mutatieregels de selectie oplevert.
- **CSV-download**: exporteert het Mutaties-tabblad als puntkomma-gescheiden CSV met UTF-8 BOM — opent direct correct in Nederlandse Excel.

## Grote bestanden

De tool is geoptimaliseerd voor bestanden van 700 MB en groter:

- Verwerking draait in een **Web Worker** (UI blijft responsief)
- XML wordt **per dagboek** geparsed — nooit het volledige bestand als één DOM
- Voortgangsbalk toont dagboeken verwerkt en aantal mutatieregels
- Bij meerdere bestanden: voortgang per bestand zichtbaar

## XAF-versies

Ondersteunt **XAF 3.1**, **XAF 3.2** en **XAF 4.0** (verplicht vanaf 1 januari 2026).

> **XAF 3.1 (Exact Globe Next)**: in bank- en verkoopboeken exporteert Exact de tegenrekening niet als afzonderlijke boekingsregel maar via `offsetAccID`. Individuele transacties lijken daardoor niet in balans, maar het bestand als geheel sluit wel. De tool detecteert dit correct.

## Privacy

Volledig client-side: geen data wordt verstuurd naar een server. Het bestand blijft in je browser.

## Technisch

- Puur client-side: geen backend, geen server
- Afhankelijkheid: [SheetJS (xlsx)](https://sheetjs.com/) via CDN
- Compatibel met Chrome, Edge en Firefox
- Gehost via GitHub Pages op xaf.bouwman.tools
