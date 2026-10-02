import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {Point,RoomTemplate} from '../game/roguelike/types';

type Plan=Pick<RoomTemplate,'width'|'height'|'boundary'|'voids'|'obstacles'>;
/** Room18 ceramic shielding and flush annular circulation finishes.
 * Game coordinates use 32 units per renderer unit. All equipment stays inside
 * the solid core. The low near-side jacket preserves the stage2 silhouette. */
export function containmentAnnulusBlockout(t:Plan):T.Group{
 const root=new T.Group();root.name='authored-containment-annulus';
 root.userData.stage='room-visuals';
 root.userData.assemblies=['sealed-core','segmented-jacket','radial-feet','inspection-plugs','passenger-vitals','authorization-state'];
 const finish=(name:string,color:number,roughness=.78,metalness=.2)=>{const m=new T.MeshStandardMaterial({color,roughness,metalness});m.name=name;m.userData.actorMaterial=true;return m;};
 const deck=finish('annulus-deck',0x3d4b51),ceramic=finish('annulus-ceramic',0xb8bab0,.9,.03),metal=finish('annulus-bands',0x66777b,.43,.65),dark=finish('annulus-sealed',0x273237),amber=finish('annulus-unarmed-service',0xb49852),vitals=finish('annulus-living-vitals',0x80aca0);
 const circulation=finish('annulus-circulation',0x69777a,.88,.12),ceramicShade=finish('annulus-ceramic-shadow',0x909b98,.92,.03);
 const parts=new Map<T.Material,T.BufferGeometry[]>();
 const add=(g:T.BufferGeometry,m:T.Material,x=0,y=0,z=0,angle=0)=>{
  g.rotateY(angle);g.translate(x,y,z);const flat=g.index?g.toNonIndexed():g;if(flat!==g)g.dispose();
  const list=parts.get(m)??[];list.push(flat);parts.set(m,list);
 };
 const box=(m:T.Material,x:number,z:number,w:number,d:number,bottom:number,height:number,angle=0)=>add(new T.BoxGeometry(w/32,height/32,d/32),m,x/32,(bottom+height/2)/32,z/32,angle);
 const path=(p:readonly Point[])=>p.map(q=>new T.Vector2(q.x/32,-q.y/32));
 const slab=(outline:readonly Point[],bottom:number,height:number,m:T.Material,holes:readonly (readonly Point[])[]=[])=>{
  const shape=new T.Shape(path(outline));for(const h of holes)shape.holes.push(new T.Path(path(h)));
  const g=new T.ExtrudeGeometry(shape,{depth:height/32,bevelEnabled:false,steps:1});g.rotateX(-Math.PI/2);add(g,m,0,bottom/32,0);
 };
 const boundary=t.boundary!,core=t.voids![0];
 slab(boundary,-14,14,deck,t.voids);slab(core,-14,25,dark);
 // The walkable ring is a broad, flush finish, not a raised catwalk.
 const expandedCore=(amount:number)=>core.map(p=>({x:p.x+Math.sign(p.x-600)*amount,y:p.y+Math.sign(p.y-440)*amount}));
 slab(expandedCore(24),0,.2,dark,[core]);
 slab(expandedCore(124),0,.25,metal,[expandedCore(24)]);
 slab(expandedCore(120),.25,.2,circulation,[expandedCore(28)]);
 // Sparse expansion joints cross the finish; no arrows or hazard countdown ring.
 for(const x of [470,730])for(const z of [268-74,612+74])box(deck,x,z,2,90,.45,.12);
 for(const x of [306,894])for(const z of [355,525])box(deck,x,z,90,2,.45,.12);
 // The elliptical jacket has three overlapping courses on a continuous backing.
 const sector=(inner:number,outer:number,start:number,end:number)=>{
  const points:Point[]=[];
  for(let j=0;j<=8;j++){const a=start+(end-start)*j/8;points.push({x:600+Math.cos(a)*outer,y:440+Math.sin(a)*outer*157/170});}
  for(let j=8;j>=0;j--){const a=start+(end-start)*j/8;points.push({x:600+Math.cos(a)*inner,y:440+Math.sin(a)*inner*157/170});}
  return points;
 };
 const lid=new T.CylinderGeometry(1,1,1,64);lid.scale(160/32,18/32,148/32);add(lid,dark,600/32,20/32,440/32);
 // Broad closed roof tiles replace the featureless blockout disk. Dark joints
 // reveal the sealed backing, never an emissive core or a hole through the lid.
 for(let i=0;i<16;i++){
  const a=i*Math.PI/8;
  slab(sector(57,153,a+.012,a+Math.PI/8-.012),29,i%4===0?5:3,i%4===0?ceramicShade:ceramic);
 }
 const hatch=new T.CylinderGeometry(56/32,60/32,7/32,16);add(hatch,metal,600/32,31.5/32,440/32);
 const hatchFace=new T.CylinderGeometry(49/32,49/32,2/32,16);add(hatchFace,ceramicShade,600/32,36/32,440/32);
 for(const x of [579,621])box(dark,x,440,6,46,37,1);
 for(let i=0;i<16;i++){
  const a=i*Math.PI/8,start=a-Math.PI/16,end=a+Math.PI/16,near=Math.sin(a)>0;
  const courseHeight=near?9:13,step=near?10:14,top=near?40:52;
  slab(sector(155,177,start,end),11,top-11,dark);
  for(let row=0;row<3;row++){
   // Each upper course overhangs the one below by two game units.
   slab(sector(159,180+row*2,start+.013,end-.013),11+row*step,courseHeight,row===1?ceramicShade:ceramic);
  }
  slab(sector(154,186,start+.006,end-.006),top,2,metal);
  slab(sector(155,184,start,end),11,3,metal);
  // Feet, risers and sparse service tabs remain inside the central solid.
  const x=600+Math.cos(a)*208,z=440+Math.sin(a)*178;
  box(metal,x,z,34,18,0,9,-a);
  box(dark,x,z,24,10,9,4,-a);
  if(i%4===0)box(amber,x,z,12,10,13,1,-a);
 }
 // Closed inspection plugs at north and south, not new interactions.
 for(const z of [270,610]){box(dark,600,z,52,24,11,12);box(metal,600,z,38,16,23,5);}
 // East status rail with independent vitals and authorization housings.
 box(metal,815,440,24,254,0,19);
 for(const [z,mat] of [[350,vitals],[490,amber]] as const){box(dark,803,z,66,76,19,9);box(mat,803,z,58,58,28,3);}
 root.userData.localSigns=[{text:'PASSENGERS ALIVE',x:810,z:350,h:31,width:48,depth:30},{text:'NOT ARMED',x:810,z:490,h:31,width:48,depth:30}];
 if(typeof document!=='undefined')for(const sign of root.userData.localSigns){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=240;const ctx=canvas.getContext('2d');if(!ctx)continue;
  ctx.fillStyle='#172126';ctx.fillRect(0,0,512,240);ctx.fillStyle='#dce1cf';ctx.font='bold 58px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  const words=sign.text==='PASSENGERS ALIVE'?['PASSENGERS','ALIVE']:['NOT ARMED','MANUAL ONLY'];for(let i=0;i<words.length;i++)ctx.fillText(words[i],256,75+i*95,490);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const material=new T.MeshBasicMaterial({map:texture});material.userData.actorMaterial=true;
  material.addEventListener('dispose',()=>texture.dispose());
  const g=new T.PlaneGeometry(sign.width/32,sign.depth/32);g.rotateX(-Math.PI/2);add(g,material,sign.x/32,(sign.h+.1)/32,sign.z/32);
 }
 // Low perimeter wall cassettes sit against the existing envelope. Rear wall
 // panels are taller; the camera-facing edge stays at the blockout curb height.
 for(let i=0;i<boundary.length;i++){
  const a=boundary[i],b=boundary[(i+1)%boundary.length],dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz),angle=-Math.atan2(dz,dx);
  const x=(a.x+b.x)/2-dz/len*4,z=(a.y+b.y)/2+dx/len*4;
  box(metal,x,z,len-8,8,0,8,angle);
  const count=Math.max(1,Math.floor(len/140)),height=(a.y+b.y)/2<200?22:8;
  for(let j=0;j<count;j++){
   const f=(j+.5)/count,px=a.x+dx*f-dz/len*10,pz=a.y+dz*f+dx/len*10;
   box(dark,px,pz,len/count-10,12,0,height,angle);
   box(ceramicShade,px,pz,len/count-18,10,0,height-3,angle);
   box(metal,px,pz,len/count-10,12,height-3,3,angle);
  }
 }
 for(const [material,list] of parts){const g=mergeGeometries(list,false)!;list.forEach(p=>p.dispose());const mesh=new T.Mesh(g,material);mesh.userData.bakedEnvironment=true;mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);}
 return root;
}
