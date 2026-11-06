'use strict';
/* «Raquel Sans» — versió apaïsada (scroll horitzontal). El món és una funció pura del temps de l'àudio (150 BPM exactes);
   els tocs només decideixen si cada salt surt bé, i tots els salts s'enlairen i aterren sobre el beat. */
const $=id=>document.getElementById(id);
const cv=$('c'),cx=cv.getContext('2d');
const R=window.RSH,B=R.B,O=R.O,DUR=R.DUR,FINAL_T=R.FINAL_T,BPS=R.BPS,LVH=R.LVH,Z0=R.Z0,S=R.S,KX=R.KX,KY=R.KY,TL=R.T,HT=R.HT,OY=R.OY,YC=R.YC,ZN=R.zones,HS=R.HS;
const PIT0=R.PIT[0],EDGE=R.EDGE_U,GF=700,FXC=.28,YFR=.78,OUT=R.outro,KF=OUT.k,KSTOP=KF+15,KCAM=KF+12;
const beat=T=>(T-O)/B,tb=k=>O+B*k;
const WIN={S:[.18,.14],U:[.2,.16],L:[.18,.14]};
const PERFECTE=.07,DBG=/[?&]dt\b/.test(location.search);
const ms=d=>(d>0?'+':d<0?'−':'')+Math.abs(Math.round(d*1000))+' ms';
let W=0,H=0,DPR=1,f=.6,vign=null;
function resize(){W=innerWidth;H=innerHeight;DPR=Math.min(2,devicePixelRatio||1);cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);cx.setTransform(DPR,0,0,DPR,0,0);
  f=Math.max(W/1280,H/640);
  vign=document.createElement('canvas');vign.width=Math.max(2,W>>1);vign.height=Math.max(2,H>>1);const v=vign.getContext('2d'),g=v.createRadialGradient(vign.width/2,vign.height*.5,Math.min(vign.width,vign.height)*.4,vign.width/2,vign.height/2,Math.hypot(vign.width,vign.height)*.62);
  g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.5)');v.fillStyle=g;v.fillRect(0,0,vign.width,vign.height)}
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
const EV=R.ev.map(e=>{const air=e.ty==='L'?2:1,t=tb(e.k);
  return{k:e.k,ty:e.ty,lv:e.lv,lv2:e.lv2,H:e.H,z:e.z,pit:!!e.pit,auto:!!e.auto,air,t,tl:t+air*B,st:0,tap:null,dt:0,perfect:false,pts:0,tc:0,dmg:false,land:false}});
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
  const lab=e.perfect?'Perfecte!':(Math.abs(dt)>.11?(dt<0?'Aviat':'Tard'):'Bé');
  const x=BPS*e.k;popup(DBG?lab+' '+ms(dt):lab,e.perfect?'#ffe36b':(lab==='Bé'?'#ffffff':'#ff9a6b'),x,YC,e.lv*LVH+30,T);
  puff(T,x,YC,e.lv*LVH,e.ty==='U'?'#3bd0ff':'#ffe36b',6,80)}
function miss(e,T,early){if(e.st!==0)return;e.st=2;G.combo=0;G.falls++;G.fallsZ[e.z]=(G.fallsZ[e.z]||0)+1;if(G.fallsZ[e.z]%3===0)G.assistMsg=T;
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
function acaba(){G.fin=true;G.on=false;atura(false);$('top').hidden=true;
  const tot=EV.filter(e=>!e.auto).length,nTv=IT.filter(i=>i.ty==='tv').length;
  $('fi-stats').innerHTML=G.mode==='passeig'?`<span>Mode</span><b>Passeig</b><span>Zones</span><b>${ZN.length-1}</b>`:
    `<span>Punts</span><b>${G.score}</b><span>Salts encertats</span><b>${G.hits} / ${tot}</b><span>Perfectes</span><b>${G.perf}</b><span>Millor ratxa</span><b>${G.maxCombo}</b><span>Cors perduts</span><b>${G.falls}</b><span>Monedes</span><b>${G.coins}</b><span>Teles de la Raquel</span><b>${G.tvs} / ${nTv}</b>`;
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
const SPR=new Image(),INTRO=new Image();let sprOk=false,introOk=false;
SPR.onload=()=>sprOk=true;INTRO.onload=()=>introOk=true;SPR.src='h-sprites.webp';INTRO.src='intro.webp';
const FAR={};function farImg(zi){if(!FAR[zi]){const im=new Image();im.src='h-f'+zi+'.webp';FAR[zi]=im}return FAR[zi]}
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
  const a=[];for(let k=k0;k<=k1;k++)a.push(loadTile(zi,k));farImg(zi);return Promise.all(a)}
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
    st.textContent='Carregant els mons…';for(let z=1;z<=8;z++)farImg(z);
    await prepTiles(1,0);bar.style.width='92%';await prepTiles(2,0);bar.style.width='100%';
    carregat=true;st.textContent='Tot a punt.';$('b-joc').disabled=false;$('b-passeig').disabled=false;
    for(let z=3;z<=8;z++)packOf(z).catch(()=>{})
  }catch(e){st.textContent="No s'ha pogut carregar. Torna a obrir la pàgina."}}

