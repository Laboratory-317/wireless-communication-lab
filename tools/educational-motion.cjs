'use strict';
// Three observable states per scene. Calculations are shared with the SVG renderer,
// while tests compare them with independent matrix and complex-sum references.
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const steering = require('./beam-steering.cjs');
const text = (x,y,s,cls='edu-caption',extra='') => `<text x="${x}" y="${y}" class="${cls}" text-anchor="middle" ${extra}>${esc(s)}</text>`;
const path = (d,cls='edu-wire',extra='') => `<path d="${d}" class="${cls}" ${extra}/>`;
const rect = (x,y,w,h,cls='edu-box') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" class="${cls}"/>`;
const circle = (x,y,r,cls='edu-box') => `<circle cx="${x}" cy="${y}" r="${r}" class="${cls}"/>`;
const phase = (i,body) => {
  // Moving data stays outside the caption/state fade, so transmission never stops.
  const packets=[];
  const layer=body.replace(/<circle\b[^>]*class="edu-packet [^"]*"[^>]*\/>/g,p=>{packets.push(p);return '';});
  return `<g class="edu-phase edu-${['one','two','three'][i]}" opacity="${i===2?1:0}" data-edu-state="${i}">${layer}</g>`+packets.join('');
};
const local = (lang,ru,en) => lang==='ru'?ru:en;
const captions = {
  access: {ru:['Устройствам нужна связь','Сеть распределяет ресурс','Данные переданы'],en:['Devices request a connection','Network assigns resources','Data delivered']},
  coding: {ru:['Преобразование битов','Проверки находят ошибку','Бит исправлен'],en:['Encoding the bits','Checks reveal a bit error','Bit corrected']},
  ris: {ru:['Прямой путь перекрыт','Настраиваем поверхность','Сигнал приходит через RIS'],en:['Direct path is blocked','Configure the surface','Signal arrives via RIS']},
  wireless: {ru:Array(3).fill('Управление направлением луча'),en:Array(3).fill('Continuous beam steering')}
};
const css = `
.edu-phase{opacity:0;animation-duration:18s;animation-timing-function:ease-in-out;animation-iteration-count:infinite}
.edu-one{animation-name:edu-one}.edu-two{animation-name:edu-two}.edu-three{animation-name:edu-three}
@keyframes edu-one{0%,24%,100%{opacity:1}36%,90%{opacity:0}}
@keyframes edu-two{0%,24%,70%,100%{opacity:0}36%,58%{opacity:1}}
@keyframes edu-three{0%,58%,100%{opacity:0}70%,90%{opacity:1}}
.edu-wire{fill:none;stroke:#536c70;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.edu-box{fill:#fff;stroke:#183841;stroke-width:1.5}.edu-active{fill:none;stroke:#257664;stroke-width:3;stroke-linecap:round}
.edu-fill{fill:#257664;stroke:#257664;stroke-width:1}.edu-alt{fill:#b77538;stroke:#b77538;stroke-width:1}.edu-third{fill:#536c70;stroke:#536c70;stroke-width:1}
.edu-faint{opacity:.22}.edu-bad{fill:none;stroke:#be3b36;stroke-width:3}.edu-error{fill:#be3b36;stroke:#be3b36}
.edu-good{fill:#257664;stroke:#257664}.edu-white{fill:#fff;stroke:none;font:12px Arial,sans-serif}
.edu-caption{fill:#183841;stroke:none;font:600 17px Arial,sans-serif}.edu-bit{fill:#183841;stroke:none;font:16px Consolas,monospace}.edu-label{fill:#536c70;stroke:none;font:14px Arial,sans-serif}
.edu-lobe{fill:#257664;fill-opacity:.13;stroke:#257664;stroke-width:2}.edu-link{fill:none;stroke:#257664;stroke-width:2;stroke-dasharray:4 5}
.edu-draw{stroke-dasharray:100;stroke-dashoffset:100;animation:edu-reveal 12s linear infinite}
.edu-received{opacity:0;animation:edu-received 12s linear infinite}
@keyframes edu-received{0%,86%{opacity:0}89%,98%{opacity:1}100%{opacity:0}}
@keyframes edu-reveal{0%,68%{stroke-dashoffset:100}87%,100%{stroke-dashoffset:0}}
.edu-access .signal{opacity:.14}.edu-ris .signal{opacity:.2}
svg:target *,svg:target .edu-phase{animation-play-state:paused!important}
@media(prefers-reduced-motion:reduce){.edu-phase,.edu-draw,.edu-received{animation:none!important}.edu-phase{opacity:0!important}.edu-three,.edu-received{opacity:1!important}.edu-draw{stroke-dashoffset:0!important}}
/* Packets travel along the actual channel geometry, including reflection at RIS. */
.edu-packet{offset-distance:0%;opacity:0;animation:edu-packet 2.8s linear infinite;animation-delay:var(--delay,0s)}
@keyframes edu-packet{0%{offset-distance:0%;opacity:0}6%,94%{opacity:1}100%{offset-distance:100%;opacity:0}}
.edu-flow{stroke-dasharray:5 9;animation:edu-flow 2.4s linear infinite}
@keyframes edu-flow{to{stroke-dashoffset:-28}}
.edu-cell{animation:edu-cell 3.6s ease-in-out infinite;animation-delay:var(--delay,0s)}
@keyframes edu-cell{0%,100%{opacity:.4}50%{opacity:1}}
.edu-beam-snapshot{display:none}
.edu-beam-live{animation:edu-beam-small 18s linear infinite}
.edu-beam-full{animation-name:edu-beam-full}
.edu-needle{animation:edu-steer 18s ease-in-out infinite}
@keyframes edu-steer{0%{transform:rotate(calc(1deg * var(--phase)))}50%{transform:rotate(calc(-1deg * var(--phase)))}100%{transform:rotate(calc(1deg * var(--phase)))}}
@media(prefers-reduced-motion:reduce){.edu-scene *{animation:none!important}.edu-packet,.edu-beam-live,.edu-gauges-live{display:none}.edu-beam-snapshot{display:initial}.edu-cell{opacity:1}}
`;

