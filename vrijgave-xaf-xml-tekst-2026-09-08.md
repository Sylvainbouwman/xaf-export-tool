# XML-tekst correct lezen en koppelen

Het lezen van XML-tekst houdt nu rekening met CDATA, commentaar en verwerkingsinstructies. Tekenverwijzingen worden eenmaal verwerkt; identificatievelden worden voor koppelingen ontdaan van omringende witruimte. Daardoor kunnen bijvoorbeeld sluittags in CDATA geen journaal afkappen en blijven rekeningkoppelingen met witruimte werken.

Het herstel tot en met 3642197 is onafhankelijk gereviewd door Code. Negentien synthetische tests controleren onder meer tekst over leesgrenzen, letterlijke CDATA, tekenverwijzingen en rekeningkoppelingen. Vóór de bestaande kopieerstap draait de publicatieworkflow nu dezelfde testset met Node 22; een testfout stopt de job. Trigger, secretverwijzing en publicatieroute blijven gelijk.

Dit is afgebakend tekstherstel. Geen volledige XAF-schemavalidatie, grote-bestandenmeting, gebruikersbediening of native Excel-proef. Headerdetectie bij een letterlijke transactions-tag in CDATA en een melding bij een onvolledig eindbuffer blijven afzonderlijke bestaande aandachtspunten. Uitsluitend synthetische testinvoer gebruikt.

Publicatie vindt pas plaats bij samenvoeging naar master of een expliciet gestarte workflow. Deze featurebranch is geen publicatie of vakinhoudelijke accordering.
