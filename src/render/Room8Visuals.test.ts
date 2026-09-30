import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {authoredRoom} from './AuthoredRooms';
import {ROOM_TEMPLATES} from '../game/roguelike/roomTemplates';
import {disposeModel} from './meshParts';
const local=['room8-apron-markings'];
const materialMesh=(group:T.Group,name:string)=>group.children.find(o=>o instanceof T.Mesh&&(o.material as T.Material).name===name) as T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>;
describe('Room8 room visuals',()=>{
 it('keeps Room8 floor paint at the loading faces of existing freight, without detached pads',()=>{
  const plan=ROOM_TEMPLATES['breached-loading-bay'],group=authoredRoom('breached-loading-bay',plan)!;
  expect(materialMesh(group,'room8-freight-apron')).toBeUndefined();
  expect(materialMesh(group,'room8-docking-channels')).toBeUndefined();
  const paint=materialMesh(group,'room8-apron-markings');expect(paint).toBeDefined();
  expect(paint.material.color.getHex()).toBe(0x777866);expect(paint.material.roughness).toBe(.96);
  const p=paint.geometry.getAttribute('position');
  // Three separated flush strokes per occupied loading face, not corner boxes.
  expect(p.count).toBe(plan.obstacles.length*3*36);
  for(const [i,r] of plan.obstacles.entries()){
   const points=Array.from({length:3*36},(_,j)=>new T.Vector3().fromBufferAttribute(p,i*3*36+j));
   const b=new T.Box3().setFromPoints(points);
   expect(b.min.x*32).toBeCloseTo(r.x-8,3);expect(b.max.x*32).toBeCloseTo(r.x+r.width+8,3);
   expect(b.min.z*32).toBeCloseTo(r.y-13.5,3);expect(b.max.z*32).toBeCloseTo(r.y-10.5,3);
   expect(b.min.y).toBeCloseTo(.001);expect(b.max.y).toBeCloseTo(.009);
  }
  disposeModel(group);
 });

 it('keeps new apron relief flush and finite with owned materials',()=>{
  const room=authoredRoom('breached-loading-bay',ROOM_TEMPLATES['breached-loading-bay'])!;
  const disposalCounts:Array<()=>number>=[];
  for(const name of local){
   const mesh=room.children.find(o=>o instanceof T.Mesh&&(o.material as T.Material).name===name) as T.Mesh;
   expect(mesh).toBeDefined();mesh.geometry.computeBoundingBox();
   expect(mesh.geometry.boundingBox!.max.y).toBeLessThan(.04);
   expect(mesh.geometry.boundingBox!.min.y).toBeGreaterThanOrEqual(0);
   for(const x of mesh.geometry.getAttribute('position').array)expect(Number.isFinite(x)).toBe(true);
   let disposed=0;(mesh.material as T.Material).addEventListener('dispose',()=>disposed++);
   disposalCounts.push(()=>disposed);
  }
  disposeModel(room);
  expect(disposalCounts).toHaveLength(1);
  for(const count of disposalCounts)expect(count()).toBe(1);
 });
 it.each(['awakening-bay','passenger-vault','overload-floor'] as const)('does not leak Room8 apron materials into %s',id=>{
  const room=authoredRoom(id,ROOM_TEMPLATES[id])!;
  for(const child of room.children)if(child instanceof T.Mesh)expect(local).not.toContain((child.material as T.Material).name);
  disposeModel(room);
 });
});
