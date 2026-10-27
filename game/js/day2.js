/* 《住户登记》 Day 2 · 周六 / 测试段落 (20版)
 * 不修改第一夜已确认的人物关系、门牌保护机制；只在玩家主动认领且开门的失败线路中复用 BE01。
 */
const DAY2_RULES=[
 '今日10:00前，请各住户检查近三日的门禁通行记录。',
 '如发现「未识别进入」，请核实是否为本人邀请的访客或维修人员。',
 '无法确认来源的记录，请勿直接删除；请通过住户关联核验确认通行归属。',
 '核验期间如收到异常通行提醒，请勿擅自开门查看。'
];
const DAY2_BURST_TOTAL=7;
let day2BurstTimer=null,day2PopupTimer=null,day2LinTimer=null;
function day2StopBurst(){if(day2BurstTimer){clearTimeout(day2BurstTimer);day2BurstTimer=null}}
function day2StopLinTimer(){if(day2LinTimer){clearTimeout(day2LinTimer);day2LinTimer=null}}
function day2Prepare(test=false){
 day2StopBurst();day2StopLinTimer();cancelNarrative();
 if(typeof nightCancelTimers==='function')nightCancelTimers();
 if(typeof SoundFX!=='undefined')SoundFX.stop();
 if(test){
  state.stage=7;state.reply=true;state.seenAnnouncement=true;state.checked=true;
  state.groupReadStage=7;state.yutongStage=5;state.neighborReadStage=4;
  state.nightChoice='browse';state.nightRepairStatus='fixed';state.nightPlateChecked=true;
  state.repairScreenshotSaved=true;state.dayOneUnlocked=true;state.appRevealPending=false;
  state.dayOneTasks={boxes:true,door:true,food:true};state.dayOneAsked=true;
  state.dayOneMimiStep=4;state.dayOneFinished=false;
 }
 if(state.day!==2||!state.day2Initialized){
  state.day2Initialized=true;
  state.satiety=dayOneClamp((Number(state.satiety)||0)-25);
  state.stress=dayOneClamp((Number(state.stress)||0)+20);
  state.stamina=dayOneClamp((Number(state.stamina)||0)+5);
  state.day2RulesRead=false;state.day2RulesViewed=false;state.day2GroupAlertRead=false;
  state.day2TicketSeen=false;state.day2AccessSeen=false;
  state.day2LinStep=0;state.day2LinRead=false;state.day2LinSentAt=0;
  state.day2Decision='';state.day2BurstCount=0;state.day2BurstDone=false;
  state.day2Final='';state.day2Clock=553;state.day2RoomExposed=false;
 }
 // Day 1 survivor ending is recorded permanently before arrival; Day 2 needs an independent outcome slot.
 state.storyEnding=null;state.nightPhase='idle';state.day=2;state.day2TestMode=!!test;state.phoneActivated=false;
 state.page='day2-chapter';state.navStack=[];state.tab='微信';
 store();render();
}
function day2StartPhone(){state.phoneActivated=true;state.page='home';state.navStack=[];state.day2Clock=553;store();render()}
function day2UnreadGroup(){return (!state.day2RulesRead?3:0)+(state.day2BurstDone&&!state.day2GroupAlertRead?1:0)}
function day2UnreadLin(){return state.day2LinStep>=2&&!state.day2LinRead?1:0}
function day2HomeHint(){
 const text=state.day2Final?'Day 2 测试段落已结束。':
  !state.day2RulesRead?'业主群有 3 条未读消息。':
  !state.day2Decision?'去物业服务看看门禁记录。':
  !state.day2BurstDone?'门禁正在连续发出异常提醒。':'门禁设备关联申请尚未处理。';
 const route=!state.day2RulesRead?'day2-group':!state.day2Decision?'property':state.day2BurstDone?'day2-alert':'property';
 return `<button class="d2-home-guide" onclick="go('${route}')"><small>DAY 2 · 周六</small><strong>${text}</strong><span>查看 ›</span></button>`;
}
function day2WechatRows(){
 const rows=[
  {label:T('业主群名称')+' ('+groupCount()+')',key:'group',snippet:state.day2BurstDone?'物业管家-小林：先不要进行新的设备关联。':'物业管家-小林：门禁系统的情况我们会查。',unread:day2UnreadGroup(),time:state.day2BurstDone?'09:42':'09:16'},
  {label:contactDisplay('米米'),key:'米米',snippet:formatPreview(mimiEntries()),unread:0,time:'昨天'},
  {label:contactDisplay('王雨桐'),key:'王雨桐',snippet:formatPreview(neighborEntries()),unread:0,time:'昨天'},
  {label:contactDisplay('妈妈'),key:'妈妈',snippet:formatPreview(directEntries('妈妈')),unread:0,time:'昨天'},
  {label:contactDisplay('小林'),key:'小林',snippet:state.day2LinStep>=2?'物业管家-小林：我说的是有这种可能，具体记录还得查。':state.day2LinStep===1?'我：小林，门禁记录里前天那条未识别进入，是怎么回事？':formatPreview(linEntries()),unread:day2UnreadLin(),time:state.day2LinStep>=2?'09:24':state.day2LinStep===1?'09:21':'昨天'},
  {label:contactDisplay('刘芳'),key:'刘芳',snippet:formatPreview(directEntries('刘芳')),unread:0,time:'昨天'},
  {label:'服务通知',key:'service',snippet:'快递服务：'+parcelMessage(),unread:0,time:'10月21日'}
 ];
 const rank=r=>/^09:/.test(r.time)?10000+rrConversationMinutes(r.time):rrConversationMinutes(r.time);
 return rows.sort((a,b)=>rank(b)-rank(a));
}
function day2SendLin(){
 if(state.day!==2||state.day2LinStep!==0)return;
 state.day2LinStep=1;state.day2LinSentAt=Date.now();state.day2LinRead=true;state.day2Clock=Math.max(state.day2Clock||553,561);
 store();render();day2ScheduleLinReply();
}
function day2ScheduleLinReply(){
 if(state.day!==2||state.day2LinStep!==1||day2LinTimer||!state.day2LinSentAt)return;
 day2LinTimer=setTimeout(()=>{
  day2LinTimer=null;if(state.day!==2||state.day2LinStep!==1)return;
  state.day2LinStep=2;state.day2LinRead=state.page==='day2-lin';state.day2Clock=Math.max(state.day2Clock||553,564);
  store();if(!document.hidden && typeof SoundFX!=='undefined')SoundFX.play('message',.55);
  if(state.page==='day2-lin'||state.page==='wechat'||state.page==='home')render();
  if(!state.day2LinRead&&!document.hidden&&state.phoneActivated)banner('我说的是有这种可能，具体记录还得查。','小林','day2-lin');
 },Math.max(1600,Number(state.messageSpeed)||2200));
}
function day2Decide(decision){
 if(state.day!==2||!['claim','retain'].includes(decision)||state.day2Decision)return;
 state.day2Decision=decision;state.day2Clock=574;
 if(decision==='claim'){
  // 主动认领并放行：住户随后亲自打开302的房门；没有把已修复门牌改为失效。
  state.day2RoomExposed=true;day2StopBurst();day2StopLinTimer();
  store();go('day2-claim-door');if(typeof SoundFX!=='undefined')SoundFX.play('door',.43);
  return;
 }
 // 不认领才触发七次密集异常，且不会自动披露玩家房号。
 store();render();day2ResumeBurst();
}
function day2OpenDoorEnd(){
 if(state.page!=='day2-claim-door'||state.day2Decision!=='claim')return;
 state.nightChoice='day2claim';store();
 if(typeof SoundFX!=='undefined')SoundFX.play('door_slide',.55);
 nightBeginDeathTransition();
}
function day2BurstPopup(index){
 if(document.hidden)return;
 const screen=document.querySelector('.phone-screen');if(!screen)return;
 document.getElementById('day2-intrusion-banner')?.remove();
 const item=document.createElement('div');item.id='day2-intrusion-banner';item.className='d2-intrusion-banner';item.setAttribute('role','status');
 item.innerHTML=`<b><span class="d2-pulse"></span>门禁异常</b><span>未识别进入 · 第 ${String(index).padStart(2,'0')} 次 / 共 07 次</span>`;
 screen.appendChild(item);clearTimeout(day2PopupTimer);
 day2PopupTimer=setTimeout(()=>item.remove(),980);
}
function day2ResumeBurst(){
 if(day2BurstTimer||state.day!==2||state.day2Decision!=='retain'||state.day2BurstDone||document.hidden||state.day2Final)return;
 const advance=()=>{
  day2BurstTimer=null;
  if(state.day!==2||document.hidden||state.day2Decision!=='retain'||state.day2Final)return;
  state.day2BurstCount=Math.min(DAY2_BURST_TOTAL,Number(state.day2BurstCount||0)+1);
  state.day2Clock=574+Math.floor(state.day2BurstCount/4);
  if(typeof SoundFX!=='undefined')SoundFX.play('message',state.day2BurstCount===7?.9:.68);
  day2BurstPopup(state.day2BurstCount);
  if(state.day2BurstCount===DAY2_BURST_TOTAL){state.day2BurstDone=true;state.day2GroupAlertRead=false;state.day2Clock=582}
  store();
  if(['day2-access','day2-alert','home','wechat','property'].includes(state.page)){
   const pane=document.querySelector('.d2-scroller');const top=pane?.scrollTop;
   render();if(top!==undefined){const next=document.querySelector('.d2-scroller');if(next)next.scrollTop=top}
  }
  if(!state.day2BurstDone)day2BurstTimer=setTimeout(advance,970);
  else day2BurstTimer=setTimeout(()=>{day2BurstTimer=null;if(state.day===2&&!state.day2Final&&!document.hidden){notify('收到新的设备关联申请');if(typeof SoundFX!=='undefined')SoundFX.play('anomaly',.32)}},850);
 };
 day2BurstTimer=setTimeout(advance,900);
}
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){day2StopBurst();clearTimeout(day2PopupTimer);document.getElementById('day2-intrusion-banner')?.remove()}
 else if(state.day===2)day2ResumeBurst();
});
function day2Finalize(allow){
 if(state.day!==2||!state.day2BurstDone||state.day2Final)return;
 if(allow){state.day2Decision='claim';state.day2RoomExposed=true;store();go('day2-claim-door');if(typeof SoundFX!=='undefined')SoundFX.play('door',.43);return}
 state.day2Final='rejected';state.day2Clock=586;store();go('day2-result');
}
function day2RuleText(){return DAY2_RULES.map((r,i)=>`${i+1}. ${r}`).join('\n\n')}
function day2AccessRows(){
 const n=Number(state.day2BurstCount)||0;let out='';
 for(let i=n;i>=1;i--){
  const min=34+Math.floor((i-1)/4),sec=String((i*3)%60).padStart(2,'0');
  out+=`<div class="d2-log-item d2-flash-log"><time>09:${min}:${sec}</time><div><strong>3栋 · 未识别进入</strong><small>来源：未登记设备　· 第 ${String(i).padStart(2,'0')} 次</small></div><span>!</span></div>`;
 }
 return out+`<div class="d2-log-item d2-legacy-log"><time>10月23日<br>23:44</time><div><strong>3栋 · 未识别进入</strong><small>来源：未登记设备</small></div><span>?</span></div>`;
}
function day2Header(name){return `<div class="screen app-white d2-screen"><header class="app-header"><button class="icon-btn" onclick="goBack()" aria-label="返回上一页">‹</button><h2>${clean(name)}</h2><div class="right-space"></div></header>`}
function day2RenderNotes(){return `${day2Header('备忘录')}<div class="scroll d2-scroller"><div class="d2-note"><small>周六 · 09:13</small><h3>今天</h3><p>门禁记录。昨晚的维修工单还在相册里。</p></div><button class="d2-action" onclick="go('clues')">查看已经记录的异常　›</button>${state.day2TicketSeen?'<div class="d2-note"><small>新记录</small><h3>不一致的解释</h3><p>小林认为那可能是昨晚维修留下的，但记录发生在10月23日23:44。两者时间不符。</p></div>':''}</div></div>`}
function renderDayTwoPage(){
 if(state.page==='day2-chapter'){
  view.innerHTML=`<div class="cover-game chapter d2-chapter"><div class="cover-supra">CHAPTER 02</div><h1>Day 2</h1><div class="chapter-rule"></div><div class="day-date">2036年10月25日 · 周六</div><p class="d2-beta">Day 2 目前处于测试阶段</p><button class="chapter-continue" onclick="go('day2-wake')">点击继续 <span>↗</span></button></div>`;return true;
 }
 if(state.page==='day2-wake'){
  view.innerHTML=`<div class="cover-game scene d2-wake"><div class="scene-top"><small>09:13 · 周六</small><h2>第二天。</h2><p>醒来时，天已经亮了。</p><p>脚步和维修声还停留在脑海里。你伸手去摸手机。</p><div class="d2-sleep-changes"><span>饱腹感 −25</span><span>精神压力 +20</span><span>体力 +5</span></div></div><button class="phone-view-cta" onclick="day2StartPhone()">查看手机 <span>→</span></button></div>`;return true;
 }
 if(state.day!==2)return false;
 if(state.day2LinStep===1)day2ScheduleLinReply();
 if(state.page==='day2-claim-door'){
  view.innerHTML=rrCG('closed','302 室 · 玄关','门禁提示：已认领。<br>紧接着，楼道里响起脚步声。<br>有人敲门，自称是来核实通行记录的工作人员。<br>你打开了门。<br>门外的人没有佩戴工牌。','day2OpenDoorEnd()','继续','still');return true;
 }
 if(state.page==='day2-group'){
  if(!state.day2RulesRead||state.day2BurstDone&&!state.day2GroupAlertRead){state.day2RulesRead=true;if(state.day2BurstDone)state.day2GroupAlertRead=true;store()}
  const old=groupEntries().map(m=>msg(m.speaker,m.body,'friend',!!m.mine)).join('');
  const extra=state.day2BurstDone?msg('物业管家-小林','先不要进行新的设备关联。物业正在检查门禁系统。','house'):'';
  view.innerHTML=`<div class="screen chat-screen d2-group-screen"><header class="page-head"><div class="head-left"><button class="back-btn" onclick="goBack()">‹</button><h2 style="font-size:15px">${E('业主群名称')} <small>(${groupCount()})</small></h2></div><button class="icon-btn" onclick="go('members')">⋯</button></header>${!state.day2RulesViewed?`<button class="chat-pinned" onclick="go('day2-rules')">📌 今日群通知：关于异常通行记录的核验　›</button>`:''}<div class="scroll" id="d2-chat-scroll"><div class="chat-messages"><div class="day-divide">昨天 · 周五</div>${old}<div class="day-divide">今天 09:13</div>${msg('物业通知','关于异常通行记录的核验通知\n\n'+day2RuleText(),'black')}${msg('徐梅萍','怎么又是这个头像发的？昨天不是说跟物业没关系吗？','friend')}${msg('物业管家-小林','不是物业发的。门禁系统的情况我们会查，大家先别自行关联。','house')}${extra}</div></div><div class="reply-area d2-reply-area"><div class="reply-hint">群里暂时没有新的回复。</div>${!state.day2RulesViewed?'<button class="reply-option" onclick="go(\'day2-rules\')">仔细查看今天的规则 →</button>':''}<button class="reply-option" onclick="go('property')">打开物业服务 →</button></div></div>`;
  document.getElementById('d2-chat-scroll').scrollTop=999999;return true;
 }
 if(state.page==='day2-rules'){
  if(!state.day2RulesViewed){state.day2RulesViewed=true;store()}
  view.innerHTML=`${header('群公告','day2-group')}<div class="scroll rules-scroll"><div class="doc-section"><h2 class="doc-title">关于异常通行记录的核验通知</h2><p class="doc-date">10月25日 · 09:13 · 未识别账号</p><div class="doc-content">${clean(day2RuleText())}</div></div></div></div>`;return true;
 }
 if(state.page==='notes'){view.innerHTML=day2RenderNotes();return true}
 if(state.page==='day2-lin'){
  if(state.day2LinStep===2&&!state.day2LinRead){state.day2LinRead=true;store()}
  const step=state.day2LinStep||0;
  const base=linEntries().map(m=>msg(m.speaker,m.body,'house',!!m.mine)).join('');
  view.innerHTML=`<div class="screen chat-screen d2-lin"><header class="page-head"><div class="head-left"><button class="back-btn" onclick="goBack()">‹</button><h2>${clean(contactDisplay('小林'))}</h2></div><button class="icon-btn" onclick="openPerson('${encodeURIComponent('小林')}')">⋯</button></header><div class="scroll" id="d2-lin-scroll"><div class="chat-messages"><div class="day-divide">昨天 · 周五</div>${base}<div class="day-divide">今天 09:21</div>${step>=1?msg(state.playerId||'我','小林，门禁记录里前天那条未识别进入，是怎么回事？','renter',true):''}${step>=2?msg('小林','我也看到过那条记录。可能是昨晚维修的人，系统有时候会延迟显示。','house'):''}${step>=2&&state.day2TicketSeen?'<div class="d2-chat-thought">你保存的工单是昨晚的，门禁记录却属于前一天。</div>':''}</div></div>${step===0?`<div class="reply-area"><div class="reply-hint">你想问清楚那条记录。</div><button class="reply-option" onclick="day2SendLin()">小林，门禁记录里前天那条未识别进入，是怎么回事？</button></div>`:step===1?`<div class="chat-compose d1-waiting"><span>⊕</span><input disabled placeholder="消息已发送，等待回复…"/><span>☺</span></div>`:`<div class="reply-area"><div class="reply-hint">他的解释还有疑点。</div><button class="reply-option" onclick="go('gallery')">打开相册，核对维修工单 →</button><button class="reply-option" onclick="go('property')">返回物业服务 →</button></div>`}</div>`;
  document.getElementById('d2-lin-scroll').scrollTop=999999;return true;
 }
 if(state.page==='day2-access'){
  state.day2AccessSeen=true;
  if(state.day2TicketSeen&&typeof nightRecordEvidence==='function')nightRecordEvidence('day2record');
  view.innerHTML=`${day2Header('门禁记录')}<div class="scroll d2-scroller"><div class="d2-access-top"><span class="d2-eyebrow">锦苑花庭 · 三栋门禁</span><h2>异常通行记录</h2><p>未登记设备的通行记录不显示具体住户。</p></div>${state.day2BurstCount?`<div class="d2-warning-strip"><span class="d2-pulse"></span><strong>短时间内连续 ${state.day2BurstCount} 次未识别进入${state.day2BurstDone?'':'……'}</strong></div>`:''}<div class="d2-log-list">${day2AccessRows()}</div>${!state.day2Decision?`<div class="d2-action-stack"><p class="d2-small-label">10月23日 23:44 的记录尚未关联住户。</p>${state.day2LinStep>=2?'<p class="d2-evidence">小林猜测是维修人员留下的。</p>':''}${state.day2TicketSeen?`<p class="d2-evidence d2-evidence-highlight">你保存的维修工单是昨晚的。10月23日23:44的记录比它早了一天，不能算同一次维修。${state.day2LinStep>=2?'小林的解释对不上。':''}</p>`:''}<button class="d2-action" onclick="go('day2-lin')">微信联系小林，确认来源 →</button><button class="d2-action" onclick="go('gallery')">打开相册，核对昨晚工单 →</button><button class="d2-action d2-action-risk" onclick="day2Decide('claim')">认领这条记录</button><button class="d2-action" onclick="day2Decide('retain')">不认领，保留异常记录</button></div>`:`<div class="d2-action-stack"><p class="d2-small-label">你没有认领这条记录，也没有授权那台未知设备。</p>${state.day2BurstDone?'<p class="d2-evidence d2-evidence-highlight">七次未识别进入终于停止。门禁系统又收到一条设备关联申请。</p><button class="d2-action d2-action-major" onclick="go(\'day2-alert\')">查看关联申请 →</button>':'<p class="d2-evidence">门禁系统仍在不断发出未识别进入提示……</p>'}</div>`}</div></div>`;
  if(state.day2Decision==='retain'&&!state.day2BurstDone)queueMicrotask(day2ResumeBurst);return true;
 }
 if(state.page==='day2-alert'){
  view.innerHTML=`${day2Header('门禁安全核验')}<div class="scroll d2-scroller"><div class="d2-alert-head"><span class="d2-pulse"></span><small>09:42 · 门禁系统</small><h2>发现新的设备关联申请</h2><p>未知设备连续七次尝试进入三栋，申请登记到你的住户资料。</p></div><div class="d2-ticket-card"><div><span>设备标识</span><strong>未识别</strong></div><div><span>操作类型</span><strong>新增关联</strong></div><div><span>通行尝试</span><strong>${state.day2BurstCount} 次</strong></div><div><span>当前状态</span><strong>${state.day2BurstDone?'待确认':'处理中'}</strong></div></div><p class="d2-alert-explain">关联不是删除历史记录的必要步骤。只有确认该设备确实属于你时才应放行。</p><div class="d2-action-stack">${state.day2BurstDone?'<button class="d2-action d2-action-major" onclick="day2Finalize(false)">拒绝关联，保留记录</button><button class="d2-action d2-action-risk" onclick="day2Finalize(true)">确认关联并放行</button>':'<p>新的通行记录仍在写入……</p>'}<button class="d2-action" onclick="go('property')">返回物业服务</button></div></div></div>`;return true;
 }
 if(state.page==='day2-result'){
  view.innerHTML=`<div class="d2-result"><div class="d2-result-inner"><small>DAY 2 · 周六 / 测试段落</small><h1>已拒绝</h1><p>关联申请被拒绝。那台没有名字的设备，暂时没有再发出新的提示。</p><p>你没有认领异常记录，也没有主动向那台设备提供房号。</p><p class="d2-result-clue">昨晚保存的维修工单仍然在相册里。</p><div class="d2-beta-finish">Day 2 目前处于测试阶段<br>后续剧情尚未开放</div><button onclick="goHome()">返回手机</button><button onclick="openStoryNodes()">剧情回溯</button></div></div>`;return true;
 }
 return false;
}
