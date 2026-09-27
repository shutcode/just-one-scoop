/* Modern Earth campaign. Layer reference depths are inherited from V11.
   This is a scientific-fantasy cross-section, not a feasible excavation plan. */
const EARTH_STAGES = [
 {id:'surface',d:0,name:'土壤与浅部沉积',risk:'孔隙水、根系、脆弱化石',req:[],lab:'water'},
 {id:'crust',d:1,name:'深部地壳',risk:'粉尘、供氧、围岩稳定性',req:['oxygen','filter'],lab:'environment'},
 {id:'drill',d:12.262,name:'超深钻探尺度',risk:'地热、岩压与测量条件',req:['oxygen','filter','gas','support'],lab:'scale'},
 {id:'mantle',d:35,name:'上地幔',risk:'高温高压；普通材料无法建立通道',req:['oxygen','pressure','thermal'],lab:'convection'},
 {id:'transition',d:410,name:'地幔过渡带',risk:'高压晶体相变、设备耐受性',req:['oxygen','pressure','thermal','xrd'],lab:'mineral'},
 {id:'lower',d:660,name:'下地幔',risk:'高温固态岩石；仅科幻防护可继续',req:['field'],lab:'pressure'},
 {id:'outer',d:2890,name:'液态外核',risk:'液态金属、导电介质；改用科幻推进',req:['field','coolloop'],lab:'magnet'},
 {id:'inner',d:5150,name:'固态内核',risk:'极端压力与温度',req:['field','coolloop','center_nav'],lab:'gravity'}
];
const EARTH_STATIONS=[
 {id:'soil',d:.02,name:'离开表土',desc:'土壤、地下水和旧岩层，是第一批可以直接观察的证据。',reward:8,lab:'water'},
 {id:'drill',d:12.262,name:'人类深钻的尺度',desc:'这只是地球表面薄薄的一层；缩放地球图，比较地表和地心。',reward:16,lab:'scale'},
 {id:'mantle',d:35,name:'地幔之门',desc:'此处按约35 km的大陆地壳参考界面设计；真实莫霍面不处处同深。',reward:22,lab:'convection'},
 {id:'410',d:410,name:'晶格的重排',desc:'高压下晶体结构改变；比较矿物相，而不只是看颜色。',reward:26,lab:'xrd'},
 {id:'660',d:660,name:'更深的固体',desc:'高温地幔主要仍为固态；“能缓慢流动”不是“全是岩浆”。',reward:30,lab:'pressure'},
 {id:'outer',d:2890,name:'液态金属边界',desc:'从挖岩切换为幻想航行；用地震波证据研究外核。',reward:36,lab:'wave'},
 {id:'inner',d:5150,name:'温度不是唯一答案',desc:'更深处主要是固态内核，温度、压力和成分共同影响物态。',reward:40,lab:'pressure'}
];
function earthStage(d){return [...EARTH_STAGES].reverse().find(s=>d>=s.d)||EARTH_STAGES[0];}
function distanceToSegment(px,py,ax,ay,bx,by){let dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy,t=l?clamp(((px-ax)*dx+(py-ay)*dy)/l,0,1):0;return Math.hypot(px-ax-dx*t,py-ay-dy*t);}
class EarthJourney {
 constructor(g){this.g=g;this.stations=[];this.rewarded=new Set;this.previous=null;this.minCenter=REAL_R;this.guide=false;this.guidedExit={x:0,y:1};this.stageNotice='';this.lastHint=-100;this.surveyRewards=new Set;}
 get active(){return this.g.campaign==='earth'&&this.g.world.regionId==='earth';}
 get stage(){return earthStage(this.g.world.depth(this.g.hero.x,this.g.hero.y));}
 begin(){this.stations=[{id:'start',name:'地表营地',x:this.g.hero.x,y:this.g.hero.y}];this.g.expedition.visited=new Set(['earth']);this.g.expedition.skills.add('record');this.g.notify('地心远征回来了','整颗地球是同一张地图。浅层调查、深部研究和挖穿另一侧都在这段旅程里。','globe',()=>this.open());}
 missingFor(d){return this.g.expedition.missing(earthStage(d).req);}
 permitDepth(d,announce=true){if(!this.active||!this.g.expedition.expert)return true;let missing=this.missingFor(d);if(!missing.length)return true;if(announce)this.g.expedition.warn('前方需要新的研究与装备',earthStage(d).name+'：'+this.g.expedition.skillNames(missing)+'。可以原路后退、打开装备树或免费返回已到达的接力站。');return false;}
 permitStep(x,y){let current=this.g.world.depth(this.g.hero.x,this.g.hero.y),next=this.g.world.depth(x,y);if(next<current-.0000001)return true;return this.permitDepth(next);}
 permitDash(id){if(!this.active)return true;if(!this.g.expedition.expert)return true;let a=worldGeo(this.g.hero.x,this.g.hero.y),u=norm(this.g.controller.dir.x,this.g.controller.dir.y),km=id==='stone'?10:100,b={x:a.x+u.x*km,y:a.y+u.y*km},maxDepth=REAL_R-distanceToSegment(0,0,a.x,a.y,b.x,b.y);if(!this.permitDepth(Math.max(0,maxDepth)))return false;
  if(maxDepth>=1&&!this.freshReport()){this.g.expedition.warn('先记录当前地层的环境','打开远征站 → 环境测量，再作跨层推进。');return false;}return true;}
 freshReport(){let e=this.g.expedition,r=e.reports.get('earth');return !!r&&this.g.time-r.time<300&&r.earthStage===this.stage.id;}
 mayWork(tool,pose){if(!this.active||!this.g.expedition.expert)return true;
  // Moving out of an inaccessible layer is always permitted after import/rescue.
  let d=this.g.world.depth(this.g.hero.x,this.g.hero.y),p=this.g.controller.dir,n=this.g.world.depth(this.g.hero.x+p.x*4,this.g.hero.y+p.y*4);if(n<d-1e-8)return true;
  if(!this.permitDepth(d))return false;
  if(d>=1&&!this.freshReport()&&!['scan'].includes(tool)){this.g.expedition.warn('这个圈层还没有有效环境报告','每换一个环境阶段重新测量。报告有效五分钟；不会消耗研究点。');return false;}return true;
 }
 environment(){let s=this.stage,d=this.g.world.depth(this.g.hero.x,this.g.hero.y);return{pressure:d<1?'浅层岩土；不套用海水静压公式':d<35?'随埋深总体增大；这里不输出伪精确数值':'高压条件 · 仅科幻防护等级',oxygen:d<.02?'浅层通道；先观测再挖掘':'不能依赖天然通风，需要生命支持',temp:d<1?'浅部随地区而异':d<35?'地温总体升高':'高温 · 科幻隔热 / 冷却',risk:s.risk};}
 surveyCompleted(first){let e=this.g.expedition,r=e.reports.get('earth');if(r)r.earthStage=this.stage.id;if(!this.surveyRewards.has(this.stage.id)){this.surveyRewards.add(this.stage.id);if(!first)this.g.research+=8;this.g.dirty=true;}}
 tick(dt){if(!this.active)return;let g=this.g,p=worldGeo(g.hero.x,g.hero.y),old=this.previous||p;this.minCenter=Math.min(this.minCenter,distanceToSegment(0,0,old.x,old.y,p.x,p.y));this.previous=p;
  const d=g.world.depth(g.hero.x,g.hero.y);
  // Milestones never replace the world. They attach relay records to the reached route.
  for(let m of EARTH_STATIONS){if(g.maxDepth>=m.d&&!this.rewarded.has(m.id)){this.rewarded.add(m.id);g.milestones.add(m.d);g.research+=m.reward;this.stations.push({id:m.id,name:m.name,x:g.hero.x,y:g.hero.y});g.science.unlockDepth(m.d);g.dirty=true;g.notify(m.name,m.desc+' · 研究支持 +'+m.reward,'flag',()=>this.open());g.expedition.celebrateUntil=g.time+2;}}
  if(this.minCenter<=2&&!g.reachedCenter){g.reachedCenter=true;this.guide=false;this.guidedExit=norm(g.controller.dir.x,g.controller.dir.y);this.rewarded.add('center');this.stations.push({id:'center',name:'地心观测区',x:g.hero.x,y:g.hero.y});g.research+=50;g.science.discover('k073',true);g.chapter('地心来信','已进入地心 ±2 km 观测区。精确中心的净重力为零；继续前进，去地球另一侧。','HALFWAY · NOT THE END');g.dirty=true;}
  const radius=Math.hypot(p.x,p.y);if(g.reachedCenter&&!g.finished&&Math.hypot(g.hero.x,g.hero.y-RW)>=RW&&g.hero.y>RW){g.finished=true;this.guide=false;this.stations.push({id:'exit',name:'另一侧地表',x:g.hero.x,y:g.hero.y});g.science.discover('k081',true);g.chapter('我们从另一边出来了','同一张地图上的路线完整保留。旅程完成后仍可回看洞穴、研究标本和继续探索。','EARTH CROSSED');g.research+=60;g.dirty=true;g.save();}
  if(g.finished&&!g.endShown&&!g.chapterUntil){g.endShown=true;g.openSummary(true);}
  this.updateStrip();
 }
 updateStrip(){let g=this.g,bar=$('journeyStrip');if(!bar)return;bar.hidden=!this.active||g.mode!=='play';if(bar.hidden)return;const pg=worldGeo(g.hero.x,g.hero.y),center=Math.hypot(pg.x,pg.y),phase=g.finished?'另一侧地表':g.reachedCenter?'出心返程':'向地心深入';$('journeyStage').textContent=phase+' · '+this.stage.name;$('journeyDistance').textContent=g.reachedCenter?'距地表 '+g.world.depth(g.hero.x,g.hero.y).toFixed(1)+' km':'距地心 '+center.toFixed(1)+' km';$('journeyGuide').textContent=this.guide?'罗盘锁向 · 开':g.reachedCenter?'向另一侧':'向地心';$('journeyGuide').classList.toggle('active',this.guide);}
 direction(){if(!this.guide||!this.active)return null;let g=this.g;if(!g.reachedCenter){let r=Math.hypot(g.hero.x,g.hero.y-RW);if(r<.8){this.guide=false;return null;}return norm(-g.hero.x,RW-g.hero.y);}return this.guidedExit;}
 toggleGuide(){this.guide=!this.guide;this.g.stopInput();this.updateStrip();this.g.notify(this.guide?'罗盘已锁定目标方向':'已回到自由挖掘',this.guide?'仍需按住画面才会挖掘；罗盘只校正航向，不自动开图。再次点击可取消，恢复任意方向。':'鼠标、单指、方向键可自由选择任意方向。','globe');}
 dock(id=null){let st=id?this.stations.find(s=>s.id===id):this.stations[this.stations.length-1];if(!st)st={...this.g.world.spawn,name:'地表营地'};let g=this.g;g.stopInput();g.controller.dash=null;g.hero={x:st.x,y:st.y};g.cam={...g.hero};g.controller.tool='spoon';g.controller.updatePose();g.expedition.recharge();g.updateTools();g.closePanel();g.updateObjects();g.dirty=true;this.guide=false;this.previous=worldGeo(g.hero.x,g.hero.y);g.notify('补给完成 · '+st.name,'只返回已经亲自到达的接力站。地图、装备、样本和知识保留。','heart');}
 open(){let g=this.g;g.openPanel('journey','现代地球 · 地心远征','ONE CONTINUOUS EARTH · NO MISSING CAMPAIGN');let stage=this.stage,missing=this.missingFor(g.world.depth(g.hero.x,g.hero.y));
  $('panelBody').innerHTML=`<div class="journeyPage"><div class="journeyHeading"><div><span class="eyebrow">${g.expedition.expert?'HELL · RESEARCH BEFORE ENTRY':'EXPLORER · FOLLOW YOUR CURIOSITY'}</span><h2>${g.finished?'挖穿地球，路线还在':g.reachedCenter?'已经过地心，向另一侧出发':'一张地图，从今天到地心'}</h2><p>地表不是一张入口图，地心也不是单独场景。沿你亲手挖开的隧道不断前进；回到浅层也仍是原来的地图。</p></div><button id="journeyEarthMap">查看整颗地球 ↗</button></div><div class="journeyMetrics"><div><small>地理深度</small><strong>${g.world.depth(g.hero.x,g.hero.y).toFixed(2)} km</strong></div><div><small>最深记录</small><strong>${g.maxDepth.toFixed(2)} km</strong></div><div><small>样本报告</small><strong>${g.expedition.samples.filter(s=>s.finished).length} 份</strong></div><div><small>已到达接力站</small><strong>${this.stations.length} 处</strong></div></div><div class="journeyGrid"><section><h3>当前任务：${stage.name}</h3><p>${stage.risk}</p><p class="notice">${g.expedition.expert?(missing.length?'待准备：'+g.expedition.skillNames(missing):'环境装备满足；继续关注本层测量报告和补给。'):'探索难度借用必要的科幻防护；仍可自己研发全部研究方法与装备。'}</p><div class="settingActions"><button id="journeySurvey">环境测量</button><button id="journeySkills">研究与装备</button><button id="journeySamples">样本档案</button><button id="journeyLabs">科学实验</button><button id="journeyCharges">稀有道具充能</button></div><h3>按实际到访路线设立的接力站</h3><p class="notice">可补给或回到已经到达的站点，不传送到未探索的深度。</p><div class="relayList">${this.stations.map(st=>`<button data-relay="${esc(st.id)}">${esc(st.name)} <span>返回 / 补给</span></button>`).join('')}</div></section><section><h3>远征航程</h3><div class="earthMilestones">${EARTH_STATIONS.map(m=>`<div class="${this.rewarded.has(m.id)?'done':''}"><i></i><strong>${m.name}</strong><small>${m.d.toLocaleString()} km 参考节点</small><span>${this.rewarded.has(m.id)?'已到达':'尚未到达'}</span></div>`).join('')}<div class="${g.reachedCenter?'done':''}"><i></i><strong>地心观测区</strong><small>平均地球半径 6,371 km</small><span>${g.reachedCenter?'已到达':'继续深入'}</span></div><div class="${g.finished?'done':''}"><i></i><strong>另一侧地表</strong><small>穿越后继续自由探索</small><span>${g.finished?'已完成':'地心不是终点'}</span></div></div></section></div><p class="notice">地层边界为简化参考；现代浅层含程序化教学沉积盆地，化石时代按所在岩性单元预设，不由深度推算。地幔与地核收集的是科学观测/实验数据，不是现实采矿。所有通行装备为科幻设定。</p><button id="journeyBack" class="primary">继续挖掘 →</button></div>`;
  $('journeyEarthMap').onclick=()=>g.map.open('earth');$('journeySurvey').onclick=()=>g.expedition.open('environment');$('journeySkills').onclick=()=>g.expedition.open('workshop');$('journeySamples').onclick=()=>g.expedition.open('samples');$('journeyLabs').onclick=()=>g.science.gallery();$('journeyCharges').onclick=()=>g.openBench();$('journeyBack').onclick=()=>g.closePanel();document.querySelectorAll('[data-relay]').forEach(b=>b.onclick=()=>this.dock(b.dataset.relay));
 }
 mission(){let g=this.g;if(g.finished)return['来自另一侧的问候','地球已挖穿。查看全景路线，完成报告，或继续探索。',1,'已完成 · 地图与研究继续保留'];if(g.reachedCenter)return['地心不是终点','继续向另一侧地表前进。罗盘可锁定出发时的穿越方向。',1-g.world.depth(g.hero.x,g.hero.y)/REAL_R,'出心返程 · '+g.world.depth(g.hero.x,g.hero.y).toFixed(1)+' km 到地表'];let next=EARTH_STATIONS.find(s=>!this.rewarded.has(s.id));return next?[next.name,next.desc,Math.min(1,g.maxDepth/next.d),'目标 '+next.d.toLocaleString()+' km · 环境研究与接力补给可随时打开']:['向地心寄一封信','内核也是完整世界的一部分；开启罗盘，继续靠近地球中心。',g.maxDepth/REAL_R,'目标地心 · 尚未结束'];}
 serialize(){return {stations:this.stations,rewarded:[...this.rewarded],minCenter:this.minCenter,surveyRewards:[...this.surveyRewards],guidedExit:this.guidedExit};}
 restore(s){this.stations=(s?.stations||[]).filter(p=>p&&typeof p.id==='string'&&Number.isFinite(p.x)&&Number.isFinite(p.y)).slice(0,30);this.rewarded=new Set(s?.rewarded||[]);this.minCenter=Number.isFinite(s?.minCenter)?s.minCenter:REAL_R;this.surveyRewards=new Set(s?.surveyRewards||[]);this.guidedExit=s?.guidedExit&&Number.isFinite(s.guidedExit.x)&&Number.isFinite(s.guidedExit.y)?norm(s.guidedExit.x,s.guidedExit.y):{x:0,y:1};this.previous=null;this.guide=false;if(!this.stations.length&&this.active)this.stations=[{id:'start',name:'地表营地',...this.g.world.spawn}];if(!s){for(let m of EARTH_STATIONS)if(this.g.maxDepth>=m.d)this.rewarded.add(m.id);}}
}
