'use strict';
/* «Raquel Sans» — versió apaïsada (scroll horitzontal). El món és una funció pura del temps de l'àudio (150 BPM exactes);
   els tocs només decideixen si cada salt surt bé, i tots els salts s'enlairen i aterren sobre el beat. */
const $=id=>document.getElementById(id);
const cv=$('c'),cx=cv.getContext('2d');
const R=window.RSH,B=R.B,O=R.O,DUR=R.DUR,FINAL_T=R.FINAL_T,BPS=R.BPS,LVH=R.LVH,Z0=R.Z0,S=R.S,KX=R.KX,KY=R.KY,TL=R.T,HT=R.HT,OY=R.OY,YC=R.YC,ZN=R.zones,HS=R.HS;
const PIT0=R.PIT[0],EDGE=R.EDGE_U,GF=700,FXC=.28,YFR=.78,OUT=R.outro,KF=OUT.k,KSTOP=KF+15,KCAM=KF+12;
const beat=T=>(T-O)/B,tb=k=>O+B*k;
const WIN={S:[.18,.14],U:[.2,.16],L:[.18,.14],H:[.095,.095]};
const PERFECTE=.07,DBG=/[?&]dt\b/.test(location.search);
const ms=d=>(d>0?'+':d<0?'−':'')+Math.abs(Math.round(d*1000))+' ms';
let W=0,H=0,DPR=1,f=.6;
const SF={l:0,r:0,t:0,b:0};
function mesuraSafe(){try{const d=document.createElement('div');d.style.cssText='position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';document.body.appendChild(d);const c=getComputedStyle(d);SF.t=parseFloat(c.paddingTop)||0;SF.r=parseFloat(c.paddingRight)||0;SF.b=parseFloat(c.paddingBottom)||0;SF.l=parseFloat(c.paddingLeft)||0;d.remove()}catch(e){}}
function resize(){W=innerWidth;H=innerHeight;mesuraSafe();DPR=Math.min(2,devicePixelRatio||1);cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);cx.setTransform(DPR,0,0,DPR,0,0);
  f=Math.max(W/1280,H/640);}
addEventListener('resize',()=>{resize();try{if(G.on&&!G.paused&&!G.fin&&matchMedia('(orientation:portrait) and (max-aspect-ratio:1/1)').matches)pausa()}catch(e){}});resize();

/* ============================ àudio (igual que la versió isomètrica) ============================ */
let ac=null,buf=null,src=null,gain=null,base=0;
try{ac=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}
const latencia=()=>ac?(ac.outputLatency||ac.baseLatency||0):0;
let AJUST=0;try{const a=parseFloat(localStorage.getItem('raquelsans-ajust'));if(isFinite(a))AJUST=Math.max(-.4,Math.min(.4,a))}catch(e){}
const rel={off:null};
function desfasa(){
  const p=performance.now()/1000;let raw=ac.currentTime-base-latencia();
  if(ac.getOutputTimestamp){try{const ts=ac.getOutputTimestamp();if(ts&&ts.performanceTime>0&&ts.contextTime>0){const r2=ts.contextTime+(p-ts.performanceTime/1000)-base;if(r2<=ac.currentTime-base+.03&&r2>=ac.currentTime-base-.6)raw=r2}}catch(e){}}
  const o=raw-p;if(rel.off===null||Math.abs(o-rel.off)>.08)rel.off=o;else rel.off+=(o-rel.off)*.05;return rel.off}
const instant=ev=>{const ts=ev&&ev.timeStamp,n=performance.now();return ts>0&&ts<=n+5&&n-ts<500?ts:n};
const tempsCru=ms=>(ms!==undefined?ms:performance.now())/1000+desfasa();
const tNow=ms=>window.__vt!==undefined?window.__vt:(ac&&buf&&src?tempsCru(ms)-AJUST:0);
let OFFMP3=0;
function mesuraInici(b){try{const d0=b.getChannelData(0),d1=b.numberOfChannels>1?b.getChannelData(1):d0,n=Math.min(d0.length,Math.round(b.sampleRate*.6));
  for(let i=0;i<n;i++){if(Math.abs((d0[i]+d1[i])/2)>.005){const dt=i/b.sampleRate-.03968;if(Math.abs(dt)<.12)OFFMP3=dt;return}}}catch(e){}}
function sona(off,pre){atura(true);rel.off=null;src=ac.createBufferSource();src.buffer=buf;gain=ac.createGain();src.connect(gain);gain.connect(ac.destination);
  const at=ac.currentTime+.06+pre,o=Math.max(0,off)+OFFMP3;if(o>=0)src.start(at,o);else src.start(at-o,0);base=at-Math.max(0,off)}
function atura(rapid){if(src){try{gain.gain.setTargetAtTime(0,ac.currentTime,rapid?.01:.12);src.stop(ac.currentTime+(rapid?.05:.5))}catch(e){}src=null}}

/* ============================ terreny, esdeveniments, objectes ============================ */
const SB=R.seg.map(s=>s[0]),SL=R.seg.map(s=>s[1]);
function idxAt(b){let lo=0,hi=SB.length-1;if(b<SB[0])return 0;while(lo<hi){const m=(lo+hi+1)>>1;if(SB[m]<=b+1e-9)lo=m;else hi=m-1}return lo}
const lvAt=b=>SL[idxAt(b)];
const EV=R.ev.map(e=>{const air=e.air||(e.ty==='L'?2:1),t=tb(e.k);
  return{k:e.k,ty:e.ty,lv:e.lv,lv2:e.lv2,H:e.H,z:e.z,pit:!!e.pit,auto:!!e.auto,syl:e.syl||'',hk:e.hk,air,t,tl:t+air*B,st:0,tap:null,dt:0,perfect:false,pts:0,tc:0,dmg:false,land:false}});
const IT=R.items.map(i=>({b:i.b,zc:i.zc,ty:i.ty,z:i.z,bonus:i.bonus,t:tb(i.b),got:false}));
const BN=R.bonus.map(b=>({k:b.k,z:b.z,ty:b.ty,t:tb(b.k),st:0}));
const EVK=new Set(EV.map(e=>e.k)),OCC=new Set(R.occ);
const OBS=R.obs;
function flatBeat(j){ // un salt de cortesia a j és possible si el terreny és pla i sense obstacles (mateixos criteris que el disseny)
  if(EVK.has(j)||OCC.has(j))return false;
  const b0=j-.6,b1=j+1.15,l0=lvAt(b0);if(l0<0)return false;
  for(let x=b0;x<=b1+1e-9;x+=.1)if(lvAt(x)!==l0)return false;
  for(const o of OBS)if(o.b-o.w/2-.12<b1&&o.b+o.w/2+.12>b0)return false;return true}
const FLAT={};
const flat=j=>FLAT[j]!==undefined?FLAT[j]:(FLAT[j]=flatBeat(j));
const zoneAt=T=>{let z=0;for(let i=0;i<ZN.length;i++)if(T>=ZN[i].t0)z=i;return z};
const HEROI={miki:'miki',tyet1:'tyetA',tyet2:'tyetB'};
function formacio(zi){const L=ZN[zi].lead;
  if(L.length===1)return[{id:HEROI[L[0]],d:0,dy:0}];
  if(L.length===2)return[{id:HEROI[L[1]],d:.9*B,dy:-3.5},{id:HEROI[L[0]],d:0,dy:0}];
  return[{id:HEROI[L[2]],d:1.7*B,dy:-7},{id:HEROI[L[1]],d:.85*B,dy:-3.5},{id:HEROI[L[0]],d:0,dy:0}]}

