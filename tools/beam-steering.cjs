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
const sizes={small:{x:39,y:55,r:130},full:{x:180,y:211,r:430}};
function project(point,size) {
  const {x,y,r}=sizes[size], [px,py,pz]=point;
  return [f(x+r*(.87*px+.42*py)),f(y+r*(.15*px-.32*py-.85*pz))];
}
const linePath=points=>points.map((p,i)=>(i?'L':'M')+p.join(' ')).join('');
function beamVector(t) {
  const {azimuth,elevation}=steering(t),a=rad(azimuth),e=rad(elevation);
  return [Math.cos(e)*Math.cos(a),Math.cos(e)*Math.sin(a),Math.sin(e)];
}
function geometry(t,size) {
  const {azimuth,elevation}=steering(t),a=rad(azimuth),e=rad(elevation),s=beamVector(t);
  const u=[-Math.sin(a),Math.cos(a),0],v=[-Math.sin(e)*Math.cos(a),-Math.sin(e)*Math.sin(a),Math.cos(e)];
  const rows=9,columns=17,mesh=[];
  // Follow the main lobe from its maximum to the first array-factor null.
  // Both steering coordinates enter every vertex of this one 3D surface.
  for(let j=0;j<columns;j++) {
    const beta=2*Math.PI*j/(columns-1), tangent=u.map((value,i)=>value*Math.cos(beta)+v[i]*Math.sin(beta));
    const vector=alpha=>s.map((value,i)=>value*Math.cos(alpha)+tangent[i]*Math.sin(alpha));
    const outside=alpha=>{const d=vector(alpha);return Math.abs(d[1]-s[1])>=.5||Math.abs(d[2]-s[2])>=.5;};
    let high=rad(1);while(high<rad(88)&&!outside(high))high+=rad(1);
    let low=high-rad(1);for(let k=0;k<24;k++){const mid=(low+high)/2;if(outside(mid))high=mid;else low=mid;}
    for(let i=0;i<rows;i++) {
      const d=vector(high*i/(rows-1)), amplitude=factor(d[1]-s[1])*factor(d[2]-s[2]);
      (mesh[i]||=[])[j]=project(d.map(value=>value*amplitude),size);
    }
  }
  let wire='';
  for(let i=1;i<rows-1;i++)wire+=linePath(mesh[i]);
  for(let j=0;j<columns-1;j+=2)wire+=linePath(mesh.map(row=>row[j]));
  const points=mesh.flat(),center=points.reduce((sum,p)=>[sum[0]+p[0]/points.length,sum[1]+p[1]/points.length],[0,0]);
  // Fixed support directions keep the projected envelope's path topology stable.
  const envelope=Array.from({length:48},(_,i)=>{
    const angle=i*Math.PI/24,dx=Math.cos(angle),dy=Math.sin(angle);
    return points.reduce((best,p)=>(p[0]-center[0])*dx+(p[1]-center[1])*dy>(best[0]-center[0])*dx+(best[1]-center[1])*dy?p:best,points[0]);
  });
  const tip=project(s,size),ground=project([s[0],s[1],-.22],size),origin=project([0,0,0],size);
  return {surface:linePath(envelope)+'Z',mesh:wire,guide:linePath([origin,tip]),drop:linePath([project([0,0,-.22],size),ground,tip]),tip};
}
function keyframes(size) {
  const frames=Array.from({length:49},(_,i)=>({t:i/48,g:geometry(i/48,size)}));
  return ['surface','mesh','guide','drop','tip'].map(part=>{
    const name=`edu-volume-${size}-${part}`;
    return '@keyframes '+name+'{'+frames.map(({t,g})=>`${f(t*100)}%{`+(part==='tip'?`transform:translate(${g.tip[0]}px,${g.tip[1]}px)`:`d:path('${g[part]}')`)+'}').join('')+'}'+`.${name}{animation:${name} 18s linear infinite}`;
  }).join('');
}
const css=`
.edu-scan-grid{fill:none;stroke:#536c70;stroke-width:.8;opacity:.3}
.edu-scan-guide{fill:none;stroke:#257664;stroke-width:1.2;stroke-dasharray:4 5;opacity:.8}
.edu-scan-title{fill:#183841;stroke:none;font:600 18px Arial,sans-serif}
.edu-scan-note{fill:#536c70;stroke:none;font:14px Arial,sans-serif}
.edu-scan-dot{fill:#257664;stroke:#fff;stroke-width:1.5}
.edu-volume-surface{fill:#257664;fill-opacity:.16;stroke:#257664;stroke-width:1.7;stroke-linejoin:round}
.edu-volume-mesh{fill:none;stroke:#257664;stroke-width:.8;opacity:.6}
.research-symbol .edu-scan-title{font:600 10px Arial,sans-serif}
.research-symbol .edu-scan-note{font:9px Arial,sans-serif}
`+Object.keys(sizes).map(keyframes).join('');
function render(lang,compact) {
  const size=compact?'small':'full', {x,y,r}=sizes[size], ru=lang==='ru',g=geometry(0,size);
  const label=(cx,cy,value,cls='edu-scan-note')=>`<text x="${cx}" y="${cy}" text-anchor="middle" class="${cls}">${value}</text>`;
  let b='';
  const p=point=>project(point,size);
  for(let k=0;k<=4;k++) {
    b+=`<path class="edu-scan-grid" d="${linePath([p([k*.25,-.45,-.22]),p([k*.25,.45,-.22])])}${linePath([p([0,(k-2)*.225,-.22]),p([1,(k-2)*.225,-.22])])}"/>`;
  }
  const arc=Array.from({length:25},(_,i)=>p([.48*Math.cos(rad(-50+i*100/24)),.48*Math.sin(rad(-50+i*100/24)),-.22]));
  b+=`<path d="${linePath(arc)}" class="edu-scan-guide"/>`;
  const elevArc=Array.from({length:25},(_,i)=>p([.35*Math.cos(rad(-30+i*60/24)),0,.35*Math.sin(rad(-30+i*60/24))]));
  b+=`<path d="${linePath(elevArc)}" class="edu-scan-guide"/>`;
  const shapes=(live)=>['drop','surface','mesh','guide'].map(part=>`<path d="${g[part]}" class="${part==='surface'?'edu-volume-surface':part==='mesh'?'edu-volume-mesh':'edu-scan-guide'}${live?' edu-beam-live edu-volume-'+size+'-'+part:''}"/>`).join('')+(live?`<circle r="${compact?2:5}" class="edu-scan-dot edu-beam-live edu-volume-${size}-tip"/>`:`<circle cx="${g.tip[0]}" cy="${g.tip[1]}" r="${compact?2:5}" class="edu-scan-dot"/>`);
  b+=shapes(true)+`<g class="edu-beam-snapshot">${shapes(false)}</g>`;
  const panel=(yy,zz,dy,dz)=>linePath([p([0,yy,zz]),p([0,yy+dy,zz]),p([0,yy+dy,zz+dz]),p([0,yy,zz+dz])])+'Z';
  b+=`<path d="${panel(-.08,-.08,.16,.16)}" class="edu-box"/>`;
  for(let row=0;row<4;row++)for(let col=0;col<4;col++)b+=`<path d="${panel(-.068+col*.035,-.068+row*.035,.025,.025)}" class="edu-fill"/>`;
  b+=`<path d="${linePath([p([0,0,-.08]),p([0,0,-.22])])}${linePath([p([0,-.055,-.22]),p([0,.055,-.22])])}" class="edu-wire"/>`;
  b+=label(x-(compact?13:40),y+(compact?33:103),ru?'БС':'BS');
  b+=label(...p([.48,-.48,-.22]),ru?'Азимут φ':'Azimuth φ');
  b+=label(...p([.28,0,.2]),ru?'Угол места θ':'Elevation θ');
  if(!compact)b+=label(400,429,ru?'Один луч · одновременное управление по двум углам':'One beam · simultaneous azimuth and elevation steering');
  return b;
}
module.exports={css,render,steering,planarFactor,sectionPath,direction,geometry,beamVector,project};
