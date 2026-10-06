# Openstaande punten — xaf-export-tool

Formaat: per punt

> Dit document is de bron voor de openstaande punten van deze tool. Elk punt heeft een
> status (open of gesloten), een eigenaar (Sylvain of sessie) en een vindplaats. Een
> gesloten punt blijft staan, met datum en reden. Het overzicht in
> `AI_kopgroep/OPEN-PUNTEN.md` leest de regel "Formaat: per punt" hierboven en toont dan
> alleen de open punten met eigenaar Sylvain. Wat een sessie zelf kan doen, staat hier
> wel maar niet in dat overzicht.
>
> De terugkoppeling aan Bram (`update-bram-xaf-export-tool.md`) en de vrijgavenotitie in
> deze map zijn verslag. Een punt dat daarin nog open staat, hoort hier.
>
> Omgezet naar deze vorm op 04-10-2026 23:26 CEST. De tekst van daarvoor, een tabel, staat in de
> Git-historie (laatste versie in commit 3ff0149). De 2 bestaande punten staan hieronder
> woordelijk met hun bestaande nummer. Punten 3 t/m 7 zijn bij de omzetting toegevoegd uit
> de twee actiedocumenten van deze map (`update-bram-xaf-export-tool.md` en
> `vrijgave-xaf-export-tool-2026-09-29-kopbalk.md`). Waar elk punt uit die documenten is
> gebleven staat in `omzetting-actiedocumenten-2026-10-04.md`. Nummers worden nooit hergebruikt.

## Open

### 4. De subadministratie van XAF 3.2 wordt niet gelezen
- **Status:** open, bewuste beperking, als achtergrond gemarkeerd op 04-10-2026
- **Eigenaar:** sessie
- **Vindplaats:** `update-bram-xaf-export-tool.md`, r.297 (§6)

De subadministratie van XAF 3.2 (onder meer `invDueDt`, de enige echte vervaldatum in de standaard) wordt niet gelezen. Voor een ouderdomsanalyse op een 3.2-bestand zou dat blok nodig zijn. Bewust niet gebouwd, omdat het blok optioneel is en in XAF 4.0 verdwijnt.

**Te sluiten wanneer:** een besluit is genomen om het blok alsnog te lezen, of vastgelegd is dat de beperking blijft staan.

### 5. Geen testbestand met meervoudige btw uit de praktijk
- **Status:** open, wacht op een echt testbestand van een pakket met meervoudige btw
- **Eigenaar:** Sylvain
- **Vindplaats:** `update-bram-xaf-export-tool.md`, r.301 (§6)

De ondersteuning voor meer dan één btw-element per boekingsregel rust op de XSD en op verzonnen fragmenten. Een echt bestand van een pakket dat dit produceert zou het bewijs sluiten. In de terugkoppeling is Bram gevraagd of hij daar via het platform aan kan komen. Een echt bestand mag alleen lokaal staan en nooit in Git of in een test.

**Te sluiten wanneer:** er een echt bestand met meervoudige btw lokaal is getoetst, of besloten is dat het bewijs op de XSD en de verzonnen fragmenten volstaat.

### 6. Excel-schrijver vervangen door een streaming-bibliotheek is niet gedaan
- **Status:** open, bewuste beperking, als achtergrond gemarkeerd op 04-10-2026
- **Eigenaar:** sessie
- **Vindplaats:** `update-bram-xaf-export-tool.md`, r.196 (§2.7)

De schrijver is bewust niet vervangen door een streaming-bibliotheek zoals ExcelJS. Dat is een eigen traject. Tot dan houdt de tool de Excel-export klein met het tekenbudget, de gesplitste export en de terugval tijdens het exporteren.

### 7. De gedeelde kopbalk beoordelen
- **Status:** open, wacht op beoordeling door de eigenaar
- **Eigenaar:** Sylvain
- **Vindplaats:** `vrijgave-xaf-export-tool-2026-09-29-kopbalk.md`, r.30 en r.34

De bovenkant van de pagina ziet er anders uit: een eerder logo (het JOIN-logo met de koppeling naar joinadministraties.nl) is vervangen door het pictogramvlak en de knop Uitloggen is nieuw. Bekijk de pagina na publicatie op bouwman.tools met het oog: de kopbalk blijft staan bij het scrollen, de knoppen erin werken en er valt niets over de kopbalk heen.

