import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {Point,RoomTemplate} from '../game/roguelike/types';

type Plan=Pick<RoomTemplate,'width'|'height'|'boundary'|'voids'|'obstacles'>;
/** Room18 rough masses. Game coordinates use 32 units per renderer unit.
 * All equipment sits in the sealed core. No props occupy the circulation ring.
 * This is a cutaway jacket, not an exposed or armed reactor. */
export function containmentAnnulusBlockout(t:Plan):T.Group{
 const root=new T.Group();root.name='authored-containment-annulus';
 root.userData.stage='rough-model-placement';
 root.userData.assemblies=['sealed-core','segmented-jacket','radial-feet','inspection-plugs','passenger-vitals','authorization-state'];
 const finish=(name:string,color:number)=>{const m=new T.MeshStandardMaterial({color,roughness:.78,metalness:.2});m.name=name;m.userData.actorMaterial=true;return m;};
 const deck=finish('annulus-deck',0x525f64),ceramic=finish('annulus-ceramic',0x9ea7a4),metal=finish('annulus-bands',0x65757a),dark=finish('annulus-sealed',0x273237),amber=finish('annulus-unarmed-service',0xb49852),vitals=finish('annulus-living-vitals',0x80aca0);
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
 // A sealed low cylindrical lid is surrounded by distinct thermal cassettes.
 const lid=new T.CylinderGeometry(1,1,1,32);lid.scale(158/32,23/32,146/32);add(lid,metal,600/32,22.5/32,440/32);
 for(let i=0;i<16;i++){
  const a=i*Math.PI/8,x=600+Math.cos(a)*170,z=440+Math.sin(a)*157;
  const height=Math.sin(a)>0?30:42;
  box(ceramic,x,z,63,20,11,height,-a-Math.PI/2);
  box(metal,x,z,66,24,11,5,-a-Math.PI/2);
  box(metal,x,z,66,24,11+height-5,5,-a-Math.PI/2);
  // Low radial mounting feet remain inside the chamfered solid reservation.
  box(metal,600+Math.cos(a)*208,440+Math.sin(a)*178,34,18,0,9,-a);
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
 // Rough perimeter curb is inside the envelope and below actor silhouette height.
 // Inset from the exact edge so its thickness never extends outside the floor.
 for(let i=0;i<boundary.length;i++){
  const a=boundary[i],b=boundary[(i+1)%boundary.length],dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz);
  const x=(a.x+b.x)/2-dz/len*4,z=(a.y+b.y)/2+dx/len*4;
  box(metal,x,z,len-8,8,0,8,-Math.atan2(dz,dx));
 }
 for(const [material,list] of parts){const g=mergeGeometries(list,false)!;list.forEach(p=>p.dispose());const mesh=new T.Mesh(g,material);mesh.userData.bakedEnvironment=true;mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);}
 return root;
}
