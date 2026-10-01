import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {environmentObstacle,appendEnvironment,environmentArchitecture} from '../src/render/ShipEnvironments';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {MAT,disposeModel} from '../src/render/meshParts';

const solids=ROOM_TEMPLATES['infested-workshop'].obstacles;
const models=()=>solids.map((f,i)=>environmentObstacle('infested',{x:f.x/32,y:f.y/32,width:f.width/32,height:f.height/32},i,'infested-workshop'));
const bounds=(o:T.Object3D)=>new T.Box3().setFromObject(o,true);
describe('Room15 rough machinery',()=>{
 it('uses room-local worn paint and matte longitudinal resin without emissive poison',()=>{
  const first=models()[0],second=models()[0];
  const paint=(first.getObjectByName('headstock') as T.Mesh).material as T.MeshStandardMaterial;
  const resin=(first.getObjectByName('directional-resin') as T.Mesh).material as T.MeshStandardMaterial;
  expect(paint).not.toBe(MAT.trim);expect(paint.map).toBeInstanceOf(T.DataTexture);
  expect(resin.roughness).toBeGreaterThan(.9);expect(resin.metalness).toBe(0);
  expect(resin.map).toBeInstanceOf(T.DataTexture);expect(resin.emissive.getHex()).toBe(0);
  expect((second.getObjectByName('headstock') as T.Mesh).material).toBe(paint);
  expect(first.getObjectByName('resin-fiber')).toBeDefined();
 });
 it('keeps the workshop shell outboard and deck markings flush with no free growth puddles',()=>{
  const shell=new T.Group();environmentArchitecture(shell,'infested',37.5,27.5,'infested-workshop');
  expect(shell.getObjectByName('workshop-rear-cassette')).toBeDefined();
  expect(shell.getObjectByName('workshop-deck-seam')).toBeDefined();
  shell.traverse(o=>{if(o instanceof T.Mesh){
   const b=bounds(o);expect(b.max.y<=.011||b.max.z<=.001).toBe(true);
   expect((o.material as T.MeshStandardMaterial).emissive.getHex()).toBe(0);
  }});
  const neighbor=new T.Group();environmentArchitecture(neighbor,'infested',37.5,27.5,'swarm-junction');
  expect(neighbor.getObjectByName('workshop-rear-cassette')).toBeUndefined();
 });
 it('places a lathe and articulated manipulator on the original first island',()=>{
  const model=models()[0];
  for(const name of ['lathe-bed','chuck','carriage','way-front','way-rear','broken-guard','arm-upper','arm-forearm','tendon-brace','suspended-workpiece','peeled-insulation'])expect(model.getObjectByName(name),name).toBeDefined();
  const piece=bounds(model.getObjectByName('suspended-workpiece')!);
  expect(piece.min.y).toBeGreaterThan(.5);
 });
 it('preserves four original solids and planned equipment roles',()=>{
  expect(solids).toEqual([{x:280,y:220,width:190,height:140},{x:480,y:560,width:180,height:160},{x:700,y:160,width:130,height:240},{x:850,y:550,width:150,height:140}]);
  expect(models().map(m=>m.name)).toEqual(['workshop-lathe-manipulator','workshop-fixture-bench','workshop-gantry','workshop-stock-cabinet']);
  expect(environmentObstacle('infested',{x:0,y:0,width:5,height:5},0,'swarm-junction').name).toBe('infested-obstacle-0');
 });
 it('contains every actual vertex inside reserved envelopes before flattening and real renderer batching',()=>{
  const reservations=[{x:288,y:228,width:174,height:124},{x:488,y:568,width:164,height:144},{x:708,y:168,width:114,height:224},{x:858,y:558,width:134,height:124}];
  models().forEach((model,i)=>{
   const b=bounds(model),r=reservations[i];
   expect(b.min.x).toBeGreaterThanOrEqual(r.x/32-1e-5);expect(b.max.x).toBeLessThanOrEqual((r.x+r.width)/32+1e-5);
   expect(b.min.z).toBeGreaterThanOrEqual(r.y/32-1e-5);expect(b.max.z).toBeLessThanOrEqual((r.y+r.height)/32+1e-5);
   expect(b.min.y).toBeGreaterThanOrEqual(-1e-5);
   let meshes=0,triangles=0;const materials=new Set<T.Material>();
   model.traverse(o=>{if(o instanceof T.Mesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3;materials.add(o.material as T.Material);}});
   expect(meshes).toBeLessThanOrEqual(128);expect(triangles).toBeLessThanOrEqual(100000);expect(materials.size).toBeLessThanOrEqual(8);
   expect(materials.has(MAT.acid)).toBe(false);
   const world=new T.Group();appendEnvironment(world,model);
   const renderer=Object.create(DepthRenderer.prototype) as {world:T.Group;floorMaterial:T.Material;bakeWorld():void};
   renderer.world=world;renderer.floorMaterial=new T.MeshStandardMaterial();renderer.bakeWorld();
   const after=bounds(world);expect(after.min.distanceTo(b.min)).toBeLessThan(1e-5);expect(after.max.distanceTo(b.max)).toBeLessThan(1e-5);
   expect(world.children.length).toBe(materials.size);disposeModel(world);renderer.floorMaterial.dispose();
  });
 });
});