/* ============================ estat ============================ */
const G={on:false,paused:false,mode:'joc',zr:0,ni:0,ii:0,fail:null,hearts:3,inv:0,shake:-9,score:0,combo:0,maxCombo:0,hits:0,perf:0,falls:0,fallsZ:{},snapZ:{},hops:[],pops:[],puffs:[],conf:[],cd:-1,fin:false,cal:false,
  lastZi:-1,wipe:-9,assistMsg:0,hc:0,snap:true,ucam:0,cv:0,x0:0,loading:false,coins:0,tvs:0,hearts_got:0,hopN:0};
const assist=z=>1+.2*Math.min(2,Math.floor((G.fallsZ[z]||0)/3));
const winFor=e=>{const w=WIN[e.ty],a=(G.mode==='passeig'||e.auto)?1:assist(e.z);return[w[0]*a,w[1]*a]};
const firstEv=zi=>{const t0=ZN[zi].t0-.01;let i=0;while(i<EV.length&&EV[i].t<t0)i++;return i};
const firstIt=zi=>{const t0=ZN[zi].t0-.01;let i=0;while(i<IT.length&&IT[i].t<t0)i++;return i};
function popup(txt,col,x,y,z,T){G.pops.push({t:T,txt,col,x,y,z})}
function puff(T,x,y,z,col,n,sp){for(let i=0;i<n;i++)G.puffs.push({t:T,x,y,z,vx:(Math.random()-.5)*(sp||60),vz:Math.random()*40+10,c:col,life:.5+Math.random()*.2})}
function xChar(T,d,off){return BPS*Math.min(beat(T-d),KSTOP-(off||0))}

/* ---------- trajectòria del personatge a l'instant T ---------- */
const sm=u=>{u=Math.max(0,Math.min(1,u));return u*u*(3-2*u)};
function landedOver(td){for(let i=Math.max(0,G.ni-8);i<EV.length;i++){const e=EV[i];if(e.t>td)break;if(e.st===1&&e.tl>=td-1e-6)return true}return false}
function baseH(T){const b=beat(T),j=idxAt(b),l=SL[j];if(l<0)return -40;let h=l*LVH;
  if(j>0&&SL[j-1]>l){const td=tb(SB[j]);if(T>=td-1e-6&&!landedOver(td)){const q=Math.max(0,T-td);h=Math.max(h,SL[j-1]*LVH-.5*GF*q*q)}}return h}
function evPath(e,T){
  const h0=e.lv*LVH,h1=e.lv2*LVH;
  if(e.st===1){const ts=Math.max(e.t,e.tap==null?e.t:e.tap);
    if(e.tap!=null&&e.tap<e.t&&T>=e.tap&&T<e.t)return{h:h0,pose:'crouch'};
    if(T>=ts&&T<e.tl){const u=(T-ts)/(e.tl-ts);return{h:h0+(h1-h0)*u+4*e.H*u*(1-u),pose:u<.3?'rise':u<.68?'apex':'fall',air:1}}
    if(T>=e.tl&&T<e.tl+.09)return{h:h1,pose:'crouch'};return null}
  const tc=e.tc;
  if(e.ty==='U'){if(T<e.t||T>=e.tl+.2)return null;const tr=e.t+.7*B,te=e.tl+.15;
    if(T<tr)return{h:h0,pose:T>=tc?'hit':'run',blink:T>=tc};const u=sm((T-tr)/(te-tr));return{h:h0+(h1-h0)*u+7*Math.sin(Math.PI*u),pose:'hit',blink:true}}
  if(e.ty==='L'&&e.pit){if(T<e.t||T>=e.tl+.12)return null;const tf=e.t+PIT0*B,tr=e.tl-.42;
    if(T<tf)return{h:h0,pose:'run'};const hf=h0-Math.min(46,.5*GF*Math.pow(Math.min(T,tr)-tf,2));
    if(T<tr)return{h:hf,pose:'hit',blink:true,sub:1};const u=sm((T-tr)/(e.tl+.1-tr));return{h:hf+(h1-hf)*u+8*Math.sin(Math.PI*u),pose:'hit',blink:true}}
  if(T<e.t||T>=e.tl+.05)return null;
  return{h:h0,pose:T>=tc&&T<tc+.5?'hit':'run',blink:T>=tc&&T<tc+1}}
function hopPath(p,T){if(T>=p.c0&&T<p.ts)return{h:p.h0,pose:'crouch'};
  if(T>=p.ts&&T<p.tl){const u=(T-p.ts)/(p.tl-p.ts);return{h:p.h0+(p.h1-p.h0)*u+4*p.H*u*(1-u),pose:u<.3?'rise':u<.68?'apex':'fall',air:1}}
  if(T>=p.tl&&T<p.tl+.07)return{h:p.h1,pose:'crouch'};return null}
function pathAt(T){
  let cr=null;
  for(let i=Math.max(0,G.ni-8);i<EV.length;i++){const e=EV[i];if(e.t>T+.3)break;if(e.st===0)continue;const r=evPath(e,T);if(r){if(r.pose==='crouch'){if(!cr)cr=r}else return r}}
  for(const p of G.hops){const r=hopPath(p,T);if(r){if(r.pose==='crouch'){if(!cr)cr=r}else return r}}
  return cr||{h:baseH(T),pose:'run'}}

/* ---------- jutjar tocs ---------- */
function hit(e,dt,T){e.st=1;e.tap=T;e.dt=dt;e.perfect=Math.abs(dt)<=PERFECTE;G.combo++;G.maxCombo=Math.max(G.maxCombo,G.combo);
  const m=1+Math.min(G.combo,20)*.05;e.pts=Math.round((e.perfect?150:100)*m);G.score+=e.pts;G.hits++;if(e.perfect)G.perf++;
  const lab=e.perfect?'Perfecte!':(Math.abs(dt)>.11?(dt<0?'Aviat':'Tard'):'Bé'),x=BPS*e.k;
  if(e.ty==='H'){popup(DBG?e.syl+' '+ms(dt):e.syl,e.perfect?'#f4b73a':'#fffaf0',x,YC,e.lv*LVH+(e.syl==='QUEL'?46:34),T);G.pops[G.pops.length-1].sz=16;puff(T,x,YC,e.lv*LVH,'#d9387f',5,70);
    if(e.syl==='SANS'&&EV.every(y=>y.hk!==e.hk||y.st===1)){G.score+=200;G.pops.push({t:T+.05,txt:'RAQUEL SANS! +200',col:'#ff7ab8',x,y:YC,z:e.lv*LVH+58,big:1});puff(T,x,YC,e.lv*LVH+10,'#f4b73a',14,140)}return}
  popup(DBG?lab+' '+ms(dt):lab,e.perfect?'#ffe36b':(lab==='Bé'?'#ffffff':'#ff9a6b'),x,YC,e.lv*LVH+30,T);
  puff(T,x,YC,e.lv*LVH,e.ty==='U'?'#2fa6c6':'#f4b73a',6,80)}
function miss(e,T,early){if(e.st!==0)return;
  if(e.ty==='H'){e.st=2;e.dmg=true;e.tc=e.t;G.combo=0;popup(e.syl,'#c9bfae',BPS*e.k,YC,e.lv*LVH+(e.syl==='QUEL'?46:34),T);G.pops[G.pops.length-1].sz=16;return}
  e.st=2;G.combo=0;G.falls++;G.fallsZ[e.z]=(G.fallsZ[e.z]||0)+1;if(G.fallsZ[e.z]%3===0)G.assistMsg=T;
  e.tc=e.ty==='S'?e.t+.5*B-.1:e.ty==='U'?e.t+EDGE*B-.04:e.t+PIT0*B;if(G.mode==='passeig'||e.auto)e.dmg=true}
