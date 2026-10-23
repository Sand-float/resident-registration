/* 住户登记 · 第一夜。所有关键线索必须在真实手机 App 中被玩家看到。 */
const NIGHT_LIN_MESSAGE='今天翻以前的维修单，看到三栋302的门牌好像一直没修好。要是还松着，记得在物业服务里留个报修，别自己粘。';
const NIGHT_EVIDENCE={
 group:{source:'微信 · 业主群',title:'不在名单里的发言者',text:'发出门牌通知的黑头像，不在群成员名单里。其他住户也注意到了。'},
 notice:{source:'微信 · 业主群',title:'物业否认的通知',text:'小林在群里否认发布过门牌核对通知，但那条通知仍留在聊天记录里。'},
 lin:{source:'微信 · 小林',title:'不合时宜的提醒',text:'小林深夜忽然提到楼层标识和报修记录，随即撤回。他为什么突然说这个？'},
 retract:{source:'微信 · 小林',title:'主动撤回',text:'我亲眼看见小林将一条重要私信撤回；微信列表也同步变成「撤回了一条消息」。'},
 repair:{source:'物业服务 · 报事报修',title:'门牌报修单',text:'302 门牌只剩一颗螺丝固定，其余三个固定点已经松脱。我提交了门牌维修工单。'},
 hallway:{source:'房门 · 深夜',title:'被略过的房间',text:'维修完成后，门外又有脚步声经过，最后没有停在 302 门前。'},
 oldticket:{source:'物业服务 · 历史工单',title:'短暂出现的历史工单',text:'物业服务中闪过一张更早的 302 室工单，联系人姓林。重新打开后却找不到了。'},
 access:{source:'物业服务 · 门禁记录',title:'异常门禁记录',text:'昨日深夜，302 室对应的门禁记录里出现一条来自未登记设备的进入信息。'},
 body:{source:'手机桌面',title:'自行出现的应用',text:'手机桌面多出了「身体状态」，里面却已填好个人房号和身体数据。'},
 archive:{source:'物业服务 · 历史记录',title:'有意被隐藏的记录',text:'302 室一张旧工单一闪而过。它没有出现在可查询的工单列表里。'}
};
function nightRecordEvidence(id){
 if(!NIGHT_EVIDENCE[id])return;
 state.investigation=state.investigation||{};
 if(state.investigation[id])return;
 state.investigation[id]=Date.now();
 state.clues=(Number(state.clues)||0)+1;
 if(typeof SoundFX!=='undefined')SoundFX.play('clue');
 store();
}
function nightInvestigationEntries(){
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
 if(typeof SoundFX!=='undefined')SoundFX.play('message');
 if(state.page!=='direct-chat'||state.dmPerson!=='小林')banner(NIGHT_LIN_MESSAGE,'小林','direct-chat');
 if(state.page==='home'||state.page==='wechat'||state.page==='direct-chat')render();
}
function nightRetractMessage(){
 if(state.nightChoice!=='browse'||state.nightLinMessage!==1||state.storyEnding)return;
 state.nightLinMessage=2;
 if(typeof SoundFX!=='undefined')SoundFX.play('retract');
 if(state.nightLinOpenedAt)nightRecordEvidence('retract');
 store();
 if(state.page==='direct-chat'&&state.dmPerson==='小林'||state.page==='wechat'||state.page==='home')render();
}
function nightLinReply(){
 if(state.nightChoice!=='browse'||state.nightLinAsk!==1||state.storyEnding)return;
 state.nightLinAsk=2;store();
 if(state.page==='direct-chat'&&state.dmPerson==='小林')render();
 else banner('我刚翻错了一页旧工单。已经处理好了，你不用管。','小林','direct-chat');
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
 if(state.nightLinMessage===1&&state.nightLinOpenedAt)nightSchedule('retract',Number(state.nightLinOpenedAt)+11500,nightRetractMessage);
 if(state.nightLinAsk===1&&state.nightLinAskAt)nightSchedule('reply',Number(state.nightLinAskAt)+Math.max(1500,Number(state.messageSpeed)||2200),nightLinReply);
 if(state.nightRepairStatus==='pending'&&state.nightRepairAt)nightSchedule('repair',Number(state.nightRepairAt)+2300,nightRepairProcess);
}
function nightOnNavigate(page){
 if(state.nightChoice!=='browse'||state.storyEnding)return;
 if(page==='direct-chat'&&state.dmPerson==='小林'&&state.nightLinMessage===1&&!state.nightLinOpenedAt){
  state.nightLinOpenedAt=Date.now();nightRecordEvidence('lin');scheduleNightEvents();
 }
}
function nightLinChatFooter(){
 if(state.nightChoice!=='browse'||state.dmPerson!=='小林')return '<div class="chat-compose dm-compose"><span>⊕</span><input disabled placeholder="当前没有可发送的消息"/><span>☺</span></div>';
 if(state.nightLinMessage<2)return '<div class="chat-compose dm-compose"><span>⊕</span><input disabled placeholder="没有可以发送的消息"/><span>☺</span></div>';
 if(state.nightLinAsk===0)return `<div class="reply-area d1-reply-area"><div class="reply-hint">那句话忽然消失了。</div><button class="reply-option" onclick="nightAskLin(true)">小林，刚才那句话是什么意思？</button><button class="reply-option" onclick="nightAskLin(false)">不问，收起聊天</button></div>`;
 if(state.nightLinAsk===1)return '<div class="chat-compose dm-compose"><span>⊕</span><input disabled placeholder="消息已发送…"/><span>☺</span></div>';
 return '<div class="chat-compose dm-compose"><span>⊕</span><input disabled placeholder="暂时没有更多消息"/><span>☺</span></div>';
}
function nightAskLin(ask){
 if(state.nightChoice!=='browse'||state.nightLinMessage!==2||state.nightLinAsk!==0)return;
 state.nightLinAsk=ask?1:3;
 if(ask)state.nightLinAskAt=Date.now();
 if(!ask){store();go('wechat');}else{store();render();scheduleNightEvents();}
}
function nightHomeHint(){
 if(state.nightLinMessage===0)return `<div class="d1-home-tip d1-discovery"><span>深夜 · 23:46</span><strong>手机屏幕一直亮着</strong><small>再看看微信里有没有新消息。</small></div>`;
 if(state.nightLinMessage===1)return `<div class="d1-home-tip d1-discovery"><span>微信 · 新消息</span><strong>小林发来了一条私信</strong><small>打开微信，看看他说了什么。</small></div>`;
 if(state.nightRepairStatus==='accepted')return `<div class="d1-home-tip d1-discovery"><span>物业服务</span><strong>你提交的报修有了新进度</strong><small>打开物业服务查看。</small></div>`;
 if(state.nightRepairStatus==='pending')return `<div class="d1-home-tip d1-discovery"><span>物业服务</span><strong>报修已经提交</strong><small>看看工单有没有被受理。</small></div>`;
 return `<div class="d1-home-tip d1-discovery"><span>23:49 · 夜深了</span><strong>手机上还有一条被撤回的消息</strong><small>你可以继续查看物业服务，也可以先收起手机。</small><button onclick="nightQuietEnding()">收起手机 →</button></div>`;
}
function nightQuietEnding(){
 if(state.nightChoice!=='browse'||state.nightLinMessage!==2||state.storyEnding||state.nightRepairStatus==='fixed')return;
 state.nightChoice='ignored';state.nightStep=0;store();nightSceneSound('danger',0);go('night-danger');
}
function nightStartBrowse(){
 if(!dayOneAllDone()||state.dayOneMimiStep<4)return;
 if(!state.nightChoice){
  state.nightChoice='browse';state.nightPhase='waiting';state.nightStep=Date.now()+2300;
  state.nightLinMessage=0;state.nightLinOpenedAt=0;state.nightLinAsk=0;
  state.nightRepairStatus='';state.nightDoorStep=0;state.nightPlateChecked=false;
 }
 goHome();scheduleNightEvents();
}
function renderNightRepair(){
 if(state.page!=='repairs')return false;
 const browsing=state.nightChoice==='browse'&&state.nightLinMessage>=1&&!!state.nightLinOpenedAt;
 const status=state.nightRepairStatus||'';
 view.innerHTML=`${header('报事报修','property')}<div class="scroll rr-repair"><div class="rr-repair-heading"><small>锦苑花庭 · 住户服务</small><h2>报事报修</h2><p>在这里可以提交房屋相关的维修申请。</p></div>${!browsing?'<div class="rr-repair-empty">近期没有提交过报修。</div>':status?`<div class="rr-repair-ticket"><small>3栋 · 302室</small><h3>门牌标识松动</h3><p>报修单号：WX-302-0148</p><p>当前状态：<strong>${status==='fixed'?'已完成维修':status==='accepted'?'已派工 · 等待上门':'正在受理'}</strong></p><p class="rr-repair-foot">${status==='fixed'?'门牌已重新固定。':'已收到报修申请，等待现场处理。'}</p></div>${status==='accepted'?`<button class="d1-primary rr-night-action" onclick="nightStartDoorScene()">放下手机，留意门外的动静 →</button>`:''}`:`${!state.nightPlateChecked?`<div class="rr-repair-inspect"><span>填写报修单前</span><p>提交报修需要填写实际故障。你还没有仔细看过门口的标识。</p><button onclick="nightOpenPlate()">去门口看一眼　›</button></div>`:`<div class="rr-repair-inspect checked"><span>现场查看</span><p>302 门牌只剩左上角的一颗螺丝固定，另外三颗已经脱落，整块门牌向下歪斜。</p></div>`}${state.nightPlateChecked?`<div class="rr-repair-options"><span>请选择报修事项</span><button onclick="nightSubmitRepair('door')"><strong>门牌标识松动</strong><small>三处螺丝脱落，门牌倾斜</small><b>›</b></button><button onclick="nightSubmitRepair('other')"><strong>水电维修</strong><small>灯具、水管等设施故障</small><b>›</b></button></div>`:''}`}</div>`;
 return true;
}
function nightOpenPlate(){if(state.nightChoice!=='browse'||state.nightRepairStatus)return;if(typeof SoundFX!=='undefined')SoundFX.play('footsteps');go('night-plate')}
function nightConfirmPlate(){if(state.nightChoice!=='browse'||state.nightRepairStatus)return;state.nightPlateChecked=true;store();go('repairs')}
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
 if(state.nightDoorStep===3){state.nightRepairStatus='fixed';nightRecordEvidence('hallway');}
 if(state.nightDoorStep>=4){if(state.nightRepairStatus!=='fixed')return;nightSetEnding('day1-survivor');return}
 store();nightSceneSound('repair',state.nightDoorStep);render();
}
function nightBody(title,content,actions,eyebrow='23:50 · 锦苑花庭'){
 return `<div class="night-screen"><div class="night-top"><button onclick="goHome()" aria-label="返回桌面">‹</button><span>${clean(eyebrow)}</span></div><div class="night-scroll"><span class="night-kicker">THE FIRST NIGHT</span><h1>${clean(title)}</h1><div class="night-copy">${content}</div><div class="night-actions">${actions}</div></div></div>`;
}
function beginNightDanger(kind){
 if(!['group','sleep'].includes(kind))return;
 if(kind==='sleep'&&(!dayOneAllDone()||state.dayOneMimiStep<4))return;
 if(kind==='group'&&!(state.dayOneChoice==='group'&&state.dayOneInquiryStep===2))return;
 state.nightChoice=kind;state.nightStep=0;state.nightAlertRead=false;store();nightSceneSound('danger',0);go('night-danger');
}
function nightAdvanceDanger(){
 if(!['sleep','group','misread','ignored'].includes(state.nightChoice)||state.storyEnding)return;
 state.nightStep=Math.min(4,(Number(state.nightStep)||0)+1);
 if(state.nightStep>=4){nightSetEnding(state.nightChoice==='group'?'day1-group-death':'day1-sleep-death');return}
 store();nightSceneSound('danger',state.nightStep);render();
}
function nightSetEnding(id){
 if(state.storyEnding)return;
 nightCancelTimers();state.storyEnding=id;state.nightStep=4;state.dayOneFinished=true;
 state.page=id==='day1-survivor'?'day-end':'night-ending';state.navStack=[];
 store();if(typeof rrSaveEnding==='function')rrSaveEnding(id);render();
}
// Scene sound cues are triggered by user navigation, not render(), to avoid repeat on refresh.
function nightSceneSound(route,step){
 if(typeof SoundFX==='undefined')return;
 if(route==='repair'){if(step===1)SoundFX.play('footsteps');if(step===2)SoundFX.play('repair');if(step===3)SoundFX.play('confirm');}
 if(route==='danger'){if(step===0)SoundFX.play('footsteps');if(step===2)SoundFX.play('latch');if(step===3)SoundFX.play('open');}
}
function rrCG(which,caption,lines,button,label,anim='still'){
 const name={loose:'plate_loose',closed:'foyer_closed',ajar:'foyer_ajar'}[which]||'foyer_closed';
 return `<section class="rr-cg-scene"><div class="rr-cg-visual ${clean(anim)}"><img src="game/assets/${name}.webp" alt="${clean(caption)}"></div><div class="rr-cg-vignette"></div><div class="rr-cg-panel"><small>${clean(caption)}</small><p>${lines}</p><button class="rr-cg-next" onclick="${button}">${clean(label)} <span>›</span></button></div></section>`;
}
function renderNightPage(){
 if(state.page==='night-plate'){
  view.innerHTML=rrCG('loose','302 室 · 门外', '你走到房门外。<br>302 的门牌斜挂着，只剩左上角一颗螺丝还固定在墙上。<br>另外三处固定点已经松脱。','nightConfirmPlate()','拍下门牌，回去填写报修','approach');
  return true;
 }
 if(state.page==='day1-night'){
  view.innerHTML=nightBody('手机还亮着',`<p>和米米道完晚安，房间渐渐安静下来。</p><p>纸箱靠在墙边。你看了一眼手机，又想起群里那条说不清来历的通知。</p><p>现在做什么？</p>`,`<button class="night-primary" onclick="beginNightDanger('sleep')">关灯睡觉</button><button onclick="nightStartBrowse()">再刷刷手机</button>`,'23:42 · 睡前');return true;
 }
 if(state.page==='night-danger'){
  const step=Math.min(3,Number(state.nightStep)||0);
  const lines=[
   ['楼道里有脚步声。<br>由远及近，越来越清楚。','仔细听','approach'],
   ['脚步声停在门外。<br>没有门铃，也没有人说话。','继续','still'],
   ['咔哒。<br>门锁传来转动的声音。','看向房门','tremble'],
   ['门被推开了一条缝。<br>走廊里没有灯光。','查看结局','reveal']
  ];
  const [copy,action,animation]=lines[step];
  view.innerHTML=rrCG(step===3?'ajar':'closed',step===0?'深夜 · 302 室':'302 室 · 玄关',copy,'nightAdvanceDanger()',action,animation);
  return true;
 }
 if(state.page==='night-door'){
  const step=Math.min(3,Math.max(1,Number(state.nightDoorStep)||1));
  const scenes={
   1:['走廊里传来几声脚步。<br>你放下手机，朝玄关走去。','靠近房门','approach'],
   2:['脚步停了。<br>门外传来螺丝刀旋动、金属轻轻碰撞的声音。<br>声音持续了一会儿。','继续听','still'],
   3:['工具声停下，脚步声渐渐远去。<br>你再次查看报修单，状态已经更新为「已完成维修」。<br>门牌重新固定好了。','保存工单记录','still']
  };
  const [copy,action,animation]=scenes[step];
  view.innerHTML=rrCG('closed','00:07 · 302 室 · 玄关',copy,'nightContinueDoor()',action,animation);
  return true;
 }
 if(state.page==='night-ending'){
  const group=state.storyEnding==='day1-group-death';
  view.innerHTML=nightBody(group?'BE 01 · 被点名的人':'BE 02 · 门外的脚步',group?`<p>那条通知没有消失。</p><p>你的房门被打开了。你没能等到天亮。</p>`:`<p>302 的门牌没有得到维修。</p><p>脚步停在门前。门锁转动，房门被打开。</p><p>第一夜到此结束。</p>`,`<button class="night-primary" onclick="openStoryNodes()">剧情回溯</button><button onclick="openEndingArchive()">查看结局图鉴</button><button onclick="returnDayOneTitle()">返回标题</button>`,'DAY 1 · 失败结局');return true;
 }
 return false;
}
