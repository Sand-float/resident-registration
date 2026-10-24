/* Low-latency, one-shot sound engine. Backgrounded sounds are discarded, never queued. */
const SoundFX=(()=>{
 const paths=Object.freeze({message:'game/audio/message.wav',retract:'game/audio/retract.wav',clue:'game/audio/clue.wav',confirm:'game/audio/confirm.wav',anomaly:'game/audio/anomaly.wav',door:'game/audio/door.wav',footsteps:'game/audio/footsteps.wav',repair:'game/audio/repair.wav',latch:'game/audio/latch.wav',open:'game/audio/open.wav',shutter:'game/audio/shutter.wav',door_slide:'game/audio/door_slide.wav'});
 const volume={message:.30,retract:.21,clue:.33,anomaly:.28,footsteps:.29,repair:.48,latch:.60,door_slide:.53,shutter:.45,confirm:.15,door:.3,open:.3};
 const buffers=new Map(),raw=new Map(),playing=new Set(),last={};
 let context=null,muted=false,visible=!document.hidden,fetchStarted=false;
 try{muted=localStorage.getItem('resident_sfx_muted_v1')==='1'}catch(e){}
 const Ctx=window.AudioContext||window.webkitAudioContext;
 function preload(){
  if(fetchStarted)return;fetchStarted=true;
  for(const [key,path]of Object.entries(paths)){
   fetch(path).then(r=>{if(!r.ok)throw Error('audio '+r.status);return r.arrayBuffer()})
    .then(buf=>{raw.set(key,buf);if(context)decode(key,buf)}).catch(()=>{});
  }
 }
 function decode(key,data){
  if(!context||buffers.has(key))return;
  context.decodeAudioData(data.slice(0)).then(b=>{buffers.set(key,b)}).catch(()=>{});
 }
 function warm(){
  if(document.hidden)return;
  preload();if(!Ctx)return;
  if(!context){context=new Ctx();for(const [k,v]of raw)decode(k,v)}
  if(context.state==='suspended')context.resume().catch(()=>{});
 }
 function stop(){for(const s of [...playing]){try{s.stop(0)}catch(e){} }playing.clear()}
 function play(id, volumeMultiplier=1){
  // Do not return a deferred promise that might resume later with a stale sound.
  if(muted||!visible||document.hidden||!buffers.has(id)||!context||context.state!=='running')return;
  const now=performance.now();if(now-(last[id]||-10000)<170)return;last[id]=now;
  const src=context.createBufferSource(),gain=context.createGain();
  src.buffer=buffers.get(id);gain.gain.value=(volume[id]??.3)*Math.max(0,Math.min(1,volumeMultiplier));
  src.connect(gain);gain.connect(context.destination);playing.add(src);
  src.onended=()=>{playing.delete(src);src.disconnect();gain.disconnect()};
  try{src.start(0)}catch(e){playing.delete(src)}
 }
 function toggle(){muted=!muted;try{localStorage.setItem('resident_sfx_muted_v1',muted?'1':'0')}catch(e){}if(muted)stop();else warm();return !muted}
 document.addEventListener('visibilitychange',()=>{visible=!document.hidden;if(!visible)stop();});
 window.addEventListener('pagehide',stop);
 window.addEventListener('pointerdown',warm,{passive:true});window.addEventListener('keydown',warm);
 // Begin prefetching before the first click. A click may only play decoded sounds.
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',preload,{once:true});else preload();
 return Object.freeze({play,stop,warm,toggle,enabled:()=>!muted,types:Object.keys(paths)});
})();
