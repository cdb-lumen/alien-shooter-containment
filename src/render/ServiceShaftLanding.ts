import * as T from 'three';
import type {RoomTemplate,Point} from '../game/roguelike/types';

const U=32;
/** Room14 rough models only. All dimensions are game units. The template owns
 * the floor cutout and collision; machinery and edge protection stay inside it. */
export function serviceShaftLanding(t:RoomTemplate):T.Group{
 const root=new T.Group();root.name='service-shaft-landing-blockout';
 const material=(name:string,color:number,metalness=.45,emissive=0)=>{
  const m=new T.MeshStandardMaterial({name:`shaft-${name}`,color,metalness,roughness:.72,emissive,emissiveIntensity:emissive?.35:0});m.userData.actorMaterial=true;return m;
 };
 const steel=material('steel',0x52616a),zinc=material('zinc',0x9aa8aa),dark=material('depth',0x202e3a,.25),deck=material('deck',0x657477,.25),amber=material('amber',0xcb9552,.35,0x7a481d),fiber=material('fiber',0x75acb5,.2);
 const group=(name:string)=>{const g=new T.Group();g.name=name;root.add(g);return g;};
 const mesh=(g:T.Group,geometry:T.BufferGeometry,m:T.Material)=>{
  // bakeWorld consumes this room-owned geometry, unlike the shared mesh cache.
  geometry.userData.environmentUV=true;
  const o=new T.Mesh(geometry,m);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;
 };
 const box=(g:T.Group,x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material)=>{const o=mesh(g,new T.BoxGeometry(w/U,h/U,d/U),m);o.position.set(x/U,y/U,z/U);return o;};
 const beam=(g:T.Group,a:number[],b:number[],radius:number,m:T.Material)=>{
  const p=new T.Vector3(...a.map(n=>n/U) as [number,number,number]),q=new T.Vector3(...b.map(n=>n/U) as [number,number,number]);
  const o=mesh(g,new T.CylinderGeometry(radius/U,radius/U,p.distanceTo(q),8),m);o.position.copy(p).add(q).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),q.sub(p).normalize());return o;
 };
 const path=(points:readonly Point[])=>points.map(p=>new T.Vector2(p.x/U,-p.y/U));
 const outline=t.boundary??[{x:0,y:0},{x:t.width,y:0},{x:t.width,y:t.height},{x:0,y:t.height}];
 const floorShape=new T.Shape(path(outline));for(const hole of t.voids??[])floorShape.holes.push(new T.Path(path(hole)));
 const floor=mesh(group('connected-balcony'),new T.ExtrudeGeometry(floorShape,{depth:12/U,bevelEnabled:false,steps:1}),deck);floor.rotation.x=-Math.PI/2;floor.position.y=-12/U;
 const curb=group('shaft-curbs'),depth=group('shaft-depth');
 for(const hole of t.voids??[]){
  const bottom=mesh(depth,new T.ShapeGeometry(new T.Shape(path(hole))),dark);bottom.rotation.x=-Math.PI/2;bottom.position.y=-150/U;
  for(let i=0;i<hole.length;i++){
   const a=hole[i],b=hole[(i+1)%hole.length];
   // Clockwise plan polygons have their solid interior to the right. Inset
   // every curb and post so no visually blocked space is legal walking floor.
   const dx=b.x-a.x,dz=b.y-a.y,length=Math.hypot(dx,dz),nx=-dz/length,nz=dx/length;
   const x=(a.x+b.x)/2+nx*7,z=(a.y+b.y)/2+nz*7;
   const horizontal=dz===0;
   box(curb,x,5,z,horizontal?length-16:12,10,horizontal?12:length-16,steel);
   box(depth,x,-76,z,horizontal?length-16:8,136,horizontal?8:length-16,steel);
   const posts=Math.floor(length/110);
   for(let j=0;j<posts;j++){
    const s=(j+.5)/posts,px=a.x+dx*s+nx*8,pz=a.y+dz*s+nz*8;
    box(curb,px,19,pz,8,28,8,zinc);
    box(curb,px,34,pz,12,3,12,amber);
   }
  }
 }
 const guides=group('guides'),weight=group('counterweight'),sheaves=group('sheaves'),bracing=group('bracing');
 // Recessed stacked weight between a single pair of lift guides, not a rack.
 box(weight,580,-49,430,124,116,92,steel);
 for(const y of [-94,-69,-44,-19])box(weight,580,y,478,118,18,5,zinc);
 for(const x of [478,682]){
  box(guides,x,-17,430,13,232,20,zinc);
  box(guides,x,-17,439,24,232,6,steel);
  for(const y of [-80,12]){
   box(guides,x+(x<580?18:-18),y,430,27,20,29,steel);
   const roller=mesh(guides,new T.CylinderGeometry(9/U,9/U,10/U,12),amber);roller.rotation.x=Math.PI/2;roller.position.set(x/U,y/U,445/U);
  }
  const pulley=mesh(sheaves,new T.TorusGeometry(22/U,5/U,8,20),zinc);pulley.position.set(x/U,99/U,430/U);
  beam(sheaves,[x-26,99,430],[x+26,99,430],4,steel);
  beam(sheaves,[x-19,-126,430],[x-19,97,430],2,dark);
  beam(sheaves,[x+19,-126,430],[x+19,97,430],2,dark);
 }
 box(guides,580,69,430,228,16,28,steel);
 for(const z of [322,530]){
  beam(bracing,[470,-128,z],[690,-22,z],6,zinc);beam(bracing,[690,-128,z],[470,-22,z],6,zinc);
  for(const x of [470,690])beam(bracing,[x,-132,z],[x,-8,z],7,steel);
 }
 const local=group('local-junction');
 box(local,359,-10,405,34,80,44,steel);box(local,359,33,405,36,6,46,amber);
 // West working face: mechanical call plate. No invented reconnect interaction.
 box(local,341.5,17,393,2,21,16,zinc);box(local,340.8,17,393,1,8,8,dark);
 // Empty socket and a visibly pulled fiber plug, separated by an air gap.
 box(local,349,38,409,11,4,11,dark);
 box(local,371,38,418,9,5,12,fiber);
 beam(local,[374,36,423],[376,18,426],2,fiber);
 beam(local,[376,18,426],[376,-15,426],2,fiber);
 // Sign remains on the solid side. Canvas is room-local and disposed with it.
 box(local,434,9,350,172,12,32,steel);
 if(typeof document!=='undefined'){
  const c=document.createElement('canvas');c.width=1024;c.height=128;const ctx=c.getContext('2d');
  if(ctx){ctx.fillStyle='#27343b';ctx.fillRect(0,0,1024,128);ctx.fillStyle='#e6ba79';ctx.font='bold 72px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('LOCAL ACCESS ONLY',512,66,1000);
   const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;
   const m=new T.MeshStandardMaterial({map:texture,roughness:.8});m.userData.actorMaterial=true;m.addEventListener('dispose',()=>texture.dispose());
   const sign=mesh(local,new T.PlaneGeometry(168/U,27/U),m);sign.rotation.x=-Math.PI/2;sign.position.set(434/U,15.1/U,350/U);
  }
 }
 const shell=group('outer-shell');
 box(shell,600,22,-6,1200,68,12,steel);
 for(const x of [0,1200])box(shell,x,8,440,10,28,880,steel);
 box(shell,600,4,886,1200,20,12,steel);
 // Sparse flush tread bands on the two arms, never across the shaft.
 for(const z of [140,740])for(let x=72;x<1160;x+=24)box(shell,x,.1,z,3,.2,70,zinc);
 return root;
}