function damage(T,e){if(T<G.inv||G.fail||G.mode==='passeig')return;G.hearts--;G.inv=T+1.0;G.shake=T;
  popup('Ai!','#ff6b6b',BPS*beat(T),YC,e.lv*LVH+34,T);puff(T,BPS*beat(T),YC,e.lv*LVH+10,'#ff6b6b',10,120);
  if(G.hearts<=0)G.fail={t:T,z:e.z}}
function hopWhy(T){if(G.fail)return'fail';
  const last=G.hops.length?G.hops[G.hops.length-1]:null;
  let j=Math.round(beat(T));if(last&&j<=last.j)j=last.j+1;
  const tj=tb(j);if(tj-T>.22)return'lluny';
  if(last&&last.tl>tj+.001)return'hop-previ';
  if(!flat(j))return'flat:'+j;
  for(let i=Math.max(0,G.ni-8);i<EV.length;i++){const e=EV[i];if(e.t>T+.45)break;if(e.st!==0&&T<e.tl+.05&&T>=e.t-.25&&!(e.tap!=null&&e.tap>T))return'ev:'+e.k}
  return null}
function hopTry(T){
  if(hopWhy(T)){if(window.__dbgh)window.__dbgh.push([+T.toFixed(3),hopWhy(T)]);return false}
  const last=G.hops.length?G.hops[G.hops.length-1]:null;
  let j=Math.round(beat(T));if(last&&j<=last.j)j=last.j+1;
  const tj=tb(j),h=lvAt(j)*LVH,ts=Math.max(tj,T);
  G.hops.push({j,c0:Math.min(T,tj),ts,tl:tj+B,h0:h,h1:h,H:HS});if(G.hops.length>8)G.hops.shift();G.hopN++;
  puff(T,BPS*beat(ts),YC,h,'rgba(255,255,255,.8)',3,40);return true}
function judgeTap(T){
  let best=null,bd=9;
  for(let i=G.ni;i<EV.length;i++){const e=EV[i];if(e.st!==0||e.auto)continue;if(e.t>T+.7)break;const d=Math.abs(T-e.t);if(d<bd){bd=d;best=e}}
  if(best){const dt=T-best.t,w=winFor(best);
    if(dt>=-w[0]&&dt<=w[1]){hit(best,dt,T);return true}
    if(dt<-w[0]&&dt>=-(w[0]+.12)){hopTry(T);miss(best,T,true);return true}}
  return hopTry(T)}

/* ---------- actualització ---------- */
function collect(it,T){const p=pathAt(it.t);if(Math.abs(p.h+11-it.zc)>11){if(window.__dbgc)window.__dbgc.push([it.b,it.zc,+p.h.toFixed(1),p.pose,+T.toFixed(3),+it.t.toFixed(3)]);return}it.got=true;const x=BPS*it.b;
  if(it.ty==='coin'){G.score+=10;G.coins++;puff(it.t,x,YC,it.zc,'#ffd23f',5,70)}
  else if(it.ty==='heart'){G.hearts_got++;if(G.hearts<3)G.hearts++;else G.score+=50;G.score+=50;popup('+1 cor','#ff6b8a',x,YC,it.zc+10,it.t);puff(it.t,x,YC,it.zc,'#ff6b8a',8,90)}
  else{G.tvs++;G.score+=150;popup('Raquel! +150','#ffe36b',x,YC,it.zc+10,it.t);puff(it.t,x,YC,it.zc,'#9ad0ff',10,100)}}
function update(T){
  while(G.ni<EV.length&&EV[G.ni].st!==0&&EV[G.ni].tl<T-1.5)G.ni++;
  if(G.fail){if(T>=G.fail.t+1.05&&window.__vt===undefined)reinicia(G.fail.z);return}
  const zi=Math.max(zoneAt(T),G.zr);
  if(!G.snapZ[zi]&&zi>=1)G.snapZ[zi]={score:G.score,hits:G.hits,perf:G.perf,falls:G.falls,coins:G.coins,tvs:G.tvs,hh:G.hearts_got,fz:G.fallsZ[zi]||0};
  for(let i=G.ni;i<EV.length;i++){const e=EV[i];if(e.t>T+1)break;
    if(e.st===0){
      if(G.mode==='passeig'||e.auto||T>FINAL_T){const j=Math.sin(e.k*2.399)*.018;if(T>=e.t+j){if(e.auto&&e.ty==='U'){e.st=1;e.tap=e.t;e.dt=0;e.perfect=true}else hit(e,j,T)}}
      else{const w=winFor(e);if(T>e.t+w[1])miss(e,T,false)}}
    if(e.st===2&&!e.dmg&&T>=e.tc){e.dmg=true;damage(T,e)}
    if(e.st===1&&!e.land&&T>=e.tl){e.land=true;puff(e.tl,BPS*(e.k+e.air),YC,e.lv2*LVH,'rgba(255,255,255,.7)',4,60)}}
  while(G.ii<IT.length&&IT[G.ii].t<=T){const it=IT[G.ii++];if(!it.got&&G.mode!=='x')collect(it,T)}
  if(G.mode==='passeig'){for(const b of BN)if(b.st===0&&T>=b.t+Math.sin(b.k*1.7)*.015){b.st=1;hopTry(b.t+.001)}}
  if(T>=DUR-.02&&!G.fin)acaba()}
function reinicia(zi){
  const z=ZN[zi],off=zi===0?0:Math.max(0,z.t0-2.0);
  for(const e of EV)if(e.t>=z.t0-.01){e.st=0;e.pts=0;e.perfect=false;e.tap=null;e.dmg=false;e.land=false;e.tc=0}
  for(const it of IT)if(it.t>=z.t0-.01)it.got=false;for(const b of BN)if(b.t>=z.t0-.01)b.st=0;
  const sn=G.snapZ[zi];if(sn&&G.fail){G.score=sn.score;G.hits=sn.hits;G.perf=sn.perf;G.falls=sn.falls;G.coins=sn.coins;G.tvs=sn.tvs;G.hearts_got=sn.hh}
  G.hearts=3;G.inv=0;G.zr=zi;G.fail=null;G.ni=firstEv(zi);G.ii=firstIt(zi);G.hops=[];G.snap=true;G.pops=[];G.puffs=[];G.combo=0;G.lastZi=-1;G.wipe=zi>=1?off-.35:-9;G.cd=zi>=1?zi:-1;
  if(window.__vt!==undefined)return;
  G.loading=true;prepTiles(zi,off).then(()=>{G.loading=false;sona(off,.35)})}
const HK=[...new Set(EV.filter(e=>e.ty==='H').map(e=>e.hk))];
const hooksOk=()=>HK.filter(h=>EV.every(e=>e.hk!==h||e.st===1)).length;
function acaba(){G.fin=true;G.on=false;atura(false);$('top').hidden=true;
  const tot=EV.filter(e=>!e.auto).length,nTv=IT.filter(i=>i.ty==='tv').length;
  $('fi-stats').innerHTML=G.mode==='passeig'?`<span>Mode</span><b>Passeig</b><span>Zones</span><b>${ZN.length-1}</b>`:
    `<span>Punts</span><b>${G.score}</b><span>Salts encertats</span><b>${G.hits} / ${tot}</b><span>Perfectes</span><b>${G.perf}</b><span>Millor ratxa</span><b>${G.maxCombo}</b><span>Cors perduts</span><b>${G.falls}</b><span>Monedes</span><b>${G.coins}</b><span>Teles de la Raquel</span><b>${G.tvs} / ${nTv}</b><span>«Raquel Sans» perfectes</span><b>${hooksOk()} / ${HK.length}</b>`;
  $('fi').hidden=false}
