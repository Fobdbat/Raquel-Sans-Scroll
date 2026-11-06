# Raquel Sans — versió apaïsada (scroll), estil retall de paper

Pugeu **tots els fitxers d'aquesta carpeta** al repositori (arrossegant-los a la pàgina «Add file → Upload files» de GitHub). Es juga obrint `horitzontal.html` (o `index.html`, que hi redirigeix). Si ja hi teníeu `raquel.mp3` i `index.html` no cal tornar-los a pujar.

## La lletra (`lletra.txt`)

El joc **no porta cap lletra incorporada**: la llegeix d'un fitxer `lletra.txt` que ha d'estar **al costat de `horitzontal.html`**, com al joc de la Ludwig. Mentre no hi sigui, el joc va igual, sense lletra (a la pantalla d'inici hi diu «sense lletra (falta lletra.txt)»; amb la lletra posada hi diu «lletra carregada (N versos)»).

- Un vers per línia, en UTF-8 (també accepta Windows-1252). Les línies buides i les marques entre claudàtors sense temps (`[Tornada]`, `[Estrofa 2]`…) s'ignoren.
- **Sincronització automàtica**: cada vers es casa amb el tros de veu que correspon comptant síl·labes contra les frases que he detectat a l'àudio. És aproximada.
- **Sincronització manual (opcional)**: si una línia comença amb un temps, es mostra just en aquell moment: `1:23 text`, `[1:23.5] text`. Es pot posar només a les línies que surtin desfasades.
- Afegint `?lletra` a l'adreça (`horitzontal.html?lletra`) la pantalla d'inici mostra la llista de versos amb el temps assignat, per veure on s'han col·locat i corregir-ho amb marques de temps.
- La lletra surt a la franja de terra, a baix; les paraules «Raquel» i «Sans» es ressalten en rosa.

## «RA-QUEL SANS» a la tornada

A cada tornada hi ha dues vegades «Raquel Sans» (0:46,1 i 0:52,5 · 1:37,3 i 1:43,7 · 2:41,3 i 2:47,7): **3 tocs seguits, un per síl·laba**, i el personatge salta amb cadascuna. Pel teu patró de 8 corxeres són les posicions 1, 2 i 5 (temps 1, 1& i 3 del compàs): RA (salt curt), QUEL (salt curt), SANS (salt alt d'un beat). Les 3 marques surten al terra amb la síl·laba escrita.

- Finestra de toc ±95 ms (molt justa, perquè RA i QUEL són a 0,2 s). Fallar una síl·laba **no treu cors**: només trenca la ratxa i perds els punts.
- Les tres de la mateixa vegada → «RAQUEL SANS! +200». A la pantalla final surt quantes en tens de perfectes (de 6).
- A «Passeig» els fa tots sol.
- En aquests 4 compassos no hi ha cap altre obstacle ni canvi de terreny.

## Estil gràfic

Retall de paper: cartolines amb vora irregular i ombra, vora blanca de recortable als personatges, gra de paper per sobre i fons en dues capes de paral·laxi. Tot està pre-renderitzat (mons a rajoles, com abans), així que al mòbil pesa igual que la versió anterior.

## Trio (món 8)

Quan van els tres junts el **Tyet que anava al darrere passa al davant**: ordre d'esquerra a dreta, Tyet de la samarreta d'ratlles (A) al darrere, Miki al mig i el Tyet de l'anorac blau (B) al davant. (A la versió isomètrica van costat a costat, no hi ha «davant/darrere» i no s'ha canviat.)

## Fitxers

| Fitxer | Què és |
|---|---|
| `horitzontal.html`, `index.html` | pàgina i redirecció |
| `joc-h.js`, `lletra.js` | motor del joc i carregador de la lletra |
| `data-h.js` | nivell: esdeveniments, terreny, objectes, zones, frases de veu |
| `h-sprites.webp`, `intro-h.webp` | personatges/icones i imatge d'inici |
| `h-w1.bin … h-w8.bin`, `h-f1…8.webp`, `h-m1…8.webp` | terra de cada zona (rajoles), fons llunyà i fons mig |
| `raquel.mp3` | la cançó (8,4 MB) |
| `lletra.txt` | **el poseu vosaltres** |

Pes: uns 3,6 MB de gràfics i codi més la cançó. Cap fitxer passa de 600 KB (excepte la cançó).

## Com es juga

- La pantalla avança a 150 BPM exactes (1 beat = 0,4 s). **Un sol toc** (pantalla o espai): salta, i sempre s'enlaira i aterra sobre el beat.
- Marques a terra: **verd** salt per sobre d'un obstacle; **blau** pujar a una plataforma; **taronja** salt llarg (forats); **rosa amb síl·laba** els de «RA-QUEL SANS».
- 3 cors i la música no s'atura; amb 0 cors tornes a l'inici de la zona. Després de 3 fallades a la mateixa zona les finestres s'eixamplen un 20 % (40 % després de 6).
- «Passeig»: el joc toca per tu. «Calibra el ritme»: mesura el retard de so del teu aparell (es desa al navegador).
- `?dt` mostra els mil·lisegons d'avançament o retard de cada salt.

## Què he comprovat i què NO

**Comprovat** (Chromium sense pantalla): partida completa en temps virtual amb tots els salts perfectes, a +60 ms, a −60 ms i irregulars: 211/211 encertats, 18/18 síl·labes, 0 cors perduts, cap salt brusc d'alçada, cap error de consola; una prova en temps real de 56 s amb tocs sintètics (inclou les dues primeres tornades): 60 fps, 47/47 encertats; captures dels 8 mons i de l'escenari final en 1280×640 i 844×390.

**NO comprovat — cal que ho mireu vosaltres:**
- **Els moments exactes de «Raquel Sans» són una estimació** feta aïllant la veu de l'àudio (separació de veu + detecció d'atacs). Les sis són on toca per l'àudio, però no he pogut escoltar-ho. Si en una surt desfasada es corregeix a `data-h.js` (esdeveniments amb `"ty":"H"`, camp `k` = beat; 1 beat = 0,4 s) o dient-me els minuts.
- **La lletra no l'he escrita ni posada jo** (no puc reproduir lletres de cançons): només el carregador. L'alineació automàtica és aproximada; cal revisar-la amb `?lletra`.
- **Cap aparell real** (ni mòbil ni Safari ni Firefox). La latència d'àudio varia molt segons l'aparell; per això hi ha el calibratge.
- **Les durades de les escenes són una estimació** (no tinc el vídeo): els canvis d'escena poden estar desfasats uns segons respecte del videoclip.
- **La dificultat** no l'ha provat cap persona. Les finestres de toc de «RA-QUEL SANS» (±95 ms) són més estretes que les de la resta.
- Les cares dels personatges són aproximades.

No s'hi ha afegit GoatCounter.
