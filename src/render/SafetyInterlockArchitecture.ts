import * as T from 'three';
import {box,rod} from './meshParts';

/** Room12 only: flush deck finish and outboard insulation, never new collision. */
export function safetyInterlockArchitecture(parent:T.Group,w:number,h:number){
 const shell=new T.Group();shell.name='room12-insulated-shell';parent.add(shell);
 const material=(name:string,color:number,metalness:number,roughness:number)=>{
  const m=new T.MeshStandardMaterial({color,metalness,roughness});m.name=`room12-shell-${name}`;m.userData.actorMaterial=true;return m;
 };
 const ceramic=material('ceramic',0xaaa48e,.08,.86),metal=material('steel',0x354246,.55,.72),copper=material('copper',0x624633,.65,.55),orange=material('worn-safety',0x946044,.15,.9),dark=material('recess',0x172123,.1,.95);
 const b=(name:string,x:number,y:number,z:number,width:number,height:number,depth:number,m:T.Material)=>{const mesh=box(shell,x,y,z,width,height,depth,m,.025);mesh.name=name;return mesh;};
 // Large insulated rear panels, with a continuous grounded sill. All raised
 // geometry stays outside z=0 so the canonical north bypass stays untouched.
 b('rear-sill',w/2,.16,-.4,w,.32,.65,metal);
 for(let x=2;x<w;x+=4){
  const width=Math.min(3.84,w-x+1.9);
  b('ceramic-wall-panel',x,1.48,-.48,width,2.55,.36,ceramic);
  b('recessed-service-band',x,1.2,-.265,width-.22,.57,.055,dark);
  b('panel-foot',x,.42,-.19,width-.3,.12,.22,metal);
  for(const dx of [-width/2+.16,width/2-.16])b('panel-clamp',x+dx,1.5,-.2,.14,2.2,.12,metal);
 }
 // Two independently terminated runs. No cosmetic wire reconnects the recorder
 // and AI equipment across the center break.
 for(const [a,z] of [[.6,w*.43],[w*.57,w-.6]]){
  rod(shell,new T.Vector3(a,2.45,-.16),new T.Vector3(z,2.45,-.16),.075,.075,copper);
  for(const x of [a,z])b('ceramic-termination',x,2.45,-.17,.22,.34,.28,ceramic);
 }
 b('room12-isolation-break',w/2,1.2,-.225,1.8,.57,.035,orange);
 // Narrow flush service channels stay at the perimeter; the main deck remains
 // quiet and open rather than acquiring detached equipment pads or boxes.
 const deck=new T.Group();deck.name='room12-service-deck';shell.add(deck);
 const inlay=(name:string,x:number,z:number,width:number,depth:number,m:T.Material)=>{const mesh=box(deck,x,.006,z,width,.012,depth,m,0);mesh.name=name;mesh.castShadow=false;};
 for(const z of [1.75,h-1.75]){
  inlay('service-channel',w/2,z,w-2,.52,metal);
  for(let x=1.2;x<w-1;x+=.42)inlay('channel-slot',x,z,.065,.36,dark);
 }
 // Short worn approach stripes belong to existing equipment, not new zones.
 for(const [x,z,width] of [[w*410/1200,h*380/880,4.5],[w*780/1200,h*380/880,4.5],[w*.5,h*735/880,6.8]]){
  for(const side of [-1,1])inlay('equipment-approach-mark',x+side*width*.36,z,width*.24,.075,orange);
 }
}
