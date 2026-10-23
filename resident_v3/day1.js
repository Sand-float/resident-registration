/* 《住户登记》 Day 1 standalone story module.
 * Original event logic and images; no code/assets from reference projects.
 * Core UI and save state are supplied by game.js.
 */
const DAY1_TASKS=[
 {id:'boxes',title:'整理纸箱',hint:'把客厅里的杂物整理一下',image:'assets/boxes.svg',action:'开始整理',cost:'体力 −12',costClass:'minus',changes:{stamina:-12,stress:2,mood:5}},
 {id:'door',title:'检查门窗',hint:'确认门锁与窗扣正常',image:'assets/door.svg',action:'检查门窗',cost:'压力 −2',costClass:'plus',changes:{stamina:-2,stress:-2,mood:2}},
 {id:'food',title:'简单吃点东西',hint:'忙了一天，先垫垫肚子',image:'assets/meal.svg',action:'开始用餐',cost:'饱腹感 +25',costClass:'plus',changes:{stamina:5,satiety:25,mood:3}}
];
APP_DESKTOP_ICONS['身体状态']='assets/status.svg';

// Dialogue phases live in the save, so returning to chat or refreshing never
// fabricates the player's words or silently completes an unasked question.
let dayOneInquiryTimer=null, dayOneMimiTimer=null;
function dayOneReplyDelay(){return Math.max(1350,Number(state.messageSpeed)||2200)}
function migrateDayOneConversationSave(snapshot){
 if(snapshot.dayOneFlowRevision===2)return;
 const anyTask=Object.values(state.dayOneTasks||{}).some(Boolean);
 if(state.dayOneChoice==='neighbor'||state.dayOneChoice==='group'){
  // Reopen the inquiry if the old release auto-completed it before any chores.
  if(!anyTask&&!state.dayOneSlept){state.dayOneAsked=false;state.dayOneInquiryStep=0;state.dayOneInquiryTextChoice=0;}
  else{state.dayOneInquiryStep=2;state.dayOneAsked=true;state.dayOneInquiryTextChoice=1;}
 }else if(state.dayOneChoice==='none'){state.dayOneAsked=true;state.dayOneInquiryStep=2;}
 if(state.dayOneMimiStep>=1&&!state.dayOneSlept){state.dayOneMimiStep=0;state.dayOneMimiChoice=0;}
 else if(state.dayOneMimiStep>=2){state.dayOneMimiStep=4;}
 state.dayOneInquirySentAt=0;state.dayOneMimiSentAt=0;state.dayOneFlowRevision=2;
}
function dayOneInquiryText(kind,choice){
 const k=kind==='neighbor'?'Day1问邻居':'Day1问物业';
 return T(k+(choice===2?'备选':'')+'正文')||T(k+'正文');
}
function dayOneInquiryResponse(kind,choice){
 const k=kind==='neighbor'?'Day1邻居回应':'Day1物业回应';
 return T(k+(choice===2?'2':'1'))||T(k);
}
function dayOneInquiryOptions(kind){
 return `<div class="reply-area d1-reply-area"><div class="reply-hint">你想怎么开口？</div>${[1,2].map(i=>`<button class="reply-option" onclick="sendDayOneInquiry(${i})">${clean(dayOneInquiryText(kind,i))}</button>`).join('')}</div>`;
}
function dayOnePendingFooter(){return `<div class="chat-compose d1-waiting"><span>⊕</span><input disabled placeholder="消息已发送，等待回复…"/><span>☺</span></div>`;}
function dayOneChatFooter(){
 if(!state.dayOneAsked&&state.dayOneInquiryStep===0)return dayOneInquiryOptions('group');
 if(state.dayOneInquiryStep===1)return dayOnePendingFooter();
 return `<div class="chat-compose"><span>⊕</span><input disabled placeholder="当前没有更多可发送的消息"/><span>☺</span></div>`;
}
function dayOneNeighborFooter(){
 if(!state.dayOneAsked&&state.dayOneInquiryStep===0)return dayOneInquiryOptions('neighbor');
 if(state.dayOneInquiryStep===1)return dayOnePendingFooter();
 return `<div class="chat-compose"><span>⊕</span><input disabled placeholder="暂时没有更多可发送的消息"/><span>☺</span></div>`;
}
function sendDayOneInquiry(choice){
 if(![1,2].includes(choice)||!['neighbor','group'].includes(state.dayOneChoice)||state.dayOneInquiryStep!==0)return;
 const kind=state.dayOneChoice;
 state.dayOneInquiryTextChoice=choice;
 state.dayOneInquiryStep=1;
 state.dayOneInquirySentAt=Date.now();
 state.stress=dayOneClamp(state.stress+(kind==='neighbor'?1:2));
 store();render();scheduleDayOneConversationReplies();
}
function deliverDayOneInquiry(){
 dayOneInquiryTimer=null;
 if(state.dayOneInquiryStep!==1 || !['neighbor','group'].includes(state.dayOneChoice))return;
 const kind=state.dayOneChoice;
 state.dayOneInquiryStep=2;state.dayOneAsked=true;
 store();
 const target=kind==='neighbor'?'neighbor':'chat';
 const name=kind==='neighbor'?'王雨桐':'物业管家-小林';
 const text=dayOneInquiryResponse(kind,state.dayOneInquiryTextChoice);
 if(!isViewingTarget(target))banner(text,name,target);
 if(state.page!=='rules'&&state.page!=='members')render();
}
function deliverDayOneMimi(){
 dayOneMimiTimer=null;
 if(![1,3].includes(state.dayOneMimiStep))return;
 const first=state.dayOneMimiStep===1;
 state.dayOneMimiStep=first?2:4;
 if(!first){markNode('mimi');}
 store();
 const text=first?T('Day1闺蜜回应'+(state.dayOneMimiChoice||1)):T('Day1闺蜜收尾');
 if(state.page!=='mimi-story'){state.mimiUnread=(state.mimiUnread||0)+1;banner(text,'米米','mimi-story');}else state.mimiUnread=0;
 store();
 if(state.page!=='rules'&&state.page!=='members')render();
}
function scheduleDayOneConversationReplies(){
 if(state.dayOneInquiryStep===1&&state.dayOneInquirySentAt>0){
  if(!dayOneInquiryTimer){
   const wait=Math.max(30,Number(state.dayOneInquirySentAt)+dayOneReplyDelay()-Date.now());
   dayOneInquiryTimer=setTimeout(deliverDayOneInquiry,wait);
  }
 }else if(dayOneInquiryTimer){clearTimeout(dayOneInquiryTimer);dayOneInquiryTimer=null;}
 if([1,3].includes(state.dayOneMimiStep)&&state.dayOneMimiSentAt>0){
  if(!dayOneMimiTimer){
   const wait=Math.max(30,Number(state.dayOneMimiSentAt)+dayOneReplyDelay()-Date.now());
   dayOneMimiTimer=setTimeout(deliverDayOneMimi,wait);
  }
 }else if(dayOneMimiTimer){clearTimeout(dayOneMimiTimer);dayOneMimiTimer=null;}
}

