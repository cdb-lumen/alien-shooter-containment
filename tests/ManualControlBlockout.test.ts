import {describe,it,expect,vi} from 'vitest';
import * as T from 'three';
import {environmentObstacle,environmentArchitecture,appendEnvironment} from '../src/render/ShipEnvironments';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {MAT,disposeModel} from '../src/render/meshParts';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {createExpeditionGeometry,canTraverseExpedition} from '../src/game/world/expeditionGeometry';

const template=ROOM_TEMPLATES['manual-control-chamber'];
const footprints=template.obstacles.map(f=>({x:f.x/32,y:f.y/32,width:f.width/32,height:f.height/32}));
const model=(i:number)=>environmentObstacle('reactor',footprints[i],i,template.id);
const bounds=(o:T.Object3D)=>new T.Box3().setFromObject(o,true);
function contains(root:T.Object3D,i:number){const b=bounds(root),f=footprints[i];expect(b.min.x).toBeGreaterThanOrEqual(f.x-1e-5);expect(b.max.x).toBeLessThanOrEqual(f.x+f.width+1e-5);expect(b.min.z).toBeGreaterThanOrEqual(f.y-1e-5);expect(b.max.z).toBeLessThanOrEqual(f.y+f.height+1e-5);expect(b.min.y).toBeCloseTo(0);}

describe('Room19 placed rough authorization equipment',()=>{
 it('replaces only this room reactor silhouettes with low switch cabinets and a separate desk/display',()=>{
  for(const i of [0,1]){const root=model(i);expect(root.getObjectByName('low-switch-cabinet')).toBeDefined();expect(bounds(root).max.y).toBeLessThan(1.7);contains(root,i);}
  const root=model(2);expect(root.getObjectByName('sloped-authorization-desk')).toBeDefined();
  const desk=root.getObjectByName('sloped-authorization-desk')!,panel=root.getObjectByName('passenger-status-panel')!;
  expect(panel).toBeDefined();expect(bounds(desk).intersectsBox(bounds(panel))).toBe(false);
  expect(bounds(panel).max.y).toBeGreaterThan(bounds(desk).max.y);contains(root,2);
  expect(environmentObstacle('reactor',footprints[2],2,'overload-floor').name).toBe('reactor-obstacle-2');
 });
 it('keeps two guard frames, a recessed actuator and connected hardwired feedthroughs inside the southern reservation',()=>{
  const root=model(2);
  for(const name of ['outer-safety-guard','inner-safety-guard','recessed-actuator','key-socket','hardwired-safety-loom','ceramic-feedthrough'])expect(root.getObjectByName(name),name).toBeDefined();
  const foot=bounds(root.getObjectByName('passenger-panel-foot')!);
  root.traverse(o=>{if(o.name==='ceramic-feedthrough')expect(bounds(o).intersectsBox(foot)).toBe(true);});
  expect(root.userData.footprint).toEqual(footprints[2]);contains(root,2);
 });
 it('places the narrow observation recess outside all walkable floor',()=>{
  const world=new T.Group();environmentArchitecture(world,'reactor',37.5,27.5,template.id);
  const recess=world.getObjectByName('armored-observation-recess');expect(recess).toBeDefined();
  expect(bounds(recess!).max.z).toBeLessThanOrEqual(0);
  const size=bounds(recess!).getSize(new T.Vector3());expect(size.x).toBeGreaterThan(size.y*2);
 });
 it('preserves actual mesh bounds through flattening/batching and releases only baked geometry',()=>{
  for(const i of [0,1,2]){
   const root=model(i),before=bounds(root),world=new T.Group();appendEnvironment(world,root);contains(world,i);
   const shared=new Set<T.BufferGeometry>();world.traverse(o=>{if(o instanceof T.Mesh)shared.add(o.geometry);});
   const spies=[...shared].map(g=>vi.spyOn(g,'dispose'));const mats=Object.values(MAT).map(m=>vi.spyOn(m,'dispose'));
   const renderer=Object.create(DepthRenderer.prototype);renderer.world=world;renderer.floorMaterial=new T.MeshStandardMaterial();renderer.bakeWorld();
   expect(world.children.length).toBeLessThanOrEqual(9);contains(world,i);
   expect(bounds(world).min.distanceTo(before.min)).toBeLessThan(1e-5);expect(bounds(world).max.distanceTo(before.max)).toBeLessThan(1e-5);
   const baked=world.children.map(o=>vi.spyOn((o as T.Mesh).geometry,'dispose'));disposeModel(world);
   for(const spy of baked)expect(spy).toHaveBeenCalledTimes(1);for(const spy of [...spies,...mats])expect(spy).not.toHaveBeenCalled();renderer.floorMaterial.dispose();vi.restoreAllMocks();
  }
 });
 it.each([16,28])('retains main crossing, warning approach and both flanks for radius %s',radius=>{
  const g=createExpeditionGeometry({id:'room19-blockout-test',templateId:template.id,depth:18,kind:'combat',next:[],reward:'upgrade'});
  const routes=[[template.spawn,{x:220,y:480},{x:980,y:480},template.exit],[{x:600,y:480},{x:600,y:550}],[{x:220,y:480},{x:220,y:140},{x:980,y:140},{x:980,y:480}],[{x:220,y:480},{x:220,y:780},{x:980,y:780},{x:980,y:480}]];
  for(const points of routes)for(let i=1;i<points.length;i++)expect(canTraverseExpedition(g,points[i-1],points[i],radius)).toBe(true);
 });
});