/* ============================ dibuix ============================ */
const pu=(x,y)=>S*(x-KX*y-G.x0),pv=(y,z)=>S*(KY*y-z)-OY;
const scr=(x,y,z)=>[(pu(x,y)-G.ucam)*f,(pv(y,Z0+z)-G.cv)*f];
function setupCam(T,zi,dt){
  const z=ZN[zi];G.x0=z.x0;
  G.ucam=Math.max(0,ucamAt(T,zi));
  const tgt=Math.max(0,lvAt(beat(T)+.25))*LVH;
  if(G.snap||dt>.5){G.hc=tgt;G.snap=false}else G.hc+=(tgt-G.hc)*(1-Math.exp(-dt*3.5));
  const Hv=H/f,vG=pv(YC,Z0);let cv0=vG-YFR*Hv-.62*S*G.hc;cv0=Math.max(0,Math.min(HT-Hv,cv0));G.cv=cv0;
  const sh=T-G.shake;if(sh>=0&&sh<.3){const a=(1-sh/.3)*3/f;G.ucam+=(Math.random()-.5)*2*a;G.cv+=(Math.random()-.5)*2*a}
  const[k0,k1]=tileRange(zi,G.ucam,2.4);wantTiles(zi,k0,k1)}
function drawSky(zi){const z=ZN[zi],g=cx.createLinearGradient(0,0,0,H);g.addColorStop(0,z.sky[0]);g.addColorStop(1,z.sky[1]);cx.fillStyle=g;cx.fillRect(0,0,W,H)}
function drawFar(zi){const im=farImg(zi);if(!im.complete||!im.naturalWidth)return;
  const vh=pv(R.YBACK,Z0)-0,by=(vh-G.cv)*f+3,w=im.naturalWidth*f,h=im.naturalHeight*f,x=-(G.ucam*.25)*f;
  // la imatge es repeteix si cal (en cas d'escales molt grans)
  for(let xx=x;xx<W;xx+=w){if(xx+w>0)cx.drawImage(im,Math.floor(xx),Math.floor(by-h),Math.ceil(w)+1,Math.ceil(h))}
  // sota l'horitzó: color del terra
}
function drawTiles(zi){const m=TB[zi];if(!m)return;const[k0,k1]=tileRange(zi,G.ucam,1.05);
  for(let k=k0;k<=k1;k++){const b=m.get(k);if(!b||b==='l')continue;const x=(k*TL-G.ucam)*f,y=(0-G.cv)*f;cx.drawImage(b,Math.floor(x),Math.floor(y),Math.ceil(TL*f)+1,Math.ceil(HT*f)+1)}}
const COLK={S:'#7dff6a',U:'#3bd0ff',L:'#ffa23b'};
function ellipse(x,y,z,r,fill,stroke,lw,a){cx.beginPath();for(let i=0;i<=28;i++){const th=i/28*6.2832,p=scr(x+r*Math.cos(th),y+r*Math.sin(th),z);i?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1])}cx.closePath();
  if(a!=null)cx.globalAlpha=a;if(fill){cx.fillStyle=fill;cx.fill()}if(stroke){cx.strokeStyle=stroke;cx.lineWidth=lw;cx.stroke()}cx.globalAlpha=1}
