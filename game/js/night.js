/* 住户登记 · 第一夜。所有关键线索必须在真实手机 App 中被玩家看到。 */
const NIGHT_LIN_MESSAGE='今天翻以前的维修单，看到三栋302的门牌好像一直没修好。要是还松着，记得在物业服务里留个报修，别自己粘。';
const NIGHT_EVIDENCE={
 group:{source:'微信 · 业主群',title:'不在名单里的发言者',text:'发出门牌通知的黑头像不在群成员名单里。其他住户也注意到了。'},
 notice:{source:'微信 · 业主群',title:'物业否认的通知',text:'小林在群里否认发布过门牌核验通知。'},
 lin:{source:'微信 · 小林',title:'不合时宜的提醒',text:'小林深夜忽然提到报修记录，随即撤回。'},
 repair:{source:'物业服务 · 报事报修',title:'门牌报修单',text:'302 门牌只剩一颗螺丝固定，其余三个固定点已经松脱。我提交了门牌维修工单。'},
 oldticket:{source:'物业服务 · 历史工单',title:'短暂出现的历史工单',text:'物业服务中闪过一张更早的 302 室工单，联系人姓林。重新打开后却找不到了。'},
 access:{source:'物业服务 · 门禁记录',title:'异常门禁记录',text:'门禁记录显示，昨日深夜三栋有一次「未识别进入」，来源标注为未登记设备。'},
 body:{source:'手机桌面',title:'自行出现的应用',text:'手机桌面多出了「身体状态」，里面记录了个人信息和身体数据。'},
 archive:{source:'物业服务 · 历史记录',title:'有意被隐藏的记录',text:'302 室一张旧工单一闪而过。它没有出现在可查询的工单列表里。'}
};
function nightRecordEvidence(id){
 if(!NIGHT_EVIDENCE[id])return;
 state.investigation=state.investigation||{};
 // 永久以线索 ID 去重；同一事件的重入/重绘不重复提示。
 if(state.investigation[id])return;
 state.investigation[id]=Date.now();
 state.clues=(Number(state.clues)||0)+1;
 if(typeof SoundFX!=='undefined')SoundFX.play('clue');
 store();
 if(typeof notify==='function')notify('获得线索：'+NIGHT_EVIDENCE[id].title);
}
function rrMigrateRemovedEvidence(){
 state.investigation=state.investigation||{};
 let changed=false;
 if(state.investigation.hallway){delete state.investigation.hallway;changed=true}
 // 旧版把线索拆成两条，且在仅仅打开私聊时就错误地收录了 lin。
 if(state.investigation.retract){
  if(state.nightLinMessage===2&&!state.investigation.lin)state.investigation.lin=state.investigation.retract;
  delete state.investigation.retract;changed=true;
 }
 if(state.nightLinMessage!==2&&state.investigation.lin){delete state.investigation.lin;changed=true}
 if(changed)store();
}
function nightInvestigationEntries(){
 rrMigrateRemovedEvidence();
 if(state.accessCluePromptedV6&&!state.investigation?.access){state.investigation=state.investigation||{};state.investigation.access=Date.now();store()}
 const found=[];
 if(state.checked||state.seenAnnouncement){if(state.checked)found.push(NIGHT_EVIDENCE.group);if(state.seenAnnouncement)found.push(NIGHT_EVIDENCE.notice)}
 for(const [id,e] of Object.entries(NIGHT_EVIDENCE)){if(!['group','notice'].includes(id)&&state.investigation?.[id])found.push(e)}
 return found;
}
const nightTimers={};
function nightCancelTimers(){for(const k of Object.keys(nightTimers)){clearTimeout(nightTimers[k]);delete nightTimers[k]}}
function nightSchedule(key,deadline,cb){
 if(nightTimers[key])return;
 nightTimers[key]=setTimeout(()=>{delete nightTimers[key];cb()},Math.max(45,deadline-Date.now()));
}
function nightNoticeArrives(){
 if(state.nightChoice!=='browse'||state.nightPhase!=='waiting'||state.storyEnding)return;
 state.nightPhase='message';state.nightLinMessage=1;state.nightLinIssuedAt=Date.now();store();
 if(state.page!=='direct-chat'||state.dmPerson!=='小林')banner(NIGHT_LIN_MESSAGE,'小林','direct-chat');
 if(state.page==='home'||state.page==='wechat'||state.page==='direct-chat')render();
}
// 按实际停留在小林私聊页面的累计时长计算撤回；离开页面和切后台均暂停。
const NIGHT_LIN_VIEW_MS=10600; // 较上一版 11500 ms 仅缩短 0.9 秒
function nightLinWatching(){return state.page==='direct-chat'&&state.dmPerson==='小林'&&!document.hidden&&state.nightChoice==='browse'&&state.nightLinMessage===1&&!state.storyEnding}
function nightPauseLinView(){
 if(nightTimers.retract){clearTimeout(nightTimers.retract);delete nightTimers.retract}
 if(state.nightLinActiveSince){
  state.nightLinViewedMs=(Number(state.nightLinViewedMs)||0)+Math.max(0,Date.now()-Number(state.nightLinActiveSince));
  state.nightLinActiveSince=0;store();
 }
}
function nightResumeLinView(){
 if(!nightLinWatching())return;
 if(!state.nightLinOpenedAt)state.nightLinOpenedAt=Date.now();
 if(!state.nightLinActiveSince)state.nightLinActiveSince=Date.now();
 store();scheduleNightEvents();
}
function nightRetractMessage(){
 if(!nightLinWatching()||!state.nightLinActiveSince)return;
 const elapsed=(Number(state.nightLinViewedMs)||0)+Date.now()-Number(state.nightLinActiveSince);
 if(elapsed<NIGHT_LIN_VIEW_MS){scheduleNightEvents();return}
 nightPauseLinView();
 state.nightLinMessage=2;
 if(typeof SoundFX!=='undefined')SoundFX.play('retract');
 nightRecordEvidence('lin');
 store();render();
}
document.addEventListener('visibilitychange',()=>{
 if(document.hidden)nightPauseLinView();
 else if(typeof state!=='undefined')nightResumeLinView();
});
function nightLinReply(){
 if(state.nightChoice!=='browse'||state.nightLinAsk!==1||state.storyEnding)return;
 state.nightLinAsk=2;store();
 if(state.page==='direct-chat'&&state.dmPerson==='小林')render();
 else banner('我也不太确定，可能是之前的记录弄混了。你先不用管。','小林','direct-chat');
}
function nightRepairProcess(){
 if(state.nightRepairStatus!=='pending'||state.nightChoice!=='browse')return;
 state.nightRepairStatus='accepted';nightRecordEvidence('repair');store();
 if(state.page==='repairs'||state.page==='property'||state.page==='home')render();
 if(state.page!=='repairs')banner('【报修进度】门牌标识 · 已受理，等待维修','物业服务','repairs');
}
function scheduleNightEvents(){
 if(state.storyEnding||state.nightChoice!=='browse'){nightCancelTimers();return}
 if(state.nightPhase==='waiting')nightSchedule('issue',Number(state.nightStep)||Date.now()+2100,nightNoticeArrives);
 if(nightLinWatching()&&state.nightLinActiveSince)nightSchedule('retract',Date.now()+Math.max(0,NIGHT_LIN_VIEW_MS-(Number(state.nightLinViewedMs)||0)-(Date.now()-Number(state.nightLinActiveSince))),nightRetractMessage);
 if(state.nightLinAsk===1&&state.nightLinAskAt)nightSchedule('reply',Number(state.nightLinAskAt)+Math.max(1500,Number(state.messageSpeed)||2200),nightLinReply);
 if(state.nightRepairStatus==='pending'&&state.nightRepairAt)nightSchedule('repair',Number(state.nightRepairAt)+2300,nightRepairProcess);
}
function nightOnNavigate(page){
 if(state.nightChoice!=='browse'||state.storyEnding)return;
 if(page==='direct-chat'&&state.dmPerson==='小林'&&state.nightLinMessage===1)nightResumeLinView();
}
function nightLinChatFooter(){
 if(state.nightChoice!=='browse'||state.dmPerson!=='小林')return '<div class="chat-compose dm-compose"><span>⊕</span><input disabled placeholder="当前没有可发送的消息"/><span>☺</span></div>';
 if(state.nightLinMessage<2)return '<div class="chat-compose dm-compose"><span>⊕</span><input disabled placeholder="没有可以发送的消息"/><span>☺</span></div>';
 if(state.nightLinAsk===0)return `<div class="reply-area d1-reply-area"><div class="reply-hint">小林撤回了一条消息。</div><button class="reply-option" onclick="nightAskLin(true)">小林，刚才那句话是什么意思？</button><button class="reply-option" onclick="nightAskLin(false)">不问，收起聊天</button></div>`;
 if(state.nightLinAsk===1)return '<div class="chat-compose dm-compose"><span>⊕</span><input disabled placeholder="消息已发送…"/><span>☺</span></div>';
 return '<div class="chat-compose dm-compose"><span>⊕</span><input disabled placeholder="暂时没有更多消息"/><span>☺</span></div>';
}
function nightAskLin(ask){
 if(state.nightChoice!=='browse'||state.nightLinMessage!==2||state.nightLinAsk!==0)return;
 state.nightLinAsk=ask?1:3;
 if(ask)state.nightLinAskAt=Date.now();
 if(!ask){state.tab='微信';store();go('wechat');}else{store();render();scheduleNightEvents();}
}
function nightHomeHint(){
 if(state.nightLinMessage===0)return `<div class="d1-home-tip d1-discovery"><span>深夜 · ${fictionalClock()}</span><strong>手机屏幕一直亮着</strong><small>再看看微信里有没有新消息。</small></div>`;
 if(state.nightLinMessage===1)return `<div class="d1-home-tip d1-discovery"><span>${fictionalClock()} · 微信</span><strong>小林发来了一条私信</strong><small>打开微信，看看他说了什么。</small></div>`;
 if(state.nightRepairStatus==='fixed')return `<div class="d1-home-tip d1-discovery"><span>00:12 · 维修结束</span><strong>门牌已经修好，可以休息了。</strong><button onclick="nightQuietEnding()">收起手机 →</button></div>`;
 if(state.nightRepairStatus==='accepted')return `<div class="d1-home-tip d1-discovery"><span>物业服务</span><strong>你提交的报修有了新进度</strong><small>打开物业服务查看。</small></div>`;
 if(state.nightRepairStatus==='pending')return `<div class="d1-home-tip d1-discovery"><span>物业服务</span><strong>报修已经提交</strong><small>看看工单有没有被受理。</small></div>`;
 return `<div class="d1-home-tip d1-discovery"><span>夜深了</span><strong>你可以收起手机去睡觉。</strong><button onclick="nightQuietEnding()">收起手机 →</button></div>`;
}
function nightQuietEnding(){
 if(state.nightChoice!=='browse'||state.storyEnding)return;
 if(state.nightRepairStatus==='fixed'){go('night-after-repair');return}
 if(state.nightLinMessage!==2)return;
 state.nightChoice='ignored';state.nightStep=0;store();nightSceneSound('danger',0);go('night-danger');
}
function nightStartBrowse(){
 if(!dayOneAllDone()||state.dayOneMimiStep<4)return;
 if(!state.nightChoice){
  state.gameClockMinute=Math.max(Number(state.gameClockMinute)||1216,23*60+12);
  state.nightChoice='browse';state.nightPhase='waiting';state.nightStep=Date.now()+2300;
  state.nightLinMessage=0;state.nightLinOpenedAt=0;state.nightLinViewedMs=0;state.nightLinActiveSince=0;state.nightLinAsk=0;
  state.nightRepairStatus='';state.nightDoorStep=0;state.nightPlateChecked=false;state.nightRepairCategory='';
 }
 goHome();scheduleNightEvents();
}
function renderNightRepair(){
 if(state.page!=='repairs')return false;
 const browsing=state.nightChoice==='browse'&&state.nightLinMessage>=1&&!!state.nightLinOpenedAt;
 const status=state.nightRepairStatus||'';
 view.innerHTML=`${header('报事报修','property')}<div class="scroll rr-repair"><div class="rr-repair-heading"><small>锦苑花庭 · 住户服务</small><h2>报事报修</h2><p>在这里可以提交房屋相关的维修申请。</p></div>${!browsing?'<div class="rr-repair-empty">近期没有提交过报修。</div>':status?`<div class="rr-repair-ticket"><small>3栋 · 302室</small><h3>门牌标识松动</h3><p>报修单号：WX-302-0148</p><p>当前状态：<strong>${status==='fixed'?'已完成维修':status==='accepted'?'已派工 · 等待上门':'正在受理'}</strong></p><p class="rr-repair-foot">${status==='fixed'?'门牌已重新固定。':'已收到报修申请，等待现场处理。'}</p></div>${status==='accepted'?`<button class="d1-primary rr-night-action" onclick="nightStartDoorScene()">放下手机，留意门外的动静 →</button>`:''}`:`${!state.nightPlateChecked?`<div class="rr-repair-inspect"><span>填写报修单前</span><p>提交报修需要填写实际故障。你还没有仔细看过门口的标识。</p><button onclick="nightOpenPlate()">去门口看一眼　›</button></div>`:`<div class="rr-repair-inspect checked"><span>报修内容</span><p>302 门牌只剩左上角一颗螺丝还固定着，其他三颗已脱落，门牌歪斜。</p></div>`}${state.nightPlateChecked?`<div class="rr-repair-options">${state.nightRepairCategory?`<span>请选择报修内容</span>${state.nightRepairCategory==='facilities'?`<button onclick="nightSubmitRepair('door')"><strong>门牌松动</strong><small>门牌需要重新固定</small><b>›</b></button><button onclick="nightSubmitRepair('other')"><strong>门禁设备</strong><small>设备无法正常使用</small><b>›</b></button>`:`<button onclick="nightSubmitRepair('other')"><strong>电器设备</strong><small>无法正常使用</small><b>›</b></button><button onclick="nightSubmitRepair('other')"><strong>墙面设施</strong><small>有损坏需要处理</small><b>›</b></button>`}<button onclick="nightRepairCategory('')"><strong>返回类别</strong><b>‹</b></button>`:`<span>请选择报修类别</span><button onclick="nightRepairCategory('facilities')"><strong>楼道设施</strong><small>公共区域设施需要维修</small><b>›</b></button><button onclick="nightRepairCategory('home')"><strong>室内维修</strong><small>房屋内部设施需要处理</small><b>›</b></button>`}</div>`:''}`}</div>`;
 return true;
}
function nightOpenPlate(){if(state.nightChoice!=='browse'||state.nightRepairStatus)return;go('night-plate')}
function nightConfirmPlate(){
 if(state.nightChoice!=='browse'||state.nightRepairStatus||state.platePhotoPending)return;
 state.platePhotoPending=true;
 if(typeof SoundFX!=='undefined')SoundFX.play('shutter');
 const pic=document.querySelector('.rr-cg-visual');if(pic){pic.classList.add('photo-hold');}
 const btn=document.querySelector('.rr-cg-next');if(btn){btn.disabled=true;btn.textContent='照片已保存';}
 setTimeout(()=>{state.platePhotoPending=false;state.nightPlateChecked=true;store();if(state.page==='night-plate')go('repairs')},1500);
}
function nightRepairCategory(name){state.nightRepairCategory=name;store();render();}
function nightSubmitRepair(type){
 if(state.nightChoice!=='browse'||state.nightLinMessage<1||state.nightRepairStatus)return;
 if(type!=='door'){nightBeginMisread('water');return}
 if(!state.nightPlateChecked){notify('请先确认门牌是否确实松动');return}
 state.nightRepairStatus='pending';state.nightRepairAt=Date.now();store();render();scheduleNightEvents();
}
function nightBeginMisread(reason){
 if(state.nightChoice!=='browse'||state.nightRepairStatus)return;
 if(typeof SoundFX!=='undefined')SoundFX.play('anomaly');
 state.nightMistake=reason||'wait';
 state.nightChoice='misread';state.nightStep=0;
 store();nightSceneSound('danger',0);go('night-danger');
}
function nightStartDoorScene(){
 if(state.nightChoice!=='browse'||state.nightRepairStatus!=='accepted')return;
 state.nightDoorStep=1;store();nightSceneSound('repair',1);go('night-door');
}
function nightContinueDoor(){
 if(state.nightChoice!=='browse'||!['accepted','fixed'].includes(state.nightRepairStatus))return;
 state.nightDoorStep=Math.min(4,Number(state.nightDoorStep||1)+1);
 if(state.nightDoorStep===3){state.nightRepairStatus='fixed';}
 if(state.nightDoorStep>=4){if(state.nightRepairStatus!=='fixed')return;if(typeof SoundFX!=='undefined')SoundFX.stop();state.page='night-after-repair';store();render();return}
 store();nightSceneSound('repair',state.nightDoorStep);render();
}
function nightBody(title,content,actions,eyebrow='锦苑花庭'){
 return `<div class="night-screen"><div class="night-top"><button onclick="goHome()" aria-label="返回桌面">‹</button><span>${state.page==='day1-night'?'':fictionalClock()+' · '}${clean(eyebrow)}</span></div><div class="night-scroll"><span class="night-kicker">THE FIRST NIGHT</span><h1>${clean(title)}</h1><div class="night-copy">${content}</div><div class="night-actions">${actions}</div></div></div>`;
}
function beginNightDanger(kind){
 if(!['group','sleep'].includes(kind))return;
 if(kind==='sleep'&&(!dayOneAllDone()||state.dayOneMimiStep<4))return;
 if(kind==='group'&&!(state.page==='anonymous-chat'&&state.anonStage>=3&&state.dayOneChoice==='group'&&state.dayOneInquiryStep===2&&state.groupAlertShown))return;
 state.nightChoice=kind;state.nightStep=0;state.nightAlertRead=false;store();nightSceneSound('danger',0);go('night-danger');
}
function nightAdvanceDanger(){
 if(!['sleep','group','misread','ignored'].includes(state.nightChoice)||state.storyEnding)return;
 state.nightStep=Math.min(4,(Number(state.nightStep)||0)+1);
 if(state.nightStep>=4){nightSetEnding(state.nightChoice==='misread'?'day1-sleep-death':state.nightChoice==='group'?'day1-group-death':'day1-no-repair-death');return}
 store();nightSceneSound('danger',state.nightStep);render();
}
function nightSetEnding(id){
 if(state.storyEnding)return;
 nightCancelTimers();if(typeof SoundFX!=='undefined')SoundFX.stop();state.storyEnding=id;state.nightStep=4;state.dayOneFinished=true;
 state.page=id==='day1-survivor'?'day-end':'night-ending';state.navStack=[];
 store();if(typeof rrSaveEnding==='function')rrSaveEnding(id);render();
}
// Scene sound cues are triggered by user navigation, not render(), to avoid repeat on refresh.
function nightSceneSound(route,step){
 if(typeof SoundFX==='undefined')return;
 if(route==='repair'){if(step===1)SoundFX.play('footsteps');if(step===2)SoundFX.play('repair');if(step===3)SoundFX.play('footsteps');}
 if(route==='danger'){if(step===0)SoundFX.play('footsteps');if(step===2)SoundFX.play('latch');if(step===3)SoundFX.play('door_slide');}
}
function rrCG(which,caption,lines,button,label,anim='still'){
 const name={loose:'plate_loose',closed:'foyer_closed',ajar:'foyer_ajar'}[which]||'foyer_closed';
 return `<section class="rr-cg-scene"><div class="rr-cg-visual ${clean(anim)}"><img src="game/assets/${name}.webp" alt="${clean(caption)}" loading="eager" decoding="sync" fetchpriority="high"></div><div class="rr-cg-vignette"></div><div class="rr-cg-panel"><small>${clean(caption)}</small><p>${lines}</p><button class="rr-cg-next" onclick="${button}">${clean(label)} <span>›</span></button></div></section>`;
}
function renderNightPage(){
 if(state.page==='night-plate'){
  view.innerHTML=rrCG('loose','302 室 · 门外', '你走到房门外。<br>302 的门牌斜挂着，只剩左上角一颗螺丝还固定在墙上。<br>另外三处固定点已经松脱。','nightConfirmPlate()','拍下门牌，回去填写报修','still');
  return true;
 }
 if(state.page==='day1-night'){
  view.innerHTML=nightBody('手机还亮着',`<p>和米米道完晚安，房间渐渐安静下来。</p><p>纸箱靠在墙边。你看了一眼手机，又想起群里那条说不清来历的通知。</p><p>现在做什么？</p>`,`<button class="night-primary" onclick="beginNightDanger('sleep')">关灯睡觉</button><button onclick="nightStartBrowse()">再刷刷手机</button>`,'睡前');return true;
 }
 if(state.page==='night-danger'){
  const step=Math.min(3,Number(state.nightStep)||0);
  const lines=[
   ['楼道里有脚步声。<br>由远及近，越来越清楚。','仔细听','still'],
   ['脚步声停在门外。<br>没有门铃，也没有人说话。','继续','still'],
   ['门锁转动了一下。','看向房门','still'],
   ['门被推开了一条缝。<br>外面是一片漆黑。','查看结局','still']
  ];
  const [copy,action,animation]=lines[step];
  view.innerHTML=rrCG(step===3?'ajar':'closed',step===0?'深夜 · 302 室':'302 室 · 玄关',copy,'nightAdvanceDanger()',action,animation);
  return true;
 }
 if(state.page==='night-door'){
  const step=Math.min(3,Math.max(1,Number(state.nightDoorStep)||1));
  const scenes={
   1:['走廊里传来几声脚步。<br>你放下手机，留意门外的动静。','靠近房门','still'],
   2:['脚步停了。<br>门外传来螺丝刀旋动、金属轻轻碰撞的声音。<br>声音持续了一会儿。','继续听','still'],
   3:['工具声停了。<br>脚步声渐渐远去。<br>你查看报修单，状态已经更新为「已完成维修」。' ,'保存工单记录','still']
  };
  const [copy,action,animation]=scenes[step];
  view.innerHTML=rrCG('closed','302 室 · 玄关',copy,'nightContinueDoor()',action,animation);
  return true;
 }
 if(state.page==='night-after-repair'){
  view.innerHTML=nightBody('可以休息了',`<p>门外已经安静下来，维修单也显示「已完成维修」。</p><p>你保存了工单截图。忙碌了一整天，困意渐渐涌上来。</p>`,`<button class="night-primary" onclick="nightSetEnding('day1-survivor')">关灯睡觉</button>`,'睡前');return true;
 }
 if(state.page==='night-ending'){
  const ending=state.storyEnding;
  const title=ending==='day1-group-death'?'BE 03 · 公开追问':ending==='day1-sleep-death'?'BE 02 · 错误报修':'BE 01 · 第一夜';
  const copy=ending==='day1-group-death'?'<p>那次公开的追问没有得到回答。</p><p>夜里，门外的脚步停下，门锁转动，门被打开。</p>':ending==='day1-sleep-death'?'<p>报修单提交了，但没有人来修门牌。</p><p>脚步在门口停住。房门被推开。</p>':'<p>302 的门牌还没修好。</p><p>脚步停在门外，随后门锁转动，门被推开。</p>';
  view.innerHTML=nightBody(title,copy,`<button class="night-primary" onclick="openStoryNodes()">剧情回溯</button><button onclick="openEndingArchive()">查看结局图鉴</button><button onclick="returnDayOneTitle()">返回标题</button>`,'DAY 1 · 失败结局');return true;
 }
 return false;
}