function comenca(mode){
  if(!carregat)return;ac.resume&&ac.resume();$('inici').hidden=true;$('fi').hidden=true;$('pausa').hidden=true;$('calibra').hidden=true;
  G.mode=mode;G.score=0;G.combo=0;G.maxCombo=0;G.falls=0;G.hits=0;G.perf=0;G.coins=0;G.tvs=0;G.hearts_got=0;G.fallsZ={};G.snapZ={};G.fin=false;G.conf=[];G.fail=null;
  for(const e of EV){e.st=0;e.pts=0;e.perfect=false;e.tap=null;e.dmg=false;e.land=false}for(const it of IT)it.got=false;for(const b of BN)b.st=0;
  G.on=true;G.paused=false;reinicia(0);$('top').hidden=false}
function pausa(){if(!G.on||G.paused||G.fin)return;G.pauseT=tNow();G.paused=true;atura(true);$('b-mode').textContent=G.mode==='joc'?'Passa a «Passeig»':'Passa a «Joc»';$('pausa').hidden=false}
function continua(){$('pausa').hidden=true;G.paused=false;ac.resume&&ac.resume();G.fail=G.fail||null;reinicia(Math.max(zoneAt(Math.max(0,G.pauseT||0)),G.zr))}
addEventListener('blur',()=>{if(G.on&&!G.paused)pausa()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&G.on&&!G.paused)pausa()});

/* ============================ imatges ============================ */
const SK=R.spr.k,CHS=.78,ITS=.62,GVD=R.GV,INK='#2b1d12',CREAM='#fffaf0';
const SPR=new Image(),INTRO=new Image();let sprOk=false,introOk=false;
SPR.onload=()=>sprOk=true;INTRO.onload=()=>introOk=true;SPR.src='h-sprites.webp';INTRO.src='intro-h.webp';
const LAY={};function layImg(c,zi){const k=c+zi;if(!LAY[k]){const im=new Image();im.src='h-'+c+zi+'.webp';LAY[k]=im}return LAY[k]}
const farImg=zi=>layImg('f',zi),midImg=zi=>layImg('m',zi);
const PK={},TB={},TP={};
const packOf=zi=>PK[zi]||(PK[zi]=fetch('h-w'+zi+'.bin').then(r=>{if(!r.ok)throw 0;return r.arrayBuffer()}));
function loadTile(zi,k){const z=ZN[zi];if(k<0||k>=z.nt)return Promise.resolve();const m=TB[zi]||(TB[zi]=new Map());if(m.has(k))return TP[zi+'_'+k]||Promise.resolve();
  const[o,l]=z.idx[k];if(!l){m.set(k,null);return Promise.resolve()}m.set(k,'l');
  return TP[zi+'_'+k]=packOf(zi).then(buf=>createImageBitmap(new Blob([buf.slice(o,o+l)],{type:'image/webp'}))).then(b=>{if(m.get(k)==='l')m.set(k,b);else b.close()}).catch(()=>{m.delete(k)})}
function wantTiles(zi,k0,k1){const m=TB[zi]||(TB[zi]=new Map());for(let k=k0;k<=k1;k++)loadTile(zi,k);
  if(window.__keep)return;for(const[k,b]of m)if((k<k0-1||k>k1+1)&&b&&b!=='l'){try{b.close()}catch(e){}m.delete(k);delete TP[zi+'_'+k]}}
function dropZone(zi){if(window.__keep)return;const m=TB[zi];if(m){for(const[k,b]of m)if(b&&b!=='l'){try{b.close()}catch(e){}delete TP[zi+'_'+k]}delete TB[zi]}}
function ucamAt(T,zi){const x=BPS*Math.min(beat(T),KCAM);return S*(x-KX*YC-ZN[zi].x0)-FXC*W/f}
function tileRange(zi,u,ahead){const k0=Math.max(0,Math.floor(u/TL)),k1=Math.min(ZN[zi].nt-1,Math.floor((u+W/f*(ahead||1.2))/TL));return[k0,k1]}
function prepTiles(zi,T0){if(zi<1)return Promise.resolve();const t=Math.max(T0,ZN[zi].t0-.5),u=Math.max(0,ucamAt(t,zi)),[k0,k1]=tileRange(zi,u,2.2);
  const a=[];for(let k=k0;k<=k1;k++)a.push(loadTile(zi,k));farImg(zi);midImg(zi);return Promise.all(a)}
/* lletra: es llegeix de lletra.txt (al costat d'aquest fitxer); si no hi és, el joc va igual, sense lletra */
let LYR=[];
const fmtT=t=>Math.floor(t/60)+':'+(t%60<10?'0':'')+(t%60).toFixed(1);
async function carregaLletra(){try{LYR=await RSLletra.carrega('lletra.txt',R.frases||[])}catch(e){LYR=[]}
  if(/[?&]lletra\b/.test(location.search)&&LYR.length){const pre=document.createElement('pre');pre.id='lletra-dbg';pre.textContent=LYR.map(l=>fmtT(l.t).padStart(6)+'  '+l.text).join('\n');$('inici').appendChild(pre)}
  return LYR.length}
let carregat=false,buf0=null;
async function carrega(){
  const st=$('estat'),bar=$('barra').firstElementChild;
  if(!ac){st.textContent='Aquest navegador no pot reproduir la cançó.';return}
  try{
    st.textContent='Carregant la cançó…';
    const r=await fetch('raquel.mp3');if(!r.ok)throw 0;const tot=+r.headers.get('content-length')||8445430;let got=0,parts=[];
    if(r.body&&r.body.getReader){const rd=r.body.getReader();for(;;){const{done,value}=await rd.read();if(done)break;parts.push(value);got+=value.length;bar.style.width=Math.min(70,got/tot*70)+'%'}
      const ab=new Uint8Array(got);let p=0;for(const c of parts){ab.set(c,p);p+=c.length}buf0=ab.buffer}else buf0=await r.arrayBuffer();
    st.textContent='Preparant el so…';
    buf=await new Promise((res,rej)=>ac.decodeAudioData(buf0,res,rej));mesuraInici(buf);bar.style.width='80%';
    st.textContent='Carregant els mons…';for(let z=1;z<=8;z++){farImg(z);midImg(z)}
    const nl=await carregaLletra();
    await prepTiles(1,0);bar.style.width='92%';await prepTiles(2,0);bar.style.width='100%';
    carregat=true;st.textContent=nl?'Tot a punt · lletra carregada ('+nl+' versos)':'Tot a punt · sense lletra (falta lletra.txt)';$('b-joc').disabled=false;$('b-passeig').disabled=false;
    for(let z=3;z<=8;z++)packOf(z).catch(()=>{})
  }catch(e){st.textContent="No s'ha pogut carregar. Torna a obrir la pàgina."}}

/* ============================ dibuix (retall de paper) ============================ */
const pu=(x,y)=>S*(x-KX*y-G.x0),pv=(y,z)=>S*(KY*y-z)-OY;
const scr=(x,y,z)=>[(pu(x,y)-G.ucam)*f,(pv(y,Z0+z)-G.cv)*f];
let GR=null;
function grain(){if(GR)return GR;const c=document.createElement('canvas');c.width=c.height=192;const g=c.getContext('2d'),im=g.createImageData(192,192),d=im.data;let s=12345;const r=()=>(s=(s*1103515245+12345)&0x7fffffff)/0x7fffffff;
  for(let i=0;i<d.length;i+=4){const dk=r()<.5;d[i]=dk?70:255;d[i+1]=dk?44:248;d[i+2]=dk?22:232;d[i+3]=Math.floor(r()*(dk?17:24))}
  g.putImageData(im,0,0);GR=cx.createPattern(c,'repeat');return GR}