function drawCues(T,zi,bp){
  for(let i=Math.max(0,G.ni-2);i<EV.length;i++){const e=EV[i];if(e.z!==zi&&!(e.auto))continue;if(e.t>T+1.4)break;if(e.auto)continue;
    const vis=e.st===0||(T-e.t<.3&&e.st===1);if(!vis||e.t<T-.35)continue;
    const x=BPS*e.k,z=e.lv*LVH,col=COLK[e.ty],u=Math.max(0,Math.min(1,(e.t-T)/.8)),pul=1+.07*(1-bp);
    if(e.st===0){ellipse(x,YC,z+.2,6.2*pul,col+'44',col,Math.max(2,2.4*f),null);
      // fletxa cap amunt
      const a=scr(x,YC,z+.4),s=S*f;cx.fillStyle='rgba(255,255,255,.9)';cx.beginPath();cx.moveTo(a[0],a[1]-s*1.2);cx.lineTo(a[0]+s*1.3,a[1]+s*.2);cx.lineTo(a[0]+s*.4,a[1]+s*.2);cx.lineTo(a[0]+s*.4,a[1]+s*1.1);cx.lineTo(a[0]-s*.4,a[1]+s*1.1);cx.lineTo(a[0]-s*.4,a[1]+s*.2);cx.lineTo(a[0]-s*1.3,a[1]+s*.2);cx.closePath();cx.fill();
      if(u>0&&u<=1){ellipse(x,YC,z+.3,6.2*(1+1.9*u),null,col,Math.max(2,(4.4-2.6*u)*f),.95-.45*u)}}
    else{const k=(T-e.t)/.3;ellipse(x,YC,z+.3,6.2+k*7,null,e.perfect?'#ffe36b':'#ffffff',3*f,1-k)}}}
function sprite(id,nom,x,y,z,a,sc){const m=R.spr.atles[id]&&R.spr.atles[id][nom];if(!m||!sprOk)return;const p=scr(x,y,z),k=f*(sc||1);
  cx.globalAlpha=a==null?1:a;cx.drawImage(SPR,m[0],m[1],m[2],m[3],p[0]-m[4]*k,p[1]-m[5]*k,m[2]*k,m[3]*k);cx.globalAlpha=1}
const ICO={1:'star',2:'coin',3:'coin',4:'mic',5:'phone',6:'remote',7:'bar',8:'note'};
function drawItems(T,zi){for(let i=G.ii;i<IT.length;i++){const it=IT[i];if(it.z!==zi&&it.z!==undefined&&false)continue;if(it.t>T+3)break;if(it.got)continue;
    const nm=it.ty==='coin'?ICO[it.z]:it.ty,bob=1.6*Math.sin(T*4.5+it.b*2.1);
    if(it.ty!=='coin'){const p=scr(BPS*it.b,YC,it.zc+bob);cx.save();cx.globalAlpha=.35+.15*Math.sin(T*6);const gg=cx.createRadialGradient(p[0],p[1],2,p[0],p[1],S*9*f);gg.addColorStop(0,it.ty==='tv'?'rgba(154,208,255,.8)':'rgba(255,107,138,.8)');gg.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=gg;cx.fillRect(p[0]-S*9*f,p[1]-S*9*f,S*18*f,S*18*f);cx.restore()}
    sprite('it',nm,BPS*it.b,YC,it.zc+bob-Z0*0,1,.8)}}
