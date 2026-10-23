/* 住户登记 · 原创剧情节点与结局档案。
 * 参考通用互动叙事的「即时存档 / 节点快照 / 永久收集」分离原则，
 * 不依赖参考游戏的代码、图鉴数据或任何图片。
 */
const RR_ARCHIVE_KEY='resident_registration_archive_v2';
const RR_ARCHIVE_VERSION=2;
const RR_NODES=[
 {id:'phone',name:'查看手机',tag:'20:16 · 开场',desc:'这晚的消息从这里开始。',page:'home',ready:s=>!!s.phoneActivated},
 {id:'group-reply',name:'查看群公告',tag:'微信群 · 调查',desc:'群里有人指出那条奇怪的通知。',page:'chat',ready:s=>s.stage>=7&&!s.reply},
 {id:'neighbor-reply',name:'看邻居消息',tag:'微信私聊 · 选择',desc:'认识住在 301 的王雨桐。',page:'neighbor',ready:s=>s.yutongStage===2&&!s.yutongReply},
 {id:'status-discovery',name:'发现新应用',tag:'手机桌面 · 异常',desc:'发现那款从未安装过的应用。',page:'home',ready:s=>s.dayOneUnlocked&&!s.dayOneBodySeen},
 {id:'investigate',name:'决定询问',tag:'身体状态 · 分岔',desc:'看完身体数据后选择如何回应。',page:'day1-choose',ready:s=>s.dayOneBodySeen&&!s.dayOneChoice},
 {id:'group-alert',name:'群内追问',tag:'危险支线',desc:'在群里向小林提出敏感问题。',page:'chat',ready:s=>s.dayOneChoice==='group'&&s.dayOneInquiryStep===2&&!s.nightChoice},
 {id:'group-ending',name:'公开追问',tag:'BE 03',desc:'群聊里的追问导致的结局。',page:'night-ending',ready:s=>s.storyEnding==='day1-group-death'},
 {id:'neighbor-ask',name:'询问王雨桐',tag:'邻居支线',desc:'向隔壁邻居确认自己的疑惑。',page:'neighbor',ready:s=>s.dayOneChoice==='neighbor'&&s.dayOneInquiryStep===2&&!s.nightChoice},
 {id:'no-ask',name:'暂时不问',tag:'沉默支线',desc:'先不问别人，做自己的事。',page:'home',ready:s=>s.dayOneChoice==='none'&&s.dayOneAsked&&!s.nightChoice},
 {id:'chores',name:'完成待办',tag:'家务 · 自由行动',desc:'整理纸箱、检查门窗、吃点东西。',page:'notes',ready:s=>s.dayOneAsked&&s.dayOneChoice!=='group'&&!Object.values(s.dayOneTasks||{}).some(Boolean)},
 {id:'mimi',name:'和米米聊天',tag:'微信 · 夜谈',desc:'待办结束，和闺蜜聊聊今晚。',page:'mimi-story',ready:s=>s.dayOneAsked&&s.dayOneChoice!=='group'&&typeof dayOneAllDone==='function'&&dayOneAllDone()&&s.dayOneMimiStep===0},
 {id:'night-choice',name:'睡前选择',tag:'夜晚 · 分岔',desc:'关灯睡觉，还是再刷刷手机？',page:'day1-night',ready:s=>s.dayOneChoice!=='group'&&s.dayOneMimiStep>=4&&!s.nightChoice&&!s.storyEnding},
 {id:'sleep-branch',name:'直接睡觉',tag:'危险支线',desc:'熄灯后听到走廊里的脚步。',page:'night-danger',ready:s=>s.nightChoice==='sleep'&&!s.storyEnding},
 {id:'sleep-ending',name:'未修门牌',tag:'BE 01',desc:'没有修好门牌。',page:'night-ending',ready:s=>s.nightChoice==='sleep'&&s.storyEnding==='day1-no-repair-death'},
 {id:'late-screen',name:'继续看手机',tag:'手机调查',desc:'放下睡意，继续检查手机。',page:'home',ready:s=>s.nightChoice==='browse'&&s.nightPhase==='waiting'},
 {id:'lin-withdraw',name:'看小林消息',tag:'微信 · 限时事件',desc:'收到后又被撤回的私信。',page:'direct-chat',ready:s=>s.nightChoice==='browse'&&s.nightLinMessage===2},
 {id:'late-misread',name:'错误报修',tag:'手机调查 · 危险分岔',desc:'按普通维修理解小林的暗示。',page:'night-danger',ready:s=>s.nightChoice==='misread'&&!s.storyEnding},
 {id:'late-misread-end',name:'门外脚步',tag:'BE 02 · 错误路线',desc:'门牌仍在核对名单上。',page:'night-ending',ready:s=>s.nightChoice==='misread'&&s.storyEnding==='day1-sleep-death'},
 {id:'repair',name:'提交报修',tag:'物业服务 · 操作',desc:'查看门牌并留下报修记录。',page:'repairs',ready:s=>['accepted','fixed'].includes(s.nightRepairStatus)&&!s.storyEnding},
 {id:'quiet-night',name:'放下手机',tag:'深夜 · 危险',desc:'没有维修门牌。',page:'night-danger',ready:s=>s.nightChoice==='ignored'&&!s.storyEnding},
 {id:'repair-fixed',name:'门牌修好',tag:'物业维修',desc:'听见工具声后，确认维修结束。',page:'night-after-repair',ready:s=>s.nightRepairStatus==='fixed'&&!s.storyEnding},
 {id:'ignored-ending',name:'未修门牌',tag:'BE 01',desc:'没有修理门牌。',page:'night-ending',ready:s=>s.nightChoice==='ignored'&&s.storyEnding==='day1-no-repair-death'},
 {id:'first-night',name:'第一夜幸存',tag:'Day 1 · 生还',desc:'门外的人略过了 302 室。',page:'day-end',ready:s=>s.storyEnding==='day1-survivor'}
];
const RR_ENDINGS=[
 {id:'day1-survivor',name:'第一夜 · 幸存',kind:'survival',chapter:1,summary:'你读到小林撤回的消息，查看门牌并报修。维修工到场，重新固定了 302 的门牌。这一夜，你活了下来。'},
 {id:'day1-no-repair-death',name:'BE 01 · 未修门牌',kind:'bad',chapter:1,summary:'302 的门牌尚未修好。夜里，脚步停在门口，门锁转动，房门被打开。'},
 {id:'day1-group-death',name:'BE 03 · 公开追问',kind:'bad',chapter:1,summary:'你在群里公开追问。夜里，脚步停在 302 室门前，房门被打开。'},
 {id:'day1-sleep-death',name:'BE 02 · 错误报修',kind:'bad',chapter:1,summary:'错误的报修事项没有让门牌得到维修。第一夜，门外来者推开了 302 的门。'}
];
function rrDefaultArchive(){return {version:RR_ARCHIVE_VERSION,nodes:{},branches:{},endings:{}}}
function rrReadArchive(){
 try{
  const data=JSON.parse(localStorage.getItem(RR_ARCHIVE_KEY)||'null');
  if(data&&typeof data==='object')return {...rrDefaultArchive(),...data,nodes:data.nodes||{},branches:data.branches||{},endings:data.endings||{}};
  // Old linear checkpoints were sometimes incorrectly unlocked. Never migrate those;
  // carry over confirmed ending discoveries only.
  const old=JSON.parse(localStorage.getItem('resident_registration_archive_v1')||'null');
  if(old?.endings){const next=rrDefaultArchive();next.endings=old.endings;return next}
 }catch(e){}return rrDefaultArchive();
}
function rrWriteArchive(data){try{localStorage.setItem(RR_ARCHIVE_KEY,JSON.stringify(data));return true}catch(e){return false}}
function rrCloneState(){const snapshot=JSON.parse(JSON.stringify(state));snapshot.navStack=[];delete snapshot.profileDraft;delete snapshot.dayOneTaskId;return snapshot}
let rrRestoring=false;
let rrArchiveReturn='intro';
function rememberStoryMilestones(){
 if(rrRestoring||!state.playerId||!state.phoneActivated||!state.storyRunId)return;
 const archive=rrReadArchive();let dirty=false;
 if(!state.storyCaptured||typeof state.storyCaptured!=='object')state.storyCaptured={};
 for(const node of RR_NODES){
  if(state.storyCaptured[node.id]||!node.ready(state))continue;
  state.storyCaptured[node.id]=true;
  const snapshot=rrCloneState();snapshot.page=node.page;snapshot.navStack=[];snapshot.storyCaptured={...state.storyCaptured};if(node.id==='lin-withdraw')snapshot.dmPerson='小林';
  // Replay points must be a genuine pre-choice state, not one with post-choice responses.
  if(node.id==='phone'){snapshot.stage=0;snapshot.phoneStartAt=Date.now();}
  archive.nodes[node.id]={at:Date.now(),runId:state.storyRunId,version:1,snapshot};
  dirty=true;
 }
 if(state.dayOneChoice&&['neighbor','group','none'].includes(state.dayOneChoice)&&!archive.branches[state.dayOneChoice]){archive.branches[state.dayOneChoice]=Date.now();dirty=true}
 if(state.storyEnding&&RR_ENDINGS.some(e=>e.id===state.storyEnding)&&!archive.endings[state.storyEnding]){archive.endings[state.storyEnding]={at:Date.now(),stats:{stamina:state.stamina,clues:state.clues,choice:state.dayOneChoice}};dirty=true}
 if(dirty)rrWriteArchive(archive);
}
function rrArchiveOpen(page){
 rrArchiveReturn=state.page;
 // Archive pages are an out-of-world menu and must not capture themselves as checkpoints.
 state.page=page;
 render();
}
function openStoryNodes(){rrArchiveOpen('story-nodes')}
function openEndingArchive(){rrArchiveOpen('story-endings')}
function rrArchiveBack(){
 if(state.page==='story-ending-detail'){state.page='story-endings';render();return}
 const dest=rrArchiveReturn&& !['story-nodes','story-endings','story-ending-detail'].includes(rrArchiveReturn)?rrArchiveReturn:'intro';
 state.page=dest;render();
}
function rrOpenEnding(id){
 if(!rrReadArchive().endings[id])return;
 const entry=RR_ENDINGS.find(item=>item.id===id);if(!entry)return;
 state.endingArchiveId=id;state.page='story-ending-detail';render();
}
function rrAskRewind(id){
 const checkpoint=rrReadArchive().nodes[id];const node=RR_NODES.find(n=>n.id===id);
 if(!checkpoint?.snapshot||!node)return;
 const root=document.querySelector('#overlay-root');
 root.innerHTML=`<div class="rr-confirm-overlay"><div class="rr-confirm-box" role="dialog" aria-modal="true" aria-label="剧情回溯确认"><small>剧情回溯</small><h2>回到「${clean(node.name)}」？</h2><p>当前正在游玩的剧情进度会被这个节点覆盖。已经解锁的节点和结局图鉴会保留，你可以重新选择另一条路。</p><button class="rr-btn-primary" onclick="rrConfirmRewind('${id}')">确定回溯</button><button class="rr-btn-quiet" onclick="rrCloseRewind()">取消</button></div></div>`;
}
function rrCloseRewind(){document.querySelector('#overlay-root').innerHTML=''}
function rrConfirmRewind(id){
 const record=rrReadArchive().nodes[id];const node=RR_NODES.find(n=>n.id===id);
 if(!record?.snapshot||!node)return;
 // Cancel all running conversations BEFORE replacing state, so old timelines cannot
 // send messages into the restored one.
 rrRestoring=true;
 try{
  cancelNarrative();if(typeof nightCancelTimers==='function')nightCancelTimers();clearTimeout(bannerTimer);bannerTimer=null;
  if(typeof dayOneInquiryTimer!=='undefined'&&dayOneInquiryTimer){clearTimeout(dayOneInquiryTimer);dayOneInquiryTimer=null}
  if(typeof dayOneMimiTimer!=='undefined'&&dayOneMimiTimer){clearTimeout(dayOneMimiTimer);dayOneMimiTimer=null}
  document.getElementById('incoming-banner')?.remove();rrCloseRewind();
  const restored=JSON.parse(JSON.stringify(record.snapshot));
  const keepTheme=state.theme,keepSpeed=state.messageSpeed;
  Object.assign(state,defaultState,restored,{page:node.page,navStack:[],theme:keepTheme,messageSpeed:keepSpeed,storyRunId:'run-'+Date.now()+'-'+Math.random().toString(36).slice(2)});
  state.storyCaptured={...restored.storyCaptured,[id]:true};
  if(state.dayOneInquiryStep===1){state.dayOneInquirySentAt=Date.now()}
  if([1,3].includes(state.dayOneMimiStep)){state.dayOneMimiSentAt=Date.now()}
  if(node.id==='phone'){state.phoneStartAt=Date.now();state.stage=0}
  if(node.id==='late-screen'){state.nightPhase='waiting';state.nightStep=Date.now()+2300;state.nightLinMessage=0;state.nightLinOpenedAt=0;state.nightLinAsk=0;state.nightRepairStatus='';state.nightDoorStep=0;state.nightMistake=''}
  rrArchiveReturn='intro';
  // Replace the ordinary save, never the permanent archive.
  store();render();
 }finally{rrRestoring=false}
 if(typeof scheduleNightEvents==='function')scheduleNightEvents();
 if(typeof scheduleDayOneConversationReplies==='function')scheduleDayOneConversationReplies();
 scheduleGroupNarrative();scheduleNeighborNarrative();scheduleGroupReaction();
 if(state.page==='chat')markGroupRead();if(state.page==='neighbor')markNeighborRead();
}
function rrSaveEnding(id){const archive=rrReadArchive();if(!archive.endings[id]){archive.endings[id]={at:Date.now(),stats:{stamina:state.stamina,clues:state.clues,choice:state.dayOneChoice}};rrWriteArchive(archive)}}
function rrArchiveHeader(eyebrow,title,subtitle){return `<header class="rr-archive-head"><button class="rr-archive-back" onclick="rrArchiveBack()" aria-label="返回">‹</button><small>${eyebrow}</small><h1>${title}</h1><p>${subtitle}</p></header>`}
function renderStoryArchivePage(){
 const page=state.page;if(!['story-nodes','story-endings','story-ending-detail'].includes(page))return false;
 if(page==='story-nodes'){
  const archive=rrReadArchive(),unlocked=RR_NODES.filter(n=>archive.nodes[n.id]).length;
  const branchNode=id=>{const n=RR_NODES.find(item=>item.id===id);if(!n)return '';const available=!!archive.nodes[id];const tag=available?'button':'div';return `<${tag} class="rr-tree-node ${available?'is-unlocked':'is-locked'}" data-node="${id}" ${available?`onclick="rrAskRewind('${id}')" title="点击回溯"`:'aria-disabled="true"'}><strong>${clean(n.name)}</strong></${tag}>`};
  const lane=ids=>ids.map(branchNode).join('<div class="rr-tree-connector"></div>');
  view.innerHTML=`<section class="rr-archive"><div class="rr-archive-scroll">${rrArchiveHeader('STORY TREE','剧情回溯',`已抵达 ${unlocked} / ${RR_NODES.length} 个节点 · 点亮走过的道路`)}<div class="rr-tree">${lane(['phone','group-reply','neighbor-reply','status-discovery','investigate'])}<div class="rr-tree-split"><div class="rr-tree-path"><div class="rr-tree-branch-tag">危险的追问</div>${lane(['group-alert','group-ending'])}</div><div class="rr-tree-path"><div class="rr-tree-branch-tag">没有公开追问</div><div class="rr-tree-mini-split"><div>${branchNode('neighbor-ask')}</div><div>${branchNode('no-ask')}</div></div>${lane(['chores','mimi','night-choice'])}<div class="rr-tree-mini-split"><div>${lane(['sleep-branch','sleep-ending'])}</div><div>${lane(['late-screen','lin-withdraw'])}<div class="rr-tree-mini-split"><div>${lane(['quiet-night','ignored-ending'])}</div><div>${lane(['repair','repair-fixed','first-night'])}${lane(['late-misread','late-misread-end'])}</div></div></div></div></div></div></div><div class="rr-branch-history"><strong>曾经作出的选择</strong><div>${[['neighbor','问王雨桐'],['group','问物业群'],['none','暂时不问']].map(([id,label])=>`<span class="${archive.branches[id]?'seen':''}">${archive.branches[id]?'✓':'·'} ${label}</span>`).join('')}</div></div><p class="rr-explain">只记录确实经过的节点。回溯时恢复该节点当时的状态；已收录结局不会消失。</p><button class="rr-archive-foot" onclick="openEndingArchive()">查看结局图鉴 →</button></div></section>`;
  return true;
 }
 if(page==='story-endings'){
  const records=rrReadArchive().endings,count=RR_ENDINGS.filter(e=>records[e.id]).length;
  view.innerHTML=`<section class="rr-archive"><div class="rr-archive-scroll">${rrArchiveHeader('ENDING COLLECTION','结局图鉴',`当前版本已记录 ${count} / ${RR_ENDINGS.length} 项章节结果`)}<div class="rr-endings-section"><h2>第一夜的不同命运</h2><div class="rr-endings-grid">${RR_ENDINGS.map((e,i)=>`<button class="rr-ending-card ${records[e.id]?'is-unlocked':'is-locked'}" ${records[e.id]?`onclick="rrOpenEnding('${e.id}')"`:'disabled'}><small>NO. ${String(i+1).padStart(3,'0')}</small><span>${records[e.id]?'✧':'◇'}</span><strong>${records[e.id]?clean(e.name):'？？？'}</strong><em>${records[e.id]?'已收录 · 查看详情':'尚未收录'}</em></button>`).join('')}</div></div><div class="rr-future-endings"><h2>后续章节</h2><p>这里记录 Day 1 的幸存或失败分支。完整故事的最终结局将在后续章节中逐步开放。</p></div><p class="rr-explain">结局与章节收集独立保存。新游戏、读档或剧情回溯都不会清空这些记录。</p><button class="rr-archive-foot" onclick="openStoryNodes()">前往剧情回溯 →</button></div></section>`;
  return true;
 }
 const e=RR_ENDINGS.find(item=>item.id===state.endingArchiveId);if(!e||!rrReadArchive().endings[e.id]){state.page='story-endings';return renderStoryArchivePage()}
 view.innerHTML=`<section class="rr-archive"><div class="rr-archive-scroll">${rrArchiveHeader('STORY ARCHIVE · DAY 1',clean(e.name),'已解锁剧情结局')}<div class="rr-ending-detail-ornament">✧</div><div class="rr-ending-detail-copy"><small>第一天 · 分支结果</small><p>${clean(e.summary)}</p><p>你可以返回剧情节点，试试另一种选择。</p></div><button class="rr-archive-foot" onclick="state.page='story-endings';render()">返回结局图鉴 →</button></div></section>`;
 return true;
}