function setupCam(T,zi,dt){
  const z=ZN[zi];G.x0=z.x0;
  G.ucam=Math.max(0,ucamAt(T,zi));
  const tgt=Math.max(0,lvAt(beat(T)+.25))*LVH;
  if(G.snap||dt>.5){G.hc=tgt;G.snap=false}else G.hc+=(tgt-G.hc)*(1-Math.exp(-dt*3.5));
  const Hv=H/f,vG=pv(YC,Z0);let cv0=vG-YFR*Hv-.62*S*G.hc;cv0=Math.max(0,Math.min(HT-Hv,cv0));if(zi===8&&T>=tb(OUT.k-6))cv0=Math.min(cv0,70);G.cv=cv0;G.cvRef=vG-YFR*Hv;
  const sh=T-G.shake;if(sh>=0&&sh<.3){const a=(1-sh/.3)*3/f;G.ucam+=(Math.random()-.5)*2*a;G.cv+=(Math.random()-.5)*2*a}
  const[k0,k1]=tileRange(zi,G.ucam,2.4);wantTiles(zi,k0,k1)}
function drawSky(zi){const z=ZN[zi],g=cx.createLinearGradient(0,0,0,H);g.addColorStop(0,z.sky[0]);g.addColorStop(1,z.sky[1]);cx.fillStyle=g;cx.fillRect(0,0,W,H)}
function strip(im,par,extra){if(!im.complete||!im.naturalWidth)return;const P=im.naturalWidth,pw=P*f,h=im.naturalHeight*f;
  const yb=(GVD-G.cvRef+extra+par*(G.cvRef-G.cv))*f;let x=-((G.ucam*par)%P)*f;if(x>0)x-=pw;
  for(;x<W;x+=pw)cx.drawImage(im,Math.floor(x),Math.floor(yb-h),Math.ceil(pw)+1,Math.ceil(h))}
function drawTiles(zi){const m=TB[zi];if(!m)return;const[k0,k1]=tileRange(zi,G.ucam,1.05);
  for(let k=k0;k<=k1;k++){const b=m.get(k);if(!b||b==='l')continue;const x=(k*TL-G.ucam)*f,y=(0-G.cv)*f;cx.drawImage(b,Math.floor(x),Math.floor(y),Math.ceil(TL*f)+1,Math.ceil(HT*f)+1)}}
const COLK={S:'#4fae5a',U:'#2fa6c6',L:'#e8873a',H:'#d9387f'};
function rr(x,y,w,h,r){cx.beginPath();cx.moveTo(x+r,y);cx.arcTo(x+w,y,x+w,y+h,r);cx.arcTo(x+w,y+h,x,y+h,r);cx.arcTo(x,y+h,x,y,r);cx.arcTo(x,y,x+w,y,r);cx.closePath()}
function txt(t,x,y,px,col,o){o=o||{};cx.save();cx.font='800 '+px+'px system-ui,sans-serif';cx.textAlign=o.al||'center';cx.textBaseline='middle';cx.lineJoin='round';cx.lineWidth=px/4.2;cx.strokeStyle=o.st||'rgba(43,29,18,.92)';cx.strokeText(t,x,y);cx.fillStyle=col;cx.fillText(t,x,y);cx.restore()}
function plate(x,y,w,h,r,fill){cx.save();cx.fillStyle='rgba(43,29,18,.28)';rr(x+2,y+4,w,h,r);cx.fill();cx.fillStyle=fill||'rgba(255,250,240,.95)';rr(x,y,w,h,r);cx.fill();cx.lineWidth=2;cx.strokeStyle=INK;cx.stroke();cx.restore()}
function ring(x,z,r,fill,stroke,lw,a){const c=scr(x,YC,z+.2),rx=r*S*f,ry=rx*.36;cx.save();cx.globalAlpha=a==null?1:a;cx.beginPath();cx.ellipse(c[0],c[1],rx,ry,0,0,6.2832);
  if(fill){cx.fillStyle=fill;cx.fill()}if(stroke){cx.lineWidth=lw;cx.strokeStyle=stroke;cx.stroke()}cx.restore()}
function pill(t,cxp,cyp,px,col){cx.save();cx.font='800 '+px+'px system-ui,sans-serif';const w=cx.measureText(t).width+px*.9,h=px*1.5;plate(cxp-w/2,cyp-h/2,w,h,h/2);cx.fillStyle=col;cx.textAlign='center';cx.textBaseline='middle';cx.fillText(t,cxp,cyp+px*.04);cx.restore()}
function drawCues(T,zi,bp){
  for(let i=Math.max(0,G.ni-2);i<EV.length;i++){const e=EV[i];if(e.z!==zi&&!(e.auto))continue;if(e.t>T+1.4)break;if(e.auto)continue;
    const vis=e.st===0||(T-e.t<.3&&e.st===1);if(!vis||e.t<T-.35)continue;
    const x=BPS*e.k,z=e.lv*LVH,col=COLK[e.ty],h=e.ty==='H',r0=h?3.4:6.2,u=Math.max(0,Math.min(1,(e.t-T)/.8)),pul=1+.07*(1-bp);
    if(e.st===0){
      ring(x,z,r0*pul,col+'59',INK,Math.max(4,5*f),.7);ring(x,z,r0*pul,null,col,Math.max(2.4,3*f));
      const a=scr(x,YC,z+.4),s=S*f*(h?.8:1);cx.save();cx.lineJoin='round';cx.lineWidth=Math.max(1.5,2*f);cx.strokeStyle=INK;cx.fillStyle=CREAM;cx.beginPath();
      cx.moveTo(a[0],a[1]-s*1.7);cx.lineTo(a[0]+s*1.3,a[1]-s*.4);cx.lineTo(a[0]+s*.45,a[1]-s*.4);cx.lineTo(a[0]+s*.45,a[1]+s*.5);cx.lineTo(a[0]-s*.45,a[1]+s*.5);cx.lineTo(a[0]-s*.45,a[1]-s*.4);cx.lineTo(a[0]-s*1.3,a[1]-s*.4);cx.closePath();cx.fill();cx.stroke();cx.restore();
      if(u>0&&u<=1)ring(x,z,r0*(1+1.9*u),null,col,Math.max(2,(4.4-2.6*u)*f),.95-.45*u);
      if(h){const q=scr(x,YC,z+(e.syl==='QUEL'?23:17));pill(e.syl,q[0],q[1],Math.max(12,Math.round(15*f)),col)}}
    else{const k=(T-e.t)/.3;ring(x,z,r0+k*7,null,e.perfect?'#f4b73a':CREAM,3*f,1-k)}}}
function sprite(id,nom,x,y,z,a,sc){const m=R.spr.atles[id]&&R.spr.atles[id][nom];if(!m||!sprOk)return;const p=scr(x,y,z),k=f*SK*(sc||1);
  cx.globalAlpha=a==null?1:a;cx.drawImage(SPR,m[0],m[1],m[2],m[3],p[0]-m[4]*k,p[1]-m[5]*k,m[2]*k,m[3]*k);cx.globalAlpha=1}
const ICO={1:'star',2:'coin',3:'coin',4:'mic',5:'phone',6:'remote',7:'bar',8:'note'};
function drawItems(T,zi){for(let i=G.ii;i<IT.length;i++){const it=IT[i];if(it.t>T+3)break;if(it.got)continue;
    const nm=it.ty==='coin'?ICO[it.z]:it.ty,bob=1.6*Math.sin(T*4.5+it.b*2.1);
    if(it.ty!=='coin'){const p=scr(BPS*it.b,YC,it.zc+bob);cx.save();cx.globalAlpha=.4+.15*Math.sin(T*6);const gg=cx.createRadialGradient(p[0],p[1],2,p[0],p[1],S*9*f);gg.addColorStop(0,it.ty==='tv'?'rgba(255,236,170,.95)':'rgba(255,200,210,.95)');gg.addColorStop(1,'rgba(255,240,200,0)');cx.fillStyle=gg;cx.fillRect(p[0]-S*9*f,p[1]-S*9*f,S*18*f,S*18*f);cx.restore()}
    sprite('it',nm,BPS*it.b,YC,it.zc+bob,1,ITS)}}