function drawChars(T,zi){
  const fi=T>=FINAL_T&&zi===8,fm=formacio(zi),list=[];
  for(let i=0;i<fm.length;i++){const c=fm[i],Td=T-c.d,p=pathAt(Td),x=xChar(T,c.d,c.d/B),y=YC+c.dy;list.push({c,p,x,y,Td})}
  list.sort((a,b)=>a.y-b.y);
  for(const o of list){const{c,p,x,y}=o;let nm=p.pose;
    if(nm==='run'||nm==='hit'&&false)nm='run_'+((Math.floor((T-c.d-O)/(B/2))&3));
    if(nm==='hit')nm='hit';
    if(fi&&T>=tb(KSTOP+.2)&&!p.air)nm='final';
    let a=1;if(p.blink&&T<G.inv+.2)a=(Math.floor(T*14)&1)?.4:1;else if(T<G.inv&&G.mode==='joc')a=(Math.floor(T*14)&1)?.45:1;
    if(p.sub)a*=.6;
    // ombra
    const hg=Math.max(0,SL[idxAt(beat(T-c.d))])*LVH,hh=Math.max(0,p.h-hg);
    if(p.h>=hg-1&&!p.sub){const sp=scr(x,y,hg);cx.save();cx.globalAlpha=.3*Math.max(.25,1-hh/50)*a;cx.fillStyle='#000';cx.beginPath();cx.ellipse(sp[0],sp[1],S*4.2*f*(1-hh/110),S*1.4*f*(1-hh/110),0,0,6.3);cx.fill();cx.restore()}
    sprite(c.id,nm,x,y,p.h,a)}
  // Raquel a l'escenari
  if(fi&&T>FINAL_T+.35){const q=Math.min(1,(T-FINAL_T-.35)/.25);sprite('raquel','final',BPS*OUT.raquel_b,YC,2*LVH+(1-q)*10,q)}}
function dibuixaFx(T){
  for(const p of G.puffs){const q=T-p.t,a=1-q/p.life;if(a<=0||q<0)continue;const s=scr(p.x+p.vx*q*.06,p.y,p.z+p.vz*q-.5*160*q*q);cx.globalAlpha=a;cx.fillStyle=p.c;cx.beginPath();cx.arc(s[0],s[1],Math.max(1.2,5*f*a+1),0,6.3);cx.fill()}cx.globalAlpha=1;
  G.puffs=G.puffs.filter(p=>T-p.t<p.life);
  for(const p of G.pops){const q=T-p.t;if(q<0||q>.8)continue;const s=scr(p.x,p.y,p.z);cx.globalAlpha=1-q/.8;txt(p.txt,s[0],s[1]-q*46*f,Math.round(22*Math.max(.95,f*1.25)),p.col);cx.globalAlpha=1}
  G.pops=G.pops.filter(p=>T-p.t<.85)}
let estatic=null,estCx=null;
function soroll(a,T){if(a<=.01)return;if(!estatic){estatic=document.createElement('canvas');estatic.width=170;estatic.height=96;estCx=estatic.getContext('2d')}
  const im=estCx.createImageData(170,96),d=im.data;for(let i=0;i<d.length;i+=4){const v=60+Math.random()*195|0;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255}estCx.putImageData(im,0,0);
  cx.save();cx.globalAlpha=Math.min(1,a);cx.imageSmoothingEnabled=false;cx.drawImage(estatic,0,0,W,H);cx.imageSmoothingEnabled=true;
  cx.fillStyle='rgba(0,0,0,.35)';for(let y=(Math.random()*6)|0;y<H;y+=6)cx.fillRect(0,y,W,2);
  const by=Math.random()*H;cx.fillStyle='rgba(255,255,255,.5)';cx.fillRect(0,by,W,10+Math.random()*30);cx.restore()}
