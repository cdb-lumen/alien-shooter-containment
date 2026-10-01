import * as T from 'three';
import {box,ring,geometry} from './meshParts';
import type {Footprint} from './ShipEnvironments';

const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
const finish=(name:string,color:number,metalness:number,roughness:number,emissive=0,intensity=0)=>{
 const material=new T.MeshStandardMaterial({name:`coolant-${name}`,color,metalness,roughness,emissive,emissiveIntensity:intensity});return material;
};
/** Room-owned finishes. Never recolor shared maintenance materials. */
export const COOLANT_MAT={
 enamel:finish('enamel',0x638b86,.32,.58),
 stainless:finish('stainless',0x81908f,.72,.69),
 frame:finish('frame',0x34474b,.6,.76),
 dark:finish('dark',0x18282c,.25,.86),
 mineral:finish('mineral',0x8c8971,.05,.96),
 amber:finish('amber',0xb99558,.3,.62,0x775021,.35),
 cool:finish('cool',0x84b7b5,.25,.5,0x497e80,.45),
};
/** The plinth retains the authoritative collision rectangle. All raised parts
 * stay inside it; supply and return pass below the walkable deck. */
export function coolantPlantBlockout(footprint:Footprint,index:number):T.Group{
 const root=new T.Group(),cell=new T.Group();root.add(cell);
 root.name=index<2?'coolant-heat-exchanger':index<4?'coolant-pump-return':'coolant-service-saddle';
 const m=COOLANT_MAT;
 const b=(x:number,y:number,z:number,w:number,h:number,d:number,material:T.Material)=>box(cell,x,y,z,w,h,d,material,0);
 const pipe=(a:T.Vector3,c:T.Vector3,r:number,material:T.Material)=>{
  const length=a.distanceTo(c),mesh=new T.Mesh(geometry(`coolant-cylinder:${r}:${length}`,()=>new T.CylinderGeometry(r,r,length,12)),material);
  mesh.position.copy(a).add(c).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(v(0,1,0),c.clone().sub(a).normalize());mesh.castShadow=mesh.receiveShadow=true;cell.add(mesh);return mesh;
 };
 const bend=(points:T.Vector3[],radius:number)=>{
  const key=`coolant-bend:${radius}:${points.map(p=>p.toArray().join(',')).join('/')}`;
  const mesh=new T.Mesh(geometry(key,()=>new T.TubeGeometry(new T.CatmullRomCurve3(points),12,radius,8,false)),m.stainless);mesh.castShadow=mesh.receiveShadow=true;cell.add(mesh);
 };
 const valve=(x:number,y:number,z:number)=>{
  pipe(v(x,y-.2,z),v(x,y,z),.06,m.stainless);
  const wheel=ring(cell,x,y,z,.22,.036,m.amber);wheel.rotation.x=-Math.PI/2;
  for(const dx of [-.17,.17])pipe(v(x,y,z),v(x+dx,y,z),.025,m.amber);
 };
 b(0,.1,0,4,.2,4,m.frame);
 // Enamel side rails tie the paired skids together without a bright floor pad.
 for(const x of [-1.82,1.82])b(x,.24,0,.12,.08,3.6,m.enamel);
 if(index<2){
  for(const z of [-.95,.95]){
   b(0,.45,z,2.15,.5,.35,m.frame);
   pipe(v(0,1.28,z-.11),v(0,1.28,z+.11),.87,m.stainless);
  }
  pipe(v(0,1.28,-1.3),v(0,1.28,1.3),.82,m.enamel);
  for(const z of [-1.4,1.4]){
   pipe(v(0,1.28,z-.08),v(0,1.28,z+.08),.96,m.stainless);
   pipe(v(0,1.28,z-.09),v(0,1.28,z+.09),.77,m.enamel);
   for(let i=0;i<8;i++){
    const a=i*Math.PI/4,x=Math.cos(a)*.84,y=1.28+Math.sin(a)*.84;
    pipe(v(x,y,z-.12),v(x,y,z+.12),.055,m.dark);
   }
  }
  // Curved outlet drops and a separate return riser remain within the skid.
  bend([v(0,1.28,1.52),v(0,1.25,1.7),v(0,.85,1.72),v(0,.24,1.72)],.19);
  bend([v(.7,1.1,-.85),v(1.3,1.1,-.85),v(1.48,.75,-.7),v(1.48,.24,-.7)],.16);
  valve(1.4,1.28,-.75);
  b(.84,1.25,.1,.035,.18,.55,m.cool);
  // Small scale deposits belong to the flange drain, not the walking floor.
  b(.35,.66,1.5,.12,.28,.012,m.mineral);
  b(.5,.74,1.5,.08,.12,.012,m.mineral);
 }else if(index<4){
  b(0,.32,0,3.3,.24,2.8,m.frame);
  pipe(v(-.87,1.02,-.48),v(-.87,1.02,.48),.7,m.enamel);
  pipe(v(-.87,1.02,-.53),v(-.87,1.02,-.47),.62,m.stainless);
  pipe(v(-.25,1.02,0),v(.35,1.02,0),.18,m.stainless);
  pipe(v(.35,1.02,0),v(1.55,1.02,0),.47,m.enamel);
  for(const x of [.48,.68,.88,1.08,1.28,1.48])pipe(v(x-.025,1.02,0),v(x+.025,1.02,0),.5,m.frame);
  b(.94,.57,0,1.35,.3,1.3,m.frame);
  for(const sign of [-1,1])bend([v(-.87,1.02,sign*.48),v(-.87,1.02,sign*1.25),v(-.87,.75,sign*1.65),v(-.87,.2,sign*1.65)],.2);
  valve(-.87,1.33,1.2);
  b(.96,1.55,0,.55,.1,.42,m.frame);
  b(1,1.61,0,.18,.025,.15,m.amber);
  b(-.57,.56,.5,.12,.15,.018,m.mineral);
 }else{
  // Open low frame carries two separate headers, each aligned with its covers.
  for(const x of [-1.25,1.25]){
   b(x,.51,0,.22,.62,3.35,m.frame).name='saddle-open-frame';
   b(x,.83,0,.38,.12,3.35,m.stainless);
  }
  for(const [i,z] of [-1.2,1.2].entries()){
   pipe(v(-1.78,.94,z),v(1.78,.94,z),.23,m.enamel).name=i===0?'supply-header':'return-header';
   for(const x of [-1.5,1.5])pipe(v(x-.07,.94,z),v(x+.07,.94,z),.3,m.stainless);
   // Drop ports meet the same below-deck service coordinates as the rough model.
   for(const x of [-1.8,1.8])pipe(v(x,.2,z),v(x,.94,z),.18,m.stainless);
   valve(i===0?-.55:.55,1.22,z);
  }
  b(0,.82,0,1.15,.1,.7,m.enamel);
  for(const x of [-.3,.3])b(x,.88,0,.18,.02,.14,x<0?m.cool:m.amber);
 }
 cell.scale.set(footprint.width/4,Math.min(1,footprint.width/4,footprint.height/4),footprint.height/4);
 root.position.set(footprint.x+footprint.width/2,0,footprint.y+footprint.height/2);
 root.userData.footprint={...footprint};return root;
}
/** Accepted below-deck service network. No emissive line or raised crossing. */
export function coolantPlantServices():T.Group{
 const root=new T.Group();root.name='coolant-flush-services';
 const paths=[[[375,340],[375,560]],[[825,340],[825,560]],[[375,410],[550,410]],[[375,470],[550,470]],[[650,410],[825,410]],[[650,470],[825,470]]];
 root.userData.servicePaths=paths;
 const plane=(x:number,z:number,w:number,d:number,height:number,material:T.Material)=>{
  const mesh=new T.Mesh(geometry('coolant-flush-cover',()=>new T.PlaneGeometry(1,1)),material);
  mesh.rotation.x=-Math.PI/2;mesh.scale.set(w/32,d/32,1);mesh.position.set(x/32,height,z/32);mesh.receiveShadow=true;root.add(mesh);
 };
 for(const [[x,z],[x2,z2]] of paths){
  const horizontal=z===z2,w=horizontal?Math.abs(x2-x):16,d=horizontal?16:Math.abs(z2-z);
  plane((x+x2)/2,(z+z2)/2,w,d,.003,COOLANT_MAT.frame);
  const length=horizontal?w:d;
  for(let along=5;along<length-3;along+=8)plane(horizontal?x+along:x,horizontal?z:z+along,horizontal?2:10,horizontal?10:2,.004,COOLANT_MAT.dark);
 }
 return root;
}