function drawChars(T,zi){
  const fi=T>=FINAL_T&&zi===8,fm=formacio(zi),list=[];
  for(let i=0;i<fm.length;i++){const c=fm[i],Td=T-c.d,p=pathAt(Td),x=xChar(T,c.d,c.d/B);list.push({c,p,x,y:YC,Td})}
  list.sort((a,b)=>b.c.d-a.c.d);                       // el de davant es dibuixa l'últim
  for(const o of list){const{c,p,x,y}=o;let nm=p.pose;
    if(nm==='run')nm='run_'+((Math.floor((T-c.d-O)/(B/2))&3));
    if(fi&&T>=tb(KSTOP+.2)&&!p.air)nm='final';
    let a=1;if(p.blink&&T<G.inv+.2)a=(Math.floor(T*14)&1)?.4:1;else if(T<G.inv&&G.mode==='joc')a=(Math.floor(T*14)&1)?.45:1;
    if(p.sub)a*=.6;
    const hg=Math.max(0,SL[idxAt(beat(T-c.d))])*LVH,hh=Math.max(0,p.h-hg);
    if(p.h>=hg-1&&!p.sub){const sp=scr(x,y,hg);cx.save();cx.globalAlpha=.3*Math.max(.25,1-hh/50)*a;cx.fillStyle='#2a1608';cx.beginPath();cx.ellipse(sp[0],sp[1],S*4.2*f*(1-hh/110),S*1.2*f*(1-hh/110),0,0,6.3);cx.fill();cx.restore()}
    sprite(c.id,nm,x,y,p.h,a,CHS)}
  if(fi&&T>FINAL_T+.35){const q=Math.min(1,(T-FINAL_T-.35)/.25);sprite('raquel','final',BPS*OUT.raquel_b,YC,2*LVH+(1-q)*10,q,CHS)}}
function dibuixaFx(T){
  for(const p of G.puffs){const q=T-p.t,a=1-q/p.life;if(a<=0||q<0)continue;const s=scr(p.x+p.vx*q*.06,p.y,p.z+p.vz*q-.5*160*q*q);cx.globalAlpha=a;cx.fillStyle=p.c;cx.beginPath();cx.arc(s[0],s[1],Math.max(1.2,5*f*a+1),0,6.3);cx.fill()}cx.globalAlpha=1;
  G.puffs=G.puffs.filter(p=>T-p.t<p.life);
  for(const p of G.pops){const q=T-p.t;if(q<0||q>(p.big?1.1:.8))continue;const s=scr(p.x,p.y,p.z),d=p.big?1.1:.8;cx.globalAlpha=Math.min(1,(1-q/d)*1.6);txt(p.txt,s[0],s[1]-q*46*f,Math.round((p.big?30:p.sz||22)*Math.max(.95,f*1.25)),p.col);cx.globalAlpha=1}
  G.pops=G.pops.filter(p=>T-p.t<(p.big?1.15:.85))}
let estatic=null,estCx=null;
function soroll(a,T){if(a<=.01)return;if(!estatic){estatic=document.createElement('canvas');estatic.width=170;estatic.height=96;estCx=estatic.getContext('2d')}
  const im=estCx.createImageData(170,96),d=im.data;for(let i=0;i<d.length;i+=4){const v=60+Math.random()*195|0;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255}estCx.putImageData(im,0,0);
  cx.save();cx.globalAlpha=Math.min(1,a);cx.imageSmoothingEnabled=false;cx.drawImage(estatic,0,0,W,H);cx.imageSmoothingEnabled=true;
  cx.fillStyle='rgba(0,0,0,.35)';for(let y=(Math.random()*6)|0;y<H;y+=6)cx.fillRect(0,y,W,2);
  const by=Math.random()*H;cx.fillStyle='rgba(255,255,255,.5)';cx.fillRect(0,by,W,10+Math.random()*30);cx.restore()}
function placa(z,T,t0){const u=T-t0;if(u<0||u>2.8)return;const a=u<.25?u/.25:u>2.3?(2.8-u)/.5:1,y=Math.max(44,H*.1)+(1-a)*-20;
  cx.save();cx.globalAlpha=a;const s=Math.min(1,W/520),w=Math.min(W-24,(100+Math.max(120,z.nom.length*11.5))*s+20*s),h=44*s,x=(W-w)/2;
  plate(x,y,w,h,12*s);cx.fillStyle='#c4572f';rr(x+6*s,y+6*s,84*s,h-12*s,8*s);cx.fill();cx.fillStyle=CREAM;cx.font='800 '+Math.round(15*s)+'px system-ui,sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText('CANAL '+z.canal,x+6*s+42*s,y+h/2+1);
  cx.fillStyle=INK;cx.font='800 '+Math.round(19*s)+'px system-ui,sans-serif';cx.fillText(z.nom,x+90*s+(w-90*s)/2,y+h/2+1);cx.restore()}
function dibuixaIntro(T){
  const k=introOk?Math.max(W/INTRO.width,H/INTRO.height):1,z=1+.045*Math.max(0,Math.min(1,T/6.7)),w=INTRO.width*k*z,h=INTRO.height*k*z;
  cx.fillStyle=INK;cx.fillRect(0,0,W,H);if(introOk)cx.drawImage(INTRO,(W-w)/2,(H-h)*.45,w,h)}
function confeti(T,dt){const cols=['#d9387f','#2fa6c6','#f4b73a','#7a4fd8','#4fae5a','#fffaf0'];
  if(T>=FINAL_T&&T<DUR+2){for(let i=0;i<4;i++)G.conf.push({x:Math.random()*W,y:-10,vx:(Math.random()-.5)*60,vy:90+Math.random()*120,c:cols[(Math.random()*cols.length)|0],r:Math.random()*6,s:3+Math.random()*4,w:Math.random()*6})}
  for(const c of G.conf){c.x+=c.vx*dt+Math.sin(c.w+=dt*5)*.8;c.y+=c.vy*dt;c.r+=dt*6;cx.fillStyle=c.c;cx.save();cx.translate(c.x,c.y);cx.rotate(c.r);cx.fillRect(-c.s,-c.s/2,c.s*2,c.s);cx.restore()}
  G.conf=G.conf.filter(c=>c.y<H+20)}
