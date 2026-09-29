# Vrijgavenotitie XAF Raw Export: de gedeelde kopbalk

29-09-2026 13:30 CEST

Technische wijziging aan de bovenkant van de pagina. Geen rekenkern, geen fiscale waarde en
geen documenttekst geraakt. De tool blijft een POC voor collega-test.

## Aanleiding

Sylvain wil bij alle tools op bouwman.tools dezelfde kopbalk als in de Dividend &
Uitkeringstoets: plakkend, met titel, ondertitel en de regel "Laatste update". Goedgekeurd op
29-09-2026 na drie proeftools. De opmaak komt uit `gedeelde-kern` (`opmaak/kopbalk.css`, blok
`KOPBALK`) en wordt daar met `tests/kopbalk.test.mjs` bewaakt.

## Wat er verandert

- De blauwe kop bovenin de kaart is vervangen door de gedeelde kopbalk bovenaan de pagina, met dezelfde titel en ondertitel.
- De drie losse, vast gepositioneerde elementen zijn samengebracht in de kopbalk: "← bouwman.tools" staat als eerste rechts, dan de privacymelding en Uitloggen.
- De privacymelding luidt nu zoals in de andere tools: "Invoer wordt niet verstuurd" (was "Geen data verstuurd"). Dat klopt: de auditfile wordt in de browser verwerkt, alleen de xlsx-bibliotheek komt van cdnjs.
- De datumregel in de voettekst is weg; de datum staat in de kopbalk. De rest van de voettekst is ongewijzigd.
- De ruimte rond de kaart zit nu op de kaart zelf in plaats van op de pagina, zodat de kopbalk tegen de bovenrand staat.
- Het gepubliceerde bestand heet op bouwman.tools xaf_export.html; de bron blijft index.html.
- Geen test aangepast.
- De datum achter `<!-- LAST_UPDATED -->Laatste update: ` vult de globale pre-commit hook in;
  de markering staat nu precies één keer in de tool.
- Bij afdrukken valt de kopbalk weg.

## Wat de eigenaar beoordeelt

- De bovenkant ziet er anders uit. Een eerder logo (zoals het JOIN-logo met de koppeling naar
  joinadministraties.nl) is vervangen door het pictogramvlak; de knop Uitloggen is nieuw waar
  die er nog niet was. Wat er per tool precies is verdwenen, verhuisd of nieuw is, staat
  hierboven onder "Wat er verandert".
- Bekijk de pagina na publicatie op bouwman.tools met het oog: de kopbalk blijft staan bij
  het scrollen, de knoppen erin werken, en er valt niets over de kopbalk heen.

## Fiscale en juridische waarden

Niet van toepassing.

## Feitelijk getest

- Tests van deze repository: node --test tests/*.test.mjs, 41 van 41 geslaagd.
- `tests/kopbalk.test.mjs` in gedeelde-kern: groen voor deze tool (blok gelijk aan de bron,
  opbouw volgens het sjabloon, één datumregel).
