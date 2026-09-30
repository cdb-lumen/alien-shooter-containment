import * as T from 'three';
import {box,rod,ring} from './meshParts';
import type {Footprint} from './ShipEnvironments';

/** Room12 draft equipment only. Collision and all story behavior remain authoritative elsewhere. */
export function safetyInterlockBlockout(footprint:Footprint,index:number):T.Group{
 const root=new T.Group(),cell=new T.Group();root.add(cell);
 const palette=(name:string,color:number,metalness:number,roughness:number,emissive=0)=>{
  const m=new T.MeshStandardMaterial({color,metalness,roughness,emissive,emissiveIntensity:emissive?.35:0});m.name=`room12-${name}`;m.userData.actorMaterial=true;return m;
 };
 const ivory=palette('ivory',0xc9c0a3,.12,.72),copper=palette('dark-copper',0x654432,.65,.49),orange=palette('muted-orange',0x986346,.25,.7),dark=palette('socket',0x172326,.15,.85),steel=palette('housing',0x465354,.55,.64),lamp=palette('local-light',0xd2ba7e,.1,.6,0xc8a361);
 const b=(name:string,x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material)=>{const mesh=box(cell,x,y,z,w,h,d,m,.035);mesh.name=name;return mesh;};
 const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
 const role=index%3;
 if(role===0){
  root.name='safety-recorder';
  b('sealed-base',0,.15,0,4.8,.3,4.15,ivory);
  b('recorder-body',0,.72,-.13,4.35,1.14,3.5,ivory);
  // A dark gasket seats the inspection opening. The exposed tape path and
  // concentric reel layers remain readable without transparent sorting layers.
  b('inspection-gasket',-.2,1.305,-.05,3.72,.07,2.55,steel);
  b('inspection-window',-.2,1.35,-.05,3.35,.035,2.27,dark);
  for(const [name,x] of [['left',-1.02],['right',.64]] as const){
   const spool=new T.Group();spool.name=`record-spool-${name}`;cell.add(spool);
   rod(spool,v(x,1.37,-.16),v(x,1.52,-.16),.64,.64,copper);
   for(const y of [1.39,1.52]){const rim=ring(spool,x,y,-.16,.65,.055,ivory);rim.rotation.x=Math.PI/2;}
   const winding=ring(spool,x,1.525,-.16,.43,.035,dark);winding.rotation.x=Math.PI/2;
   rod(spool,v(x,1.37,-.16),v(x,1.59,-.16),.13,.13,steel);
  }
  b('record-tape-span',-.19,1.48,.49,1.66,.075,.07,copper);
  for(const x of [-1.02,.64])rod(cell,v(x,1.37,.65),v(x,1.56,.65),.09,.09,ivory);
  for(const x of [-1.98,1.59])b('window-rim',x,1.4,-.05,.14,.22,2.7,ivory);
  for(const z of [-1.38,1.28])b('window-rim',-.2,1.4,z,3.7,.22,.14,ivory);
  b('timestamp-sill',-.2,1.28,1.7,3.7,.24,.7,ivory);
  b('timestamp-plate',-.3,1.43,1.69,3.15,.08,.59,copper);
  const lines=['LOCAL RECORD','BEFORE AWAKENING'];
  const legendMaterial=ivory;
  if(typeof document!=='undefined'){
   const canvas=document.createElement('canvas');canvas.width=768;canvas.height=160;
   const context=canvas.getContext('2d');
   if(context){
    context.fillStyle='#c6b18b';context.fillRect(0,0,768,160);
    context.fillStyle='#242c2b';context.font='bold 54px monospace';context.textAlign='center';context.textBaseline='middle';
    lines.forEach((line,i)=>context.fillText(line,384,42+i*76));
    // Neutral swatch preserves the original ivory color on every non-label face.
    context.fillStyle='#ffffff';context.fillRect(0,0,16,16);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
    texture.generateMipmaps=false;texture.minFilter=T.LinearFilter;
    legendMaterial.map=texture;legendMaterial.addEventListener('dispose',()=>texture.dispose());
   }
  }
  const legend=new T.Mesh(new T.PlaneGeometry(2.96,.52),legendMaterial);
  legend.name='timestamp-legend';legend.userData.lines=lines;legend.rotation.x=-Math.PI/2;legend.position.set(-.3,1.475,1.69);cell.add(legend);
  b('seal-strap',1.47,1.44,1.63,.15,.1,.79,orange);
  b('seal',1.47,1.52,1.88,.28,.1,.22,copper);
  const lever=rod(cell,v(1.99,1.05,.65),v(1.99,1.8,1.06),.085,.085,copper);lever.name='manual-test-lever';
  b('lever-grip',1.99,1.82,1.06,.42,.18,.23,orange);
  b('steady-local-lamp',-1.85,1.35,1.7,.2,.12,.23,lamp);
  cell.traverse(o=>{
   if(o instanceof T.Mesh&&o.material===ivory&&o!==legend){
    // meshParts geometry is shared across rooms. Only remap owned copies.
    o.geometry=o.geometry.clone();const uv=o.geometry.getAttribute('uv');
    for(let i=0;i<uv.count;i++)uv.setXY(i,8/768,1-8/160);
    uv.needsUpdate=true;
   }
  });
 }else if(role===1){
  root.name='disconnected-ai-housing';
  b('housing-base',0,.15,0,4.8,.3,4.15,steel);
  b('ai-housing',0,1.02,-.4,4.25,1.74,2.9,steel);
  b('dark-status-panel',0,1.92,-.4,2.9,.09,1.9,dark);
  for(const x of [-1.5,0,1.5])b('housing-rib',x,1.12,-.48,.12,1.6,3.1,copper);
  b('socket-board',0,.74,1.36,3.5,.94,.32,orange);
  for(const [name,x] of [['left',-.86],['right',.86]] as const){
   b(`empty-socket-${name}`,x,.79,1.55,.92,.59,.06,dark);
   const mouth=ring(cell,x,.79,1.61,.31,.07,steel);mouth.name=`socket-rim-${name}`;
  }
 }else{
  root.name='split-contactor-battery';
  b('island-base',0,.15,0,7.25,.3,3.5,steel);
  for(const x of [-2.5,.22]){
   b('ceramic-support',x,.53,0,1.68,.76,2.65,ivory);
   for(const z of [-.83,.83])b('insulator-rib',x,.94,z,1.85,.14,.28,ivory);
  }
  b('contactor-left',-2.06,1.12,0,2.35,.28,1.32,copper);
  b('contactor-right',.82,1.12,0,2.35,.28,1.32,copper);
  b('open-jaw-tip',-.93,1.29,0,.12,.22,1.32,orange);
  b('open-jaw-tip',-.31,1.29,0,.12,.22,1.32,orange);
  const battery=rod(cell,v(2.72,.3,0),v(2.72,1.72,0),.59,.59,ivory);battery.name='local-battery';
  for(const y of [.46,1.46]){const collar=ring(cell,2.72,y,0,.61,.08,orange);collar.rotation.x=Math.PI/2;}
  b('battery-terminal',2.72,1.8,0,.28,.16,.28,copper);
 }
 // Fit actual vertex bounds for both canonical and generic test footprints.
 cell.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(cell,true),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
 cell.scale.set(footprint.width*.97/size.x,Math.min(1,footprint.width/size.x,footprint.height/size.z),footprint.height*.97/size.z);
 cell.position.set(-center.x*cell.scale.x,-bounds.min.y*cell.scale.y,-center.z*cell.scale.z);
 root.position.set(footprint.x+footprint.width/2,0,footprint.y+footprint.height/2);root.userData.footprint={...footprint};
 return root;
}
