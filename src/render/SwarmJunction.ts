import * as T from 'three';
import {SWARM_ORGAN} from '../game/world/swarmJunctionLayout';
import type {Point} from '../game/roguelike/types';

const U=32;
type XY=readonly [number,number];
/** Room16 stage2 blockout. Game-unit dimensions; no animation, lights or gameplay. */
export function swarmJunctionBlockout(){
 const root=new T.Group();root.name='swarm-junction-rough';
 const material=(name:string,color:number,metalness:number)=>{
  const m=new T.MeshStandardMaterial({color,metalness,roughness:.8,emissiveIntensity:0});
  m.name=`swarm-${name}`;m.userData.actorMaterial=true;return m;
 };
 const chitin=material('charcoal',0x303735,.15),rib=material('bone-grey',0xa1a599,.15),
  tendon=material('tendon',0x63504a,.05),metal=material('human-metal',0x4f646b,.6),
  dark=material('recess',0x101715,.05),mark=material('direction',0xb2ac89,.2);
 const add=(name:string,g:T.BufferGeometry,m:T.Material,solid=true)=>{
  // The production bake releases these uncached source geometries. disposeModel
  // releases the baked geometry and owned materials on room change or shutdown.
  g.userData.environmentUV=true;
  const mesh=new T.Mesh(g,m);mesh.name=name;mesh.userData.swarmSolid=solid;
  mesh.castShadow=solid;mesh.receiveShadow=true;root.add(mesh);return mesh;
 };
 const slab=(name:string,points:readonly Point[],bottom:number,height:number,m:T.Material,solid=true)=>{
  const shape=new T.Shape(points.map(p=>new T.Vector2(p.x/U,-p.y/U)));
  const g=new T.ExtrudeGeometry(shape,{depth:height/U,bevelEnabled:false,steps:1});
  g.rotateX(-Math.PI/2);g.translate(0,bottom/U,0);return add(name,g,m,solid);
 };
 const poly=(name:string,p:readonly XY[],bottom:number,height:number,m:T.Material,solid=true)=>slab(name,p.map(([x,y])=>({x,y})),bottom,height,m,solid);
 const box=(name:string,x:number,y:number,w:number,d:number,bottom:number,height:number,m:T.Material,solid=true)=>poly(name,[[x,y],[x+w,y],[x+w,y+d],[x,y+d]],bottom,height,m,solid);
 const mix=(a:XY,b:XY,t:number):XY=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
 // The sealed footprint blocks shots, so its body reaches the .95m fallback
 // projectile plane everywhere. Upper fittings stay below 1.4m overall.
 slab('organ-bed',SWARM_ORGAN,0,32,tendon);
 // Broad overlapping plates follow each root. Exposed bands are rough rib beds,
 // not repetitive nodules. Each root terminates in its own pale severed face.
 const arm=(name:string,a:XY,b:XY,c:XY,d:XY)=>{
  for(let i=0;i<4;i++){
   const t=i/4,end=(i+1)/4;
   poly(`${name}-rib-${i}`,[mix(a,c,t),mix(b,d,t),mix(b,d,end),mix(a,c,end)],32,3,rib);
   poly(`${name}-plate-${i}`,[mix(a,c,t+.025),mix(b,d,t+.025),mix(b,d,end-.035),mix(a,c,end-.035)],35,3.5+i,chitin);
  }
  poly(`${name}-cut`,[a,b,mix(b,d,.045),mix(a,c,.045)],32,5,rib);
  // Broken metal saddle below the growth, with a visible dark interruption.
  poly(`${name}-saddle`,[mix(a,c,.12),mix(b,d,.12),mix(b,d,.17),mix(a,c,.17)],32,7,metal);
 };
 arm('root-west',[370,130],[415,115],[515,255],[550,210]);
 arm('root-east',[785,115],[830,130],[650,210],[685,255]);
 arm('root-south',[575,370],[625,370],[575,310],[625,310]);
 // Torn low rectangular distributor still frames the central routing recess.
 box('severed-distributor',576,226,12,60,32,10.5,metal);
 box('distributor-east',616,226,10,56,32,9,metal);
 box('distributor-front-left',584,278,15,12,32,9,metal);
 box('distributor-front-right',607,278,11,12,32,6.5,metal);
 poly('torn-distributor-lid',[[582,225],[586,211],[613,211],[620,226]],32,12.5,metal);
 box('sensory-recess',588,231,28,43,32,.5,dark);
 poly('organ-west-shoulder',[[550,235],[576,226],[576,285],[556,279]],32,10,chitin);
 poly('organ-east-shoulder',[[626,226],[650,235],[644,279],[626,285]],32,10,chitin);
 poly('organ-south-socket',[[580,291],[620,291],[622,310],[578,310]],32,8,chitin);
 // Six flush segments reproduce the layout's service paths. They do not add solids.
 const runs:readonly (readonly XY[])[]=[[[330,90],[400,135],[550,250]],[[870,90],[800,135],[650,250]],[[600,620],[600,370],[600,280]]];
 for(const [i,run] of runs.entries())for(let j=1;j<run.length;j++){
  const [a,b]=[run[j-1],run[j]],length=Math.hypot(b[0]-a[0],b[1]-a[1]),dx=-(b[1]-a[1])/length*3,dy=(b[0]-a[0])/length*3;
  const m=poly(`flush-service-${i}-${j}`,[[a[0]+dx,a[1]+dy],[b[0]+dx,b[1]+dy],[b[0]-dx,b[1]-dy],[a[0]-dx,a[1]-dy]],.07,.04,metal,false);m.userData.swarmService=true;
 }
 // Far-wall gantry uses a rough right arrow instead of tiny text. The broken
 // end and wall-fixed supports stay within the reserved y12..32 dressing band.
 poly('directional-gantry',[[450,12],[710,12],[717,17],[708,21],[717,28],[706,32],[450,32]],51,16,metal,false);
 box('gantry-wall-support',458,12,10,12,0,51,metal,false);
 box('gantry-end-support',734,12,10,12,0,42,metal,false);
 poly('gantry-right-arrow',[[632,15],[680,15],[680,13],[701,22],[680,30],[680,27],[632,27]],67,.6,mark,false);
 poly('gantry-broken-end',[[738,12],[750,12],[750,32],[731,32],[738,27],[732,19]],42,12,metal,false);
 // Retain the generic rear bulkhead envelope, without random infestation nodules.
 for(let x=2;x<37.5;x+=4){
  const width=Math.min(3.96,37.5-x+2)*U;
  box('retained-rear-bulkhead',x*U-width/2,-.575*U,width,.35*U,0,2.65*U,metal,false);
  box('retained-rear-rib',(x-.15)*U,-.24*U,.3*U,.22*U,0,2.65*U,metal,false);
 }
 return root;
}