let tPrev=0;
function render(T){
  const dt=Math.max(0,Math.min(.1,performance.now()/1000-tPrev));tPrev=performance.now()/1000;
  const zi=Math.max(zoneAt(T),G.zr),z=ZN[zi];
  if(zi!==G.lastZi){G.lastZi=zi;G.snap=true;if(zi>=1){for(const k of Object.keys(TB))if(+k!==zi&&+k!==zi+1)dropZone(+k)}}
  const bp=((((T-O)/B)%1)+1)%1;
  if(zi===0){dibuixaIntro(T)}
  else{
    setupCam(T,zi,dt);drawSky(zi);strip(farImg(zi),.25,80);strip(midImg(zi),.5,105);drawTiles(zi);
    if(ZN[zi+1]&&T>ZN[zi+1].t0-7)prepTiles(zi+1,ZN[zi+1].t0-.5);
    const fi=T>=FINAL_T;
    if(!fi)drawCues(T,zi,bp);
    drawItems(T,zi);drawChars(T,zi);dibuixaFx(T);
    cx.fillStyle=grain();cx.fillRect(0,0,W,H);
    if(bp<.2&&!fi){cx.globalAlpha=.05*(1-bp/.2);cx.fillStyle='#fff';cx.fillRect(0,0,W,H);cx.globalAlpha=1}
  }
  const zt=z.t0;let a=0;
  if(zi>=1&&T>=zt-.14&&T<=zt+.5){a=T<zt-.04?(T-(zt-.14))/.1:T<zt+.08?1:Math.max(0,1-(T-zt-.08)/.42)}
  else if(zi>=1){const nt=zi+1<ZN.length?ZN[zi+1].t0:null;if(nt&&T>=nt-.14&&T<=nt)a=(T-(nt-.14))/.1}
  if(zi===0&&ZN[1]&&T>=ZN[1].t0-.14)a=Math.min(1,(T-(ZN[1].t0-.14))/.1);
  if(G.wipe>-9){const q=(T-G.wipe)/.5;if(q<1)a=Math.max(a,1-q)}
  soroll(a,T);
  if(!G.fin)placa(z,T,Math.max(zt,0)+(zi===0?.4:0));
  if(T<DUR&&zi>=1)confeti(T,dt);
  hud(T,zi);
}
/* lletra de la cançó, a la franja de terra */
function lletraHud(T){
  const l=LYR.length?RSLletra.actual(LYR,T):null;if(!l)return;
  const a=Math.max(0,Math.min(1,(T-l.t)/.15+.05,(l.te-T)/.25)),mg=14+Math.max(SF.l,SF.r),maxw=W-2*mg;let px=Math.round(Math.max(13,Math.min(26,W/34,H/16))),lines=[l.text];
  cx.save();cx.font='800 '+px+'px system-ui,sans-serif';let w0=cx.measureText(l.text).width;
  if(w0>maxw){px=Math.max(12,Math.floor(px*maxw/w0));cx.font='800 '+px+'px system-ui,sans-serif';w0=cx.measureText(l.text).width}
  if(w0>maxw){const mid=l.text.length/2;let c=-1,bd=1e9;for(let i=0;i<l.text.length;i++)if(l.text[i]===' '&&Math.abs(i-mid)<bd){bd=Math.abs(i-mid);c=i}if(c>0)lines=[l.text.slice(0,c),l.text.slice(c+1)]}
  const lw=lines.map(s=>cx.measureText(s).width),bw=Math.min(maxw,Math.max(...lw))+px*1.2,bh=lines.length*px*1.25+px*.5,bx=(W-bw)/2,by=H-bh-Math.max(6,H*.02)-SF.b;
  cx.globalAlpha=a;cx.fillStyle='rgba(43,29,18,.32)';rr(bx,by,bw,bh,px*.55);cx.fill();      // globus translúcid: deixa veure el terra i les marques
  cx.textBaseline='middle';cx.textAlign='left';cx.lineJoin='round';cx.lineWidth=Math.max(2,px/4.6);cx.strokeStyle='rgba(43,29,18,.9)';
  lines.forEach((s,i)=>{let x=(W-lw[i])/2;const y=by+px*.25+(i+.5)*px*1.25;for(const w of s.split(/(\s+)/)){const ww=cx.measureText(w).width;cx.strokeText(w,x,y);cx.fillStyle=/raquel|sans/i.test(w)?'#ff8cc2':CREAM;cx.fillText(w,x,y);x+=ww}});
  cx.restore()}
function hud(T,zi){
  if(!G.on)return;
  const x0=12+SF.l,pw=W-24-SF.l-SF.r,y0=7+SF.t;cx.fillStyle='rgba(43,29,18,.3)';rr(x0,y0,pw,6,3);cx.fill();
  cx.fillStyle='#c4572f';rr(x0,y0,Math.max(6,pw*Math.max(0,Math.min(1,T/DUR))),6,3);cx.fill();cx.fillStyle=CREAM;for(const z of ZN)cx.fillRect(x0+pw*z.t0/DUR-1,y0-2,2,10);
  if(G.mode==='joc'){plate(x0,20+SF.t,Math.max(74,String(G.score).length*17+28),34,10);cx.fillStyle=INK;cx.font='800 22px system-ui,sans-serif';cx.textAlign='left';cx.textBaseline='middle';cx.fillText(String(G.score),x0+12,38+SF.t);
    if(G.combo>=3)pill('×'+G.combo,x0+28,72+SF.t,16,'#d9387f');
    const hm=R.spr.atles.it.heart;if(hm&&sprOk){const w=30,h=w*hm[3]/hm[2];for(let i=0;i<3;i++){cx.globalAlpha=i<G.hearts?1:.25;cx.drawImage(SPR,hm[0],hm[1],hm[2],hm[3],W-80-SF.r-(w+3)*(3-i),20+SF.t,w,h)}cx.globalAlpha=1}}
  else{plate(x0,20+SF.t,104,30,10);txt('PASSEIG',x0+52,35+SF.t,15,'#4fae5a')}
  const z=ZN[zi];if(zi>=1&&zi===G.cd&&T<z.t0+.35&&T>z.t0-1.25){const q=z.t0-T,n=q>.8?3:q>.4?2:q>0?1:0;txt(n?String(n):'Va!',W/2,H*.45,Math.round(Math.min(W,H)*.22),'#f4b73a')}
  if(G.assistMsg&&T-G.assistMsg<3.5&&T>=G.assistMsg)txt('Ajuda activada: finestres una mica més amples',W/2,H*.62,14,'#9be08a');
  if(G.mode==='joc'&&!G.fail){for(let i=G.ni;i<EV.length;i++){const e=EV[i];if(e.st!==0||e.auto)continue;
      if(e.ty==='H'){const hs=G.hkSeen||(G.hkSeen=new Set());if(e.syl==='RA'&&e.t-T<1.6&&e.t-T>-.1&&(hs.size<2||hs.has(e.hk))){txt("TOCA A CADA SÍL·LABA: RA-QUEL SANS!",W/2,H*.2,Math.round(Math.min(26,W/24)),'#fffaf0');if(e.t-T<.15)hs.add(e.hk)}break}
      if(e.t-T<1.2&&e.t-T>-.1&&G.hits<(e.ty==='S'?4:2)&&(e.ty==='S'?zi===1:!G['hint'+e.ty])){txt(e.ty==='S'?'TOCA QUAN ARRIBIS A L\'ANELL!':e.ty==='U'?'TOCA PER PUJAR A LA PLATAFORMA!':'TOCA PER CREUAR!',W/2,H*.2,Math.round(Math.min(26,W/26)),'#fffaf0');if(e.t-T<.2&&e.ty!=='S')G['hint'+e.ty]=1}break}}
  if(G.fail&&T>=G.fail.t+.1)txt('Sense cors!',W/2,H*.4,34,'#ff8a7a');
  lletraHud(T)}
function frame(){
  requestAnimationFrame(frame);
  if(G.paused||G.cal)return;
  if(G.loading){cx.setTransform(DPR,0,0,DPR,0,0);cx.fillStyle=INK;cx.fillRect(0,0,W,H);return}
  if(!G.on){if(!G.fin){cx.setTransform(DPR,0,0,DPR,0,0);dibuixaIntro(0)}return}
  const T=tNow();cx.setTransform(DPR,0,0,DPR,0,0);update(T);render(T)}

