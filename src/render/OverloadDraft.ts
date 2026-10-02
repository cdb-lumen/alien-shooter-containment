import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

/** Room20 stage2 only. Coordinates are game units; all solid work stays in the
 * existing void. Heads occupy the stage1 reservations, not the combat deck. */
export function createOverloadDraft(){
 const root=new T.Group();root.name='overload-draft';
 const material=(name:string,color:number,metalness=.65)=>{const m=new T.MeshStandardMaterial({color,metalness,roughness:.65});m.name=name;m.userData.actorMaterial=true;return m;};
 const steel=material('overload-steel',0x52656a),dark=material('overload-recess',0x17262d),ceramic=material('overload-ceramic',0xb2bcb1,.12),bronze=material('overload-buswork',0x9b7243),bolts=material('reactor-fasteners',0x8c999a);
 // Quiet static column. Sequence-driven overload emission is not part of this pass.
 const core=material('overload-column',0x8ebfc5,.3);core.emissive.setHex(0x285762);core.emissiveIntensity=.35;
 let group:T.Group;
 const role=(name:string)=>{group=new T.Group();group.name=name;root.add(group);};
 const add=(g:T.BufferGeometry,m:T.Material,x:number,h:number,z:number)=>{const mesh=new T.Mesh(g,m);mesh.position.set(x/32,h/32,z/32);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);return mesh;};
 const box=(x:number,h:number,z:number,w:number,t:number,d:number,m:T.Material)=>add(new T.BoxGeometry(w/32,t/32,d/32),m,x,h,z);
 const pipe=(a:number[],b:number[],r:number,m:T.Material)=>{const start=new T.Vector3(...a).divideScalar(32),end=new T.Vector3(...b).divideScalar(32),mesh=add(new T.CylinderGeometry(r/32,r/32,start.distanceTo(end),12),m,0,0,0);mesh.position.copy(start).add(end).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize());};
 const ring=(h:number,r:number,t:number,m:T.Material)=>{const mesh=add(new T.TorusGeometry(r/32,t/32,8,48),m,600,h,415);mesh.rotation.x=-Math.PI/2;};
 const foundation=(x:number,z:number)=>{for(const dx of [-18,18])box(x+dx,-101,z,10,118,36,steel);};
 role('coolant-header');foundation(510,375);
 box(510,-38,375,56,8,66,dark);
 for(const x of [489,531])box(x,-8,375,8,52,58,steel);
 // Broad transverse header and paired drop/return pipes, unlike the bus blades.
 pipe([489,24,352],[531,24,352],8,steel);
 for(const x of [496,524]){
  pipe([x,-34,394],[x,24,394],6,steel);pipe([x,24,352],[x,24,394],6,steel);
  pipe([x,24,364],[x,24,376],8,ceramic);
 }
 role('power-bus');foundation(690,375);
 box(690,-38,375,56,8,66,dark);
 for(const z of [350,396]){box(690,-9,z,52,50,9,steel);box(690,18,z,54,8,12,ceramic);}
 for(const x of [673,690,707]){box(x,30,375,7,16,58,bronze);box(x,42,350,10,8,10,ceramic);}
 role('restraint-head');foundation(600,510);
 box(600,-38,510,66,8,56,dark);
 // Two raised cheeks carry a transverse jaw and a visible axial piston.
 for(const x of [574,626]){box(x,1,510,12,70,52,steel);box(x,39,510,14,6,54,ceramic);}
 box(600,28,489,60,16,12,steel);
 pipe([600,20,492],[600,20,532],7,bronze);pipe([600,20,489],[600,20,512],4,bolts);
 box(600,20,533,28,24,10,steel);
 for(const x of [574,626])for(const z of [490,530])pipe([x,42,z],[x,46,z],3,bolts);
 role('induction-core');foundation(600,415);
 box(600,-38,415,56,8,96,dark);
 pipe([600,-34,415],[600,82,415],8,core);
 for(const h of [-20,18,54]){ring(h,25,3,bronze);ring(h+5,18,2,ceramic);}
 for(const x of [578,622])for(const z of [390,440]){
  box(x,12,z,5,92,6,steel);box(x,37,z,8,12,9,ceramic);
 }
 role('connections');
 // Local return trunks connect the heads beneath the exposed ring stack.
 for(const x of [496,524]){pipe([x,-26,394],[x,-26,430],4,steel);pipe([x,-26,430],[580,-26,430],4,steel);}
 for(const x of [673,690,707]){pipe([x,0,400],[x,0,450],3,bronze);pipe([x,0,450],[620,0,450],3,bronze);}
 pipe([600,-18,480],[600,-18,460],6,steel);
 root.userData.overloadDraftRoles=root.children.slice(0,4).map(o=>o.name);
 return root;
}

/** Release input geometry after flattening. One owned mesh per material. */
export function batchOverloadDraft(root:T.Group){
 root.updateMatrixWorld(true);const buckets=new Map<T.Material,T.BufferGeometry[]>();
 root.traverse(o=>{if(o instanceof T.Mesh){const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(o.matrixWorld);const m=o.material as T.Material;const list=buckets.get(m)??[];list.push(g);buckets.set(m,list);o.geometry.dispose();}});
 const result=new T.Group();result.name=root.name;result.userData={...root.userData};
 for(const [material,parts] of buckets){const geometry=mergeGeometries(parts)!;geometry.userData.environmentUV=true;parts.forEach(g=>g.dispose());const mesh=new T.Mesh(geometry,material);mesh.userData.bakedEnvironment=true;mesh.castShadow=mesh.receiveShadow=true;result.add(mesh);}
 root.clear();return result;
}
