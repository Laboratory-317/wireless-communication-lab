'use strict';
// A 4 × 4 planar array in the yz plane, with half-wavelength spacing.
// Azimuth is measured from +x towards +y; elevation from the xy plane.
const rad = degrees => degrees * Math.PI / 180;
const f = value => Number(value.toFixed(3));
function steering(t) {
  return { azimuth: 25 * Math.sin(2 * Math.PI * t), elevation: -8 + 12 * Math.sin(2 * Math.PI * t + Math.PI / 3) };
}
function factor(delta) {
  const q = Math.PI * delta / 2;
  return Math.abs(Math.sin(q)) < 1e-12 ? 1 : Math.abs(Math.sin(4*q)/(4*Math.sin(q)));
}
function planarFactor(azimuth, elevation, targetAzimuth, targetElevation) {
  return factor(Math.cos(elevation)*Math.sin(azimuth)-Math.cos(targetElevation)*Math.sin(targetAzimuth))
    * factor(Math.sin(elevation)-Math.sin(targetElevation));
}
function sectionPath(plane, x, y, radius, t, sy=1) {
  const target = steering(t), az = rad(target.azimuth), el = rad(target.elevation);
  let d = `M${x} ${y}`;
  // Cuts through the instantaneous beam direction. Equal topology allows smooth CSS interpolation.
  for(let degrees=-90;degrees<=90;degrees+=2) {
    const angle=rad(degrees);
    const amplitude=plane==='azimuth' ? planarFactor(angle,el,az,el) : planarFactor(az,angle,az,el);
    d+=`L${f(x+radius*amplitude*Math.cos(angle))} ${f(y-sy*radius*amplitude*Math.sin(angle))}`;
  }
  return d+'Z';
}
function direction(plane,x,y,radius,t,sy=1) {
  const angle=rad(steering(t)[plane]);
  return [f(x+radius*Math.cos(angle)),f(y-sy*radius*Math.sin(angle))];
}
const sizes={small:{x:[27,27],y:[40,108],r:118,sy:.45},full:{x:[98,458],y:[274,274],r:246,sy:1}};
function keyframes(size,plane,index) {
  const {x,y,r,sy}=sizes[size], name=`edu-${plane}-${size}`;
  const frames=Array.from({length:49},(_,i)=>i/48);
  const shape='@keyframes '+name+'{'+frames.map(t=>`${f(t*100)}%{d:path('${sectionPath(plane,x[index],y[index],r,t,sy)}')}`).join('')+'}';
  const guide='@keyframes '+name+'-guide{'+frames.map(t=>`${f(t*100)}%{d:path('M${x[index]} ${y[index]}L${direction(plane,x[index],y[index],r,t,sy).join(' ')}')}`).join('')+'}';
  const dot='@keyframes '+name+'-dot{'+frames.map(t=>`${f(t*100)}%{transform:translate(${direction(plane,x[index],y[index],r,t,sy).map(v=>v+'px').join(',')})}`).join('')+'}';
  return shape+guide+dot+`.${name}{animation:${name} 18s linear infinite}.${name}-guide{animation:${name}-guide 18s linear infinite}.${name}-dot{animation:${name}-dot 18s linear infinite}`;
}
const css=`
.edu-scan-grid{fill:none;stroke:#536c70;stroke-width:.8;opacity:.3}
.edu-scan-guide{fill:none;stroke:#257664;stroke-width:1.2;stroke-dasharray:4 5;opacity:.8}
.edu-scan-title{fill:#183841;stroke:none;font:600 18px Arial,sans-serif}
.edu-scan-note{fill:#536c70;stroke:none;font:14px Arial,sans-serif}
.edu-scan-dot{fill:#257664;stroke:#fff;stroke-width:1.5}
.research-symbol .edu-scan-title{font:600 10px Arial,sans-serif}
.research-symbol .edu-scan-note{font:9px Arial,sans-serif}
`+Object.keys(sizes).flatMap(size=>['azimuth','elevation'].map((plane,i)=>keyframes(size,plane,i))).join('');
function render(lang,compact) {
  const size=compact?'small':'full', {x,y,r,sy}=sizes[size], ru=lang==='ru';
  const label=(cx,cy,value,cls='edu-scan-note')=>`<text x="${cx}" y="${cy}" text-anchor="middle" class="${cls}">${value}</text>`;
  let b='';
  ['azimuth','elevation'].forEach((plane,i)=>{
    const cx=x[i],cy=y[i], name=`edu-${plane}-${size}`;
    if(!compact) {
      b+=label(cx+105,142,i===0?(ru?'Горизонтальная плоскость':'Horizontal plane'):(ru?'Вертикальная плоскость':'Vertical plane'),'edu-scan-title');
      b+=label(cx+105,167,i===0?(ru?'Азимут φ · вид сверху':'Azimuth φ · top view'):(ru?'Угол места θ · вид сбоку':'Elevation θ · side view'));
    } else b+=label(101,i===0?11:79,i===0?(ru?'Азимут':'Azimuth'):(ru?'Угол места':'Elevation'),'edu-scan-title');
    for(const scale of [.5,1]) {
      const radius=r*scale, dx=f(radius*Math.cos(rad(compact?14:32))), dy=f(radius*Math.sin(rad(compact?14:32)));
      b+=`<path class="edu-scan-grid" d="M${f(cx+dx)} ${f(cy-dy)}A${radius} ${radius} 0 0 1 ${f(cx+dx)} ${f(cy+dy)}"/>`;
    }
    b+=`<path class="edu-scan-grid" d="M${cx} ${cy-r*(compact?.25:.43)}V${cy+r*(compact?.25:.43)}M${cx} ${cy}H${cx+r+7}"/>`;
    const beam=sectionPath(plane,cx,cy,r,0,sy),tip=direction(plane,cx,cy,r,0,sy);
    b+=`<path d="${beam}" class="edu-lobe edu-beam-live ${name}"/><path d="M${cx} ${cy}L${tip.join(' ')}" class="edu-scan-guide edu-beam-live ${name}-guide"/><circle r="${compact?2.5:5}" class="edu-scan-dot edu-beam-live ${name}-dot"/>`;
    b+=`<g class="edu-beam-snapshot"><path d="${beam}" class="edu-lobe"/><path d="M${cx} ${cy}L${tip.join(' ')}" class="edu-scan-guide"/><circle cx="${tip[0]}" cy="${tip[1]}" r="${compact?2.5:5}" class="edu-scan-dot"/></g>`;
    // Fixed antenna panel: only the electronic beam changes direction.
    const cell=compact?2:5, pitch=compact?3:7, left=cx-(compact?16:36),top=cy-2*pitch;
    b+=`<rect x="${left-3}" y="${top-3}" width="${pitch*4+3}" height="${pitch*4+3}" rx="3" class="edu-box"/>`;
    for(let row=0;row<4;row++)for(let col=0;col<4;col++)b+=`<rect x="${left+col*pitch}" y="${top+row*pitch}" width="${cell}" height="${cell}" class="edu-fill"/>`;
    b+=`<path d="M${left+pitch*2} ${top+pitch*4+2}v${compact?5:22}m-${compact?5:12} 0h${compact?10:24}" class="edu-wire"/>`;
    b+=label(cx-(compact?8:20),cy+(compact?25:68),ru?'БС':'BS');
    if(!compact)b+=label(cx+115,394,i===0?(ru?'Сканирование влево и вправо':'Steering left and right'):(ru?'Подъём и наклон луча':'Beam elevation and downtilt'));
  });
  if(!compact)b+=label(400,429,ru?'Антенная панель неподвижна · направление луча задаётся фазами':'Fixed antenna panel · phase shifts control the beam direction');
  return b;
}
module.exports={css,render,steering,planarFactor,sectionPath,direction};
