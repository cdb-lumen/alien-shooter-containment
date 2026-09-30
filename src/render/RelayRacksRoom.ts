import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RELAY_RACKS_FOOTPRINTS} from '../game/roguelike/relayRacksLayout';

/** Stage2 rough placement only. Dimensions are game units, not finished assets.
 * Raised forms remain inside the five production solids. Cross-aisle cables
 * are flush deck inlays, not extra blockers or relay-success indicators. */
export function relayRacksRoom():T.Group{
 const root=new T.Group();root.name='authored-relay-racks';
 const material=(name:string,color:number,metalness=.35)=>{const m=new T.MeshStandardMaterial({color,metalness,roughness:.78});m.name=name;m.userData.actorMaterial=true;return m;};
 const deck=material('painted-steel-deck',0x303b40,.1),dark=material('relay-frame-metal',0x26343b),rail=material('relay-rail-metal',0x879998),pale=material('relay-ceramic',0xbdc6b9,.1),cyan=material('relay-fiber',0x568b91,.1),amber=material('relay-bridge-metal',0xb59160),damage=material('relay-cut-metal',0x765746);
 // Neutral dry deck and unlit contact contract. Final surface art is later.
 const normals=new T.DataTexture(new Uint8Array([127,128,255,255,129,128,255,255,128,127,255,255,128,129,255,255]),2,2);
 normals.wrapS=normals.wrapT=T.RepeatWrapping;normals.repeat.set(150,110);normals.needsUpdate=true;
 deck.normalMap=normals;deck.normalScale.set(.3,.3);deck.roughness=.92;deck.addEventListener('dispose',()=>normals.dispose());
 const contact=new T.MeshBasicMaterial({color:0x111c23,transparent:true,opacity:.3,depthWrite:false});contact.name='environment-contact';contact.userData.actorMaterial=true;
 cyan.emissive.setHex(0x24464b);cyan.emissiveIntensity=.5;
 const groups=new Map<T.Group,Map<T.Material,{parts:T.BufferGeometry[];name:string}>>();
 const group=(name:string)=>{const g=new T.Group();g.name=name;root.add(g);groups.set(g,new Map());return g;};
 const add=(g:T.Group,geo:T.BufferGeometry,m:T.Material,name='')=>{
  const flat=geo.index?geo.toNonIndexed():geo.clone();geo.dispose();
  const batch=groups.get(g)!;if(!batch.has(m))batch.set(m,{parts:[],name});batch.get(m)!.parts.push(flat);
 };
 const box=(g:T.Group,x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,name='')=>add(g,new T.BoxGeometry(w/32,h/32,d/32).translate(x/32,y/32,z/32),m,name);
 const pipe=(g:T.Group,a:number[],b:number[],radius:number,m:T.Material,name='')=>{
  const p=new T.Vector3(...a.map(n=>n/32)),q=new T.Vector3(...b.map(n=>n/32));
  const geo=new T.CylinderGeometry(radius/32,radius/32,p.distanceTo(q),8);
  geo.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),q.clone().sub(p).normalize()));geo.translate(...p.add(q).multiplyScalar(.5).toArray());add(g,geo,m,name);
 };
 const shell=group('relay-neutral-shell');
 box(shell,600,-6,440,1200,12,880,deck);
 // A neutral low edge outside the playable envelope, with entry/exit breaks.
 for(const z of [-6,886])box(shell,600,12,z,1200,24,12,dark);
 for(const x of [-6,1206])for(const z of [180,700])box(shell,x,12,z,12,24,360,dark);
 root.userData.lightFixtures=[];
 for(const x of [160,480,720,1040]){
  box(shell,x,27,-6,28,4,8,cyan);
  root.userData.lightFixtures.push({x:x/32,y:27/32,z:-6/32,color:cyan.emissive.getHex()});
 }
 for(const [i,r]of RELAY_RACKS_FOOTPRINTS.entries()){
  const g=group(`relay-fixture-${i}`),x=r.x+r.width/2,z=r.y+r.height/2;
  box(g,x,4,z,r.width,8,r.height,dark);
  add(shell,new T.PlaneGeometry(r.width/32,r.height/32).rotateX(-Math.PI/2).translate(x/32,.005,z/32),contact);
  if(i<4){
   const broken=i===1,height=broken?56:76;
   // Three repeated blade bays share an open frame, not a stretched cabinet.
   for(const dx of [-43,43])for(const dz of [-77,77])box(g,x+dx,height/2,z+dz,6,height,6,rail,'relay-open-rails');
   for(const dz of [-77,77])box(g,x,height-3,z+dz,92,6,6,rail);
   for(const dx of [-40,40])box(g,x+dx,broken?24:39,z,6,8,154,rail);
   for(const bay of [-1,0,1]){
    const bz=z+bay*50;
    box(g,x,13,bz,84,10,42,dark);
    box(g,x,broken&&bay===0?25:40,bz,78,7,38,pale);
    // Top-facing patch blocks and broad rough loops stay legible at game zoom.
    if(!(broken&&bay===0)){
     box(g,x,51,bz-12,62,9,12,dark);
     for(const dx of [-20,0,20])box(g,x+dx,57,bz-12,8,4,9,pale);
     const curve=new T.CatmullRomCurve3([[x-23,57,bz-10],[x-25,broken?60:78,bz+5],[x+25,broken?60:78,bz+5],[x+23,57,bz-10]].map(p=>new T.Vector3(p[0]/32,p[1]/32,p[2]/32)));
     add(g,new T.TubeGeometry(curve,12,2.2/32,5,false),broken?damage:cyan,'relay-fiber-loops');
    }else{
     // Missing tray and short fallen rail are contained inside the damaged bay.
     pipe(g,[x-33,17,bz-15],[x+29,28,bz+14],4,damage);
    }
   }
  }else{
   // Squat central drum feeds the north trunk. South bridge has a physical gap.
   add(g,new T.CylinderGeometry(37/32,37/32,44/32,16).translate(x/32,30/32,(z-17)/32),amber,'relay-distribution-drum');
   box(g,x,57,z-17,84,10,70,pale);
   for(const dx of [-26,0,26])pipe(g,[x+dx,62,z-30],[x+dx,62,z+2],3,cyan);
   box(g,x-22,24,z+54,26,32,30,rail,'relay-bridge-coupler');
   box(g,x+22,24,z+54,26,32,30,rail);
   box(g,x,12,z+54,18,8,20,damage);
   for(const dx of [-32,32])pipe(g,[x+dx,10,z-74],[x+dx,49,z-47],4,dark);
  }
 }
 const channels=group('relay-flush-channels');
 // Flat rectangular inlays: north feed connects both upper banks to the hub.
 box(channels,600,.15,230,10,.3,260,cyan);
 box(channels,600,.15,100,510,.3,10,cyan);
 for(const x of [350,850])box(channels,x,.15,130,10,.3,60,cyan);
 // Severed southern spur: a 26-unit unpainted gap, no raised trip hazard.
 box(channels,600,.15,539,10,.3,38,damage);
 box(channels,600,.15,627,10,.3,86,damage);
 box(channels,500,.15,670,200,.3,10,damage);
 for(const [g,batches]of groups)for(const [m,{parts,name}]of batches){
  const geo=mergeGeometries(parts,false)!;for(const p of parts)p.dispose();
  const mesh=new T.Mesh(geo,m);mesh.name=name;mesh.castShadow=g!==channels&&g!==shell;mesh.receiveShadow=true;mesh.userData.bakedEnvironment=true;(g===shell?root:g).add(mesh);
 }
 return root;
}