function dayOneSync(){
 if(state.phoneActivated && Number(state.yutongStage)>=5 && !state.dayOneUnlocked){
  state.dayOneUnlocked=true;
  state.dayOneTasks=state.dayOneTasks||{};
  store();
 }
 if(!state.dayOneTasks || typeof state.dayOneTasks!=='object')state.dayOneTasks={};
 if(state.dayOneMimiStep>=4)scheduleLinEvent();
}
function unlockDayOne(){if(!state.dayOneUnlocked){state.dayOneUnlocked=true;state.dayOneTasks=state.dayOneTasks||{};store();}if(state.page==='home')render();}
function dayOneOnNavigate(p){if(p==='body-status'){state.dayOneBodySeen=true;findClue('body');markNode('body');store();}}
const dayOneAllDone=()=>DAY1_TASKS.every(t=>!!state.dayOneTasks?.[t.id]);
const dayOneCompleted=()=>DAY1_TASKS.filter(t=>!!state.dayOneTasks?.[t.id]).length;
function dayOneHomeGuide(){
 if(state.endingKind)return `<div class="d1-home-tip"><span>DAY 1</span><strong>这一夜留下了记录</strong><button onclick="go('day-end')">查看结局 →</button></div>`;
 if(!state.dayOneBodySeen)return `<div class="d1-home-tip d1-discovery"><span>桌面</span><strong>这里多出一个以前没有的图标。</strong><small>试着打开看看。</small></div>`;
 if(!state.dayOneAsked){if(state.dayOneChoice){const target=state.dayOneChoice==='neighbor'?'neighbor':'chat';return `<div class="d1-home-tip d1-discovery"><span>微信</span><strong>${state.dayOneInquiryStep===1?'还有一条回复没来':'你还没把话问完'}</strong><button onclick="go('${target}')">看看消息 →</button></div>`;}return `<div class="d1-home-tip d1-discovery"><span>未读</span><strong>关于那些数据，有人知道吗？</strong><button onclick="go('body-status')">查看身体状态 →</button></div>`;}
 if(!dayOneAllDone())return `<div class="d1-home-tip d1-discovery"><span>备忘录</span><strong>今晚还有些东西没收拾。</strong><small>打开备忘录，看看待办事项。</small></div>`;
 if(state.dayOneMimiStep<4)return `<div class="d1-home-tip d1-discovery"><span>微信</span><strong>想和米米说说今天发生的事。</strong><button onclick="openDirect('${encodeURIComponent('米米')}')">打开聊天 →</button></div>`;
 if(state.linPhase==='idle')return `<div class="d1-home-tip d1-discovery"><span>手机</span><strong>通知栏闪了一下。</strong><small>去微信看看哪条会话有未读。</small></div>`;
 if(state.linPhase==='visible')return `<div class="d1-home-tip d1-discovery"><span>微信 · 新消息</span><strong>微信出现了一条新消息。</strong><button onclick="openWechatRow('lin')">打开微信 →</button></div>`;
 if(!state.linResponded)return `<div class="d1-home-tip d1-discovery"><span>微信</span><strong>那个会话还停在消息列表最上面。</strong><small>手机里的其他应用也许留下了不同的记录。</small></div>`;
 return `<div class="d1-home-tip d1-discovery"><span>21:23</span><strong>夜里终于安静下来。</strong><button onclick="go('day1-night')">放下手机 →</button></div>`;
}
function dayOneTaskTitle(task){return T('Day1'+task.title+'标题')||task.title}
function dayOneTaskDesc(task){return T('Day1'+task.title+'描述')||task.hint}
function dayOneTaskResult(task){return T('Day1'+task.title+'结果')||'事情做完了。'}
function dayOneClamp(n){return Math.min(100,Math.max(0,Math.round(Number(n)||0)))}
function d1Header(name){return `<div class="screen app-white d1-screen"><header class="app-header"><button class="icon-btn" onclick="goBack()" aria-label="返回上一页">‹</button><h2>${clean(name)}</h2><div class="right-space"></div></header>`;}
function d1Metric(label,num,color,note){
 const n=dayOneClamp(num);
 return `<div class="d1-metric"><div class="d1-metric-top"><span>${label}</span><strong>${n}<small> / 100</small></strong></div><div class="d1-track"><span style="width:${n}%;background:${color}"></span></div>${note?`<small class="d1-metric-note">${note}</small>`:''}</div>`;
}
function renderDayOnePage(){
 const page=state.page;
 if(page==='body-status'){
  if(!state.dayOneBodySeen){state.dayOneBodySeen=true;findClue('body');markNode('body');store()}
  view.innerHTML=`${d1Header('身体状态')}<div class="scroll d1-flat-scroll"><div class="d1-eyebrow">个人状态 · Day 1</div><div class="d1-status-identity"><img src="assets/status.svg" alt=""/><div><strong>${clean(state.playerId||'新住户')}</strong><small>锦苑花庭 · 302室</small></div></div><div class="d1-status-intro">忙了一整天，身体还在努力适应搬家的节奏。</div>${d1Metric('体力',state.stamina,'#80bba5','整理物品和行动会消耗体力')}${d1Metric('饱腹感',state.satiety,'#dba979','吃东西可以补充饱腹感')}${d1Metric('心情',state.mood,'#bb98c8','今晚发生的事情可能影响心情')}${d1Metric('精神压力',state.stress,'#d48c91','数值越高，压力越大')}<p class="d1-fineprint">以上为游戏角色的虚构状态数值。</p><button class="d1-primary" onclick="go('day1-choose')">关于这些数字，要问问谁吗？ →</button><p class="d1-flow-caption">也可以先返回桌面，再决定下一步。</p></div></div>`;
  return true;
 }
 if(page==='notes'&&state.dayOneUnlocked){
  const done=dayOneCompleted();
  view.innerHTML=`${d1Header('备忘录')}<div class="scroll d1-flat-scroll d1-notes"><div class="d1-eyebrow">我的待办 · 今日</div><h2 class="d1-big-heading">今晚要做的事</h2><p class="d1-subheading">回家后的几件小事，做完就能休息了。</p><div class="d1-progress"><span>已完成 ${done} / ${DAY1_TASKS.length}</span><span>${Math.round(done/DAY1_TASKS.length*100)}%</span></div><div class="d1-progress-track"><span style="width:${done/DAY1_TASKS.length*100}%"></span></div><div class="d1-task-list">${DAY1_TASKS.map(t=>{const yes=!!state.dayOneTasks[t.id];return `<button class="d1-task-row ${yes?'completed':''}" onclick="openDayOneTask('${t.id}')"><img src="${t.image}" alt=""/><span class="d1-task-copy"><strong>${dayOneTaskTitle(t)}</strong><small>${yes?'已完成':clean(t.hint)}</small></span><span class="d1-switch ${yes?'on':''}" role="switch" aria-checked="${yes}" aria-label="${clean(t.title)}${yes?'已完成':'待完成'}"><i></i></span></button>`}).join('')}</div><div class="d1-note-divider"></div><button class="d1-note-link" onclick="go('clues')"><span>奇怪的事情</span><small>${state.clues} 条线索　›</small></button>${!state.dayOneBodySeen?`<button class="d1-secondary" onclick="go('body-status')">查看身体状态 →</button>`:''}${done===DAY1_TASKS.length?`<div class="d1-task-next"><p>今晚的待办都完成了。</p>${state.dayOneMimiStep<4?`<button class="d1-primary" onclick="openDirect('${encodeURIComponent('米米')}')">打开微信 · 米米 →</button>`:`<button class="d1-primary" onclick="go('wechat')">返回微信，看看有没有新消息 →</button>`}</div>`:''}</div></div>`;
  return true;
 }
 if(page==='day1-task'){
  const t=DAY1_TASKS.find(a=>a.id===state.dayOneTaskId)||DAY1_TASKS[0];
  if(state.dayOneTasks[t.id]){state.dayOneTaskId=t.id;state.page='day1-task-result';return renderDayOnePage()}
  view.innerHTML=`${d1Header(dayOneTaskTitle(t))}<div class="scroll d1-event"><div class="d1-event-image"><img src="${t.image}" alt="${clean(dayOneTaskTitle(t))}场景插画"/></div><div class="d1-event-copy"><span class="d1-eyebrow">晚间行动</span><h2>${dayOneTaskTitle(t)}</h2><p>${clean(dayOneTaskDesc(t))}</p><div class="d1-effect ${t.costClass}">${clean(t.cost)}</div></div><div class="d1-event-bottom"><button class="d1-primary" onclick="completeDayOneTask('${t.id}')">${t.action}</button><button class="d1-text-action" onclick="goBack()">稍后再做</button></div></div></div>`;
  return true;
 }
 if(page==='day1-task-result'){
  const t=DAY1_TASKS.find(a=>a.id===state.dayOneTaskId)||DAY1_TASKS[0];
  view.innerHTML=`${d1Header('待办已完成')}<div class="scroll d1-event"><div class="d1-event-image"><img src="${t.image}" alt=""/></div><div class="d1-event-copy"><span class="d1-eyebrow">已完成 · 20:${16+dayOneCompleted()*8}</span><h2>${dayOneTaskTitle(t)} <span class="d1-check">✓</span></h2><p>${clean(dayOneTaskResult(t))}</p><div class="d1-effect ${t.costClass}">${clean(t.cost)}</div></div><div class="d1-event-bottom"><button class="d1-primary" onclick="go('notes')">返回待办 →</button></div></div></div>`;
  return true;
 }
 if(page==='day1-choose'){
  if(!state.dayOneBodySeen){goHome();return true}
  view.innerHTML=`${d1Header('今晚的消息')}<div class="scroll d1-choice-page"><span class="d1-eyebrow">20:43 · 一点疑惑</span><h2>${E('Day1选择标题')}</h2><p>${E('Day1选择说明')}</p><div class="d1-choice-list"><button onclick="chooseDayOneInquiry('neighbor')"><strong>问问王雨桐</strong><small>和隔壁邻居再聊聊</small><span>›</span></button><button onclick="chooseDayOneInquiry('group')"><strong>问问物业群</strong><small>看看小林有没有新消息</small><span>›</span></button><button onclick="chooseDayOneInquiry('none')"><strong>什么都不问</strong><small>暂时不问，先把手头的事做完</small><span>›</span></button></div></div></div>`;
  return true;
 }
 if(page==='mimi-story'){
  state.mimiUnread=0;
  if(!state.dayOneAsked||!dayOneAllDone()){goHome();return true}
  const step=Number(state.dayOneMimiStep)||0;
  const bubbles=[`<div class="day-divide">今天 20:48</div>`,msg('米米',T('Day1闺蜜开场1'),'friend'),msg('米米',T('Day1闺蜜开场2'),'friend')];
  if(step>=1)bubbles.push(msg(state.playerId||'我',T('Day1闺蜜玩家回复'+(state.dayOneMimiChoice||1)),'renter',true));
  if(step>=2)bubbles.push(msg('米米',T('Day1闺蜜回应'+(state.dayOneMimiChoice||1)),'friend'));
  if(step>=3)bubbles.push(msg(state.playerId||'我',T('Day1闺蜜玩家晚安')||'好呀，晚安～','renter',true));
  if(step>=4)bubbles.push(msg('米米',T('Day1闺蜜收尾'),'friend'));
  const actions=step===0?`<div class="reply-area d1-reply-area"><div class="reply-hint">回复米米</div><button class="reply-option" onclick="replyDayOneMimi(1)">${E('Day1闺蜜玩家回复1')}</button><button class="reply-option" onclick="replyDayOneMimi(2)">${E('Day1闺蜜玩家回复2')}</button></div>`:
    step===1||step===3?dayOnePendingFooter():
    step===2?`<div class="reply-area d1-reply-area"><div class="reply-hint">回复米米</div><button class="reply-option" onclick="finishDayOneMimi()">${E('Day1闺蜜玩家晚安')||'好呀，晚安～'}</button></div>`:
    `<div class="chat-compose"><span>⊕</span><input disabled placeholder="已读 · 暂无新消息"/><span>☺</span></div>`;
  view.innerHTML=`<div class="screen chat-screen d1-mimi-chat"><div class="page-head"><div class="head-left"><button class="back-btn" onclick="goBack()">‹</button><h2>${clean(displayContact('米米'))}</h2></div><button class="icon-btn" onclick="openPerson('${encodeURIComponent('米米')}')">⋯</button></div><div class="scroll" id="mimi-day1-scroll"><div class="chat-messages">${bubbles.join('')}</div></div>${actions}</div>`;
  document.getElementById('mimi-day1-scroll').scrollTop=99999;
  return true;
 }
 if(page==='day1-night'){
  if(state.linPhase==='visible'&&!state.linResponded){go('wechat');return true}
  view.innerHTML=`<div class="screen d1-night-screen"><button class="d1-night-back" onclick="goHome()">‹</button><div class="d1-night-scene"><img src="assets/night.svg" alt="静静亮着窗灯的夜晚"/></div><div class="d1-night-text"><span class="d1-eyebrow">Day 1 · 23:10</span><p>${E('Day1睡前正文')}</p><p>${E('Day1睡前异样')}</p><button class="d1-night-sleep" onclick="finishDayOneSleep()">关灯休息 →</button></div></div>`;
  return true;
 }
 if(page==='day-end'){
  const kind=state.endingKind||'ordinary';
  const copy=kind==='survival'?['幸存','你照着那条短暂出现的信息，否认了昨夜23:44的记录。','系统暂停核验的几分钟里，你从消防楼梯离开。经过一楼值班台，玻璃下压着一张发黄的寻人启事。上面的人是小林的妹妹，两年前在这栋楼失踪。','你终于明白他为什么不该发、却还是发了那条消息。再回头时，302的窗户后面站着另一个影子。']:
    kind==='anomaly'?['异常登记','你确认了两份互相矛盾的住户资料。','页面自动刷新，302的住户只剩下一人。你的姓名消失了，门禁却显示有人正在用你的身份上楼。','锁芯缓缓转动。门外的人似乎知道，你会习惯性地给自己开门。']:
    ['无事发生','你关上灯，把手机放在枕边。','门外安静得像什么都没有发生过。','第二天依然普通，只有那条被撤回的消息没有再出现。'];
  view.innerHTML=`<div class="d1-end-screen"><div class="d1-end-inner"><span class="d1-eyebrow">RESIDENT REGISTRATION · ENDING</span><span class="d1-end-rule"></span><h1>Day 1</h1><h2>${copy[0]}</h2><p>${copy.slice(1).map(clean).join('<br><br>')}</p><div class="d1-end-numbers"><span>待办完成 <b>${dayOneCompleted()} / ${DAY1_TASKS.length}</b></span><span>已记录异常 <b>${state.anomalyFound?.length||0} 条</b></span></div><button onclick="go('recall')">查看树状回溯 →</button><button onclick="returnDayOneTitle()">返回标题 →</button></div></div>`;
  return true;
 }
 return false;
}
function openDayOneTask(id){
 if(!state.dayOneAsked){notify('先查看身体状态，再决定要不要问问情况');return}
 const t=DAY1_TASKS.find(t=>t.id===id);if(!t)return;
 state.dayOneTaskId=id;store();go(state.dayOneTasks[id]?'day1-task-result':'day1-task');
}
function completeDayOneTask(id){
 const t=DAY1_TASKS.find(t=>t.id===id);if(!t||state.dayOneTasks[id])return;
 state.dayOneTasks[id]=true;
 for(const [key,delta]of Object.entries(t.changes)){state[key]=dayOneClamp((Number(state[key])||0)+delta)}
 if(dayOneAllDone())markNode('tasks');store();go('day1-task-result');
}
function chooseDayOneInquiry(kind){
 if(!state.dayOneBodySeen){notify('先看看新出现的「身体状态」');goHome();return}
 if(state.dayOneAsked){notify('已经决定过要问谁了');goHome();return}
 if(!['neighbor','group','none'].includes(kind))return;
 state.dayOneChoice=kind;markNode(kind==='neighbor'?'ask-neighbor':kind==='group'?'ask-group':'ask-none');state.dayOneInquiryStep=kind==='none'?2:0;state.dayOneInquiryTextChoice=0;state.dayOneAsked=kind==='none';
 // A question opens the corresponding conversation, but returning from it
 // must take the player to the home screen rather than back into the choice menu.
 store();
 if(kind==='none'){goHome();return}
 go(kind==='neighbor'?'neighbor':'chat');
 state.navStack=['home'];store();
}
function replyDayOneMimi(choice){
 if(!state.dayOneAsked||!dayOneAllDone()){notify('先完成今晚的事');goHome();return}
 if(state.dayOneMimiStep!==0)return;
 state.dayOneMimiStep=1;state.dayOneMimiChoice=choice;state.dayOneMimiSentAt=Date.now();state.mood=dayOneClamp(state.mood+3);store();render();scheduleDayOneConversationReplies();
}
function finishDayOneMimi(){
 if(state.dayOneMimiStep!==2)return;
 state.dayOneMimiStep=3;state.dayOneMimiSentAt=Date.now();store();render();scheduleDayOneConversationReplies();
}
function finishDayOneSleep(){
 if(!dayOneAllDone()||state.dayOneMimiStep<4){notify('今天还有些事没有做完');return}
 state.dayOneSlept=true;state.stamina=dayOneClamp(state.stamina+12);
 beginOrdinaryEnding();
}
function returnDayOneTitle(){
 state.page='intro';state.navStack=[];
 cancelNarrative();render();
}