function packet(d,r=3,delay=0,cls='edu-fill') {
  return [delay,delay-1.4].map(start=>`<circle r="${r}" class="edu-packet ${cls}" style="offset-path:path('${d}');--delay:${start}s"/>`).join('');
}
function beamKeyframes(name,x,y,r) {
  // Cosine steering has matching position and velocity at the loop boundary.
  const frames=Array.from({length:25},(_,i)=>[i*100/24,-15*Math.cos(i*Math.PI/12)]);
  return `@keyframes ${name}{`+frames.map(([time,angle])=>`${time}%{d:path('${beamPath(x,y,r,angle,2)}')}`).join('')+'}';
}

// F tensor F, without bit reversal; row-vector convention x = u(F tensor F).
function polarStates(input) {
  const a=input.slice(); a[0]^=a[2]; a[1]^=a[3];
  const b=a.slice(); b[0]^=b[1]; b[2]^=b[3];
  return [input.slice(),a,b];
}
const checks = [[0,1,4],[1,2,5],[2,3,6],[0,3,7]];
const parity = bits => checks.map(indices=>indices.reduce((sum,i)=>sum^bits[i],0));
const validWord = [1,0,1,0,1,1,1,1];
const damagedWord = validWord.map((bit,i)=>bit^(i===2?1:0));
// Ideal 4-element ULA, half-wavelength spacing, isotropic elements.
// Normalized array factor, theta measured from broadside. No measured prototype is implied.
function arrayFactor(theta,steer) {
  const psi=Math.PI*(Math.sin(theta)-Math.sin(steer));
  return Math.abs(Math.sin(psi/2))<1e-12?1:Math.abs(Math.sin(2*psi)/(4*Math.sin(psi/2)));
}
function beamPath(cx,cy,r,steerDeg,step=.5) {
  const steer=steerDeg*Math.PI/180;
  let d=`M${cx} ${cy}`;
  for(let degrees=-90;degrees<=90;degrees+=step) {
    const theta=degrees*Math.PI/180, radius=r*arrayFactor(theta,steer);
    d+=`L${(cx+radius*Math.cos(theta)).toFixed(3)} ${(cy-radius*Math.sin(theta)).toFixed(3)}`;
  }
  return d+'Z';
}
function gauges(x,ys,steerDeg,r) {
  return ys.map((y,i)=>{
    // The drawn element index increases downwards; positive phase progression
    // therefore compensates propagation towards positive (upward) steering angles.
    const angle=Math.PI*i*Math.sin(steerDeg*Math.PI/180);
    return circle(x,y,r,'edu-box')+path(`M${x} ${y}L${x+r*.78*Math.cos(angle)} ${y-r*.78*Math.sin(angle)}`,'edu-active');
  }).join('');
}
function beamScene(lang,compact=false) {
  return steering.render(lang,compact);
}
function compactAccess(lang) {
  let b='';const ys=[30,65,100],colors=['edu-fill','edu-alt','edu-third'];
  ys.forEach(y=>{b+=rect(8,y-9,17,20)+path(`M25 ${y}L145 65`,'edu-wire');});
  b+=path('M145 41V88M134 88L145 55L156 88M137 76H153','edu-wire')+circle(145,37,4,'edu-box');
  b+=phase(0,ys.map((y,i)=>rect(29,y-6,20,12,colors[i])+text(39,y+4,'→','edu-white')).join('')+text(92,141,captions.access[lang][0]));
  const pool=colors.map((c,i)=>rect(55+i*22,103,18,11,c)+rect(55+i*22,118,18,11,c)).join('');
  b+=phase(1,pool+text(87,97,local(lang,'Радиоресурс','Radio resources'),'edu-label')+text(92,141,captions.access[lang][1]));
  b+=phase(2,pool+ys.map((y,i)=>path(`M25 ${y}L145 65`,'edu-active edu-flow')+packet(`M25 ${y}L145 65`,3,-i*.7,colors[i])+circle(16,y,5,colors[i])).join('')+text(92,141,captions.access[lang][2]));return b;
}
function compactCoding(lang) {
  let b=text(92,10,'POLAR','edu-label');
  const ys=[24,36,48,60];ys.forEach(y=>b+=path(`M18 ${y}H166`));
  const gates=[[48,24,48],[70,36,60],[112,24,36],[140,48,60]];
  gates.forEach(([x,a,z])=>{b+=path(`M${x} ${a+4}V${z}`)+circle(x,a,4)+path(`M${x-2} ${a}h4m-2-2v4`)+circle(x,z,1.6,'edu-fill');});
  b+=text(92,80,'LDPC','edu-label');
  const xs=[24,69,114,159],cx=[46,92,138];
  [[0,1],[1,2],[2,3]].forEach((bits,j)=>bits.forEach(i=>b+=path(`M${xs[i]} 95L${cx[j]} 120`)));
  const polar=polarStates([1,0,1,1]);
  for(let k=0;k<3;k++) {
    const bits=k===1?[1,1,0,1]:[1,1,1,1];
    let layer=polar[k].map((bit,i)=>text(7,ys[i]+3,polar[0][i],'edu-bit')+text(177,ys[i]+3,bit,'edu-bit')).join('');
    layer+=xs.map((x,i)=>circle(x,95,7,k===1&&i===2?'edu-error':'edu-good')+text(x,99,bits[i],'edu-white')).join('');
    layer+=cx.map((x,j)=>{const check=bits[j]^bits[j+1];return rect(x-6,114,12,12,check?'edu-error':'edu-good')+text(x,124,check,'edu-white');}).join('');
    layer+=ys.map((y,i)=>packet(`M18 ${y}H166`,2,-i*.5)).join('');
    if(k===1)layer+=cx.map((x,j)=>packet(`M${xs[j]} 95L${x} 120`,2,-j*.6)).join('');
    layer+=text(92,143,captions.coding[lang][k]);b+=phase(k,layer);
  }return b;
}
function compactRis(lang) {
  let b=rect(65,17,54,23)+rect(84,67,10,44,'edu-third')+text(89,122,local(lang,'Преграда','Obstacle'),'edu-label');
  b+=path('M18 95H148','edu-wire')+circle(18,95,5)+rect(142,85,12,22)+text(18,112,'Tx','edu-label')+text(148,120,'Rx','edu-label')+text(92,12,'RIS','edu-label');
  b+=phase(0,path('M23 95H82','edu-bad')+path('M79 89L91 101M79 101L91 89','edu-bad')+text(92,143,captions.ris[lang][0]));
  const configuration=Array.from({length:8},(_,i)=>`<g class="edu-cell" style="--delay:${-i*.3}s">`+rect(68+(i%4)*12,20+Math.floor(i/4)*9,9,6,i%2?'edu-alt':'edu-fill')+'</g>').join('');
  b+=phase(1,configuration+text(92,143,captions.ris[lang][1]));
  b+=phase(2,configuration+path('M23 93L92 42L142 89','edu-active')+packet('M23 93L92 42L142 89',3)+packet('M23 93L92 42L142 89',3,-1.4)+circle(148,95,4,'edu-good')+text(92,143,captions.ris[lang][2]));return b;
}
function renderCompact(kind,lang,still=false) {
  const body={access:compactAccess,coding:compactCoding,ris:compactRis,wireless:(l)=>beamScene(l,true)}[kind](lang);
  return `<svg class="research-symbol research-direction-symbol edu-scene edu-${kind}${kind==='coding'?' coding-symbol':''}${still||kind==='coding'?' edu-static':''}" viewBox="0 0 184 148" aria-hidden="true">${body}</svg>`;
}
function detailedOverlay(kind,lang) {
  let b='';
  if(kind==='wireless')return '';
  if(kind==='polar') {
    const states=polarStates([1,0,1,1]);
    const captionsLocal=local(lang,['Вход: 1011','Первый этап: 0111','Кодовое слово: 1101'],['Input: 1011','First stage: 0111','Codeword: 1101']);
    states.forEach((bits,k)=>{
      const gates=k===1?[[280,187],[350,249]]:k===2?[[490,187],[560,311]]:[];
      b+=phase(k,bits.map((bit,i)=>rect(609,171+i*62,34,30)+text(626,193+i*62,bit,'edu-bit')+packet(`M126 ${187+i*62}H605`,5,-i*.5)).join('')+gates.map(([x,y])=>circle(x,y,17,'edu-active')).join('')+text(400,430,captionsLocal[k]));
    });
  } else if(kind==='ldpc') {
    [validWord,damagedWord,validWord].forEach((bits,k)=>{
      const syndrome=parity(bits);
      let layer=bits.map((bit,i)=>circle(120+i*80,210,12,k===1&&i===2?'edu-error':'edu-good')+text(120+i*80,216,bit,'edu-white')).join('');
      layer+=syndrome.map((bit,j)=>rect(208+j*120,338,24,24,bit?'edu-error':'edu-good')+text(220+j*120,356,bit,'edu-white')).join('');
      layer+=checks.flatMap((indices,j)=>indices.map((i)=>packet(`M${120+i*80} 210L${220+j*120} 350`,4,-i*.3-j*.5))).join('');
      const caption=k===0?local(lang,'Все проверки выполнены','All parity checks pass'):captions.coding[lang][k];
      b+=phase(k,layer+text(400,430,caption));
    });
  } else if(kind==='ris') {
    b+=phase(0,path('M142 339H368','edu-bad')+path('M378 329L398 349M378 349L398 329','edu-bad')+text(400,430,captions.ris[lang][0]));
    const configuration=Array.from({length:12},(_,i)=>`<g class="edu-cell" style="--delay:${-i*.3}s">`+rect(450+i%6*25,159+Math.floor(i/6)*25,20,20,i%2?'edu-alt':'edu-fill')+'</g>').join('');
    b+=phase(1,configuration+text(400,430,captions.ris[lang][1]));
    b+=phase(2,configuration+path('M142 330L522 217L674 329','edu-active')+packet('M142 330L522 217L674 329',6)+packet('M142 330L522 217L674 329',6,-1.4)+circle(688,341,7,'edu-good')+text(400,430,captions.ris[lang][2]));
  } else if(kind==='access') {
    const colors=['edu-fill','edu-alt','edu-third'],ys=[176,266,356];
    const pool=colors.map((c,i)=>rect(339+i*25,145,20,16,c)+rect(339+i*25,168,20,16,c)).join('');
    b+=phase(0,ys.map((y,i)=>rect(500,y-9,31,19,colors[i])+text(516,y+5,'→','edu-white')).join('')+text(400,430,captions.access[lang][0]));
    b+=phase(1,pool+text(376,130,local(lang,'Радиоресурс','Radio resources'),'edu-label')+text(400,430,captions.access[lang][1]));
    b+=phase(2,pool+ys.map((y,i)=>path(`M272 245L551 ${y}`,'edu-active edu-flow')+packet(`M272 245L551 ${y}`,6,-i*.7,colors[i])+circle(581,y,7,'edu-good')).join('')+text(400,430,captions.access[lang][2]));
  }return b;
}
const staticCss='.edu-static *{animation:none!important}.edu-static .edu-phase{opacity:0!important}.edu-static .edu-three{opacity:1!important}.edu-static .edu-packet,.edu-static .edu-beam-live,.edu-static .edu-gauges-live{display:none}.edu-static .edu-beam-snapshot{display:initial}.edu-static .edu-cell{opacity:1}';
module.exports={css:css+staticCss+steering.css,diagramCss:kind=>css+staticCss+(kind==='wireless'?steering.css:''),renderCompact,detailedOverlay,beamScene,polarStates,checks,parity,validWord,damagedWord,arrayFactor,beamPath};
