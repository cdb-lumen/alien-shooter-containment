import * as T from 'three';
import {box,rod,geometry,MAT} from './meshParts';
import type {Footprint} from './ShipEnvironments';

/** Room19 rough equipment only. These inert meshes never arm the story action.
 * All floor equipment fills the existing three collision reservations.
 */
export function manualControlBlockout(f:Footprint,index:number):T.Group{
 const root=new T.Group(),parts=new T.Group();root.name=`manual-control-blockout-${index}`;root.add(parts);
 const w=f.width,d=f.height;
 const b=(name:string,x:number,y:number,z:number,width:number,height:number,depth:number,mat:T.Material)=>{
  const mesh=box(parts,x*w,y,z*d,width*w,height,depth*d,mat,0);mesh.name=name;return mesh;
 };
 b('solid-equipment-plinth',.5,.12,.5,.98,.24,.98,MAT.black);
 if(index!==2){
  b('low-switch-cabinet',.5,.63,.5,.95,1.02,.95,MAT.bone);
  b('inset-switch-deck',.5,1.155,.5,.82,.03,.81,MAT.black);
  // Broad recessed service trays make these read as controls, not cargo boxes.
  for(let row=0;row<3;row++){
   b('service-tray',.5,1.19,.22+row*.28,.77,.04,.22,MAT.steel);
   for(let n=0;n<4;n++){
    b('switch-socket',.22+n*.18,1.23,.22+row*.28,.09,.04,.08,MAT.black);
    b('switch-paddle',.22+n*.18,1.29,.22+row*.28,.028,.12,.07,MAT.bone);
   }
  }
  for(const x of [.08,.92])b('cabinet-protective-rail',x,1.23,.5,.045,.18,.92,MAT.edge);
  b('restrained-status-strip',index===0?.25:.75,1.23,.12,.23,.03,.035,MAT.amber);
  for(const x of [.26,.74]){
   b('cabinet-front-recess',x,.68,.979,.39,.6,.009,MAT.steel);
   b('cabinet-front-handle',x,.85,.989,.14,.04,.008,MAT.bone);
  }
 }else{
  const wedge=geometry('room19-rough-desk-wedge',()=>{
   const g=new T.BoxGeometry(1,1,1),p=g.getAttribute('position');
   for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)>0?1.32-p.getZ(i)*.44:0);
   p.needsUpdate=true;g.computeVertexNormals();return g;
  });
  const desk=new T.Mesh(wedge,MAT.bone);desk.name='sloped-authorization-desk';desk.position.set(.30*w,.24,.50*d);desk.scale.set(.55*w,1,.84*d);desk.castShadow=desk.receiveShadow=true;parts.add(desk);
  // Controls follow the inclined deck. Closed nested guards are inert presentation.
  const controls=new T.Group();controls.position.set(.30*w,1.57,.50*d);controls.rotation.x=Math.atan(.44/(.84*d));parts.add(controls);
  const c=(name:string,x:number,y:number,z:number,cw:number,ch:number,cd:number,mat:T.Material)=>{const m=box(controls,x*w,y,z*d,cw*w,ch,cd*d,mat,0);m.name=name;return m;};
  c('control-well',0,.015,0,.46,.025,.64,MAT.black);
  for(const [name,width,depth,y] of [['outer-safety-guard',.31,.52,.17],['inner-safety-guard',.20,.34,.13]] as const){
   const frame=new T.Group();frame.name=name;controls.add(frame);
   for(const x of [-width/2,width/2])box(frame,x*w,y,0,.026*w,.20,depth*d,MAT.edge,0);
   for(const z of [-depth/2,depth/2])box(frame,0,y,z*d,width*w,.20,.025*d,MAT.edge,0);
  }
  c('recessed-actuator',0,.07,0,.09,.06,.11,MAT.red);
  c('closed-guard-crossbar',0,.25,0,.23,.07,.035,MAT.bone);
  c('key-socket',-.20,.05,.20,.055,.045,.07,MAT.steel);
  c('key-slot',-.20,.075,.20,.009,.008,.044,MAT.black);
  // Separate taller passenger-status board, not another destruct button.
  b('passenger-panel-foot',.79,.65,.48,.33,1.06,.63,MAT.steel);
  const panel=new T.Group();panel.name='passenger-status-panel';panel.position.set(.79*w,1.55,.49*d);panel.rotation.x=-.40;parts.add(panel);
  box(panel,0,0,0,.32*w,1.72,.18*d,MAT.bone,0);
  box(panel,0,.02,.098*d,.28*w,1.44,.02*d,MAT.black,0);
  box(panel,0,.59,.113*d,.23*w,.10,.008*d,MAT.amber,0);
  // Rough passenger berth/status rows. Final typography belongs to model iteration.
  for(let row=0;row<3;row++){
   box(panel,-.085*w,.30-row*.30,.113*d,.032*w,.14,.008*d,MAT.bone,0);
   box(panel,.035*w,.30-row*.30,.113*d,.15*w,.065,.008*d,MAT.bone,0);
  }
  box(panel,0,-.57,.113*d,.23*w,.08,.008*d,MAT.red,0);
  // Three hardwired leads join the desk's rear edge to panel feedthroughs.
  const loom=new T.Group();loom.name='hardwired-safety-loom';parts.add(loom);
  for(let n=0;n<3;n++){
   const z=(.21+n*.045)*d,y=.63;
   rod(loom,new T.Vector3(.54*w,y,z),new T.Vector3(.65*w,y,z),.035,.035,MAT.copper);
   rod(loom,new T.Vector3(.65*w,y,z),new T.Vector3(.69*w,1.08,z),.035,.035,MAT.copper);
   const ceramic=rod(loom,new T.Vector3(.68*w,1.0,z),new T.Vector3(.70*w,1.22,z),.065,.065,MAT.bone);ceramic.name='ceramic-feedthrough';
  }
 }
 // Defensive fit for renderer callers using smaller test or preview cells.
 // Canonical Room19 footprints already contain the authored equipment unchanged.
 const bounds=new T.Box3().setFromObject(parts,true),size=bounds.getSize(new T.Vector3());
 if(bounds.min.x<0||bounds.max.x>w||bounds.min.z<0||bounds.max.z>d){
  parts.scale.set(Math.min(1,w*.98/size.x),1,Math.min(1,d*.98/size.z));
  parts.position.set(w/2-(bounds.min.x+size.x/2)*parts.scale.x,0,d/2-(bounds.min.z+size.z/2)*parts.scale.z);
 }
 root.position.set(f.x,0,f.y);root.userData.footprint={...f};return root;
}

/** The slit sits in the outboard north wall, with no new walkable obstruction. */
export function manualControlArchitecture(parent:T.Group,w:number):void{
 for(let x=2;x<w;x+=4){
  box(parent,x,1.325,-.48,Math.min(3.96,w-x+2),2.65,.30,MAT.steel,0);
 }
 const recess=box(parent,w*.69,1.62,-.32,5.8,.64,.08,MAT.black,0);recess.name='armored-observation-recess';
 for(const y of [-.41,.41])box(parent,w*.69,1.62+y,-.20,6.2,.20,.28,MAT.bone,0);
 for(const x of [-3,3])box(parent,w*.69+x,1.62,-.20,.20,.65,.28,MAT.bone,0);
 for(const x of [-1.5,0,1.5])box(parent,w*.69+x,1.62,-.25,.10,.65,.18,MAT.edge,0);
}