**Te sluiten wanneer:** de eigenaar de kopbalk op bouwman.tools heeft bekeken en akkoord of aanpassingen heeft gemeld.

## Gesloten

### 3. Rijgrens van het Excel-bestand: gemeten, gekozen en gebouwd
- **Status:** gesloten 04-10-2026, de drie onderdelen zijn gemeten, besloten en gebouwd op 16-09-2026
- **Eigenaar:** sessie
- **Vindplaats:** `update-bram-xaf-export-tool.md`, r.269, r.284 en r.290 (§6); uitwerking §2.5, §2.6 en §2.7; `index.html` (`CHAR_BUDGET`, `MIN_ROWS_PER_PART`); `tests/btw-elementen.test.mjs`

Gesloten 04-10-2026. Drie punten uit §6 van `update-bram-xaf-export-tool.md` stonden daar al als opgelost: het onjuiste cellenbudget van ongeveer 15 miljoen (gemeten en vervangen door een rijgrens), de rijgrens die een afkapping was en nu een gesplitste export is, en de vaste grens die niet naar de tekstlengte keek en nu in tekens rekent met terugval tijdens het exporteren. Bewijs: het besluit staat in het document zelf met datum (16-09-2026, Sylvain), met de meting erbij in §6; `tests/btw-elementen.test.mjs` test de rijencap, de ondergrens van 500 regels, het aantal deelbestanden en dat samenvoegen van de delen de oorspronkelijke rijen teruggeeft. Het punt blijft hier staan omdat het in dat document als open eind begon.

### 1. Header-detectie bij een letterlijke "transactions"-tag binnen een CDATA-blok
- **Status:** gesloten 06-10-2026, gerepareerd en getest
- **Eigenaar:** Sylvain
- **Vindplaats:** vrijgave-xaf-xml-tekst-2026-09-08.md, verwijderd bij commit 20c05a0 (14-09-2026, "afgehandeld"); `index.html` (worker, zoekt `transactions` nu met `xmlOpeningTag`); `tests/header-en-eindbuffer.test.mjs`

Besluit 06-10-2026, op advies van de sessie, mandaat van Sylvain van 05-10-2026: repareren in plaats van als beperking laten staan. Afgewezen: het punt laten staan als bekende beperking. Reden: de reparatie is klein, de bestaande hulpfunctie voor letterlijke tekst deed al wat nodig was, en een afgesneden header geeft stil een lege bedrijfsnaam en rekeningenlijst.

De splitsing tussen header en mutaties negeert nu letterlijke tekst (CDATA, commentaar, verwerkingsinstructies). Hetzelfde geldt voor de grenzen waarmee `parseHeader` het bedrijfsblok afbakent. Bewijs: de test "letterlijke transactions-tag in CDATA snijdt de header niet af" draait over drie knippatronen van de bytestroom (bedrijfsnaam, rekeningen en mutatieregel blijven intact). De test faalt op de kern van vóór deze wijziging.

### 2. Een ontbrekende melding bij een onvolledig eindbuffer
- **Status:** gesloten 06-10-2026, gebouwd en getest
- **Eigenaar:** Sylvain
- **Vindplaats:** vrijgave-xaf-xml-tekst-2026-09-08.md, verwijderd bij commit 20c05a0 (14-09-2026, "afgehandeld"); `index.html` (`afgekapt` in het done-bericht, rood waarschuwingsvak `afgekapt-warning`); `tests/header-en-eindbuffer.test.mjs`

Besluit 06-10-2026, op advies van de sessie, mandaat van Sylvain van 05-10-2026: een zichtbare waarschuwing in de weergave, de uitvoer zelf blijft ongewijzigd. Afgewezen: de export blokkeren (de wel ingelezen dagboeken zijn bruikbaar) en stil blijven negeren (dat was het probleem). Reden: een fiscalist moet weten dat de mutaties mogelijk onvolledig zijn, maar mag met de rest verder werken.

Blijft na afloop van de stream een `<journal>` zonder sluittag over, dan toont de tool een rode waarschuwing met het bestandsnummer bij meerdere bestanden. Bewijs: de tests "afgekapt bestand", "compleet bestand meldt niets" en "bij meerdere bestanden staat het nummer van het afgekapte bestand in de melding".
