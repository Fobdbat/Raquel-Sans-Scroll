'use strict';
/* Lletra de «Raquel Sans». El joc la llegeix de lletra.txt (al costat de l'index): no en porta cap de còpia incorporada.
   Una línia per vers. El moment de cada vers ve d'una taula (TAULA, només nombres) obtinguda de la veu aïllada de la cançó i
   comprovada amb reconeixement de parla; si lletra.txt no té els mateixos versos, es casen amb els trams de veu comptant síl·labes.
   Si vols forçar el moment d'una línia, comença-la amb el temps: «1:23 text» o «[1:23.5] text».
   Les línies entre claudàtors sense temps ([Tornada], [Estrofa 2]…) s'ignoren. */
(function () {
  const sil = s => { s = String(s).toLowerCase().replace(/q[uü](?=[eiéèí])/g, 'q').replace(/g[u](?=[eiéèí])/g, 'g'); const m = s.match(/[ïü]|[aeiouàèéíòóú]+/g); return m ? m.length : 0 };
  function decodifica(buf) { try { return new TextDecoder('utf-8', { fatal: true }).decode(buf) } catch (e) { try { return new TextDecoder('windows-1252').decode(buf) } catch (e2) { return new TextDecoder().decode(buf) } } }
  const reT = /^\s*\[?\s*(\d{1,2}):(\d{2}(?:[.,]\d+)?)\s*\]?[\s\-–:]+(.*)$/;
  function parseLinies(txt) {
    const out = [];
    for (let raw of String(txt || '').replace(/^﻿/, '').split(/\r?\n/)) {
      let s = raw.trim(); if (!s) continue;
      let t = null; const m = s.match(reT);
      if (m) { t = (+m[1]) * 60 + parseFloat(m[2].replace(',', '.')); s = m[3].trim() }
      else if (/^\[[^\]]*\]$/.test(s) || /^\([^)]*\)$/.test(s)) continue;
      if (!s) continue;
      out.push({ text: s, t, f: Math.max(1, sil(s)) });
    }
    return out;
  }
  /* programació dinàmica: línies (síl·labes) contra trams de veu [inici, fi, síl·labes estimades] */
  function casa(L, FR) {
    const n = L.length, m = FR.length, INF = 1e9, G = 7;
    const pre = [0]; for (const x of FR) pre.push(pre[pre.length - 1] + x[2]);
    const C = [], B = []; for (let i = 0; i <= n; i++) { C.push(new Float64Array(m + 1).fill(INF)); B.push(new Int8Array(m + 1)) }
    C[0][0] = 0;
    const up = (i, j, v, op) => { if (v < C[i][j]) { C[i][j] = v; B[i][j] = op } };
    for (let i = 0; i <= n; i++) for (let j = 0; j <= m; j++) {
      const c = C[i][j]; if (c >= INF) continue;
      if (j < m) up(i, j + 1, c + 1.5 + .25 * FR[j][2], 1);                                         // tram sense lletra (veus de fons)
      if (i < n) {
        for (let g = 1; g <= G && j + g <= m; g++) up(i + 1, j + g, c + Math.abs(pre[j + g] - pre[j] - L[i].f) + (g - 1) * .5, 2);   // la línia ocupa g trams
        up(i + 1, j, c + 8 + .3 * L[i].f, 3);                                                        // línia sense tram
        if (i + 1 < n && j < m) up(i + 2, j + 1, c + 1.5 + Math.abs(FR[j][2] - L[i].f - L[i + 1].f), 4);   // dues línies en un mateix tram
      }
    }
    const res = new Array(n).fill(null); let i = n, j = m;
    while (i > 0 || j > 0) {
      const op = B[i][j];
      if (op === 1) j--;
      else if (op === 2) { let g = 1; for (; g <= G; g++) { const jj = j - g; if (jj >= 0 && C[i - 1][jj] < INF && Math.abs(C[i - 1][jj] + Math.abs(pre[j] - pre[jj] - L[i - 1].f) + (g - 1) * .5 - C[i][j]) < 1e-9) break } res[i - 1] = { a: FR[j - g][0], b: FR[j - 1][1] }; i--; j -= g }
      else if (op === 3) i--;
      else if (op === 4) { const q = j - 1, f0 = L[i - 2].f / (L[i - 2].f + L[i - 1].f), a = FR[q][0], b = FR[q][1], mid = a + f0 * (b - a); res[i - 2] = { a, b: mid }; res[i - 1] = { a: mid, b }; i -= 2; j-- }
      else break;
    }
    return res;
  }
  /* Moments de cada vers (només nombres): inici, final i síl·labes del vers (per saber si lletra.txt és la mateixa).
     Obtinguts de la veu aïllada i verificats amb reconeixement de parla; si lletra.txt té un altre nombre de versos, es torna al càlcul automàtic. */
  const TAULA = { t: [4.37,7.59,10.81,13.99,17.81,20.1,23.5,26.7,30.1,33.31,36.53,39.77,42.91,45.97,54.9,58.78,61.97,65.3,67.83,71,72.64,75.33,81.26,84.52,87.72,90.97,94.11,97.17,105.34,108.54,111.74,114.94,118.14,121.34,124.54,127.74,130.9,132.8,138.2,145.3,148.51,151.72,154.97,158.11,161.16],
    e: [7.59,10.81,13.99,17.81,20.1,23.5,26.7,30.1,33.31,36.53,39.77,42.91,45.97,54.9,58.78,61.97,65.3,67.83,71,72.64,74.78,81.26,84.52,87.72,90.97,94.11,97.17,105.34,108.54,111.74,114.94,118.14,121.34,124.54,127.74,130.9,132.8,138.2,145.3,148.51,151.72,154.97,158.11,161.16,172.35],
    f: [8,10,10,12,8,10,13,6,9,8,9,11,6,7,12,10,14,8,15,8,10,12,9,8,9,11,6,7,10,10,10,10,10,10,10,10,6,13,14,8,8,9,11,6,7] };
  /* la taula només s'aplica si lletra.txt és (quasi) la mateixa: mateix nombre de versos, síl·labes semblants, cap temps manual */
  function usaTaula(L) {
    if (L.length !== TAULA.t.length || L.some(l => l.t != null)) return false;
    let ok = 0; for (let i = 0; i < L.length; i++) if (Math.abs(L[i].f - TAULA.f[i]) <= 2) ok++;
    return ok >= .85 * L.length;
  }
  function llegeix(txt, FR) {
    const L = parseLinies(txt); if (!L.length) return [];
    if (usaTaula(L)) return L.map((l, i) => ({ text: l.text, t: TAULA.t[i], te: TAULA.e[i] }));
    const pos = FR && FR.length ? casa(L, FR) : new Array(L.length).fill(null);
    // temps: marca manual > tram detectat > interpolació entre veïnes
    const t = L.map((l, i) => l.t != null ? { a: l.t, b: null } : pos[i]);
    for (let i = 0; i < L.length; i++) if (!t[i]) {
      let p = i - 1; while (p >= 0 && !t[p]) p--; let q = i + 1; while (q < L.length && !t[q]) q++;
      const ta = p >= 0 ? (t[p].b != null ? t[p].b : t[p].a + 2) : 0, tb = q < L.length ? t[q].a : ta + 4 * (q - p);
      t[i] = { a: ta + (tb - ta) * (i - p) / (q - p) * .98, b: null };
    }
    const out = L.map((l, i) => ({ text: l.text, t: t[i].a, te: t[i].b != null ? t[i].b + .9 : t[i].a + 3 })).sort((x, y) => x.t - y.t);
    for (let i = 0; i < out.length - 1; i++) out[i].te = Math.min(out[i].te, Math.max(out[i].t + 1.2, out[i + 1].t - .05)); // no se solapen
    return out;
  }
  const carrega = (url, FR) => fetch(url, { cache: 'no-cache' }).then(r => r.ok ? r.arrayBuffer() : null).then(b => b ? llegeix(decodifica(b), FR) : []).catch(() => []);
  function actual(arr, T) { let l = null; for (const x of arr) { if (x.t <= T + .02) l = x; else break } return l && T < l.te ? l : null }
  window.RSLletra = { carrega, llegeix, actual, sil, parseLinies, taula: TAULA };
})();
