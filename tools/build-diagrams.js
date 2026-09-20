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
${text(744,57,`0${index}`,'text-anchor="end" class="muted"')}
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
    ys.forEach((y,i)=>{body+=line(126,y,660,y)+text(79,y+6,`u${['₀','₁','₂','₃'][i]}`)+text(683,y+6,`x${['₀','₁','₂','₃'][i]}`);});
    for(const [x,a,b] of [[300,187,311],[300,249,373],[530,187,249],[530,311,373]]) {
      body+=line(x-83,b,x,a,'class="signal"')+circle(x-83,b,4,'style="fill:#257664;stroke:#257664"')+circle(x,a,12)+line(x-7,a,x+7,a)+line(x,a-7,x,a+7);
    }
    return body;
  },
  access(l) {
    let body=text(210,145,l.left,'text-anchor="middle" font-weight="700"')+text(592,145,l.right,'text-anchor="middle" font-weight="700"');
    body+=rect(50,180,320,130,'rx="6" fill="#fff" stroke="#ccdad3"')+rect(430,180,320,130,'rx="6" fill="#fff" stroke="#ccdad3"');
    for(let i=0;i<4;i++)body+=rect(62+i*77,192,68,106,`rx="3" fill="${i%2?'#b77538':'#257664'}"`);
    body+=rect(442,192,296,66,'rx="3" fill="#257664"')+rect(442,262,296,36,'rx="3" fill="#b77538"');
    body+=line(50,326,369,326,'class="signal" marker-end="url(#arrow)"')+line(430,326,748,326,'class="signal" marker-end="url(#arrow)"');
    body+=text(210,351,l.time,'text-anchor="middle" class="small"')+text(592,351,l.time,'text-anchor="middle" class="small"');
    body+=text(210,383,l.leftnote,'text-anchor="middle" class="small"')+text(592,383,l.rightnote,'text-anchor="middle" class="small"');
    body+=rect(195,411,12,12,'fill="#257664"')+text(217,422,l.usera,'class="small"')+rect(438,411,12,12,'fill="#b77538"')+text(460,422,l.userb,'class="small"');
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
    fs.writeFileSync(path.join(root,'assets/research',`${name}${suffix}.svg`),frame(label,++index,draw(label)));
  }
}
console.log('Built 8 RU/EN research diagrams from Markdown labels.');
