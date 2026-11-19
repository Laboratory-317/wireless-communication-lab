'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const scene=require('./educational-motion.cjs');
const steering=require('./beam-steering.cjs');
const root=path.resolve(__dirname,'..');
// Independently form F tensor F and compare every possible four-bit input.
const f=[[1,0],[1,1]];
const matrix=Array.from({length:4},(_,r)=>Array.from({length:4},(_,c)=>f[Math.floor(r/2)][Math.floor(c/2)]*f[r%2][c%2]));
for(let input=0;input<16;input++) {
  const bits=Array.from({length:4},(_,i)=>(input>>i)&1);
  const expected=matrix[0].map((_,c)=>bits.reduce((sum,bit,r)=>sum^(bit&matrix[r][c]),0));
  assert.deepEqual(scene.polarStates(bits)[2],expected);
}
assert.deepEqual(scene.polarStates([1,0,1,1]),[[1,0,1,1],[0,1,1,1],[1,1,0,1]]);
assert.deepEqual(scene.parity(scene.validWord),[0,0,0,0]);
assert.deepEqual(scene.parity(scene.damagedWord),[0,1,1,0]);
// Each single-bit error has a unique nonzero syndrome in this example graph.
const syndromes=new Set();
for(let i=0;i<8;i++) {
  const damaged=scene.validWord.map((bit,j)=>bit^(i===j?1:0));
  const syndrome=scene.parity(damaged);assert(syndrome.some(Boolean));
  assert(!syndromes.has(syndrome.join('')));syndromes.add(syndrome.join(''));
  const column=Array.from({length:8},(_,j)=>scene.checks.map(row=>Number(row.includes(j))));
  const found=column.findIndex(candidate=>candidate.join('')===syndrome.join(''));
  assert.equal(found,i);damaged[found]^=1;assert.deepEqual(damaged,scene.validWord);
}
// Compare the closed form with a direct sum of four complex element voltages.
for(const degrees of [0,15,-15]) {
  const steer=degrees*Math.PI/180;
  assert(Math.abs(scene.arrayFactor(steer,steer)-1)<1e-12);
  for(let angle=-90;angle<=90;angle++) {
    const theta=angle*Math.PI/180,psi=Math.PI*(Math.sin(theta)-Math.sin(steer));
    let real=0,imaginary=0;
    for(let element=0;element<4;element++){real+=Math.cos(element*psi);imaginary+=Math.sin(element*psi);}
    assert(Math.abs(scene.arrayFactor(theta,steer)-Math.hypot(real,imaginary)/4)<1e-10);
  }
}
for(const lang of ['ru','en'])for(const page of ['index','research','students','education']) {
  const source=fs.readFileSync(path.join(root,`quarto-site/${lang}/${page}.qmd`),'utf8');
  const svgs=[...source.matchAll(/<svg class="research-symbol research-direction-symbol edu-scene edu-(access|coding|ris|wireless)[^>]*>[\s\S]*?<\/svg>/g)];
  assert.equal(svgs.length,page==='education'?5:4);
  for(const [svg,kind] of svgs)assert.equal(svg,scene.renderCompact(kind,lang,page==='research'));
}
assert(scene.css.includes('prefers-reduced-motion'));
assert(scene.css.includes('svg:target .edu-phase'));
// Check the planar-array expression against an independent 16-element complex sum.
for(const time of [0,.125,.25,.5,.75,1]) {
  const target=steering.steering(time), a=target.azimuth*Math.PI/180, e=target.elevation*Math.PI/180;
  assert(Math.abs(steering.planarFactor(a,e,a,e)-1)<1e-12);
  for(const az of [-.6,0,.4])for(const el of [-.4,0,.3]) {
    let real=0,imag=0;
    for(let m=0;m<4;m++)for(let n=0;n<4;n++) {
      const phase=Math.PI*(m*(Math.cos(el)*Math.sin(az)-Math.cos(e)*Math.sin(a))+n*(Math.sin(el)-Math.sin(e)));
      real+=Math.cos(phase);imag+=Math.sin(phase);
    }
    assert(Math.abs(steering.planarFactor(az,el,a,e)-Math.hypot(real,imag)/16)<1e-12);
  }
}
for(const plane of ['azimuth','elevation']) {
  assert.equal(steering.sectionPath(plane,98,274,246,0),steering.sectionPath(plane,98,274,246,1));
  assert.notEqual(steering.sectionPath(plane,98,274,246,.25),steering.sectionPath(plane,98,274,246,.75));
}
assert.deepEqual(steering.geometry(0,'full'),steering.geometry(1,'full'));
const before=steering.beamVector(.1),after=steering.beamVector(.12);
assert.notEqual(Math.atan2(before[1],before[0]),Math.atan2(after[1],after[0]));
assert.notEqual(Math.asin(before[2]),Math.asin(after[2]));
for(const size of ['small','full']) {
  const first=steering.geometry(0,size),next=steering.geometry(.3,size);
  assert.notEqual(first.surface,next.surface);
  assert.equal(first.mesh.match(/[ML]/g).length,next.mesh.match(/[ML]/g).length);
  assert(!JSON.stringify(next).includes('NaN'));
}
// The renderer alone is insufficient: every direction page must embed its illustration.
for(const lang of ['ru','en'])for(const [page,asset] of [
  ['access','access'],['polar','polar'],['metasurfaces','ris'],['wireless','wireless']
]) {
  const source=fs.readFileSync(path.join(root,`quarto-site/${lang}/research-${page}.qmd`),'utf8');
  const image=`../assets/research/${asset}${lang==='en'?'-en':''}.svg){.detail-diagram}`;
  assert(source.includes(image),`Missing animated illustration on ${lang}/research-${page}`);
}
console.log('Educational scenes: all 16 polar vectors, 8 single-bit corrections, 543 complex array sums and 34 reused scenes verified.');
