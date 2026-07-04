# UC_xaf-export-tool — XAF Raw Export Tool

| | |
|---|---|
| **Eigenaar** | Sylvain Bouwman |
| **Domein** | Samenstel / Data / Auditfile |
| **Status** | Live |
| **Versie** | v1 — juni 2026 |

## Doel

XAF-auditfiles (XML Auditfile Financieel) inlezen en exporteren naar Excel of CSV, volledig in de browser zonder installatie of server.

## Betrokkenen

| Rol | Toelichting |
|---|---|
| Eigenaar | Sylvain Bouwman |
| Gebruikers | Accountants en adviseurs bij Join Administraties en DK Accountants die met auditfiles werken |

## Trigger

Medewerker heeft een XAF-auditfile ontvangen en wil de ruwe data exporteren naar Excel of CSV voor verdere analyse.

## As-is situatie

XAF-bestanden zijn XML en niet direct leesbaar in Excel. Medewerkers gebruiken externe software of handmatige conversie, wat tijdrovend is en soms licenties vereist.

## To-be situatie

1. Medewerker opent de tool in de browser (geen installatie)
2. XAF-bestand uploaden
3. Tool parseert de XML en toont de ruwe data gestructureerd
4. Export naar Excel (.xlsx) of CSV met één klik
5. Volledige client-side verwerking — klantdata verlaat de browser niet

## Live

[xaf.bouwman.tools](https://xaf.bouwman.tools)

## Waarde

| | |
|---|---|
| **Tijdwinst** | Directe export zonder externe software of handmatige conversie |
| **Privacy** | Volledige client-side verwerking |
| **Toegankelijkheid** | Geen installatie; werkt op elk apparaat via de browser |