/* ============================ entrada ============================ */
function tocPantalla(ev){if(!G.on||G.paused||G.fail||G.fin||G.loading||G.mode==='passeig')return;judgeTap(tNow(instant(ev)))}
cv.addEventListener('pointerdown',ev=>{ev.preventDefault();tocPantalla(ev)});
addEventListener('keydown',ev=>{if(ev.repeat)return;if(ev.code==='Space'||ev.code==='ArrowUp'||ev.code==='Enter'||ev.code==='KeyZ'||ev.code==='KeyX'){if(G.on&&!G.paused){ev.preventDefault();tocPantalla(ev)}}
  else if(ev.code==='Escape'||ev.code==='KeyP'){G.on&&(G.paused?continua():pausa())}});
$('b-joc').onclick=()=>comenca('joc');$('b-passeig').onclick=()=>comenca('passeig');
$('pau').onclick=pausa;$('b-continua').onclick=continua;
$('b-mode').onclick=()=>{G.mode=G.mode==='joc'?'passeig':'joc';$('b-mode').textContent=G.mode==='joc'?'Passa a «Passeig»':'Passa a «Joc»'};
$('b-surt').onclick=()=>{G.on=false;G.paused=false;$('pausa').hidden=true;$('top').hidden=true;$('inici').hidden=false;atura(true)};
$('b-torna').onclick=()=>{$('fi').hidden=true;$('inici').hidden=false;G.fin=false};
const fsOn=()=>document.fullscreenElement||document.webkitFullscreenElement;
const jaApp=(()=>{try{return navigator.standalone===true||matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches}catch(e){return false}})();
if(jaApp)$('b-fs').hidden=true;
$('b-fs').onclick=async()=>{const el=document.documentElement;
  try{if(fsOn()){(document.exitFullscreen||document.webkitExitFullscreen).call(document);return}
    const rq=el.requestFullscreen||el.webkitRequestFullscreen;if(rq){await rq.call(el);try{await screen.orientation.lock('landscape')}catch(e){}}}catch(e){}
  setTimeout(()=>{if(!fsOn())$('ajuda-fs').hidden=false},500)};
$('b-fs-ok').onclick=()=>{$('ajuda-fs').hidden=true};

/* ---------- calibrar el ritme ---------- */
const CAL={actiu:false,tocs:[],n:16,t:null};
const fmtAj=v=>(v>0?'+':v<0?'−':'')+Math.abs(Math.round(v*1000))+' ms';
function pintaAjust(){$('aj-val').textContent=fmtAj(AJUST)}
function desaAjust(v){AJUST=Math.max(-.4,Math.min(.4,Math.round(v*200)/200));try{localStorage.setItem('raquelsans-ajust',String(AJUST))}catch(e){}pintaAjust()}
function pintaCal(){$('cal-punts').innerHTML=Array.from({length:CAL.n},(_,k)=>`<i class="${k<CAL.tocs.length?'on':''}"></i>`).join('')}
function cop(at,fort){const o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.value=fort?1760:1320;
  g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(.55,at+.002);g.gain.exponentialRampToValueAtTime(.001,at+.07);o.connect(g);g.connect(ac.destination);o.start(at);o.stop(at+.09)}
function comencaCal(){
  if(!ac)return;ac.resume&&ac.resume();atura(true);clearTimeout(CAL.t);
  const P=B,at=ac.currentTime+.9;for(let k=0;k<CAL.n;k++)cop(at+k*P,k%4===0);
  base=at;rel.off=null;CAL.actiu=true;CAL.tocs=[];pintaCal();
  $('cal-t').textContent='Escolta i toca';$('cal-p').textContent="Toca la pantalla, o prem l'espai, a cada cop. Els primers serveixen per agafar el ritme.";
  $('b-cal-comenca').disabled=true;CAL.t=setTimeout(acabaCal,(.9+CAL.n*P+.7)*1000)}
function tocCal(ev){if(!CAL.actiu)return;CAL.tocs.push(tempsCru(instant(ev)));if(CAL.tocs.length<=CAL.n)pintaCal()}
function acabaCal(){
  CAL.actiu=false;$('b-cal-comenca').disabled=false;$('b-cal-comenca').textContent='Torna-ho a provar';
  const P=B,d=[];for(const t of CAL.tocs){const k=Math.round(t/P);if(k>=3&&k<CAL.n){const x=t-k*P;if(Math.abs(x)<.3)d.push(x)}}
  if(d.length<6){$('cal-t').textContent='Calen més tocs';$('cal-p').textContent='Toca a cada cop que sentis, fins al final. Torna-ho a provar.';return}
  d.sort((a,b)=>a-b);const med=d[d.length>>1],disp=d.map(x=>Math.abs(x-med)).sort((a,b)=>a-b)[d.length>>1];desaAjust(med);
  $('cal-t').textContent='Ritme calibrat';
  $('cal-p').textContent=(Math.abs(med)<.015?'El so i el joc ja anaven junts.':`El so t'arriba ${Math.abs(Math.round(med*1000))} ms ${med>0?'més tard':'abans'} del que el navegador diu. Ja està corregit.`)+(disp>.05?' Els tocs han estat una mica irregulars: si vols més precisió, repeteix-ho.':'')+' Queda desat en aquest aparell.'}
$('b-calibra').onclick=()=>{if(!carregat)return;$('inici').hidden=true;$('calibra').hidden=false;G.cal=true;$('cal-t').textContent='Toca a cada cop';$('cal-p').textContent="Sonaran 16 cops. Toca la pantalla, o prem l'espai, just quan sentis cada cop. Fes-ho amb els auriculars o l'altaveu amb què jugaràs.";$('b-cal-comenca').textContent='Comença';CAL.tocs=[];pintaCal()};
$('b-cal-comenca').onclick=comencaCal;
$('b-cal-tanca').onclick=()=>{CAL.actiu=false;clearTimeout(CAL.t);G.cal=false;$('calibra').hidden=true;$('inici').hidden=false};
$('calibra').addEventListener('pointerdown',ev=>{if(!CAL.actiu||(ev.target.closest&&ev.target.closest('button,a')))return;ev.preventDefault();tocCal(ev)});
addEventListener('keydown',ev=>{if(CAL.actiu&&(ev.code==='Space'||ev.code==='Enter')){ev.preventDefault();tocCal(ev)}});
$('b-aj-menys').onclick=()=>desaAjust(AJUST-.01);$('b-aj-mes').onclick=()=>desaAjust(AJUST+.01);$('aj-val').onclick=()=>desaAjust(0);pintaAjust();

/* ============================ proves (temps virtual) ============================ */
window.__rs={G,EV,IT,BN,ZN,R,pathAt,lvAt,flat,get LYR(){return LYR},setLletra(t){LYR=RSLletra.llegeix(t,R.frases||[]);return LYR},
  prepara(mode){G.mode=mode||'joc';G.score=0;G.combo=0;G.maxCombo=0;G.falls=0;G.hits=0;G.perf=0;G.coins=0;G.tvs=0;G.hearts_got=0;G.fallsZ={};G.snapZ={};G.fin=false;G.fail=null;
    for(const e of EV){e.st=0;e.pts=0;e.perfect=false;e.tap=null;e.dmg=false;e.land=false}for(const it of IT)it.got=false;for(const b of BN)b.st=0;G.on=true;G.paused=false;$('inici').hidden=true;$('top').hidden=false;reinicia(0)},
  async carregaMons(){for(let z=1;z<=8;z++){const n=ZN[z].nt;for(let k=0;k<n;k++)await loadTile(z,k);farImg(z);midImg(z)}},
  pas(T){window.__vt=T;update(T);cx.setTransform(DPR,0,0,DPR,0,0);render(T)},
  sensePintar(T){window.__vt=T;update(T)},
  toca(T){window.__vt=T;return judgeTap(T)},
  reinicia,tNow,carrega:()=>{carregat=true}};
requestAnimationFrame(frame);
carrega();
