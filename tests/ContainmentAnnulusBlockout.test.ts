import {expect,it,vi} from 'vitest';
import * as T from 'three';
import {STORY_ROOM_TEMPLATES} from '../src/game/roguelike/storyRoomTemplates';
import {ROOM_STORY_ROUTE} from '../src/game/roguelike/storyRooms';
import {authoredRoom} from '../src/render/AuthoredRooms';
import {disposeModel} from '../src/render/meshParts';
import {createExpeditionGeometry,canOccupyExpedition,canTraverseExpedition,hasClearExpeditionShot} from '../src/game/world/expeditionGeometry';
const t=STORY_ROOM_TEMPLATES['containment-annulus'];
it('integrates the approved solid core and ring without detached blockers',()=>{
 expect(t.boundary).toEqual([{x:80,y:40},{x:1120,y:40},{x:1160,y:80},{x:1160,y:800},{x:1120,y:840},{x:80,y:840},{x:40,y:800},{x:40,y:80}]);
 expect(t.voids).toEqual([[{x:420,y:240},{x:780,y:240},{x:840,y:300},{x:840,y:580},{x:780,y:640},{x:420,y:640},{x:360,y:580},{x:360,y:300}]]);
 expect(t.obstacles).toEqual([]);
});
it('keeps both complete ring directions and entry/exit open at player and enemy clearance',()=>{
 const g=createExpeditionGeometry({id:'room18-test',templateId:'containment-annulus',depth:17,kind:'combat',reward:'upgrade',next:[]});const ring=[[240,440],[240,220],[340,140],[860,140],[960,220],[960,660],[860,740],[340,740],[240,660],[240,440]].map(([x,y])=>({x,y}));
 for(const r of [16,28,30]){
  for(const path of [ring,[...ring].reverse(),[t.spawn,ring[0]],[{x:960,y:440},t.exit]])for(let i=1;i<path.length;i++)expect(canTraverseExpedition(g,path[i-1],path[i],r)).toBe(true);
  for(const p of [...t.breaches,{x:600,y:160},{x:600,y:720},{x:930,y:350},{x:930,y:490}])expect(canOccupyExpedition(g,p,r)).toBe(true);
  expect(canOccupyExpedition(g,{x:600,y:440},r)).toBe(false);
 }
 expect(hasClearExpeditionShot(g,{x:240,y:440},{x:960,y:440})).toBe(false);
});
it('places bounded rough assemblies and preserves owned resource disposal',()=>{
 const model=authoredRoom(t.id,t);expect(model).not.toBeNull();if(!model)return;
 expect(model.userData.stage).toBe('rough-model-placement');
 expect(model.userData.assemblies).toEqual(['sealed-core','segmented-jacket','radial-feet','inspection-plugs','passenger-vitals','authorization-state']);
 const bounds=new T.Box3().setFromObject(model,true);expect(bounds.min.x).toBeGreaterThanOrEqual(40/32-1e-5);expect(bounds.max.x).toBeLessThanOrEqual(1160/32+1e-5);expect(bounds.max.y).toBeLessThanOrEqual(1.7);
 const meshes:T.Mesh[]=[];model.traverse(o=>{if(o instanceof T.Mesh)meshes.push(o);});expect(meshes.length).toBeLessThanOrEqual(8);
 const materials=[...new Set(meshes.map(m=>m.material as T.Material))];const gs=meshes.map(m=>vi.spyOn(m.geometry,'dispose')),ms=materials.map(m=>vi.spyOn(m,'dispose'));
 disposeModel(model);for(const spy of [...gs,...ms])expect(spy).toHaveBeenCalledTimes(1);vi.restoreAllMocks();
});
it('retires document-present sign textures with their owned materials',()=>{
 vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>({fillRect(){},fillText(){}})})});
 try{
  const model=authoredRoom(t.id,t)!;const textures=new Set<T.Texture>();
  model.traverse(o=>{if(o instanceof T.Mesh){const m=o.material as T.MeshBasicMaterial;if(m.map)textures.add(m.map);}});
  expect(textures.size).toBe(2);const spies=[...textures].map(texture=>vi.spyOn(texture,'dispose'));
  disposeModel(model);for(const spy of spies)expect(spy).toHaveBeenCalledTimes(1);
 }finally{vi.unstubAllGlobals();vi.restoreAllMocks();}
});
it('retains the living-passenger and unarmed story',()=>{
 const story=ROOM_STORY_ROUTE.find(r=>r.templateId===t.id)!;
 expect(story.objective).toContain('Overload is NOT armed.');expect(story.story).toBe('PASSENGERS ALIVE. Manual authorization still required.');
});
