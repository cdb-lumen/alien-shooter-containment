import * as T from 'three';
import {MAT,box,rod,ring,geometry} from './meshParts';
import type {Footprint} from './ShipEnvironments';

const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
/** Rough main masses only. The full plinth matches the existing collision solid.
 * All machinery is fitted within it, with no new interaction or blocking pipe. */
export function coolantPlantBlockout(footprint:Footprint,index:number):T.Group{
 const root=new T.Group(),cell=new T.Group();root.add(cell);
 root.name=index<2?'coolant-heat-exchanger':index<4?'coolant-pump-return':'coolant-service-saddle';
 const b=(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material)=>box(cell,x,y,z,w,h,d,m,0);
 const pipe=(a:T.Vector3,c:T.Vector3,r:number,m:T.Material)=>rod(cell,a,c,r,r,m);
 b(0,.1,0,4,.2,4,MAT.steel);
 if(index<2){
  // Horizontal shell, two bearing saddles and broad end plates establish scale.
  for(const z of [-1,1])b(0,.48,z,2,.76,.38,MAT.edge);
  pipe(v(0,1.35,-1.35),v(0,1.35,1.35),.83,MAT.shellDark);
  for(const z of [-1.4,1.4]){pipe(v(0,1.35,z-.09),v(0,1.35,z+.09),.97,MAT.edge);ring(cell,0,1.35,z,.75,.065,MAT.armor);}
  // Outlet descends inside the plinth into the flush service spine.
  pipe(v(0,1.35,1.5),v(0,1.35,1.7),.24,MAT.steel);
  pipe(v(0,.24,1.7),v(0,1.35,1.7),.24,MAT.steel);
  b(.89,1.38,0,.035,.2,1.5,MAT.cyan);
 }else if(index<4){
  // Pump volute, coupling and long motor are distinct connected rough masses.
  b(0,.32,0,3.3,.24,2.8,MAT.edge);
  pipe(v(-.87,1.02,-.48),v(-.87,1.02,.48),.7,MAT.shellDark);
  pipe(v(-.25,1.02,0),v(.35,1.02,0),.18,MAT.armor);
  pipe(v(.35,1.02,0),v(1.55,1.02,0),.47,MAT.edge);
  b(.94,.57,0,1.35,.3,1.3,MAT.steel);
  pipe(v(-.87,1.02,-1.65),v(-.87,1.02,-.48),.22,MAT.steel);
  pipe(v(-.87,.2,-1.65),v(-.87,1.02,-1.65),.22,MAT.steel);
  pipe(v(-.87,1.02,.48),v(-.87,1.02,1.65),.22,MAT.steel);
  pipe(v(-.87,.2,1.65),v(-.87,1.02,1.65),.22,MAT.steel);
  b(1,1.52,0,.55,.07,.3,MAT.amber);
 }else{
  // Low shared service saddle. Four ports terminate at the plinth edges.
  b(0,.53,0,3.65,.86,3.55,MAT.edge);
  b(0,.99,0,3.3,.06,2.7,MAT.steel);
  for(const z of [-1.2,1.2]){pipe(v(-1.8,.8,z),v(1.8,.8,z),.14,MAT.shellDark);for(const x of [-1.9,1.9])b(x,.46,z,.2,.52,.48,MAT.cyan);}
  b(0,1.04,0,1,.04,.2,MAT.amber);
 }
 cell.scale.set(footprint.width/4,Math.min(1,footprint.width/4,footprint.height/4),footprint.height/4);
 root.position.set(footprint.x+footprint.width/2,0,footprint.y+footprint.height/2);
 root.userData.footprint={...footprint};return root;
}
/** Accepted below-deck service network. Upward planes mark flush closed covers,
 * not exposed pipes crossing the player's feet. Coordinates are game units. */
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
  plane((x+x2)/2,(z+z2)/2,w,d,.003,MAT.edge);
  plane((x+x2)/2,(z+z2)/2,horizontal?w:2,horizontal?2:d,.004,MAT.cyan);
 }
 return root;
}
