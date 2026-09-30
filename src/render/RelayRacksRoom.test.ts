import {afterEach,describe,expect,it} from 'vitest';
import * as T from 'three';
import {authoredRoom} from './AuthoredRooms';
import {disposeModel} from './models';
import {ROOM_TEMPLATES} from '../game/roguelike/roomTemplates';
import {generateRun} from '../game/roguelike/run';
import {canOccupyExpedition,canTraverseExpedition,createExpeditionGeometry,hasClearExpeditionShot} from '../game/world/expeditionGeometry';
import {FacilityNavigation} from '../game/world/FacilityNavigation';
const template=ROOM_TEMPLATES['relay-racks'];
const node=generateRun(1729,3).nodes.find(n=>n.templateId==='relay-racks')!;
const geometry=createExpeditionGeometry(node);
const expected=[[300,160,100,170],[300,550,100,170],[800,160,100,170],[800,550,100,170],[550,360,100,160]];
const owned:T.Group[]=[];
const make=()=>{const g=authoredRoom('relay-racks',template);expect(g).not.toBeNull();owned.push(g!);g!.updateMatrixWorld(true);return g!;};
afterEach(()=>{for(const g of owned)disposeModel(g);owned.length=0;});
describe('Room9 stage2 production placement',()=>{
 it('uses the reviewed five footprints without changing envelope or anchors',()=>{
  expect(template.obstacles.map(r=>[r.x,r.y,r.width,r.height])).toEqual(expected);
  expect([template.width,template.height]).toEqual([1200,880]);
  expect(template.spawn).toEqual({x:100,y:440});expect(template.exit).toEqual({x:1100,y:440});
  expect(template.breaches).toEqual([{x:100,y:100},{x:1100,y:100},{x:100,y:780},{x:1100,y:780}]);
 });
 it.each([16,28,38])('keeps both forks, end cross-links and offset breach approaches clear at radius %i',radius=>{
  const routes=[[[100,440],[460,440],[460,280],[740,280],[740,440],[1100,440]],[[100,440],[460,440],[460,600],[740,600],[740,440],[1100,440]],[[100,110],[1100,110]],[[100,770],[1100,770]],...template.breaches.map(p=>[[p.x+(p.x<600?56:-56),p.y],[p.x+(p.x<600?56:-56),440]])];
  for(const route of routes)for(let i=1;i<route.length;i++){
   const a={x:route[i-1][0],y:route[i-1][1]},b={x:route[i][0],y:route[i][1]};
   expect(canTraverseExpedition(geometry,a,b,radius)).toBe(true);
   expect(hasClearExpeditionShot(geometry,a,b)).toBe(true);
  }
  expect(canOccupyExpedition(geometry,{x:600,y:440},radius)).toBe(false);
  expect(hasClearExpeditionShot(geometry,{x:460,y:440},{x:740,y:440})).toBe(false);
 });
 it('connects breach spawns and both forks through shipping FacilityNavigation',()=>{
  const nav=new FacilityNavigation(geometry);nav.prepare(template.exit,0);
  for(const p of [...template.breaches,template.spawn,{x:600,y:280},{x:600,y:600}])expect(nav.reachable(p)).toBe(true);
  const from={x:460,y:440,radius:28},target={x:740,y:440};
  const next=nav.waypoint(from,target,0);expect(next).not.toBeNull();
  expect(Math.hypot(next!.x-from.x,next!.y-from.y)).toBeGreaterThan(1);
  expect(canTraverseExpedition(geometry,from,next!,from.radius)).toBe(true);
 });
 it('places grounded rough assemblies inside their exact collision footprints',()=>{
  const g=make();
  for(const [i,r]of expected.entries()){
   const model=g.getObjectByName(`relay-fixture-${i}`);expect(model).toBeDefined();
   const b=new T.Box3().setFromObject(model!);
   expect(b.min.x*32).toBeCloseTo(r[0],3);expect(b.max.x*32).toBeCloseTo(r[0]+r[2],3);
   expect(b.min.z*32).toBeCloseTo(r[1],3);expect(b.max.z*32).toBeCloseTo(r[1]+r[3],3);
   expect(b.min.y).toBeCloseTo(0,4);expect(b.max.y*32).toBeGreaterThan(45);expect(b.max.y*32).toBeLessThanOrEqual(86);
  }
  const channels=g.getObjectByName('relay-flush-channels')!;expect(channels).toBeDefined();
  expect(new T.Box3().setFromObject(channels).max.y*32).toBeLessThanOrEqual(.4);
 });
 it('has open rails, patch loops and a lower damaged bank without success animation',()=>{
  const g=make(),intact=g.getObjectByName('relay-fixture-0')!,damaged=g.getObjectByName('relay-fixture-1')!;
  expect(new T.Box3().setFromObject(damaged).max.y).toBeLessThan(new T.Box3().setFromObject(intact).max.y);
  for(const name of ['relay-open-rails','relay-fiber-loops','relay-bridge-coupler','relay-distribution-drum'])expect(g.getObjectByName(name)).toBeDefined();
  expect(g.animations).toEqual([]);
 });
 it('owns finite bounded geometry and releases its resources once',()=>{
  const g=make(),geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();let vertices=0;
  g.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);const p=o.geometry.getAttribute('position');vertices+=p.count;for(const n of p.array)expect(Number.isFinite(n)).toBe(true);}});
  expect(vertices).toBeLessThan(50000);expect(materials.size).toBeLessThanOrEqual(8);
  let disposed=0;for(const x of [...geometries,...materials])x.addEventListener('dispose',()=>disposed++);
  disposeModel(g);owned.pop();expect(disposed).toBe(geometries.size+materials.size);
 });
});
