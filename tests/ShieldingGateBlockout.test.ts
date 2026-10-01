import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {environmentObstacle,appendEnvironment} from '../src/render/ShipEnvironments';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';

const solids=ROOM_TEMPLATES['shielding-gate'].obstacles;
const models=()=>solids.map((s,i)=>environmentObstacle('containment',{x:s.x/32,y:s.y/32,width:s.width/32,height:s.height/32},i,'shielding-gate'));
const named=(r:T.Object3D,prefix:string)=>{const found:T.Object3D[]=[];r.traverse(o=>{if(o.name.startsWith(prefix))found.push(o);});return found;};
describe('Room17 rough shield gate',()=>{
 it('replaces repeated generic cells with two nested static gate assemblies and backing cover',()=>{
  const m=models();
  expect(m.map(r=>r.name)).toEqual(['shielding-gate-west','shielding-gate-backing','shielding-gate-east']);
  for(const i of [0,2]){
   expect(named(m[i],'shield-leaf-')).toHaveLength(3);
   expect(named(m[i],'screw-shaft')).toHaveLength(1);
   expect(named(m[i],'guide-shoe-')).toHaveLength(2);
   expect(named(m[i],'gear-housing')).toHaveLength(1);
   expect(named(m[i],'backing-layer-').length).toBeGreaterThanOrEqual(3);
  }
 });
 it('keeps every vertex inside the original collision footprints before and after batching',()=>{
  for(const [i,model] of models().entries()){
   const f=solids[i];
   for(const object of [model,(()=>{const g=new T.Group();appendEnvironment(g,model.clone(true));return g;})()]){
    const b=new T.Box3().setFromObject(object,true);
    expect(b.min.x).toBeGreaterThanOrEqual(f.x/32-1e-6);expect(b.max.x).toBeLessThanOrEqual((f.x+f.width)/32+1e-6);
    expect(b.min.z).toBeGreaterThanOrEqual(f.y/32-1e-6);expect(b.max.z).toBeLessThanOrEqual((f.y+f.height)/32+1e-6);
    expect(b.min.y).toBeGreaterThanOrEqual(-1e-6);
   }
  }
 });
 it('places gate machinery inside stage1 G1 and G2 reservations without spanning the threshold',()=>{
  const m=models();
  for(const [i,x] of [[0,310],[2,810]]){
   m[i].updateMatrixWorld(true);
   const g=m[i].getObjectByName('gate-mechanism');expect(g).toBeDefined();
   const b=new T.Box3().setFromObject(g!,true);
   expect(b.min.x*32).toBeGreaterThanOrEqual(x-1e-5);expect(b.max.x*32).toBeLessThanOrEqual(x+80+1e-5);
   expect(b.min.z*32).toBeGreaterThanOrEqual(345-1e-5);expect(b.max.z*32).toBeLessThanOrEqual(435+1e-5);
  }
 });
 it('leaves the other containment room on its existing model path',()=>{
  const r=environmentObstacle('containment',{x:0,y:0,width:3,height:8},0,'containment-annulus');
  expect(r.name).toBe('containment-obstacle-0');expect(named(r,'shield-leaf-')).toHaveLength(0);
 });
});
