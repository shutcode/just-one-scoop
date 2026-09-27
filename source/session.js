/* V13: one engine, two campaigns, four isolated save profiles.
   Selecting a card never mutates the running world. Switching goes through a
   complete snapshot restore, rather than replacing the game or its listeners. */
const CAMPAIGNS = {
 earth: {name:'现代地球 · 地心远征', short:'地心远征', region:'earth', hint:'从今天的地表出发，自由开洞，经过地幔、外核、内核，抵达地心后继续挖向另一侧。'},
 field: {name:'地标地质 · 野外考察', short:'地质考察', region:'camp', hint:'去喜马拉雅、澄江、煤系与海沟；比较真实地貌背景下的时代、化石、矿物和研究方法。'}
};
class SessionManager {
 constructor(g){this.g=g;this.campaign='earth';this.difficulty='explorer';this.cache=new Map();this.started=false;this.wasPlaying=false;this.migrationNote='';}
 key(c=this.campaign,d=this.difficulty){return 'scoop-v13-'+c+'-'+d+'-save';}
 read(c=this.campaign,d=this.difficulty){let key=this.key(c,d);if(this.cache.has(key))return JSON.parse(JSON.stringify(this.cache.get(key)));try{let s=localStorage.getItem(key);if(s){let data=JSON.parse(s);this.g.validate(data);this.cache.set(key,data);return JSON.parse(JSON.stringify(data));}}catch(e){if(e.name==='SecurityError')this.g.saveOK=false;}return null;}
 store(snapshot){let key=this.key(snapshot.campaign,snapshot.expedition.mode);const encoded=JSON.stringify(snapshot);this.cache.set(key,JSON.parse(encoded));try{localStorage.setItem(key,encoded);this.g.saveOK=true;}catch(e){this.g.saveOK=false;}return key;}
 bind(){
  document.querySelectorAll('button[data-campaign]').forEach(b=>b.onclick=()=>this.select(b.dataset.campaign,this.difficulty));
  document.querySelectorAll('button[data-difficulty]').forEach(b=>b.onclick=()=>this.select(this.campaign,b.dataset.difficulty));
  $('startBtn').onclick=()=>this.start(false);$('freshBtn').onclick=()=>this.start(true);
  $('resumeRunning').onclick=()=>this.resume();$('importProfile').onclick=()=>this.g.import();
  $('openHome').innerHTML=icon('map');$('openHome').onclick=()=>this.open();
  $('previewLabs').onclick=()=>this.g.science.gallery();$('journeyGuide').onclick=()=>this.g.journey.toggleGuide();$('journeyStation').onclick=()=>this.g.journey.open();this.render();
 }
 select(c,d){if(!CAMPAIGNS[c]||!['explorer','hell'].includes(d))return;this.campaign=c;this.difficulty=d;this.render();}
 render(){
  const save=this.read(),cfg=CAMPAIGNS[this.campaign],hell=this.difficulty==='hell';
  document.querySelectorAll('button[data-campaign]').forEach(b=>{let on=b.dataset.campaign===this.campaign;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',on);});
  document.querySelectorAll('button[data-difficulty]').forEach(b=>{let on=b.dataset.difficulty===this.difficulty;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',on);});
  $('campaignDescription').textContent=cfg.hint;
  $('difficultyDescription').textContent=hell?'地狱难度：环境调查、逐级研发与补给都影响能否继续挖掘。暂停面板不耗氧，救援始终可用。':'探索难度：自由开图、不因生命资源失败；防护自动借用，研究、标本保护与装备成长照常保留。';
  $('startBtn').disabled=false;$('startBtn').textContent=save?'继续这一段旅程 →':'开始'+cfg.short+' →';
  $('freshBtn').hidden=!save;$('resumeRunning').hidden=!this.wasPlaying;
  $('profileState').textContent=save?`${cfg.short} · ${hell?'地狱':'探索'} | ${save.scienceLabel||((save.discovered||[]).length+' 个科学发现')} · ${save.campaign==='earth'?(save.maxDepth||0).toFixed(2)+' km 最深记录':(save.expedition.visited||[]).length+' 处已访问'} · 独立进度`:`${cfg.short} · ${hell?'地狱':'探索'} | 新旅程，与其余三个档位互不覆盖`;
  $('intro').dataset.campaign=this.campaign;$('intro').dataset.difficulty=this.difficulty;
 }
 blank(c,d){let g=this.g,w=new World(7241,CAMPAIGNS[c].region),stats={};for(let k of Object.keys(g.stats))stats[k]=0;
  return {format:'scoop-v13',version:13,campaign:c,simTime:0,seed:7241,regionId:w.regionId,hero:{...w.spawn},cam:{...w.spawn},energy:100,research:0,charges:{stone:0,machine:0},maxDepth:0,reachedCenter:false,finished:false,endShown:false,stats,settings:{...g.settings},water:[],sources:[],edits:[],dug:[],collected:[],poiSeen:[],objects:[],bounds:{...w.bounds},discovered:[],mastered:[],awarded:[],milestones:[],normalMilestones:[],journey:null,expedition:{mode:d,labels:true,skills:['record'],samples:[],reports:[],visited:[w.regionId],localMax:[],completed:[],oxygen:100,hull:100,heat:0,stability:100,rescues:0,worlds:[]}};
 }
 start(fresh=false){
  let g=this.g,s=this.read();if(fresh&&s&&!confirm('只重开当前选择的“'+CAMPAIGNS[this.campaign].short+' / '+(this.difficulty==='hell'?'地狱':'探索')+'”档位。其他三个存档不变。是否继续？'))return;
  if(this.started&&g.mode==='play')g.save();const continued=!!s&&!fresh;
  g.closePanel();g.notifyQueue=[];g.toastUntil=0;g.toastNext=0;g.chapterUntil=0;$('toast').hidden=true;$('chapterToast').hidden=true;
  g.restore(continued?s:this.blank(this.campaign,this.difficulty));
  g.hasSave=continued;g.mode='play';g.panelPinned=false;$('intro').hidden=true;$('hud').hidden=false;
  this.started=true;this.wasPlaying=true;g.lastObjects=-1;g.lastHUD=-1;g.lastSave=g.time;g.updateObjects();g.updateTools();g.resize();g.updateHUD();g.audio.start();
  if(!continued){g.expedition.enter();g.science.discover('k000',true);if(g.campaign==='earth')g.journey.begin();}
  else g.notify('继续'+CAMPAIGNS[g.campaign].short,'已恢复本档的洞穴、研究、装备与环境记录。','check');
  g.dirty=true;g.save();
 }
 open(){let g=this.g;if(g.panelType)g.closePanel();if(g.mode==='play'){g.save();this.wasPlaying=true;this.campaign=g.campaign;this.difficulty=g.expedition.mode;}g.stopInput();g.mode='intro';g.notifyQueue=[];g.toastUntil=0;$('toast').hidden=true;$('chapterToast').hidden=true;$('hud').hidden=true;$('intro').hidden=false;this.render();}
 resume(){if(!this.wasPlaying)return;let g=this.g;g.closePanel();g.mode='play';g.stopInput();$('intro').hidden=true;$('hud').hidden=false;g.updateHUD();}
 normalizeImport(raw){
  if(!raw||typeof raw!=='object')throw Error('不是有效的游戏存档。');let s=JSON.parse(JSON.stringify(raw));this.migrationNote='';
  if(s.format==='scoop-v11'&&s.version===11){let e=this.blank('earth','explorer');s={...e,...s,format:'scoop-v13',version:13,campaign:'earth',regionId:'earth',expedition:e.expedition,journey:null};this.migrationNote='已把 V11 路线、收藏与研究进度迁入现代地球探索档；新增技能从基础开始。';}
  else if(s.format==='scoop-v12'&&s.version===12){s.format='scoop-v13';s.version=13;s.campaign=s.regionId==='earth'?'earth':'field';s.journey=null;this.migrationNote='已迁移 V12，按当前场景放入'+CAMPAIGNS[s.campaign].short+'档位；保留原地形和研究记录。';}
  this.g.validate(s);return s;
 }
}
