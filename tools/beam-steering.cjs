'use strict';
// A 4 × 4 planar array in the yz plane, with half-wavelength spacing.
// Azimuth is measured from +x towards +y; elevation from the xy plane.
const rad = degrees => degrees * Math.PI / 180;
const f = value => Number(value.toFixed(3));
const street = [.75,-.34,-.21];
const indoor = [.91,.25,.16];
const streetUsers = [[.68,-.45,-.21],street,[.83,-.26,-.21]];
function targetAt(t) {
  const mix = (1-Math.cos(2*Math.PI*t))/2;
  return street.map((value,i)=>value+(indoor[i]-value)*mix);
}
function steering(t) {
  const [x,y,z]=targetAt(t);
  return {azimuth:Math.atan2(y,x)/rad(1),elevation:Math.atan2(z,Math.hypot(x,y))/rad(1)};
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
const sizes={small:{x:34,y:77,r:112},full:{x:198,y:281,r:395}};
function project(point,size) {
  const {x,y,r}=sizes[size], [px,py,pz]=point;
  // Oblique view from in front of the panel, with both its face and the beam length visible.
  const depth=1+.18*py;
  return [f(x+r*(.68*px+.81*py)/depth),f(y+r*(-.17*px+.13*py-.93*pz)/depth)];
}
const linePath=points=>points.map((p,i)=>(i?'L':'M')+p.join(' ')).join('');
function beamVector(t) {
  const {azimuth,elevation}=steering(t),a=rad(azimuth),e=rad(elevation);
  return [Math.cos(e)*Math.cos(a),Math.cos(e)*Math.sin(a),Math.sin(e)];
}
function geometry(t,size) {
  const {azimuth,elevation}=steering(t),a=rad(azimuth),e=rad(elevation),s=beamVector(t);
  const target=targetAt(t),range=Math.hypot(...target);
  const u=[-Math.sin(a),Math.cos(a),0],v=[-Math.sin(e)*Math.cos(a),-Math.sin(e)*Math.sin(a),Math.cos(e)];
  const rows=9,columns=17,mesh=[];
  // Follow the main lobe from its maximum to the first array-factor null.
  // Both steering coordinates enter every vertex of this one 3D surface.
  for(let j=0;j<columns;j++) {
    const beta=2*Math.PI*j/(columns-1), tangent=u.map((value,i)=>value*Math.cos(beta)+v[i]*Math.sin(beta));
    const vector=alpha=>s.map((value,i)=>value*Math.cos(alpha)+tangent[i]*Math.sin(alpha));
    const outside=alpha=>{const d=vector(alpha);return d[0]<=.12||Math.abs(d[1]-s[1])>=.5||Math.abs(d[2]-s[2])>=.5;};
    let high=rad(1);while(high<rad(180)&&!outside(high))high+=rad(1);
    let low=high-rad(1);for(let k=0;k<24;k++){const mid=(low+high)/2;if(outside(mid))high=mid;else low=mid;}
    for(let i=0;i<rows;i++) {
      const d=vector(high*i/(rows-1));
      // Taper the panel's response near grazing incidence so a clipped ray cannot leave a spike.
      const forward=Math.max(0,Math.min(1,(d[0]-.12)/.53));
      const amplitude=i===rows-1?0:factor(d[1]-s[1])*factor(d[2]-s[2])*forward*forward*(3-2*forward);
      (mesh[i]||=[])[j]=project(d.map(value=>value*amplitude*range),size);
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
  const tip=project(target,size),origin=project([0,0,0],size);
  return {surface:linePath(envelope)+'Z',mesh:wire,guide:linePath([origin,tip]),tip};
}
function keyframes(size) {
  const frames=Array.from({length:49},(_,i)=>({t:i/48,g:geometry(i/48,size)}));
  return ['surface','mesh','guide','tip'].map(part=>{
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
.edu-volume-mesh{fill:none;stroke:#257664;stroke-width:.65;opacity:.44}
.edu-building{fill:#fff;stroke:#536c70;stroke-width:1}
.edu-building-side{fill:#536c70;fill-opacity:.25;stroke:#536c70;stroke-width:1}
.edu-building-roof{fill:#536c70;fill-opacity:.18;stroke:#536c70;stroke-width:1}
.edu-window{fill:#536c70;fill-opacity:.15;stroke:#536c70;stroke-width:.7}
.edu-room{fill:#b77538;fill-opacity:.20;stroke:#b77538;stroke-width:1.2}
.edu-floor{fill:none;stroke:#536c70;stroke-width:.7;opacity:.35}
.edu-person{fill:#183841;stroke:#183841;stroke-width:1.25;stroke-linecap:round;stroke-linejoin:round}
.edu-person-body{fill:none}
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
  const polygon=(points,cls)=>`<path d="${linePath(points.map(p))}Z" class="${cls}"/>`;
  const facade=(y1,y2,z1,z2,cls)=>polygon([[.88,y1,z1],[.88,y2,z1],[.88,y2,z2],[.88,y1,z2]],cls);
  const base=-.28,roof=.335,left=.10,right=.59,back=1;
  b+=polygon([[.88,right,base],[back,right,base],[back,right,roof],[.88,right,roof]],'edu-building-side');
  b+=polygon([[.88,left,roof],[back,left,roof],[back,right,roof],[.88,right,roof]],'edu-building-roof');
  b+=facade(left,right,base,roof,'edu-building');
  for(let row=0;row<5;row++) {
    const floor=base+row*.121,bottom=floor+.028;
    if(row>0)b+=`<path d="${linePath([p([.88,left,floor]),p([.88,right,floor]),p([back,right,floor])])}" class="edu-floor"/>`;
    for(let column=0;column<3;column++) {
      if(row===3&&column<2)continue;
      const start=left+.045+column*.15;
      b+=facade(start,start+.105,bottom,bottom+.07,'edu-window');
      b+=`<path d="${linePath([p([.88,start+.052,bottom]),p([.88,start+.052,bottom+.07])])}" class="edu-floor"/>`;
    }
  }
  b+=facade(.126,.405,.086,.204,'edu-room');
  const shapes=(live)=>['surface','mesh','guide'].map(part=>`<path d="${g[part]}" class="${part==='surface'?'edu-volume-surface':part==='mesh'?'edu-volume-mesh':'edu-scan-guide'}${live?' edu-beam-live edu-volume-'+size+'-'+part:''}"/>`).join('')+(live?`<circle r="${compact?2:4}" class="edu-scan-dot edu-beam-live edu-volume-${size}-tip"/>`:`<circle cx="${g.tip[0]}" cy="${g.tip[1]}" r="${compact?2:4}" class="edu-scan-dot"/>`);
  b+=shapes(true)+`<g class="edu-beam-snapshot">${shapes(false)}</g>`;
  const panel=(yy,zz,dy,dz)=>linePath([p([0,yy,zz]),p([0,yy+dy,zz]),p([0,yy+dy,zz+dz]),p([0,yy,zz+dz])])+'Z';
  b+=`<path d="${panel(-.08,-.08,.16,.16)}" class="edu-box"/>`;
  for(let row=0;row<4;row++)for(let col=0;col<4;col++)b+=`<path d="${panel(-.068+col*.035,-.068+row*.035,.025,.025)}" class="edu-fill"/>`;
  b+=`<path d="${linePath([p([0,0,-.08]),p([0,0,-.22])])}${linePath([p([0,-.055,-.22]),p([0,.055,-.22])])}" class="edu-wire"/>`;
  b+=label(x-(compact?16:46),y+(compact?21:66),ru?'БС':'BS');
  const person=point=>{
    const [px,py]=p(point),scale=compact?.52:1.3;
    return `<g transform="translate(${px} ${py}) scale(${scale})" class="edu-person"><circle cx="-4" cy="-7" r="2.8" class="edu-person"/><path d="M-4 -3V6l-3 7m3-7 3 7m-3-16-4 7m4-7L0 0" class="edu-person-body"/><path d="M1 -4v5" class="edu-person-body"/></g>`;
  };
  b+=streetUsers.map(person).join('')+person(indoor);
  if(!compact) {
    const [streetX,streetY]=p(street),[indoorX,indoorY]=p(indoor);
    b+=label(streetX,streetY+34,ru?'Пользователи на улице':'Outdoor users');
    b+=label(indoorX-105,indoorY-48,ru?'Пользователь в помещении':'Indoor user');
    b+=`<path d="M${indoorX-42} ${indoorY-38}L${indoorX-9} ${indoorY-10}" class="edu-scan-grid"/>`;
    b+=label(400,429,ru?'БС меняет азимут и угол места луча':'The base station steers the beam in azimuth and elevation');
  }
  return b;
}
module.exports={css,render,steering,planarFactor,sectionPath,direction,geometry,beamVector,project};
