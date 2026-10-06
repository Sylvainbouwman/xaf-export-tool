# Vrijgavenotitie XAF Raw Export: header-detectie en afgekapte bestanden

06-10-2026 09:42 CEST

Technische wijziging aan de stroomverwerking in de worker. Geen fiscale waarde en geen rekenkern in fiscale zin geraakt. De tool blijft een POC voor collega-test.

## Wat er verandert

- Een letterlijke `<transactions>`-tag in een CDATA-blok of commentaar vóór het echte element snijdt de header niet meer af. Eerder gaf dat een lege bedrijfsnaam en rekeningenlijst. Ook de grenzen waarmee het bedrijfsblok wordt afgebakend negeren nu letterlijke tekst.
- Een afgekapt of beschadigd bestand (een `<journal>` zonder sluittag aan het eind) geeft nu een rode waarschuwing boven de periodekeuze, met het bestandsnummer bij meerdere bestanden. Eerder werd het restant stil genegeerd. De export zelf blijft ongewijzigd en bevat de wel ingelezen dagboeken.

## Bewijs

- `node --test tests/*.test.mjs`: 45 van 45 geslaagd (41 bestaande en 4 nieuwe in `tests/header-en-eindbuffer.test.mjs`).
- De nieuwe tests falen op de kern van vóór deze wijziging (gemeten: bedrijfsnaam leeg in plaats van de verwachte naam).
- Fiscale waarden: geen geraakt. Testbestanden zijn aantoonbaar synthetisch.

## Wat de gebruiker merkt

Niets bij een compleet bestand. Bij een afgekapt bestand verschijnt de waarschuwing.

## Punten

Punt 1 en 2 in `OPENSTAAND.md` zijn hiermee gesloten.
