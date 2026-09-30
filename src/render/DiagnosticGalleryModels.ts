import * as T from 'three';
import {diagnosticConsolePolygon} from '../game/roguelike/diagnosticGalleryLayout';
import type {Point} from '../game/roguelike/types';

/** Stage2 room-local rough models. No shared assets, lights or interactions. */
export function diagnosticGalleryModels():T.Group{
 const root=new T.Group();root.name='diagnostic-gallery-rough-models';
 const mat=(color:number,emissive=0)=>{const m=new T.MeshStandardMaterial({color,roughness:.7,metalness:.25,emissive,emissiveIntensity:emissive?.45:0});m.userData.actorMaterial=true;return m;};
 const teal=mat(0x476466),ivory=mat(0xb8b7a3),dark=mat(0x172b31),edge=mat(0x738589),amber=mat(0xd69d4b,0xcb822f),cryo=mat(0x67a99e,0x327b70);
 let owner='physical-ship-cutaway';
 const add=(name:string,g:T.BufferGeometry,m:T.Material,x=0,y=0,z=0)=>{const mesh=new T.Mesh(g,m);mesh.name=`diagnostic-${name}`;mesh.userData.solidId=owner;mesh.position.set(x/32,y/32,z/32);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh;};
 const box=(name:string,x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material)=>add(name,new T.BoxGeometry(w/32,h/32,d/32),m,x,y,z);
 const slab=(name:string,points:readonly Point[],height:number,thickness:number,m:T.Material)=>{
  const shape=new T.Shape(points.map(p=>new T.Vector2(p.x/32,-p.y/32)));
  const mesh=add(name,new T.ExtrudeGeometry(shape,{depth:thickness/32,steps:1,bevelEnabled:false}),m,0,height,0);mesh.rotation.x=-Math.PI/2;return mesh;
 };
 const pipe=(name:string,a:number[],b:number[],radius:number,m:T.Material)=>{
  const p=new T.Vector3(...a.map(v=>v/32) as [number,number,number]),q=new T.Vector3(...b.map(v=>v/32) as [number,number,number]);
  const mesh=add(name,new T.CylinderGeometry(radius/32,radius/32,p.distanceTo(q),8),m);mesh.position.copy(p).add(q).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),q.sub(p).normalize());return mesh;
 };
 // Sealed pedestal, stern at west, pointed bow at east. No floor opening.
 box('physical-ship-cutaway',600,9,150,396,18,116,dark);
 slab('ship-hull',[{x:411,y:99},{x:741,y:99},{x:789,y:150},{x:741,y:201},{x:411,y:201}],18,8,teal);
 box('stern-frame',416,39,150,7,42,99,ivory);
 // Three stepped deck plates expose each face to the south approach.
 const decks=[{z:179,h:28,width:345},{z:149,h:43,width:361},{z:119,h:58,width:337}];
 for(const [i,d] of decks.entries()){
  box(`deck-${i}`,594,d.h,d.z,d.width,6,26,ivory);
  box(`deck-recess-${i}`,596,d.h+4,d.z,d.width-18,2,20,dark);
  box(`purge-branch-${i}`,580,d.h+6,d.z,265,3,4,amber);
  // End nodes make the common bus physically terminate on every deck.
  box(`purge-node-${i}`,715,d.h+7,d.z,9,5,12,amber);
  if(i<2)for(const x of [522,564,606,648]){
   box(`system-module-${i}-${x}`,x,d.h+8,d.z-5,27,8,9,teal);
  }
 }
 // Diagonal hardwired spine behind a partial guard, joining all three plates.
 pipe('purge-bus',[450,34,179],[450,64,119],3,amber);
 box('bus-cover',435,52,141,10,35,70,teal);
 for(const z of [119,149,179])box(`bus-clamp-${z}`,450,34+(179-z)/2,z,13,3,5,edge);
 // Occupied cryopod symbols are physical miniature berths, not empty lights.
 for(const [i,x] of [510,553,596,639].entries()){
  box(`occupied-cryo-${i}`,x,65,118,29,6,21,cryo);
  box(`cryo-window-${i}`,x,69,118,23,2,16,dark);
  const head=add(`cryo-head-${i}`,new T.SphereGeometry(3.5/32,10,8),ivory,x-7,72,118);head.scale.y=.65;
  box(`cryo-person-${i}`,x+3,71.5,118,12,3,6,ivory);
  box(`cryo-feed-${i}`,x,66,129,4,3,5,amber);
 }
 // Interrupted semicircle, low backs, recessed instrument plates facing inward.
 for(const [id,start,end] of [['west-low-console',112,155],['east-low-console',25,68]] as const){
  owner=id;
  slab(id,diagnosticConsolePolygon(start+.3,end-.3,301,349),0,23,teal);
  slab(`${id}-top`,diagnosticConsolePolygon(start+.6,end-.6,303,347),23,5,ivory);
  slab(`${id}-low-back`,diagnosticConsolePolygon(start+.8,end-.8,343,347),28,6,teal);
  for(let i=0;i<5;i++){
   const a=(start+5+(end-start-10)*i/4)*Math.PI/180,x=600+325*Math.cos(a),z=220+325*Math.sin(a),angle=-a-Math.PI/2;
   const panel=box(`${id}-gauge-recess-${i}`,x,29,z,28,2,26,dark);panel.rotation.y=angle;
   const dial=add(`${id}-gauge-${i}`,new T.CylinderGeometry(7/32,7/32,2/32,12),cryo,x,31,z);
   dial.rotation.y=angle;
   const needle=box(`${id}-needle-${i}`,x,32.5,z,2,1,9,ivory);needle.rotation.y=angle+.5;
  }
 }
 return root;
}
