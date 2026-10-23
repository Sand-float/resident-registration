/* Centralized audio templates; no scene code should instantiate Audio directly. */
const SoundFX=(()=>{
 const paths=Object.freeze({message:'game/audio/message.wav',retract:'game/audio/retract.wav',clue:'game/audio/clue.wav',confirm:'game/audio/confirm.wav',anomaly:'game/audio/anomaly.wav',door:'game/audio/door.wav'});
 const pool=new Map();let unlocked=false,last={};
 let muted=false;try{muted=localStorage.getItem('resident_sfx_muted_v1')==='1'}catch(e){}
 function warm(){unlocked=true;for(const [id,src]of Object.entries(paths)){if(pool.has(id))continue;const a=new Audio(src);a.preload='auto';a.volume=id==='message'?.40:id==='anomaly'?.45:.34;pool.set(id,a);}}
 function play(id){if(!paths[id]||muted||!unlocked)return;const now=Date.now();if(now-(last[id]||0)<220)return;last[id]=now;const original=pool.get(id);if(!original)return;try{const a=original.cloneNode(true);a.volume=original.volume;const promise=a.play();if(promise&&promise.catch)promise.catch(()=>{});}catch(e){}}
 function toggle(){muted=!muted;try{localStorage.setItem('resident_sfx_muted_v1',muted?'1':'0')}catch(e){}if(!muted){warm();play('confirm')}return !muted}
 window.addEventListener('pointerdown',warm,{once:true,passive:true});window.addEventListener('keydown',warm,{once:true});
 return Object.freeze({play,warm,toggle,enabled:()=>!muted,types:Object.keys(paths)});
})();
