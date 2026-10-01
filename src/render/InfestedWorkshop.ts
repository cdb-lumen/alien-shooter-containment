import * as T from 'three';
import {box,rod,ring,shell} from './meshParts';
import {WORKSHOP_MAT as MAT} from './InfestedWorkshopMaterials';
import type {Footprint} from './ShipEnvironments';

/** Room15 stage3: major machinery and room-local material treatment. */
export function infestedWorkshop(footprint:Footprint,index:number):T.Group{
 const root=new T.Group(),cell=new T.Group();root.add(cell);
 const roles=['lathe-manipulator','fixture-bench','gantry','stock-cabinet'];
 root.name=`workshop-${roles[index%4]}`;
 const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
 const b=(name:string,x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material=MAT.steel)=>{
  const mesh=box(cell,x,y,z,w,h,d,m,.025);mesh.name=name;return mesh;
 };
 const link=(name:string,a:T.Vector3,c:T.Vector3,r:number,m:T.Material=MAT.edge)=>{
  const mesh=rod(cell,a,c,r,r,m);mesh.name=name;return mesh;
 };
 const rib=(x:number,z:number,top:number)=>{
  // Bundled fibers rise along the fixed casting, not out into the aisle.
  const a=v(x-.12,.42,z+.09),mid=v(x,.95,z+.1),end=v(x+.12,top,z-.08);
  link('directional-resin',a,mid,.11,MAT.flesh);
  link('directional-resin',mid,end,.085,MAT.flesh);
  for(const offset of [-.065,0,.065]){
   const shift=v(offset,.012,.075);
   link('resin-fiber',a.clone().add(shift),mid.clone().add(shift),.019,MAT.flesh);
   link('resin-fiber',mid.clone().add(shift),end.clone().add(shift),.014,MAT.flesh);
  }
 };
 if(index%4===0){
  // Long axis follows the original northwest island, operator faces south.
  for(const x of [-1.7,1.7])b('pedestal',x,.47,0,.9,.94,1.35,MAT.black);
  b('lathe-bed',0,.94,0,4.8,.32,1.45);
  b('way-front',.2,1.16,.39,3.8,.13,.15,MAT.edge);
  b('way-rear',.2,1.16,-.39,3.8,.13,.15,MAT.edge);
  b('headstock',-1.78,1.55,0,1.12,1.1,1.2,MAT.trim);
  link('chuck',v(-1.15,1.67,0),v(-.8,1.67,0),.41,MAT.edge);
  for(const a of [0,Math.PI*2/3,Math.PI*4/3]){
   b('chuck-jaw',-.77,1.67+Math.sin(a)*.24,Math.cos(a)*.24,.16,.14,.14,MAT.black);
  }
  b('carriage',.55,1.31,0,.92,.23,1.22,MAT.trim);
  b('cross-slide',.55,1.5,.08,.5,.18,.74,MAT.edge);
  b('tool-post',.55,1.72,.32,.22,.3,.25,MAT.black);
  b('cutting-tool',.33,1.79,.19,.55,.07,.09,MAT.edge);
  b('tailstock',1.7,1.51,0,.65,.72,.67,MAT.trim);
  link('tailstock-center',v(1.2,1.67,0),v(1.55,1.67,0),.09);
  const wheel=ring(cell,.56,1.3,.79,.23,.045,MAT.edge);wheel.name='carriage-handwheel';
  // The opened guard leaves the chuck and working ways visible.
  const guard=b('broken-guard',-1.2,2.12,-.57,1.15,.08,.55,MAT.trim);guard.rotation.x=-.7;
  b('guard-stump',-.71,1.83,-.54,.12,.5,.12,MAT.edge);
  // A rear bolted shoulder supports a bent two-link arm, not a floating arch.
  b('arm-foot',.72,1.17,-.83,.75,.24,.48,MAT.black);
  link('arm-column',v(.72,1.2,-.83),v(.72,2.08,-.83),.18,MAT.trim);
  const shoulder=v(.72,2.05,-.83),elbow=v(-.12,2.92,-.62),wrist=v(-.2,2.24,0);
  link('arm-upper',shoulder,elbow,.16,MAT.trim);
  link('arm-forearm',elbow,wrist,.12,MAT.trim);
  for(const p of [shoulder,elbow,wrist])link('arm-hinge',p.clone().add(v(0,0,-.15)),p.clone().add(v(0,0,.15)),.23,MAT.edge);
  link('tendon-brace',v(1.45,1.08,-.74),elbow.clone().add(v(.14,-.12,0)),.075,MAT.flesh);
  link('tendon-brace',v(-.58,1.08,-.69),elbow.clone().add(v(-.12,-.1,0)),.055,MAT.bone);
  // Two jaws physically meet the suspended stock. No free-floating collectible.
  for(const x of [-.4,0]){
   link('gripper',v(x,2.24,0),v(x,1.82,0),.065,MAT.black);
  }
  link('suspended-workpiece',v(-.72,1.77,0),v(.17,1.77,0),.16,MAT.copper);
  for(const x of [-2.13,-1.88,-1.63]){
   rib(x,.62,2.08);
   link('housing-resin-wrap',v(x+.12,2.08,.54),v(x+.22,2.12,-.36),.065,MAT.flesh);
  }
  // Broad attached apron establishes the fixed machine mass at gameplay scale.
  b('bed-apron',-.1,.74,.69,4.25,.36,.12,MAT.steel);
  for(const x of [-1.8,-1.48])b('apron-worn-paint',x,.76,.765,.22,.25,.025,MAT.trim);
  for(const offset of [-.07,.07])link('tendon-fiber',v(1.45+offset,1.08,-.7),elbow.clone().add(v(.14+offset,-.12,.04)),.026,MAT.flesh);
  link('wet-resin-seam',v(-2.03,1.42,.72),v(-1.97,1.75,.64),.018,MAT.wet);
  const socket=shell(cell,1.2,.7,-.68,.3,.22,.8,MAT.flesh);socket.name='asymmetric-growth-socket';
  for(let i=0;i<3;i++){
   link('peeled-insulation',v(.72+i*.07,1.93,-.93),v(.25+i*.08,1.45,-.96),.025,MAT.rubber);
   link('cut-copper-end',v(.25+i*.08,1.45,-.96),v(.15+i*.08,1.32,-.92),.015,MAT.copper);
  }
  // Coarse missing-paint patches only, not final surface texturing.
  b('chipped-yellow',-1.96,2.106,.12,.35,.014,.25,MAT.steel);
  b('chipped-yellow',1.75,1.875,.08,.23,.014,.24,MAT.steel);
 }else if(index%4===1){
  for(const x of [-1.55,1.55])for(const z of [-1.1,1.1])b('bench-leg',x,.5,z,.26,1,.26,MAT.black);
  b('fixture-table',0,1.12,0,3.6,.24,2.7);
  for(const x of [-1,0,1])b('fixture-slot',x,1.25,0,.07,.025,2.35,MAT.black);
  for(const x of [-.8,.8])b('vise-jaw',x,1.46,0,.28,.42,.9,MAT.trim);
  link('vise-screw',v(-1.35,1.4,0),v(1.35,1.4,0),.08);
  rib(-1.5,-.8,1.2);
 }else if(index%4===2){
  b('gantry-base',0,.13,0,2.8,.26,5.4,MAT.black);
  for(const z of [-2,2]){
   for(const x of [-1,1])b('gantry-upright',x,1.2,z,.25,2.4,.28,MAT.trim);
   b('gantry-crossbeam',0,2.4,z,2.4,.25,.4);
  }
  for(const x of [-.75,.75])b('gantry-rail',x,2.58,0,.14,.18,4.5,MAT.edge);
  b('gantry-slider',0,2.7,-.55,1.8,.18,.55,MAT.trim);
  link('gantry-tool',v(0,2.65,-.55),v(0,1.3,-.55),.12);
  b('gantry-fixture',0,.52,0,1.3,.6,1.6);
  rib(-1,1.7,2.3);
 }else{
  b('stock-cabinet',0,1,0,3.2,2,1.3);
  for(const y of [.35,.85,1.35,1.85]){
   b('drawer',0,y,.7,2.9,.37,.1,MAT.trim);
   b('drawer-handle',0,y,.8,.7,.07,.1,MAT.black);
  }
  b('stock-cradle',0,2.1,0,2.9,.2,1.2,MAT.black);
  for(const z of [-.33,0,.33])link('retained-stock',v(-1.3,2.3,z),v(1.3,2.3,z),.11,MAT.edge);
  rib(1.2,.58,1.8);
 }
 // Fit actual vertices to the stage1 inner reservation, eight units from solids.
 cell.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(cell,true),size=bounds.getSize(v(0,0,0)),center=bounds.getCenter(v(0,0,0));
 const w=Math.max(footprint.width-.5,footprint.width*.5),d=Math.max(footprint.height-.5,footprint.height*.5);
 cell.scale.set(w/size.x,Math.min(1,w/size.x,d/size.z),d/size.z);
 cell.position.set(-center.x*cell.scale.x,-bounds.min.y*cell.scale.y,-center.z*cell.scale.z);
 root.position.set(footprint.x+footprint.width/2,0,footprint.y+footprint.height/2);
 root.userData.footprint={...footprint};return root;
}
