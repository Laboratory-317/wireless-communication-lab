// Editable vector artwork; all visible labels live in paired Markdown files.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
function labels(language) {
  const text = fs.readFileSync(path.join(root, 'content/research-diagrams', `${language}.md`), 'utf8');
  const result = {};
  let section;
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith('## ')) { section = {}; result[line.slice(3)] = section; }
    const match = line.match(/^([a-z]+):\s*(.+)$/);
    if (section && match) section[match[1]] = match[2];
  }
  return result;
}
const text = (x, y, value, extra = '') => `<text x="${x}" y="${y}" ${extra}>${escape(value)}</text>`;
const line = (x1, y1, x2, y2, extra = '') => `<path d="M${x1} ${y1}L${x2} ${y2}" ${extra}/>`;
const circle = (x,y,r,extra='') => `<circle cx="${x}" cy="${y}" r="${r}" ${extra}/>`;
const rect = (x,y,w,h,extra='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${extra}/>`;
function frame(label, index, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" role="img" aria-labelledby="title desc">
<title id="title">${escape(label.title)}</title><desc id="desc">${escape(label.subtitle)}</desc>
<defs><marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#257664"/></marker></defs>
<style>text{font-family:Arial,sans-serif;fill:#183841;font-size:18px}path{fill:none;stroke:#183841;stroke-width:2}circle{fill:#fff;stroke:#183841;stroke-width:2}.muted{fill:#536c70;font-size:16px}.signal{stroke:#257664;stroke-width:3}.accent{fill:#257664}.head{font-size:27px;font-weight:700}.small{font-size:15px}</style>
${rect(0,0,800,520,'fill="#f3f6f3"')}${rect(32,32,4,60,'fill="#257664"')}
${text(52,58,label.title,'class="head"')}${text(52,88,label.subtitle,'class="muted"')}

${body}
${line(40,449,760,449,'style="stroke:#ccd9d3"')}${text(40,483,label.note,'class="small"')}
</svg>\n`;
}
const drawings = {
  wireless(l) {
    let body = '<path d="M222 272L622 151L622 382Z" style="fill:#2576640d;stroke:none"/>';
    body += rect(129,183,73,158,'rx="8" fill="#dce8e1" stroke="#183841" stroke-width="2"');
    for(let r=0;r<4;r++) for(let c=0;c<2;c++) body+=rect(144+c*28,199+r*34,15,22,'rx="3" fill="#257664"');
    body+=line(165,342,165,374)+line(141,375,189,375);
    for(const [x,y] of [[600,164],[654,256],[592,346]]) {
      body+=line(220,267,x-18,y+17,'class="signal" marker-end="url(#arrow)"');
      body+=rect(x,y,28,46,'rx="5" fill="#fff" stroke="#183841" stroke-width="2"')+line(x+9,y+37,x+19,y+37);
    }
    body+='<path d="M320 218Q352 266 320 314M405 196Q454 266 405 336" style="stroke:#257664;stroke-width:2;stroke-dasharray:4 6"/>';
    return body+text(165,413,l.source,'text-anchor="middle"')+text(635,413,l.target,'text-anchor="middle"');
  },
  polar(l) {
    let body=text(112,138,l.source,'text-anchor="middle" class="muted"')+text(680,138,l.target,'text-anchor="middle" class="muted"');
    const ys=[187,249,311,373];
    ys.forEach((y,i)=>{body+=line(126,y,660,y)+text(79,y+6,`u${['₀','₁','₂','₃'][i]}`,'font-style="italic"')+text(683,y+6,`x${['₀','₁','₂','₃'][i]}`,'font-style="italic"');});
    for(const [x,a,b] of [[280,187,311],[350,249,373],[490,187,249],[560,311,373]]) {
      body+=line(x,b,x,a+12,'class="signal"')+circle(x,b,4,'style="fill:#257664;stroke:#257664"')+circle(x,a,12)+line(x-7,a,x+7,a)+line(x,a-7,x,a+7);
    }
    return body;
  },
  ldpc(l) {
    // Each row lists the variable nodes in one parity-check equation.
    const checks = [[0,1,4], [1,2,5], [2,3,6], [0,3,7]];
    const xs = Array.from({length:8}, (_,i)=>120+i*80);
    let body=text(400,145,l.source,'text-anchor="middle" class="muted"');
    checks.forEach((bits,j)=>bits.forEach(i=>{
      body+=line(xs[i],210,220+j*120,350,'class="signal"');
    }));
    xs.forEach((x,i)=>{
      body+=circle(x,210,12)+text(x,183,`x${['₀','₁','₂','₃','₄','₅','₆','₇'][i]}`,'text-anchor="middle" font-style="italic"');
    });
    checks.forEach((bits,j)=>{
      const x=220+j*120;
      body+=rect(x-12,338,24,24,'fill="#fff" stroke="#183841" stroke-width="2"')+text(x,391,`c${['₀','₁','₂','₃'][j]}`,'text-anchor="middle" font-style="italic"');
    });
    return body+text(400,427,l.target,'text-anchor="middle" class="muted"');
  },
  access(l) {
    // A shared network, without implying any particular access technique.
    let body='';
    for(const y of [176,266,356]) {
      body+=line(272,245,551,y,'class="signal" style="stroke-dasharray:6 6"');
      const dy=y-245, dx=279, norm=Math.hypot(dx,dy);
      const ux=dx/norm, uy=dy/norm;
      for(const [x0,y0,sign] of [[280,245+dy*8/279,-1],[543,y-dy*8/279,1]]) {
        body+=line(x0,y0,x0-sign*ux*9-uy*5,y0-sign*uy*9+ux*5,'class="signal"')+line(x0,y0,x0-sign*ux*9+uy*5,y0-sign*uy*9-ux*5,'class="signal"');
      }
    }
    // Base station and radio waves.
    body+='<path d="M220 224L169 356H271ZM193 295H247M181 326H259M193 295L259 326M247 295L181 326M220 224V198"/>';
    body+=circle(220,188,7,'style="fill:#257664;stroke:#257664"');
    body+='<path d="M198 166Q177 188 198 210M242 166Q263 188 242 210M184 153Q150 188 184 223M256 153Q290 188 256 223" class="signal"/>';
    body+=text(220,396,l.station,'text-anchor="middle"');
    // Phone, laptop and sensor: familiar examples of network users.
    body+=rect(565,150,30,52,'rx="5" fill="#fff" stroke="#183841" stroke-width="2"')+line(574,194,586,194);
    body+=text(623,183,l.phone);
    body+=rect(554,241,54,35,'rx="3" fill="#fff" stroke="#183841" stroke-width="2"')+'<path d="M548 283H614L608 276H554Z"/>';
    body+=text(633,268,l.laptop);
    body+=rect(562,337,38,38,'rx="7" fill="#fff" stroke="#183841" stroke-width="2"')+circle(581,356,7)+line(581,337,581,323)+circle(581,320,3);
    body+=text(626,363,l.sensor);
    return body;
  },
  ris(l) {
    let body=line(138,339,682,339,'style="stroke:#a7b9b1;stroke-dasharray:5 6"');
    body+=rect(368,283,50,105,'fill="#d7dcd4" stroke="#536c70"')+text(393,413,l.wall,'text-anchor="middle" class="muted"');
    body+=rect(443,152,164,62,'rx="4" fill="#dce8e1" stroke="#183841"');
    for(let r=0;r<2;r++)for(let c=0;c<6;c++)body+=rect(450+c*25,159+r*25,20,20,'rx="2" fill="#257664"');
    body+=line(142,330,512,217,'class="signal" marker-end="url(#arrow)"')+line(531,219,674,329,'class="signal" marker-end="url(#arrow)"');
    body+=line(138,313,138,376)+line(122,376,154,376)+circle(138,314,6,'style="fill:#183841"');
    body+=rect(674,318,28,47,'rx="5" fill="#fff" stroke="#183841"')+line(683,356,693,356);
    body+=text(525,135,l.surface,'text-anchor="middle" font-weight="700"')+text(138,413,l.source,'text-anchor="middle"')+text(686,413,l.target,'text-anchor="middle"');
    return body;
  }
};
for (const language of ['ru','en']) {
  const localized = labels(language);
  let index=0;
  for(const [name,draw] of Object.entries(drawings)) {
    const label=localized[name];
    if(!label?.title || !label?.note) throw new Error(`Missing labels: ${language}/${name}`);
    const suffix=language==='ru'?'':'-en';
    const svg=frame(label,++index,draw(label));
    fs.writeFileSync(path.join(root,'assets/research',`${name}${suffix}.svg`),svg);
    // Both designs use the same coding diagrams and geometry.
    if (['polar','ldpc','access'].includes(name)) fs.writeFileSync(path.join(root,'quarto-site/assets/research',`${name}${suffix}.svg`),svg);
  }
}
console.log(`Built ${Object.keys(drawings).length*2} RU/EN research diagrams from Markdown labels.`);
