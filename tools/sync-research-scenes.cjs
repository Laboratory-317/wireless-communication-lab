'use strict';
// Run explicitly after changing educational-motion.cjs; normal builds do not rewrite QMD.
const fs=require('node:fs');
const path=require('node:path');
const {css,renderCompact}=require('./educational-motion.cjs');
const root=path.resolve(__dirname,'..');
for(const lang of ['ru','en'])for(const page of ['index','research','students','education']) {
  const file=path.join(root,`quarto-site/${lang}/${page}.qmd`);
  let count=0;
  const source=fs.readFileSync(file,'utf8').replace(/<svg class="research-symbol[^>]*>[\s\S]*?<\/svg>/g,svg=>{
    const kind=svg.includes('edu-coding')?'coding':svg.includes('edu-wireless')?'wireless':svg.includes('edu-access')?'access':svg.includes('edu-ris')?'ris':null;
    if(!kind)return svg;
    count++;return renderCompact(kind,lang,true);
  });
  if(count!==(page==='education'?5:4))throw Error(`Unexpected scene count: ${lang}/${page}: ${count}`);
  fs.writeFileSync(file,source);
}
const themed=(colors)=>css.replace(/#[0-9a-fA-F]{3,8}\b/g,value=>colors[value]||value);
const file=path.join(root,'quarto-site/home.css');let source=fs.readFileSync(file,'utf8');
const start=source.indexOf('/* Explanatory three-state scenes');const end=source.indexOf('.motion-toggle',start);
if(start<0||end<0)throw Error('Missing scene stylesheet boundaries');
source=source.slice(0,start)+'/* Explanatory three-state scenes share one timeline. */\n'+themed({'#183841':'var(--home-ink)','#fff':'var(--home-surface)','#536c70':'var(--home-muted)','#257664':'var(--home-accent)','#b77538':'var(--home-secondary)','#be3b36':'var(--home-error)'}).replaceAll('svg:target',':root[data-lab-motion="off"]')+`
.research-symbol .edu-caption { font:600 10px Arial,sans-serif; fill:var(--home-ink); }
.research-symbol .edu-bit { font:10px Consolas,monospace; fill:var(--home-ink); }
.research-symbol .edu-label { font:10px Arial,sans-serif; fill:var(--home-muted); }
.research-symbol .edu-white { font:10px Arial,sans-serif; fill:var(--home-surface); }
`+source.slice(end);fs.writeFileSync(file,source);
const scientific=path.join(root,'scientific-site/scientific.css');let style=fs.readFileSync(scientific,'utf8');
style=style.split('/* Canonical educational scenes: static final state in Scientific. */')[0];
style+='\n/* Canonical educational scenes: static final state in Scientific. */\n'+themed({'#183841':'var(--sc-ink)','#fff':'var(--sc-paper)','#536c70':'var(--sc-muted)','#257664':'var(--sc-accent)'})+'\n.research-symbol .edu-phase{animation:none!important;opacity:0!important}.research-symbol .edu-three{opacity:1!important}.research-symbol .edu-draw{animation:none!important;stroke-dashoffset:0!important}.research-symbol .edu-received{animation:none!important;opacity:1!important}.research-symbol .edu-caption{font:600 10px Arial,sans-serif}.research-symbol .edu-bit,.research-symbol .edu-white{font:10px Consolas,monospace}.research-symbol .edu-label{font:10px Arial,sans-serif}\n';
style+='\n.research-symbol *{animation:none!important}.research-symbol .edu-packet,.research-symbol .edu-beam-live,.research-symbol .edu-gauges-live{display:none}.research-symbol .edu-beam-snapshot{display:initial}.research-symbol .edu-cell{opacity:1}\n';
fs.writeFileSync(scientific,style);
console.log('Synchronized 34 reusable scenes and their shared styles.');
