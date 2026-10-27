/* 《住户登记》Day 2 · 周六／测试章节（19版）。
 * 只复用首夜已确定的门牌保障、维修截图及门禁“未识别进入”线索。
 * 即便房号泄漏，只要门牌已修复，入侵者仍不能直接进入302室。
 */
const DAY2_RULES=[
 '今日10:00前，请各住户检查近三日的门禁通行记录。',
 '如发现「未识别进入」，请核实是否为本人邀请的访客或维修人员。',
 '无法确认来源的记录，请勿直接删除；请通过住户关联核验确认通行归属。',
 '核验期间如收到异常通行提醒，请勿擅自开门查看。'
];
const DAY2_BURST_TOTAL=19;
let day2BurstTimer=null,day2PopupTimer=null;
function day2StopBurst(){if(day2BurstTimer){clearTimeout(day2BurstTimer);day2BurstTimer=null}}
function day2Prepare(test=false){
 day2StopBurst();cancelNarrative();
 if(typeof nightCancelTimers==='function')nightCancelTimers();
 if(typeof SoundFX!=='undefined')SoundFX.stop();
 if(test){
  // Dev shortcut: only prepare test data, never record an unearned Day 1 ending.
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
  state.day2RulesRead=false;state.day2GroupAlertRead=false;state.day2TicketSeen=false;state.day2AccessSeen=false;
  state.day2LinSeen=false;state.day2Decision='';state.day2BurstCount=0;
  state.day2BurstDone=false;state.day2Final='';state.day2Clock=553;
 }
 state.day=2;state.day2TestMode=!!test;state.phoneActivated=false;
 state.page='day2-chapter';state.navStack=[];state.tab='微信';
 store();render();
}
function day2StartPhone(){
 state.phoneActivated=true;state.page='home';state.navStack=[];state.day2Clock=553;
 store();render();
}
function day2HomeHint(){
 const text=state.day2Final?'第二天的测试段落已经结束。':
  !state.day2RulesRead?'业主群有一条新的通知。':
  !state.day2Decision?'门禁记录里那条「未识别进入」还在。':
  !state.day2BurstDone?'门禁系统正在连续发出异常提醒。':'新的设备关联申请尚未处理。';
 return `<button class="d2-home-guide" onclick="${!state.day2RulesRead?"go('day2-group')":!state.day2Decision?"go('day2-access')":state.day2BurstDone?"go('day2-alert')":"go('day2-access')"}"><small>DAY 2 · 周六</small><strong>${text}</strong><span>查看 ›</span></button>`;
}
// Only the group row changes. Other chats keep their old, unedited history.
function day2WechatRows(){
 const previous=state.rrChatLastContent||{};
 const rows=[
  {label:T('业主群名称')+' ('+groupCount()+')',key:'group',snippet:state.day2BurstDone?'物业管家-小林：请不要继续关联异常设备。':'物业通知：关于异常通行记录的核验通知',unread:(!state.day2RulesRead?1:0)+(state.day2BurstDone&&!state.day2GroupAlertRead?1:0),time:state.day2BurstDone?'09:42':state.day2Decision==='group'?'09:34':'09:13'},
  {label:contactDisplay('米米'),key:'米米',snippet:formatPreview(mimiEntries()),unread:0,time:'昨天'},
  {label:contactDisplay('王雨桐'),key:'王雨桐',snippet:formatPreview(neighborEntries()),unread:0,time:'昨天'},
  {label:contactDisplay('妈妈'),key:'妈妈',snippet:formatPreview(directEntries('妈妈')),unread:0,time:'昨天'},
  {label:contactDisplay('小林'),key:'小林',snippet:state.day2LinSeen?'可能是昨晚的维修人员，门禁登记延迟了。':formatPreview(linEntries()),unread:0,time:state.day2LinSeen?'09:21':'昨天'},
  {label:contactDisplay('刘芳'),key:'刘芳',snippet:formatPreview(directEntries('刘芳')),unread:0,time:'昨天'},
  {label:'服务通知',key:'service',snippet:'快递服务：'+parcelMessage(),unread:0,time:'10月21日'}
 ];
 const rank=r=>/^09:/.test(r.time)?10000+rrConversationMinutes(r.time):rrConversationMinutes(r.time);
 return rows.sort((a,b)=>rank(b)-rank(a));
}
function day2OpenGroup(){state.day2RulesRead=true;state.day2Clock=Math.max(553,state.day2Clock||0);store();render();}
function day2AskLin(){state.day2LinSeen=true;state.day2Clock=Math.max(state.day2Clock||553,561);store();go('day2-lin');}
function day2Decide(decision){
 if(!['claim','retain','group'].includes(decision)||state.day2Decision)return;
 state.day2Decision=decision;state.day2Clock=574;
 if(decision==='claim'||decision==='group')state.day2RoomExposed=true;
 // The property team can share identifying records; the intruder cannot read the backend by magic.
 store();go(decision==='group'?'day2-group':'day2-access');day2ResumeBurst();
}
function day2BurstPopup(index){
 if(document.hidden)return;
 const screen=document.querySelector('.phone-screen');if(!screen)return;
 document.getElementById('day2-intrusion-banner')?.remove();
 const item=document.createElement('div');item.id='day2-intrusion-banner';item.className='d2-intrusion-banner';item.setAttribute('role','status');
 item.innerHTML=`<b><span class="d2-pulse"></span>门禁异常</b><span>未识别进入 · 第 ${String(index).padStart(2,'0')} 次</span>`;
 screen.appendChild(item);
 clearTimeout(day2PopupTimer);
 day2PopupTimer=setTimeout(()=>item.remove(),750);
}
function day2ResumeBurst(){
 if(day2BurstTimer||state.day!==2||!state.day2Decision||state.day2BurstDone||document.hidden||state.day2Final)return;
 const advance=()=>{
  day2BurstTimer=null;
  if(state.day!==2||document.hidden||!state.day2Decision||state.day2Final)return;
  state.day2BurstCount=Math.min(DAY2_BURST_TOTAL,Number(state.day2BurstCount||0)+1);
  state.day2Clock=574+Math.floor(state.day2BurstCount/7);
  // One sound per new attempt; no audio is queued when the tab is hidden.
  if(typeof SoundFX!=='undefined')SoundFX.play('message',state.day2BurstCount%5===0?.9:.68);
  day2BurstPopup(state.day2BurstCount);
  if(state.day2BurstCount===DAY2_BURST_TOTAL){
   state.day2BurstDone=true;state.day2GroupAlertRead=false;state.day2Clock=582;
  }
  store();
  if(['day2-access','day2-alert','home','wechat'].includes(state.page))render();
  if(!state.day2BurstDone)day2BurstTimer=setTimeout(advance,530);
  else {setTimeout(()=>{if(state.day===2&&!state.day2Final&&!document.hidden){notify('新的设备核验申请已送达');if(typeof SoundFX!=='undefined')SoundFX.play('anomaly',.32);}},850)}
 };
 day2BurstTimer=setTimeout(advance,700);
}
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){day2StopBurst();clearTimeout(day2PopupTimer);document.getElementById('day2-intrusion-banner')?.remove()}
 else if(state.day===2)day2ResumeBurst();
});
function day2Finalize(allow){
 if(!state.day2BurstDone||state.day2Final)return;
 if(allow)state.day2RoomExposed=true;
 state.day2Final=allow?'approved':'rejected';state.day2Clock=586;
 store();go('day2-result');
}
function day2RuleText(){return DAY2_RULES.map((r,i)=>`<p><b>${i+1}.</b> ${clean(r)}</p>`).join('')}
function day2AccessRows(){
 const n=Number(state.day2BurstCount)||0;
 let out='';
 for(let i=n;i>=1;i--){
  const min=34+Math.floor((i-1)/7),sec=String((i*3)%60).padStart(2,'0');
  out+=`<div class="d2-log-item d2-flash-log"><time>09:${min}:${sec}</time><div><strong>3栋 · 未识别进入</strong><small>来源：未登记设备　· 第 ${String(i).padStart(2,'0')} 次</small></div><span>!</span></div>`;
 }
 return out+`<div class="d2-log-item d2-legacy-log"><time>10月23日<br>23:44</time><div><strong>3栋 · 未识别进入</strong><small>来源：未登记设备</small></div><span>?</span></div>`;
}
function day2Header(name){return `<div class="screen app-white d2-screen"><header class="app-header"><button class="icon-btn" onclick="goBack()" aria-label="返回上一页">‹</button><h2>${clean(name)}</h2><div class="right-space"></div></header>`}
function day2RenderNotes(){return `${day2Header('备忘录')}<div class="scroll d2-scroller"><div class="d2-note"><small>周六 · 09:13</small><h3>今天</h3><p>门禁记录。昨晚的维修工单还在相册里。</p></div><button class="d2-action" onclick="go('clues')">查看已经记录的异常　›</button>${state.day2TicketSeen?'<div class="d2-note"><small>新记录</small><h3>不一致的解释</h3><p>小林说门禁异常可能是昨晚维修留下的。但那条记录发生在10月23日23:44，比昨晚的维修早了一天。</p></div>':''}</div></div>`}
function renderDayTwoPage(){
 if(state.page==='day2-chapter'){
  view.innerHTML=`<div class="cover-game chapter d2-chapter"><div class="cover-supra">CHAPTER 02</div><h1>Day 2</h1><div class="chapter-rule"></div><div class="day-date">2036年10月25日 · 周六</div><p class="d2-beta">Day 2 目前处于测试阶段</p><button class="chapter-continue" onclick="go('day2-wake')">点击继续 <span>↗</span></button></div>`;return true;
 }
 if(state.page==='day2-wake'){
  view.innerHTML=`<div class="cover-game scene d2-wake"><div class="scene-top"><small>09:13 · 周六</small><h2>第二天。</h2><p>醒来时，天已经亮了。</p><p>昨晚门外的工具声还留在记忆里。你伸手去摸手机。</p><div class="d2-sleep-changes"><span>饱腹感 −25</span><span>精神压力 +20</span><span>体力 +5</span></div></div><button class="phone-view-cta" onclick="day2StartPhone()">查看手机 <span>→</span></button></div>`;return true;
 }
 if(state.day!==2)return false;
 if(state.page==='day2-group'){
  if(!state.day2RulesRead||state.day2BurstDone&&!state.day2GroupAlertRead){state.day2RulesRead=true;if(state.day2BurstDone)state.day2GroupAlertRead=true;store();}
  const old=groupEntries().map(m=>msg(m.speaker,m.body,'friend',!!m.mine)).join('');
  const exposed=state.day2Decision==='group'?msg('我','我是302室的，门禁记录里有一条未识别进入。这到底是怎么回事？','renter',true):'';
  const extra=state.day2BurstDone?msg('物业管家-小林','请不要继续关联异常设备。物业正在核实门禁系统的问题。','house'):'';
  view.innerHTML=`<div class="screen chat-screen d2-group-screen"><header class="page-head"><div class="head-left"><button class="back-btn" onclick="goBack()">‹</button><h2 style="font-size:15px">${E('业主群名称')} <small>(${groupCount()})</small></h2></div><button class="icon-btn" onclick="go('members')">⋯</button></header><div class="scroll" id="d2-chat-scroll"><div class="chat-messages"><div class="day-divide">昨天 · 周五</div>${old}<div class="day-divide">今天 09:13</div>${msg('物业通知','关于异常通行记录的核验通知\n\n'+DAY2_RULES.map((r,i)=>(i+1)+'. '+r).join('\n\n'),'black')}${msg('徐梅萍','怎么又是这个头像？','friend')}${msg('物业管家-小林','这不是物业发布的通知。门禁记录确实有过识别异常，我们会检查。','house')}${exposed}${extra}</div></div><div class="reply-area d2-reply-area"><div class="reply-hint">这条通知没有经过物业确认。</div><button class="reply-option" onclick="go('day2-rules')">仔细查看今天的规则 →</button><button class="reply-option" onclick="go('day2-access')">去物业服务查看门禁记录 →</button></div></div>`;
  document.getElementById('d2-chat-scroll').scrollTop=999999;return true;
 }
 if(state.page==='day2-rules'){
  view.innerHTML=`${day2Header('群公告')}<div class="scroll rules-scroll"><div class="doc-section"><h2 class="doc-title">关于异常通行记录的核验通知</h2><p class="doc-date">10月25日 · 09:13</p><div class="doc-content d2-rules-text">${day2RuleText()}</div><p class="d2-unsigned">发布者：未识别账号</p><button class="d2-action" onclick="go('day2-access')">去核对门禁记录　›</button></div></div></div>`;return true;
 }
 if(state.page==='notes') {view.innerHTML=day2RenderNotes();return true}
 if(state.page==='day2-lin'){
  view.innerHTML=`<div class="screen chat-screen d2-lin"><header class="page-head"><div class="head-left"><button class="back-btn" onclick="goBack()">‹</button><h2>${clean(contactDisplay('小林'))}</h2></div><button class="icon-btn" onclick="openPerson('${encodeURIComponent('小林')}')">⋯</button></header><div class="scroll"><div class="chat-messages"><div class="day-divide">今天 09:21</div>${msg('我','10月23日23:44那条未识别进入是什么？','renter',true)}${msg('小林','可能是昨晚的维修人员，门禁登记延迟了。先别动那条记录。','house')}${state.day2TicketSeen?`<div class="d2-chat-thought">你想起昨夜保存的工单。时间似乎对不上。</div>`:''}</div></div><div class="reply-area"><div class="reply-hint">可以保留这段对话，再核对门禁记录。</div><button class="reply-option" onclick="go('gallery')">打开相册，查看维修工单 →</button><button class="reply-option" onclick="go('day2-access')">回到门禁记录 →</button></div></div>`;return true;
 }
 if(state.page==='day2-access'){
  state.day2AccessSeen=true;if(state.day2TicketSeen&&typeof nightRecordEvidence==='function')nightRecordEvidence('day2record');
  // No false claim of multiple physical intrusions: these are building access attempts, not entries into the protected apartment.
  view.innerHTML=`${day2Header('门禁记录')}<div class="scroll d2-scroller"><div class="d2-access-top"><span class="d2-eyebrow">锦苑花庭 · 三栋门禁</span><h2>异常通行记录</h2><p>来自未登记设备的记录不会显示具体住户。</p></div>${state.day2BurstCount?`<div class="d2-warning-strip"><span class="d2-pulse"></span><strong>短时间内连续 ${state.day2BurstCount} 次未识别进入${state.day2BurstDone?'':'……'}</strong></div>`:''}<div class="d2-log-list">${day2AccessRows()}</div>${!state.day2Decision?`<div class="d2-action-stack"><p class="d2-small-label">这条历史记录尚未关联住户。</p>${state.day2LinSeen?'<p class="d2-evidence">小林解释：可能是昨晚的维修人员。</p>':''}${state.day2TicketSeen?`<p class="d2-evidence d2-evidence-highlight">你保存的维修工单属于昨夜，但这条记录是10月23日23:44。${state.day2LinSeen?'小林的解释对不上。':'这两条记录并非同一次事件。'}</p>`:''}<button class="d2-action" onclick="day2AskLin()">私聊小林，确认来源 →</button><button class="d2-action" onclick="go('gallery')">打开相册，查看旧工单 →</button><button class="d2-action d2-action-risk" onclick="day2Decide('claim')">认领为本人住户的通行记录</button><button class="d2-action" onclick="day2Decide('retain')">暂不认领，保留原记录</button><button class="d2-action" onclick="day2Decide('group')">在群里说明自己住302并求助</button></div>`:`<div class="d2-action-stack"><p class="d2-small-label">${state.day2Decision==='claim'?'你已将通行记录关联到自己的住户资料。':state.day2Decision==='group'?'你在群里公开了自己的房号。':'你没有认领这条记录。'}</p>${state.day2BurstDone?'<p class="d2-evidence d2-evidence-highlight">门禁通行尝试突然停止。一条新的设备关联申请出现了。</p><button class="d2-action d2-action-major" onclick="go(\'day2-alert\')">查看新的设备关联申请 →</button>':'<p class="d2-evidence">门禁系统仍在不断发送未识别进入提醒……</p>'}</div>`}</div></div>`;
  if(state.day2Decision&&!state.day2BurstDone)queueMicrotask(day2ResumeBurst);return true;
 }
 if(state.page==='day2-alert'){
  view.innerHTML=`${day2Header('门禁安全核验')}<div class="scroll d2-scroller"><div class="d2-alert-head"><span class="d2-pulse"></span><small>09:42 · 门禁系统</small><h2>发现新的设备关联申请</h2><p>未登记设备连续尝试进入三栋，现申请补录为关联住户设备。</p></div><div class="d2-ticket-card"><div><span>设备标识</span><strong>未识别</strong></div><div><span>操作类型</span><strong>新增关联</strong></div><div><span>通行尝试</span><strong>${state.day2BurstCount} 次</strong></div><div><span>当前状态</span><strong>${state.day2BurstDone?'待住户确认':'处理中'}</strong></div></div><p class="d2-alert-explain">添加关联后，设备与当前认证住户建立联系。这并不是清除异常记录的必需步骤。</p><div class="d2-action-stack">${state.day2BurstDone?'<button class="d2-action d2-action-major" onclick="day2Finalize(false)">拒绝关联，保留异常记录</button><button class="d2-action d2-action-risk" onclick="day2Finalize(true)">允许将设备关联到本人住户</button>':'<p>新的通行记录仍在写入……</p>'}<button class="d2-action" onclick="go('day2-access')">返回查看记录</button></div></div></div>`;return true;
 }
 if(state.page==='day2-result'){
  const danger=!!state.day2RoomExposed;
  view.innerHTML=`<div class="d2-result"><div class="d2-result-inner"><small>DAY 2 · 周六 / 测试段落</small><h1>${state.day2Final==='approved'?'已关联':'已拒绝'}</h1><p>${state.day2Final==='approved'?'系统提示操作成功。你却不知道那台设备究竟属于谁。':'请求被拒绝，门禁记录仍在。楼道里暂时没有新的动静。'}</p><p>${danger?'但至少有一项信息已经与302室产生了联系。':'你的房号没有在这次核验中被主动关联给异常设备。'}</p><p class="d2-result-clue">昨夜真正完成的门牌维修仍然有效。知道房号，并不等于能够进入这间房。</p><div class="d2-beta-finish">Day 2 目前处于测试阶段<br>后续剧情尚未开放</div><button onclick="goHome()">返回手机</button><button onclick="openStoryNodes()">剧情回溯</button></div></div>`;return true;
 }
 return false;
}
