import {describe,expect,it,vi} from 'vitest';
import * as T from 'three';
import {environmentObstacle,appendEnvironment} from '../src/render/ShipEnvironments';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {disposeModel,MAT} from '../src/render/meshParts';
import {createExpeditionGeometry,canTraverseExpedition,canOccupyExpedition} from '../src/game/world/expeditionGeometry';

const reservations=[[330,210,160,140],[700,210,160,140],[480,580,240,120]].map(([x,y,width,height])=>({x:x/32,y:y/32,width:width/32,height:height/32}));
const model=(i:number,id='safety-interlock-station')=>environmentObstacle('engineering',reservations[i],i,id);
const bounds=(o:T.Object3D)=>new T.Box3().setFromObject(o,true);
describe('Room12 rough safety equipment',()=>{
 it('places the isolated recorder, AI housing and lower contactor at the retained reservations',()=>{
  expect([0,1,2].map(i=>model(i).name)).toEqual(['safety-recorder','disconnected-ai-housing','split-contactor-battery']);
  const recorder=model(0);
  for(const name of ['inspection-window','record-spool-left','record-spool-right','manual-test-lever','timestamp-plate'])expect(recorder.getObjectByName(name)).toBeDefined();
  const ai=model(1);for(const name of ['empty-socket-left','empty-socket-right'])expect(ai.getObjectByName(name)).toBeDefined();
  expect(bounds(ai).min.x-bounds(recorder).max.x).toBeGreaterThanOrEqual(210/32);
 });
 it('leaves a measurable gap between actual copper jaws, with a separate battery',()=>{
  const lower=model(2),left=lower.getObjectByName('contactor-left'),right=lower.getObjectByName('contactor-right');
  expect(left).toBeDefined();expect(right).toBeDefined();
  expect(bounds(right!).min.x-bounds(left!).max.x).toBeGreaterThan(.5);
  expect(lower.getObjectByName('local-battery')).toBeDefined();
 });
 for(const i of [0,1,2])it(`grounds and contains reservation ${i} before and after real batching`,()=>{
  const root=model(i),f=reservations[i],world=new T.Group();
  const check=(o:T.Object3D)=>{const b=bounds(o);expect(b.min.x).toBeGreaterThanOrEqual(f.x-1e-5);expect(b.max.x).toBeLessThanOrEqual(f.x+f.width+1e-5);expect(b.min.z).toBeGreaterThanOrEqual(f.y-1e-5);expect(b.max.z).toBeLessThanOrEqual(f.y+f.height+1e-5);expect(b.min.y).toBeCloseTo(0,5);expect(b.max.y).toBeLessThan(2.5);};
  check(root);appendEnvironment(world,root);
  const renderer=Object.create(DepthRenderer.prototype) as {world:T.Group;floorMaterial:T.Material;bakeWorld():void};renderer.world=world;renderer.floorMaterial=new T.MeshStandardMaterial();renderer.bakeWorld();check(world);
  const materials=new Set<T.Material>();world.traverse(o=>{if(o instanceof T.Mesh)materials.add(o.material as T.Material);});
  expect(materials.size).toBeLessThanOrEqual(6);const spies=[...materials].map(m=>{expect(Object.values(MAT)).not.toContain(m);expect(m.userData.actorMaterial).toBe(true);return vi.spyOn(m,'dispose');});
  disposeModel(world);for(const spy of spies)expect(spy).toHaveBeenCalledTimes(1);renderer.floorMaterial.dispose();vi.restoreAllMocks();
 });
 it('does not replace the neighboring room or generic engineering models',()=>{
  const signature=(o:T.Object3D)=>{const data:unknown[]=[];o.traverse(m=>{if(m instanceof T.Mesh)data.push([m.position.toArray(),m.scale.toArray(),m.geometry.uuid,(m.material as T.MeshStandardMaterial).color.getHex()]);});return data;};
  expect(signature(model(0,'diagnostic-gallery'))).toEqual(signature(model(0,'')));
  expect(model(0).name).not.toBe(model(0,'diagnostic-gallery').name);
 });
 it('retains canonical collision, direct route, bypasses and viewing approaches for both actor radii',()=>{
  const g=createExpeditionGeometry({id:'room12-check',depth:11,kind:'combat',reward:'upgrade',next:[],templateId:'safety-interlock-station'});
  expect(g.voids??[]).toEqual([]);
  const paths=[[[100,440],[1100,440]],[[100,440],[100,140],[1100,140],[1100,440]],[[100,440],[100,760],[1100,760],[1100,440]],[[410,440],[410,395]],[[780,440],[780,395]],[[600,440],[600,535]]];
  for(const r of [16,28]){for(const path of paths)for(let j=1;j<path.length;j++)expect(canTraverseExpedition(g,{x:path[j-1][0],y:path[j-1][1]},{x:path[j][0],y:path[j][1]},r)).toBe(true);for(const b of g.breaches)expect(canOccupyExpedition(g,{x:b.x+(b.facing==='east'?56:-56),y:b.y},r)).toBe(true);}
 });
});
