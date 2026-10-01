import * as T from 'three';
import {MAT,box,rod,ring} from './meshParts';
import type {Footprint} from './ShipEnvironments';

/** Room17 only. Static rough assemblies inside the three unchanged solids.
 * Coordinates below are authored game units; the caller supplies renderer units.
 * No threshold mesh, overhead beam, animation, new collision or borrowed room kit.
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
 b(body,'grounded-plinth',width/2,5,depth/2,width-4,10,depth-4,MAT.steel);
 if(index===1){
  // Low defensive backing stack, subordinate to the paired tall gate heads.
  for(let n=0;n<3;n++)b(body,`backing-layer-${n}`,28+n*51,27+n*5,75,45,44+n*10,138-n*12,n===1?MAT.steel:MAT.armor);
  b(body,'backing-cap',80,61,75,148,8,104,MAT.edge);
 }else{
  const gateStart=index===0?205:5;
  // Long dense shielding supports stop behind the reserved machinery bay.
  const start=index===0?6:100,end=index===0?200:354;
  for(let n=0;n<3;n++){
   const x=18+n*32,height=58+n*12;
   b(body,`backing-layer-${n}`,x,height/2+10,(start+end)/2,28,height,end-start,n===1?MAT.steel:MAT.armor);
   b(body,`backing-contact-${n}`,x,height+12,(start+end)/2,24,4,end-start-8,MAT.edge);
  }
  const gate=new T.Group();gate.name='gate-mechanism';body.add(gate);
  const mirror=(x:number)=>index===2?100-x:x;
  const g=(name:string,x:number,y:number,z:number,w:number,h:number,d:number,mat:T.Material)=>b(gate,name,mirror(x),y,gateStart+z,w,h,d,mat);
  // Three retracted leaves step toward the legal opening, separated by recesses.
  for(let n=0;n<3;n++){
   const left=25+n*6,right=76+n*5,height=100-n*9;
   g(`shield-leaf-${n}`,(left+right)/2,10+height/2,16+n*25,right-left,height,19,MAT.armor);
   g(`contact-edge-${n}`,right-2,10+height/2,16+n*25,4,height-8,20,MAT.edge);
   g(`leaf-ochre-${n}`,(left+right)/2,height+12,16+n*25,right-left,4,13,MAT.trim);
  }
  for(const [n,z] of [7,83].entries())g(`guide-shoe-${n}`,53,16,z,70,12,10,MAT.steel);
  g('gear-housing',20,91,45,18,38,32,MAT.steel);
  g('gear-cover',20,113,45,20,6,28,MAT.trim);
  const a=new T.Vector3(mirror(29)/32,111/32,(gateStart+45)/32),c=new T.Vector3(mirror(83)/32,111/32,(gateStart+45)/32);
  const shaft=rod(gate,a,c,4/32,4/32,MAT.edge);shaft.name='screw-shaft';
  // Spaced thread collars are intentionally coarse enough for gameplay scale.
  for(let n=0;n<9;n++){
   const thread=ring(gate,mirror(32+n*6)/32,111/32,(gateStart+45)/32,5/32,1.5/32,MAT.steel);
   thread.rotation.y=Math.PI/2;thread.name=`screw-thread-${n}`;
  }
  g('end-bearing',84,107,45,10,20,18,MAT.steel);
  g('locking-block',76,31,76,20,30,12,MAT.trim);
 }
 // Dimension fit only, never rotate or extend beyond the owning rectangle.
 root.scale.set(footprint.width/(width/32),1,footprint.height/(depth/32));
 root.position.set(footprint.x,0,footprint.y);
 return root;
}
