# Raquel Sans — versió apaïsada (scroll horitzontal)

Aquesta carpeta **només conté els fitxers nous**. Es pugen al mateix lloc on ja tens el joc isomètric, perquè comparteixen dos fitxers:

- `raquel.mp3` (la cançó)
- `intro.webp` (la sala d'inici)

Si ja els tens al repositori no cal tornar-los a pujar. Per jugar-hi, obre `horitzontal.html`.

## Fitxers (20 + aquest)

| Fitxer | Què és |
|---|---|
| `horitzontal.html` | la pàgina (menú, pausa, final, avís de «gira el telèfon») |
| `joc-h.js` | el motor del joc |
| `data-h.js` | nivell: esdeveniments, terreny, objectes, zones |
| `h-sprites.webp` | personatges i icones (voxel) |
| `h-w1.bin … h-w8.bin` | el món de cada zona, a trossos (rajoles) |
| `h-f1.webp … h-f8.webp` | capa llunyana de cada zona (parallax) |

Pes total: uns 4,2 MB (a més dels 8,4 MB de la cançó, que ja hi és). Cap fitxer passa de 650 KB, així que la pujada per la web de GitHub no té problema.

## Com es juga

- La pantalla avança sola, a 150 BPM exactes: 1 beat = 0,4 s. El jugador no pot anar endavant ni endarrere.
- **Un sol toc** (pantalla o espai): salta. Cada salt surt i aterra **sobre el beat**.
- Quan el personatge s'acosta a una marca a terra, l'anell es va tancant. Toca quan es tanqui:
  - **verd** → salt per sobre d'un obstacle (1 beat);
  - **blau** → pujar a una plataforma (1 o 2 nivells);
  - **taronja** → salt llarg (2 beats), per creuar un forat o un obstacle ample.
- Les plataformes són a 3 alçades; baixar-ne és automàtic en acabar-se.
- Objectes: monedes (amb icona pròpia per escena), cors (+1 vida) i teles amb la cara de la Raquel. Algunes es recullen només amb el salt obligatori de l'anell (si el fas ben clavat); d'altres són **bonus opcionals**: toca *a l'inici d'un beat* en un tram pla i el personatge fa un salt petit d'un beat (hi ha 14 punts així; 6 amb tele, 3 amb cor).
- Tens 3 cors i **la música no s'atura**. Si en perds un, el personatge continua i parpelleja 1 s. Amb 0 cors tornes a l'inici de la zona, amb compte enrere. Després de 3 fallades a la mateixa zona les finestres s'eixamplen un 20 %, i després de 6, un 40 %.
- Finestres de toc: salt normal/llarg −180 / +140 ms, pujada −200 / +160 ms. «Perfecte» = dins de ±70 ms.
- «Passeig»: el joc toca per tu (per veure-ho tot sense perdre).
- «Calibra el ritme»: mesura el retard de so del teu aparell i el compensa (es desa al navegador). Convé fer-ho una vegada, amb els auriculars o l'altaveu que faràs servir.
- Si es gira el telèfon a vertical, el joc es posa en pausa i demana girar-lo.
- Afegint `?dt` a l'adreça (`horitzontal.html?dt`) els avisos de cada salt mostren els mil·lisegons d'avançament o retard.

## El nivell

210 salts obligatoris: 158 normals, 42 de pujada a plataforma i 10 de llargs (6 sobre forats). 28 dels salts normals són baixant d'una plataforma. 53 trams de plataforma, fins a 3 nivells. Zones (mateixes escenes que la versió isomètrica):

| Zona | Escena | Inici | Salts |
|---|---|---|---|
| 1 | Dins la tele | 0:06,7 | 6 (tutorial) |
| 2 | De les 9 a les 10 | 0:16,3 | 22 |
| 3 | Wall Street | 0:40,3 | 21 |
| 4 | Telenotícies | 0:59,5 | 23 |
| 5 | La tertúlia | 1:17,1 | 31 |
| 6 | Zapping | 1:39,5 | 34 |
| 7 | Quin horror | 2:01,9 | 21 |
| 8 | Raquel Sans (trio) | 2:19,5 | 52 |
| Final | escenari + Raquel | 2:51,5 | 3 de pujada automàtics |

## Què està comprovat i què NO

**Comprovat (amb Chromium sense pantalla, en temps virtual i una prova en temps real):**
- Ritme: 150,000 BPM constant, beat 0,400 s; tots els salts s'enlairen i aterren a un beat exacte; recorregut complet amb els 210 salts perfectes, amb tots amb +100 ms, amb tots amb −100 ms i amb retards irregulars: 210/210 encertats, 0 cors perduts, cap salt brusc de l'alçada del personatge.
- Els 183 objectes (170 monedes, 7 cors, 6 teles) es poden recollir en una partida perfecta; els dels 14 punts de bonus requereixen el toc a l'inici del beat.
- Fallades: perdre cors, parpelleig, reinici de zona amb compte enrere, final amb estadístiques i enllaços a YouTube i Spotify.
- Una prova en temps real de 45 s amb tocs sintètics 50 ms tard: 31/31 encertats.

**No comprovat — cal que ho miris tu:**
- **Cap aparell real** (ni mòbil ni Safari ni Firefox). La latència d'àudio de cada telèfon pot variar molt; per això hi ha el calibratge.
- **Les durades de les escenes són una estimació** (no tinc accés al vídeo): els canvis d'escena poden estar desfasats uns segons respecte del videoclip. Es corregeixen a `data-h.js` (camps `t0`/`t1`/`b0`/`b1` de cada zona) o em dius els minuts i ho refaig.
- **El to visual** només l'he validat amb captures: paletes, plataformes i personatges poden agradar-te o no.
- **La dificultat** no l'ha provat cap persona. Les finestres de toc són les mateixes que vam fer servir a la versió isomètrica; en un mòbil amb pantalla tàctil poden ser massa estretes o massa amples.
- Quan s'erra un salt no hi ha cap «teletransport»: el personatge fa la mateixa trajectòria amb la pose de cop i parpelleja (xoc contra l'obstacle, contra la paret de la plataforma o caiguda al forat i sortida). És una simplificació.
- La memòria: el món es carrega en rajoles de 512 px amb `createImageBitmap` i només n'hi ha unes quantes a la vegada, però en mòbils molt antics no ho he pogut provar.

No s'hi ha afegit GoatCounter ni cap lletra de la cançó.