function rr(x,y,w,h,r){cx.beginPath();cx.moveTo(x+r,y);cx.arcTo(x+w,y,x+w,y+h,r);cx.arcTo(x+w,y+h,x,y+h,r);cx.arcTo(x,y+h,x,y,r);cx.arcTo(x,y,x+w,y,r);cx.closePath()}
function txt(t,x,y,px,col,o){o=o||{};cx.save();cx.font='800 '+px+'px system-ui,sans-serif';cx.textAlign=o.al||'center';cx.textBaseline='middle';cx.lineJoin='round';cx.lineWidth=px/5;cx.strokeStyle=o.st||'rgba(20,10,30,.85)';cx.strokeText(t,x,y);cx.fillStyle=col;cx.fillText(t,x,y);cx.restore()}
function placa(z,T,t0){const u=T-t0;if(u<0||u>2.8)return;const a=u<.25?u/.25:u>2.3?(2.8-u)/.5:1,y=Math.max(44,H*.1)+(1-a)*-20;
  cx.save();cx.globalAlpha=a;const s=Math.min(1,W/520),w=Math.min(W-24,(100+Math.max(120,z.nom.length*11.5))*s+20*s),h=44*s,x=(W-w)/2;
  cx.fillStyle='rgba(10,8,20,.82)';rr(x,y,w,h,12);cx.fill();cx.strokeStyle='#ffd23f';cx.lineWidth=2;cx.stroke();
  cx.fillStyle='#ffd23f';rr(x+6,y+6,84*s,h-12,8);cx.fill();cx.fillStyle='#1a1020';cx.font='800 '+Math.round(15*s)+'px system-ui,sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText('CANAL '+z.canal,x+6+42*s,y+h/2+1);
  cx.fillStyle='#fff7e6';cx.font='800 '+Math.round(19*s)+'px system-ui,sans-serif';cx.fillText(z.nom,x+90*s+(w-90*s)/2,y+h/2+1);cx.restore()}
function dibuixaIntro(T){
  const k=introOk?Math.max(W/INTRO.width,H/INTRO.height):1,z=1+.045*Math.max(0,Math.min(1,T/6.7)),w=INTRO.width*k*z,h=INTRO.height*k*z;
  cx.fillStyle='#0b0b14';cx.fillRect(0,0,W,H);if(introOk)cx.drawImage(INTRO,(W-w)/2,(H-h)*.45,w,h)}
function confeti(T,dt){const cols=['#ff4ba0','#3bd0ff','#ffe36b','#9b5cff','#7dff6a','#ffffff'];
  if(T>=FINAL_T&&T<DUR+2){for(let i=0;i<4;i++)G.conf.push({x:Math.random()*W,y:-10,vx:(Math.random()-.5)*60,vy:90+Math.random()*120,c:cols[(Math.random()*cols.length)|0],r:Math.random()*6,s:3+Math.random()*4,w:Math.random()*6})}
  for(const c of G.conf){c.x+=c.vx*dt+Math.sin(c.w+=dt*5)*.8;c.y+=c.vy*dt;c.r+=dt*6;cx.fillStyle=c.c;cx.save();cx.translate(c.x,c.y);cx.rotate(c.r);cx.fillRect(-c.s,-c.s/2,c.s*2,c.s);cx.restore()}
  G.conf=G.conf.filter(c=>c.y<H+20)}
