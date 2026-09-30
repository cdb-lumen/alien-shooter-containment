import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import * as T from 'three';
import {ROOM_TEMPLATES} from '../game/roguelike/roomTemplates';
import {createExpeditionGeometry,canOccupyExpedition,canTraverseExpedition} from '../game/world/expeditionGeometry';
import {clearPolygonTopology} from '../game/world/polygonGeometry';
import {authoredRoom} from './AuthoredRooms';
import {disposeModel} from './meshParts';
const layout=JSON.parse(readFileSync('docs/art-evidence/room10-story-flow-v3/stage-1/attempt-962/layout.json','utf8'));
const template=ROOM_TEMPLATES['transmission-chamber'];
const geometry=()=>createExpeditionGeometry({id:'room10-stage2',templateId:'transmission-chamber'} as Parameters<typeof createExpeditionGeometry>[0]);
describe('Room10 rough placement',()=>{
 it('implements precisely the reviewed nine solids and retains canonical anchors',()=>{
  expect(template.voids).toEqual(layout.solids.map((s:{points:unknown})=>s.points));
  expect(template.obstacles).toEqual([]);expect(template.boundary).toEqual(layout.boundary);
  for(const key of ['width','height','spawn','exit','breaches'] as const)expect(template[key]).toEqual(layout[key]);
  expect(geometry().blockers).toEqual(geometry().boundaryWalls);
 });
 it.each([16,28,38])('preserves every reviewed swept route at radius %s',radius=>{
  const g=geometry();
  for(const route of layout.routes){
   const points=route.points as {x:number;y:number}[];
   expect(points.every(p=>canOccupyExpedition(g,p,radius)),route.id+' endpoints').toBe(true);
   const swept=points.slice(1).every((p,i)=>canTraverseExpedition(g,points[i],p,radius));
   expect(swept,route.id).toBe(route.expected==='clear');
  }
  for(const anchor of [template.spawn,template.exit,...template.breaches])expect(canOccupyExpedition(g,anchor,radius)).toBe(true);
  for(const solid of layout.solids){const p={x:solid.points.reduce((n:number,p:{x:number})=>n+p.x,0)/solid.points.length,y:solid.points.reduce((n:number,p:{y:number})=>n+p.y,0)/solid.points.length};expect(canOccupyExpedition(g,p,radius)).toBe(false);}
 });
 it('renders all nine grounded fixtures inside their collision outlines',()=>{
  const room=authoredRoom('transmission-chamber',template);expect(room).not.toBeNull();if(!room)return;
  room.updateMatrixWorld(true);
  for(const solid of layout.solids){
   const fixture=room.getObjectByName(solid.id);expect(fixture,solid.id).toBeDefined();if(!fixture)continue;
   let vertices=0;const bounds=new T.Box3().setFromObject(fixture);expect(bounds.min.y).toBeCloseTo(0,5);
   fixture.traverse(o=>{if(!(o instanceof T.Mesh))return;const p=o.geometry.getAttribute('position');for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);const q={x:v.x*32,y:v.z*32};
    // Expand by 0.002 game units solely for Float32 vertex rounding at exact edges.
    const center=solid.points.reduce((c:{x:number;y:number},p:{x:number;y:number})=>({x:c.x+p.x/solid.points.length,y:c.y+p.y/solid.points.length}),{x:0,y:0});
    const inset={x:q.x+(center.x-q.x)*.00001,y:q.y+(center.y-q.y)*.00001};
    expect(clearPolygonTopology({voids:[solid.points]},inset,inset,0),solid.id+' vertex outside').toBe(false);vertices++;
   }});expect(vertices).toBeGreaterThan(20);
   if(solid.id.startsWith('waveguide'))expect(bounds.max.y*32).toBeLessThanOrEqual(44);
  }
  disposeModel(room);
 });
 it('owns bounded room resources and disposes each exactly once',()=>{
  const room=authoredRoom('transmission-chamber',template);expect(room).not.toBeNull();if(!room)return;
  const resources=new Set<T.BufferGeometry|T.Material>();let meshes=0,triangles=0;
  room.traverse(o=>{if(o instanceof T.Mesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;resources.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])resources.add(m);}});
  expect(meshes).toBeLessThan(90);expect(triangles).toBeLessThan(15000);
  const counts=new Map([...resources].map(r=>[r,0]));for(const r of resources)r.addEventListener('dispose',()=>counts.set(r,counts.get(r)!+1));disposeModel(room);for(const n of counts.values())expect(n).toBe(1);
 });
});
