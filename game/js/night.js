/* 住户登记 · 第一夜。所有关键线索必须在真实手机 App 中被玩家看到。 */
const NIGHT_LIN_MESSAGE='今天翻以前的维修单，看到三栋302的门牌好像一直没修好。要是还松着，记得在物业服务里留个报修，别自己粘。';
const NIGHT_EVIDENCE={
 group:{source:'微信 · 业主群',title:'不在名单里的发言者',text:'发出门牌通知的黑头像，不在群成员名单里。其他住户也注意到了。'},
 notice:{source:'微信 · 业主群',title:'物业否认的通知',text:'小林在群里否认发布过门牌核对通知，但那条通知仍留在聊天记录里。'},
 lin:{source:'微信 · 小林',title:'不合时宜的提醒',text:'小林深夜忽然提到楼层标识和报修记录，随即撤回。他为什么突然说这个？'},
 retract:{source:'微信 · 小林',title:'主动撤回',text:'我亲眼看见小林将一条重要私信撤回；微信列表也同步变成「撤回了一条消息」。'},
 repair:{source:'物业服务 · 报事报修',title:'门牌报修单',text:'我检查到 302 门牌右下角有翘边，在物业服务报修后出现一张待处理工单。'},
 hallway:{source:'房门 · 深夜',title:'被略过的房间',text:'门外的人核对到 302 室时停顿了一下，随后说「先跳过」，走向了下一间。'},
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
 return `<div class="d1-home-tip d1-discovery"><span>23:49 · 夜深了</span><strong>手机上还有一条被撤回的消息</strong><small>你可以继续查看物业服务，也可以先结束今晚。</small><button onclick="nightQuietEnding()">收起手机，结束今晚 →</button></div>`;
}
function nightQuietEnding(){
 if(state.nightChoice!=='browse'||state.nightLinMessage!==2||state.storyEnding)return;
 nightSetEnding('day1-quiet');
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
 view.innerHTML=`${header('报事报修','property')}<div class="scroll rr-repair"><div class="rr-repair-heading"><small>锦苑花庭 · 住户服务</small><h2>报事报修</h2><p>在这里可以提交房屋相关的维修申请。</p></div>${!browsing?'<div class="rr-repair-empty">近期没有提交过报修。</div>':status?`<div class="rr-repair-ticket"><small>3栋 · 302室</small><h3>门牌标识松动</h3><p>报修单号：WX-302-0148</p><p>当前状态：<strong>${status==='accepted'?'待维修 · 暂缓现场核验':'正在受理'}</strong></p><p class="rr-repair-foot">${status==='accepted'?'已转入待维修队列。请勿重复提交。':'已收到申请，正在分配工单。'}</p></div>${status==='accepted'?`<button class="d1-primary rr-night-action" onclick="nightStartDoorScene()">放下手机，听见走廊里的动静 →</button>`:''}`:`${!state.nightPlateChecked?`<div class="rr-repair-inspect"><span>填写报修单前</span><p>提交报修需要填写实际故障。你还没有仔细看过门口的标识。</p><button onclick="nightOpenPlate()">去门口看一眼　›</button></div>`:`<div class="rr-repair-inspect checked"><span>现场查看</span><p>302 门牌右下角有一点翘起，像是胶没有粘牢。</p></div>`}${state.nightPlateChecked?`<div class="rr-repair-options"><span>请选择报修事项</span><button onclick="nightSubmitRepair('door')"><strong>门牌标识松动</strong><small>边角翘起、固定不牢</small><b>›</b></button><button onclick="nightSubmitRepair('other')"><strong>水电维修</strong><small>灯具、水管等设施故障</small><b>›</b></button></div>`:''}`}</div>`;
 return true;
}
function nightOpenPlate(){if(state.nightChoice!=='browse'||state.nightRepairStatus)return;go('night-plate')}
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
 store();go('night-danger');
}
function nightStartDoorScene(){
 if(state.nightChoice!=='browse'||state.nightRepairStatus!=='accepted')return;
 state.nightDoorStep=1;if(typeof SoundFX!=='undefined')SoundFX.play('door');store();go('night-door');
}
function nightContinueDoor(){
 if(state.nightChoice!=='browse'||state.nightRepairStatus!=='accepted')return;
 state.nightDoorStep=Math.min(4,Number(state.nightDoorStep||1)+1);
 if(state.nightDoorStep>=4){nightRecordEvidence('hallway');nightRecordEvidence('oldticket');nightSetEnding('day1-survivor');return}
 store();render();
}
function nightBody(title,content,actions,eyebrow='23:50 · 锦苑花庭'){
 return `<div class="night-screen"><div class="night-top"><button onclick="goHome()" aria-label="返回桌面">‹</button><span>${clean(eyebrow)}</span></div><div class="night-scroll"><span class="night-kicker">THE FIRST NIGHT</span><h1>${clean(title)}</h1><div class="night-copy">${content}</div><div class="night-actions">${actions}</div></div></div>`;
}
function beginNightDanger(kind){
 if(!['group','sleep'].includes(kind))return;
 if(kind==='sleep'&&(!dayOneAllDone()||state.dayOneMimiStep<4))return;
 if(kind==='group'&&!(state.dayOneChoice==='group'&&state.dayOneInquiryStep===2))return;
 state.nightChoice=kind;state.nightStep=0;state.nightAlertRead=false;store();go('night-danger');
}
function nightAdvanceDanger(){
 if(!['sleep','group','misread'].includes(state.nightChoice)||state.storyEnding)return;
 state.nightStep=Math.min(4,(Number(state.nightStep)||0)+1);
 if(state.nightStep>=4){nightSetEnding(state.nightChoice==='group'?'day1-group-death':'day1-sleep-death');return}
 store();render();
}
function nightSetEnding(id){
 if(state.storyEnding)return;
 nightCancelTimers();state.storyEnding=id;state.nightStep=4;state.dayOneFinished=true;
 state.page=['day1-survivor','day1-quiet'].includes(id)?'day-end':'night-ending';state.navStack=[];
 store();if(typeof rrSaveEnding==='function')rrSaveEnding(id);render();
}
function renderNightPage(){
 if(state.page==='night-plate'){
  view.innerHTML=`${header('302 室 · 门口','repairs')}<div class="scroll rr-plate-scene"><div class="rr-plate-art"><img src="game/assets/door.svg" alt="家门和门牌"/></div><div class="rr-plate-copy"><span>23:54 · 302 室</span><h2>门牌</h2><p>你走到门边，发现写着 302 的标识右下角微微翘起。</p><p>大概是搬进来时没注意到。现在再看，确实没有粘牢。</p></div><button class="rr-plate-action" onclick="nightConfirmPlate()">拍张照片，回去填写报修 →</button></div>`;
  return true;
 }
 if(state.page==='day1-night'){
  view.innerHTML=nightBody('手机还亮着',`<p>和米米道完晚安，房间渐渐安静下来。</p><p>纸箱靠在墙边。你看了一眼手机，又想起群里那条说不清来历的通知。</p><p>现在做什么？</p>`,`<button class="night-primary" onclick="beginNightDanger('sleep')">关灯睡觉</button><button onclick="nightStartBrowse()">再刷刷手机</button>`,'23:42 · 睡前');return true;
 }
 if(state.page==='night-danger'){
  const group=state.nightChoice==='group',i=Math.min(3,Number(state.nightStep)||0);
  const misread=state.nightChoice==='misread';
  const scenes=misread?[
   ['普通报修',`<p>你在物业服务里选了「水电维修」。提交成功后，手机回到桌面。</p><p>没有人回复你。小林撤回的那句话也不见了。</p><p>过了一会儿，走廊里传来一声轻轻的金属碰撞。</p>`,'回到房门前'],
   ['302',`<p>走廊里有人站在你家门外，像是在一张纸上对照数字。</p><p>他念出了三栋、三层，然后停在了 302。</p><p>手机里那张水电工单仍写着「已提交」，再没有任何变化。</p>`,'仔细听'],
   ['那张表',`<p>你想起小林那句没头没尾的话：楼层标识、报修记录。</p><p>水电工单并没有改变门牌那一栏的记录。你忽然觉得自己理解错了。</p><p>门外有人低声说：</p><blockquote>这户的标识还在。继续。</blockquote>`,'屏住呼吸'],
   ['无人应答',`<p>你还没来得及重新打开物业服务，门锁已经轻轻转动。</p><p>屏幕亮了，又暗下去。聊天列表里仍然只剩那条撤回通知。</p>`,'查看结局']
  ]:group?[
   ['突然的私信',`<p>你刚在群里问出那个问题，小林只回了一句：</p><blockquote>别在群里说。稍后联系你。</blockquote><p>然而半分钟过去，发来私信的不是小林，而是一个头像全黑的账号。</p><blockquote>302。</blockquote>`,'查看消息'],
   ['楼道的声音',`<p>你想把聊天往上划，却发现那条黑头像的通知怎么也无法删除。</p><p>走廊里响起金属摩擦的轻响。有人在门外，挨个查看门牌。</p><p>紧接着，有人准确喊出了你刚才在群里说过的房号。</p>`,'关掉屏幕'],
   ['不该出现的人',`<p>猫眼外的灯忽明忽暗。门口传来很轻的声音：</p><blockquote>我们只找刚才在群里提问的住户。</blockquote><p>你屏住呼吸，没有回答。然而门锁里传来了第二个人拧动钥匙的声音。</p>`,'继续'],
   ['302',`<p>你突然意识到，自己亲口在群里说出了房号，还问了他们不想回答的问题。</p><p>手机在掌心里振动。小林终于发来一句话：</p><blockquote>我已经尽力了。对不起。</blockquote><p>门开了。</p>`,'查看结局']
  ]:[
   ['准备入睡',`<p>你关了灯，房间很快只剩窗外的微光。</p><p>刚躺下，走廊里传来一声轻响，像钥匙碰到了门牌。</p><p>你以为是隔壁有人回来，没有在意。</p>`,'闭上眼睛'],
   ['有人在外面',`<p>脚步声靠近，又停住。</p><p>门外的人没有按门铃，只沿着门框缓缓摸索。</p><p>你半梦半醒，觉得那声音离自己很远。</p>`,'继续'],
   ['那是谁',`<p>不知过了多久，一阵细微的敲击声传来。</p><p>有人隔着门轻声喊出你的名字，语调和白天在微信里听到的声音一模一样。</p><p>你猛地清醒，却发现卧室门已经被推开了一条缝。</p>`,'继续'],
   ['没有来电',`<p>手机屏幕没有亮，也没有任何消息。</p><p>门外传来最后一次脚步声——只是这次，它已经在房间里面。</p>`,'查看结局']
  ];
  const [title,body,action]=scenes[i];view.innerHTML=nightBody(title,body,`<button class="night-primary" onclick="nightAdvanceDanger()">${action} →</button>`,group?'22:19 · 异常问询':'23:46 · 深夜');return true;
 }
 if(state.page==='night-door'){
  const step=Math.min(3,Number(state.nightDoorStep||1));
  const scenes={
   1:['走廊',`<p>你刚把手机放下，门外就响起了脚步声。</p><p>先停在 301 室，又慢慢向这边靠近。</p><p>有人拿着什么东西，轻轻碰了一下 302 的门。</p>`,'再听一会儿'],
   2:['停顿',`<p>门外的人翻动着一份纸质名单，又像是在核对手机上的什么记录。</p><p>很久以后，一个模糊的声音说：</p><blockquote>这间状态不对。先跳过。</blockquote><p>脚步声向走廊尽头移去。</p>`,'继续'],
   3:['凌晨',`<p>你打开物业服务。刚才那张工单还在：</p><blockquote>门牌标识松动 · 待维修。</blockquote><p>楼道重新安静下来。你没有睡着，却终于可以稍稍松开握紧手机的手。</p><p>你截下了工单。返回上一页时，历史记录里短暂闪过另一张三栋 302 室的旧工单，联系人姓林。再打开，却找不到了。</p>`,'保存线索']
  };
  const [title,body,action]=scenes[step];
  view.innerHTML=nightBody(title,body,`<button class="night-primary" onclick="nightContinueDoor()">${action} →</button>`,'00:07 · 302 室');return true;
 }
 if(state.page==='night-ending'){
  const group=state.storyEnding==='day1-group-death';
  view.innerHTML=nightBody(group?'BE 01 · 被点名的人':'BE 02 · 门外的脚步',group?`<p>今晚来访的人，知道了你在群里留下的房号。</p><p>小林知道发生了什么，却不敢公开帮你。你成为那条陌生通知后第一个被敲门的人。</p>`:state.nightMistake?`<p>你记得小林提起维修，却没留意他说的是哪一种标识。</p><p>深夜来访者仍然在表上找到了 302 室。等你终于想通，已经太晚了。</p>`:`<p>你把手机放在一旁，像平常一样睡去。</p><p>没有任何系统替你做确认。只是有人按照门牌找到了你的房间，而你没能醒来。</p>`,`<button class="night-primary" onclick="openStoryNodes()">剧情回溯 · 改变选择 →</button><button onclick="openEndingArchive()">查看结局图鉴</button><button onclick="returnDayOneTitle()">返回标题</button>`,'DAY 1 · 失败结局');return true;
 }
 return false;
}