let tPrev=0;
function render(T){
  const dt=Math.max(0,Math.min(.1,performance.now()/1000-tPrev));tPrev=performance.now()/1000;
  const zi=Math.max(zoneAt(T),G.zr),z=ZN[zi];
  if(zi!==G.lastZi){const prev=G.lastZi;G.lastZi=zi;G.snap=true;if(zi>=1){for(const k of Object.keys(TB))if(+k!==zi&&+k!==zi+1)dropZone(+k)}}
  const bp=((((T-O)/B)%1)+1)%1;
  if(zi===0){dibuixaIntro(T)}
  else{
    setupCam(T,zi,dt);drawSky(zi);drawFar(zi);drawTiles(zi);
    // prefetch de la zona següent
    if(ZN[zi+1]&&T>ZN[zi+1].t0-7)prepTiles(zi+1,ZN[zi+1].t0-.5);
    const fi=T>=FINAL_T;
    if(!fi)drawCues(T,zi,bp);
    drawItems(T,zi);drawChars(T,zi);dibuixaFx(T);
    cx.drawImage(vign,0,0,W,H);
    if(bp<.2&&!fi){cx.globalAlpha=.06*(1-bp/.2);cx.fillStyle='#fff';cx.fillRect(0,0,W,H);cx.globalAlpha=1}
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
function hud(T,zi){
  if(!G.on)return;
  const pw=W-24,x0=12,y0=6;cx.fillStyle='rgba(255,255,255,.18)';cx.fillRect(x0,y0,pw,4);
  cx.fillStyle='#ffd23f';cx.fillRect(x0,y0,pw*Math.max(0,Math.min(1,T/DUR)),4);cx.fillStyle='rgba(255,255,255,.7)';for(const z of ZN)cx.fillRect(x0+pw*z.t0/DUR-1,y0-2,2,8);
  if(G.mode==='joc'){txt(String(G.score),16,34,24,'#fff7e6',{al:'left'});if(G.combo>=3)txt('×'+G.combo,16,60,18,'#ffd23f',{al:'left'});
    const hm=R.spr.atles.it.heart;if(hm&&sprOk){const k=.42,w=hm[2]*k,h=hm[3]*k;for(let i=0;i<3;i++){cx.globalAlpha=i<G.hearts?1:.22;cx.drawImage(SPR,hm[0],hm[1],hm[2],hm[3],W-74-(w+4)*(3-i),14,w,h)}cx.globalAlpha=1}}
  else txt('PASSEIG',16,34,18,'#7dff6a',{al:'left'});
  const z=ZN[zi];if(zi>=1&&zi===G.cd&&T<z.t0+.35&&T>z.t0-1.25){const q=z.t0-T,n=q>.8?3:q>.4?2:q>0?1:0;txt(n?String(n):'Va!',W/2,H*.45,Math.round(Math.min(W,H)*.22),'#ffd23f')}
  if(G.assistMsg&&T-G.assistMsg<3.5&&T>=G.assistMsg)txt('Ajuda activada: finestres una mica més amples',W/2,H-34,14,'#7dff6a');
  if(G.mode==='joc'&&!G.fail){for(let i=G.ni;i<EV.length;i++){const e=EV[i];if(e.st!==0||e.auto)continue;
      if(e.t-T<1.2&&e.t-T>-.1&&G.hits<(e.ty==='S'?4:2)&&(e.ty==='S'?zi===1:!G['hint'+e.ty])){txt(e.ty==='S'?'TOCA QUAN ARRIBIS A L\'ANELL!':e.ty==='U'?'TOCA PER PUJAR A LA PLATAFORMA!':'TOCA PER CREUAR!',W/2,H*.2,Math.round(Math.min(26,W/26)),'#ffffff');if(e.t-T<.2&&e.ty!=='S')G['hint'+e.ty]=1}break}}
  if(G.fail&&T>=G.fail.t+.1)txt('Sense cors!',W/2,H*.4,34,'#ff6b6b')}
function frame(){
  requestAnimationFrame(frame);
  if(G.paused||G.cal)return;
  if(G.loading){cx.setTransform(DPR,0,0,DPR,0,0);cx.fillStyle='#0b0b14';cx.fillRect(0,0,W,H);return}
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
$('b-fs').onclick=async()=>{try{const el=document.documentElement;if(!document.fullscreenElement){await (el.requestFullscreen||el.webkitRequestFullscreen).call(el);try{await screen.orientation.lock('landscape')}catch(e){}}else document.exitFullscreen()}catch(e){}};
if(!(document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen))$('b-fs').hidden=true;

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
window.__rs={G,EV,IT,BN,ZN,R,pathAt,lvAt,flat,
  prepara(mode){G.mode=mode||'joc';G.score=0;G.combo=0;G.maxCombo=0;G.falls=0;G.hits=0;G.perf=0;G.coins=0;G.tvs=0;G.hearts_got=0;G.fallsZ={};G.snapZ={};G.fin=false;G.fail=null;
    for(const e of EV){e.st=0;e.pts=0;e.perfect=false;e.tap=null;e.dmg=false;e.land=false}for(const it of IT)it.got=false;for(const b of BN)b.st=0;G.on=true;G.paused=false;$('inici').hidden=true;$('top').hidden=false;reinicia(0)},
  async carregaMons(){for(let z=1;z<=8;z++){const n=ZN[z].nt;for(let k=0;k<n;k++)await loadTile(z,k);farImg(z)}},
  pas(T){window.__vt=T;update(T);cx.setTransform(DPR,0,0,DPR,0,0);render(T)},
  sensePintar(T){window.__vt=T;update(T)},
  toca(T){window.__vt=T;return judgeTap(T)},
  reinicia,tNow,carrega:()=>{carregat=true}};
requestAnimationFrame(frame);
carrega();
