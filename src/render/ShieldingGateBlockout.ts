import * as T from 'three';
import {box,rod,ring,geometry} from './meshParts';
import type {Footprint} from './ShipEnvironments';

// Room-local materials. Shared singletons keep the static batch small and do not
// recolor the containment kit used by other rooms.
const material=(name:string,color:number,metalness:number,roughness:number)=>{
 const m=new T.MeshStandardMaterial({color,metalness,roughness});
 m.name=`shielding-gate-${name}`;return m;
};
const SHIELD={
 lead:material('lead',0x586064,.42,.84),
 jacket:material('jacket',0x424b50,.55,.72),
 contact:material('contact',0x899392,.78,.46),
 ochre:material('ochre',0x92764b,.24,.83),
 recess:material('recess',0x1e272b,.25,.88),
};

/** Room17 static shielding shell, fitted to the three unchanged solids.
 * Coordinates are authored game units; the caller supplies renderer units.
 * The open threshold has no mesh, overhead beam, animation or new collision.
 */
export function shieldingGateBlockout(footprint:Footprint,index:number):T.Group{
 index=index===0||index===2?index:1;
 const root=new T.Group();
 root.name=`shielding-gate-${index===0?'west':index===2?'east':'backing'}`;
 root.userData.footprint={...footprint};
 const width=index===1?160:100,depth=index===0?310:index===2?360:150;
 const body=new T.Group();root.add(body);
 const b=(parent:T.Group,name:string,x:number,y:number,z:number,w:number,h:number,d:number,mat:T.Material)=>{
  const mesh=box(parent,x/32,y/32,z/32,w/32,h/32,d/32,mat,.025);mesh.name=name;return mesh;
 };
 b(body,'grounded-plinth',width/2,5,depth/2,width-4,10,depth-4,SHIELD.recess);
 // Each dense core has separate jacket cassettes, recessed joints, and saddles
 // that visibly transfer its load to the continuous plinth.
 const bank=(n:number,x:number,w:number,height:number,start:number,end:number)=>{
  b(body,`backing-layer-${n}`,x,height/2+10,(start+end)/2,w,height,end-start,SHIELD.lead);
  const count=index===1?3:4,span=(end-start)/count;
  for(let j=0;j<count;j++){
   const z=start+(j+.5)*span;
   b(body,`shell-cassette-${n}-${j}`,x,height+11,z,w-5,3,span-5,SHIELD.jacket);
   // Narrow exposed contact lands, not bright full-face backing slabs.
   b(body,`shell-contact-${n}-${j}`,x+w/2-3,height+13,z,2,2,span-9,SHIELD.contact);
  }
  for(const [j,z] of [start+12,end-12].entries()){
   b(body,`shell-saddle-${n}-${j}`,x,height/2+10,z,w+3,height+2,7,SHIELD.jacket);
   b(body,`saddle-crown-${n}-${j}`,x,height+13,z,w+3,4,7,SHIELD.ochre);
  }
  // Layer seams on the exposed ends make the radiation laminate visible.
  for(const [j,z] of [start+.8,end-.8].entries())for(let k=0;k<3;k++)
   b(body,`laminate-seam-${n}-${j}-${k}`,x,22+k*14,z,w-3,2,2,SHIELD.recess);
 };
 if(index===1){
  for(let n=0;n<3;n++)bank(n,28+n*51,45,44+n*10,6+n*6,144-n*6);
  // Low cross-bracing ties the backing mass together without a bright flat lid.
  for(const [n,z] of [40,110].entries())b(body,`backing-tie-${n}`,80,32,z,150,8,8,SHIELD.jacket);
 }else{
  const gateStart=index===0?205:5;
  const start=index===0?6:100,end=index===0?200:354;
  for(let n=0;n<3;n++)bank(n,18+n*32,28,58+n*12,start,end);
  const gate=new T.Group();gate.name='gate-mechanism';body.add(gate);
  const mirror=(x:number)=>index===2?100-x:x;
  const g=(name:string,x:number,y:number,z:number,w:number,h:number,d:number,mat:T.Material)=>b(gate,name,mirror(x),y,gateStart+z,w,h,d,mat);
  // Retracted leaves are distinct thicknesses with dark compression grooves.
  for(let n=0;n<3;n++){
   const left=25+n*6,right=76+n*5,height=100-n*9,z=16+n*25;
   g(`shield-leaf-${n}`,(left+right)/2,10+height/2,z,right-left,height,19,SHIELD.lead);
   g(`compression-seal-${n}`,right-7,10+height/2,z,5,height-6,20,SHIELD.recess);
   g(`contact-edge-${n}`,right-2,10+height/2,z,4,height-8,20,SHIELD.contact);
   g(`leaf-ochre-${n}`,(left+right)/2,height+12,z,right-left-8,4,13,SHIELD.ochre);
   g(`leaf-recess-${n}`,(left+right)/2-3,10+height/2,z+9.6,right-left-20,height-26,1.4,SHIELD.recess);
   g(`leaf-face-${n}`,(left+right)/2-3,10+height/2,z+10.6,right-left-24,height-32,1.8,SHIELD.jacket);
   // Paired bearing ribs join the face to its contact end.
   for(const [j,y] of [27,height-8].entries())g(`leaf-rib-${n}-${j}`,(left+right)/2,y,z+11,right-left-9,6,3,SHIELD.lead);
  }
  for(const [n,z] of [7,83].entries()){
   g(`guide-shoe-${n}`,53,16,z,70,12,10,SHIELD.jacket);
   g(`guide-contact-${n}`,53,23,z,62,2,5,SHIELD.contact);
  }
  g('gear-housing',20,91,45,18,38,32,SHIELD.jacket);
  g('gear-cover',20,113,45,20,6,28,SHIELD.ochre);
  g('gear-recess',20,117,45,13,2,20,SHIELD.recess);
  g('gear-bearing-cap',20,119,45,9,3,15,SHIELD.jacket);
  const a=new T.Vector3(mirror(29)/32,111/32,(gateStart+45)/32),c=new T.Vector3(mirror(83)/32,111/32,(gateStart+45)/32);
  const shaft=rod(gate,a,c,4/32,4/32,SHIELD.contact);shaft.name='screw-shaft';
  for(let n=0;n<9;n++){
   const thread=ring(gate,mirror(32+n*6)/32,111/32,(gateStart+45)/32,5/32,1.5/32,SHIELD.jacket);
   thread.rotation.y=Math.PI/2;thread.name=`screw-thread-${n}`;
  }
  for(const [n,x] of [29,83].entries()){
   const collar=ring(gate,mirror(x)/32,111/32,(gateStart+45)/32,6/32,2/32,SHIELD.contact);
   collar.rotation.y=Math.PI/2;collar.name=`bearing-collar-${n}`;
  }
  g('end-bearing',84,107,45,10,20,18,SHIELD.jacket);
  g('lock-pocket',76,28,76,24,36,16,SHIELD.recess);
  // A tapered wedge seated in a dark pocket, rather than a painted cube.
  const wedgeGeometry=geometry('shielding-gate-lock-wedge',()=>{
   const shape=new T.Shape();shape.moveTo(-10/32,-15/32);shape.lineTo(10/32,-15/32);
   shape.lineTo(6/32,15/32);shape.lineTo(-6/32,15/32);shape.closePath();
   const result=new T.ExtrudeGeometry(shape,{depth:12/32,bevelEnabled:false});result.translate(0,0,-6/32);return result;
  });
  const wedge=new T.Mesh(wedgeGeometry,SHIELD.ochre);wedge.name='locking-wedge';
  wedge.position.set(mirror(76)/32,31/32,(gateStart+76)/32);wedge.castShadow=wedge.receiveShadow=true;gate.add(wedge);
  g('dosimeter-frame',46,59,78,20,14,4,SHIELD.contact);
  g('dosimeter-well',46,59,80.5,16,10,1.5,SHIELD.recess);
  g('dosimeter-plate',45,59,81.5,9,6,1,SHIELD.ochre);
 }
 root.scale.set(footprint.width/(width/32),1,footprint.height/(depth/32));
 root.position.set(footprint.x,0,footprint.y);
 return root;
}
