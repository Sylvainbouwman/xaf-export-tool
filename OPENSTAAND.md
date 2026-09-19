# Openstaande punten — xaf-export-tool

| # | Status | Eigenaar | Punt | Bron |
|---|--------|----------|------|------|
| 1 | open | Sylvain | Header-detectie bij een letterlijke "transactions"-tag binnen een CDATA-blok. De splitsing tussen header en mutaties zoekt met `buffer.search(/<transactions[\s>]/)` in de ruwe, nog niet van CDATA ontdane tekst (`index.html`); een dergelijke tag als letterlijke tekst vóór het echte structurele element zou de header te vroeg laten afsnijden. Gecontroleerd op 19-09-2026: geen test in `tests/` dekt dit specifieke geval af. | vrijgave-xaf-xml-tekst-2026-09-08.md, verwijderd bij commit 20c05a0 (14-09-2026, "afgehandeld") |
| 2 | open | Sylvain | Een ontbrekende melding bij een onvolledig eindbuffer. Blijft er na afloop van de stream in `index.html` een onvolledig `<journal>`-blok in de buffer staan (bijvoorbeeld bij een afgekapt of corrupt bestand), dan wordt dat restant stilzwijgend genegeerd; er verschijnt geen waarschuwing dat het bestand mogelijk onvolledig is. Gecontroleerd op 19-09-2026: geen test in `tests/` dekt dit specifieke geval af. | vrijgave-xaf-xml-tekst-2026-09-08.md, verwijderd bij commit 20c05a0 (14-09-2026, "afgehandeld") |
