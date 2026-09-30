import * as T from 'three';
import {TRANSMISSION_BLOCKOUT} from '../game/roguelike/transmissionChamberLayout';
import type {Point} from '../game/roguelike/types';
const U=32;
/** Room10 stage2. Synchronous rough forms with owned materials and exact solid bases.
 * No new interactions, milestone text, arena roof, shield or emissive route ring. */
export function transmissionChamberRoom():T.Group{
 const room=new T.Group();room.name='authored-transmission-chamber';
 const mat=(name:string,color:number,metalness=.25,roughness=.78)=>{const m=new T.MeshStandardMaterial({color,metalness,roughness});m.name=name;m.userData.actorMaterial=true;return m;};
 const steel=mat('transmission-alloy',0x687c85,.6,.58),ceramic=mat('transmission-ceramic',0xb8bbb0,.1,.82),dark=mat('transmission-housing',0x25333e,.4,.8),deck=mat('transmission-blockout-deck',0x35434b,.2,.9),blue=mat('transmission-indicator',0x8abacb,.1,.6);
 blue.emissive.setHex(0x315965);blue.emissiveIntensity=.25;
 const mesh=(owner:T.Group,g:T.BufferGeometry,m:T.Material,x=0,y=0,z=0)=>{const o=new T.Mesh(g,m);o.position.set(x/U,y/U,z/U);o.castShadow=true;o.receiveShadow=true;o.userData.bakedEnvironment=true;owner.add(o);return o;};
 const box=(g:T.Group,x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material)=>mesh(g,new T.BoxGeometry(w/U,h/U,d/U),m,x,y,z);
 const cylinder=(g:T.Group,x:number,y:number,z:number,r:number,h:number,m:T.Material,open=false)=>mesh(g,new T.CylinderGeometry(r/U,r/U,h/U,24,1,open),m,x,y,z);
 const slab=(g:T.Group,points:readonly Point[],height:number,base:number,m:T.Material)=>{
  const shape=new T.Shape(points.map(p=>new T.Vector2(p.x/U,-p.y/U)));
  const o=mesh(g,new T.ExtrudeGeometry(shape,{depth:height/U,bevelEnabled:false,steps:1}),m,0,base,0);o.rotation.x=-Math.PI/2;return o;
 };
 const rod=(g:T.Group,a:number[],b:number[],radius:number,m:T.Material)=>{
  const av=new T.Vector3(...a.map(v=>v/U) as [number,number,number]),bv=new T.Vector3(...b.map(v=>v/U) as [number,number,number]);
  const o=mesh(g,new T.CylinderGeometry(radius/U,radius/U,av.distanceTo(bv),8),m);o.position.copy(av).add(bv).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());
 };
 // Continuous rectangular deck. Collision voids are filled by solid equipment bases.
 box(room,600,-8,440,1200,16,880,deck);
 box(room,600,24,0,1200,48,12,dark);box(room,600,7,880,1200,14,12,dark);
 for(const x of [0,1200])box(room,x,12,440,12,24,880,dark);
 for(const x of [200,400,800,1000])box(room,x,49,0,50,2,8,steel);
 for(const f of TRANSMISSION_BLOCKOUT){
  const g=new T.Group();g.name=f.id;g.userData.footprint=f.footprint;room.add(g);
  const center=f.footprint.reduce((c,p)=>({x:c.x+p.x/f.footprint.length,y:c.y+p.y/f.footprint.length}),{x:0,y:0});
  slab(g,f.footprint,8,0,dark);
  if(f.id.startsWith('waveguide')){
   slab(g,f.footprint,12,8,steel);
   const inset=f.footprint.map(p=>({x:center.x+(p.x-center.x)*.8,y:center.y+(p.y-center.y)*.8}));
   slab(g,inset,5,20,ceramic);
   cylinder(g,center.x,30,center.y,9,10,dark);
   for(const y of [26,33,40])cylinder(g,center.x,y,center.y,12,4,ceramic);
  }else if(f.id==='exposed-feed'){
   slab(g,f.footprint,5,8,steel);
   cylinder(g,600,17,440,48,8,ceramic);
   cylinder(g,600,30,440,30,26,steel,true);
   cylinder(g,600,22,440,27,2,dark);
   const lip=mesh(g,new T.TorusGeometry(30/U,4/U,8,32),ceramic,600,43,440);lip.rotation.x=-Math.PI/2;
   cylinder(g,600,27,440,9,8,blue);
  }else if(f.id==='antenna-truss'){
   for(const x of [520,680]){box(g,x,13,75,28,10,50,steel);box(g,x,57,75,12,78,12,steel);}
   box(g,600,95,75,174,12,18,steel);
   rod(g,[526,20,75],[674,90,75],4,dark);rod(g,[674,20,75],[526,90,75],4,dark);
   // Shallow concave dish faces the arena. Its entire projection stays on the truss base.
   const dish=mesh(g,new T.LatheGeometry([[0,0],[18,1],[40,5],[60,11],[76,18]].map(([r,h])=>new T.Vector2(r/U,h/U)),32),ceramic,600,112,60);
   dish.rotation.x=Math.PI/2;dish.material=ceramic;
   // Back side gets a separate owned shell, avoiding double-sided transparent passes.
   const back=mesh(g,dish.geometry.clone(),steel,600,112,58);back.rotation.x=Math.PI/2;back.scale.y=-1;
   rod(g,[600,112,62],[600,112,98],5,steel);box(g,600,112,100,14,14,12,blue);
  }else{
   box(g,925,23,652.5,138,30,55,steel);
   const panel=box(g,925,43,652.5,136,6,49,dark);panel.rotation.x=.2;
   const screen=box(g,925,47,646,112,2,27,blue);screen.rotation.x=.2;
   // Blank hardware panel. Actual warning text remains in existing essential status.
  }
 }
 room.userData.storyFixtures=TRANSMISSION_BLOCKOUT;
 return room;
}
