# xaf-export-tool

Tool die XAF-auditfiles inleest en exporteert naar Excel of CSV, als één HTML-bestand (`index.html`) met een Web Worker. Aanvullend op de instructies van de verzamelmap.

- **Publicatie:** twee routes, allebei bij een push naar `master`. De workflow `.github/workflows/sync-to-bouwman-tools.yml` draait eerst de tests en kopieert daarna alleen `index.html` als `xaf_export.html` naar de publieke repository `bouwman-tools`. Daarnaast is deze repository zelf publiek en dient GitHub Pages (bron `master`, hoofdmap, `CNAME` is `xaf.bouwman.tools`) alles in de hoofdmap uit. Een push of merge naar `master` is dus de publicatie, en elk bestand in de hoofdmap is publiek leesbaar, ook deze AGENTS.md. Bouw op een eigen branch.
- **Test:** `node --test tests/*.test.mjs` (Node 22 of hoger). Er is geen `package.json`, dus `npm test` bestaat niet.
- `tests/worker-kern.mjs` haalt de workercode uit het blok `<script id="worker-src">` in `index.html` en laadt daar de rekenkern uit (tot `self.onmessage =`). Hernoem of verplaats die structuur dus niet zonder de tests mee te nemen.
- Er zijn geen fiscale waarden en geen rekenkern in fiscale zin. De bron per gedrag staat in de README (XAF-schema en functionele hiërarchie van Belastingdienst/ODB). Zet een nieuwe aanname over de standaard daar met vindplaats neer.
- De Excel-export gebruikt SheetJS via een CDN. De grens voor één Excel-bestand rekent in tekens (tekenbudget in de README, gemeten en door Sylvain besloten op 16-09-2026). Wijzig dat niet op gevoel.
- Echte auditfiles bevatten klantgegevens. Gebruik ze niet in tests of voorbeelden in Git.
- **Openstaande punten:** OPENSTAAND.md.
