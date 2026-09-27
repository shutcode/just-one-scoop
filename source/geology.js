// Regional geology is a teaching reconstruction, not a navigation-grade geological map.
const EXP=DATA.expedition, REGIONS=EXP.regions, AGES=Object.fromEntries(EXP.ages.map(a=>[a.id,a]));
const MINERALS=Object.fromEntries(EXP.minerals.map(m=>[m.id,m]));
const REGION=id=>REGIONS.find(r=>r.id===id)||REGIONS[0];
MATS.push(
 {n:'海相石灰岩',sub:'碳酸盐与生物碎屑',hard:1.8,col:'#bdbaa5'},
 {n:'层理泥页岩',sub:'薄层 · 可能保存细节',hard:1.4,col:'#859093'},
 {n:'煤系',sub:'有机质富集 · 先测气体',hard:1.1,col:'#535759'},
 {n:'凝灰岩',sub:'火山灰成岩 · 锆石时钟',hard:1.7,col:'#b8ad8f'},
 {n:'玄武质岩',sub:'洋壳火成岩 · 非沉积层',hard:3.1,col:'#667b7a'},
 {n:'层理砂岩',sub:'颗粒和交错层理',hard:2,col:'#b18a67'},
 {n:'冰雪与碎屑',sub:'高寒地形 · 保温与供氧',hard:.7,col:'#d5e8e1'},
 {n:'冲积砾砂',sub:'分选、圆度与搬运',hard:1.2,col:'#bca87b'}
);
function regionSurface(id,x){
 const r=REGION(id);if(id==='earth')return Math.abs(x)<RW?RW-Math.sqrt(RW*RW-x*x):0;
 const broad=noise(x/440,19,274)*32-16, fine=noise(x/93,13,362)*9;
 if(r.kind==='snow')return 20-205*Math.exp(-Math.pow(((x-360)/300),2))-100*Math.exp(-Math.pow(((x+450)/440),2))+broad+fine;
 if(r.kind==='canyon')return -100+240*Math.exp(-Math.pow(((x-530)/320),4))+Math.floor(Math.sin(x/270)*3)*13+broad*.45;
 if(r.kind==='trench')return -70+330*Math.exp(-Math.pow(((x-430)/350),2))+broad+fine;
 if(r.kind==='ocean')return 80-120*Math.exp(-Math.pow(((x-370)/185),2))+broad+fine;
 if(r.kind==='coal')return -10+Math.sin(x/480)*25+broad*.4;
 if(r.kind==='lake')return 35+45*Math.exp(-Math.pow(((x-350)/540),2))+broad*.6;
 return broad+fine;
}
function regionalDepth(id,x,y){return Math.max(0,y-regionSurface(id,x));}
function regionalBed(id,x,y){
 let r=REGION(id);if(id==='earth')return modernBed(x,y);
 let z=regionalDepth(id,x,y); // This vertical coordinate is deliberately not age.
 if(r.kind==='snow'&&z>80)z=81+Math.max(0,z-81+Math.sin(x/120)*120+Math.sin((x+z*.45)/260)*80);
 if(r.kind==='canyon'&&z>760)z+=(x-120)*.24; // simplified tilted Proterozoic strata
 let b=r.beds.find(b=>z<b.end)||r.beds[r.beds.length-1];return b;
}
function deepBed(d){
 let mat=d<.02?0:d<35?3:d<2890?5:d<5150?6:7;
 let name=layer(d),minerals=d<.02?['quartz','clay']:d<35?['quartz','feldspar','mica','magnetite','hematite']:d<410?['olivine','pyroxene']:d<520?['wadsleyite']:d<660?['ringwoodite']:d<2890?['bridgmanite','ferropericlase']:['alloy'];
 return{name,age:null,env:d<35?'地壳剖面示意':d<2890?'高温高压岩石 · 实验与地震学数据':'高压铁合金 · 虚拟数据包',mat,end:999999,fossils:[],minerals,note:'这里是物理圈层，不是沉积年代层；深部采集代表观测、实验与模型数据，不是实地采矿。'};
}
function ageLabel(id){let a=AGES[id];return a?`${a.name} · ${a.rank}`:'非沉积层 · 不按深度赋年代';}
function ageInterval(id){let a=AGES[id];return a?`${a.old}—${a.young} Ma`:'不适用';}
function enrichObject(world,o){
 if(o.regionId&&o.title)return o;
 let bed=world.stratum(o.x,o.y),r=REGION(world.regionId),h=hash(Math.floor(o.x),Math.floor(o.y),world.seed);
 o.regionId=r.id;o.bedName=bed.name;o.age=bed.age;o.environment=bed.env;o.material=bed.mat;
 if(o.type==='fossil'){
  if(!bed.fossils?.length){o.type='crystal'}else{o.fossilId=bed.fossils[Math.floor(h*bed.fossils.length)];o.title=EXP.fossils[o.fossilId][0];o.description=EXP.fossils[o.fossilId][1];o.sampleKind='fossil'}
 }
 if(o.type==='crystal'||o.type==='sample'){
  let ids=bed.minerals||['quartz'];o.mineralId=ids[Math.floor(h*ids.length)];let m=MINERALS[o.mineralId];o.title=m.name;o.description=m.note;o.sampleKind='mineral';
  if(r.id==='earth'&&world.depth(o.x,o.y)>=35){o.type='sample';o.sampleKind='deepdata';o.title+=' · 观测数据';}
 }
 if(o.type==='root'){o.title='根系与土壤团粒';o.sampleKind='ecology';o.description='记录环境后原位观察，不搬走地下小居民。'}
 if(o.type==='water'){o.title=r.water>0?'孔隙水观测点':'裂隙渗水';o.sampleKind='water';o.description='地下水主要存在于孔隙和裂隙中，动画流量采用游戏尺度。'}
 if(o.type==='stone'){o.title='远古石铲 · 科幻装备';o.sampleKind='tool'}
 if(o.type==='machine'){o.title='未来挖掘机 · 科幻装备';o.sampleKind='tool'}
 return o;
}
function populateRegionStart(world){
 if(world.regionId==='earth'){
  world.addObject({id:'earth-fossil-first',x:170,y:252,type:'fossil',value:.6});world.addObject({id:'earth-root-first',x:-220,y:170,type:'root',value:.3});world.addObject({id:'earth-data-first',x:145,y:205,type:'crystal',value:.5});world.addObject({id:'earth-water-first',x:-200,y:360,type:'water',value:.4});return;
 }
 let r=REGION(world.regionId),p=world.spawn;
 // The initial fossils are anchored in a genuinely compatible bed, never sprinkled in topsoil.
 let b=r.beds.find(b=>b.fossils?.length),prev=0;
 if(b){let idx=r.beds.indexOf(b);prev=idx?r.beds[idx-1].end:0;let x=p.x+150,y=regionSurface(r.id,x)+Math.max(prev+40,110);if(r.kind==='snow')y+=90;
  for(let tries=0;tries<40&&!world.stratum(x,y).fossils?.length;tries++)y+=18;
  world.addObject({id:r.id+':first-fossil',x,y,type:'fossil',value:.5});}
 world.addObject({id:r.id+':first-mineral',x:p.x+230,y:regionSurface(r.id,p.x+230)+135,type:'crystal',value:.4});
 world.addObject({id:r.id+':first-water',x:p.x-170,y:regionSurface(r.id,p.x-170)+200,type:'water',value:.2});
 if(r.id==='camp')world.addObject({id:'camp:replica',x:p.x-118,y:p.y+32,type:'sample',sampleKind:'artifact',title:'教学陶片 · 人工复制件',description:'考古学研究人类活动遗存；古生物学研究古代生命。这是营地教学复制件，不是真实出土文物。',regionId:'camp',age:'quaternary',bedName:'营地教学沙盘',environment:'现代人工埋放',value:.5});
}
function generateRegionalPOI(world,cx,cy){
 let h=hash(cx,cy,world.seed),key=cx+','+cy;if(h<.18)return;
 let x=(cx*CS+5+hash(cx+42,cy,world.seed)*22)*CELL,y=(cy*CS+5+hash(cx,cy+52,world.seed)*22)*CELL;
 if(world.regionId==='earth'){
  let d=world.depth(x,y);if(Math.hypot(x,y-RW)>=RW-120)return;
  let b=world.stratum(x,y),type=b.fossils?.length&&h>.44&&h<.8?'fossil':d<.004?(h>.85?'water':'root'):d<35?(h>.88?'water':'crystal'):d<2890?'crystal':'sample';
  if(h>.997&&d<30)type='stone';else if(h>.999)type='machine';world.addObject({id:'poi:'+key,x,y,type,value:h});return;
 }
 let z=regionalDepth(world.regionId,x,y);if(z<45||world.initial(x,y)<30)return;
 let b=world.stratum(x,y),type=b.fossils?.length&&h>.48?'fossil':h>.85?'water':'crystal';
 if(z<50&&h<.5)type='root';
 world.addObject({id:'poi:'+world.regionId+':'+key,x,y,type,value:h});
}
function drawRegionalFossil(c,x,y,size,id,integrity=100){
 if(!id){drawFossil(c,x,y,size,integrity);return;}c.save();c.translate(x,y);c.scale(size/36,size/36);c.rotate(-.14);let base='#d6c69b',dark='#7f7155';c.strokeStyle=base;c.fillStyle=base;c.lineWidth=2;c.lineCap='round';
 if(id==='trilobite'||id==='naraoia'){
  let g=c.createLinearGradient(-14,0,14,0);g.addColorStop(0,'#8c805f');g.addColorStop(.45,'#ece0bc');g.addColorStop(1,'#99875f');c.fillStyle=g;c.beginPath();c.ellipse(0,0,15,27,0,0,TAU);c.fill();c.strokeStyle=dark;
  if(id==='trilobite'){for(let j=-15;j<21;j+=4){c.beginPath();c.moveTo(-13,j);c.quadraticCurveTo(0,j+6,13,j);c.stroke()}c.fillStyle='#c2b281';rr(c,-3,-19,6,39,3);c.fill();}else{c.beginPath();c.moveTo(-14,-7);c.quadraticCurveTo(0,-1,14,-7);c.stroke();}circle(c,-5,-18,1.5,dark);circle(c,5,-18,1.5,dark);
 }else if(['fish','feather','leaf','bark','roottrace','algae'].includes(id)){
  c.strokeStyle=base;if(id==='fish'){c.beginPath();c.moveTo(-27,0);c.lineTo(22,0);c.stroke();c.beginPath();c.moveTo(20,0);c.lineTo(31,-11);c.lineTo(31,11);c.closePath();c.stroke();circle(c,-24,0,5,base);for(let j=-18;j<18;j+=5){c.beginPath();c.moveTo(j,0);c.lineTo(j-4,-12+Math.abs(j)*.25);c.moveTo(j,0);c.lineTo(j-4,12-Math.abs(j)*.25);c.stroke()}}
  else{c.beginPath();c.moveTo(0,27);c.lineTo(0,-27);c.stroke();for(let j=-20;j<22;j+=5){let w=(id==='bark'?12:15)*Math.sin((j+28)/56*Math.PI);c.beginPath();c.moveTo(0,j+5);c.lineTo(-w,j-4);c.moveTo(0,j+5);c.lineTo(w,j-4);c.stroke();if(id==='bark'){c.beginPath();c.moveTo(-w,j);c.lineTo(w,j);c.stroke()}}}
 }else if(id==='brachiopod'){
  c.fillStyle=base;c.beginPath();c.moveTo(0,-17);c.bezierCurveTo(-33,-10,-24,24,0,23);c.bezierCurveTo(24,24,33,-10,0,-17);c.fill();c.strokeStyle=dark;c.lineWidth=1;for(let i=-4;i<=4;i++){c.beginPath();c.moveTo(0,-15);c.quadraticCurveTo(i*5,0,i*4,20-Math.abs(i)*1.5);c.stroke()}
 }else if(id==='crinoid'){
  c.beginPath();c.moveTo(0,27);c.lineTo(0,-6);c.stroke();for(let j=-4;j<27;j+=5){c.beginPath();c.moveTo(-4,j);c.lineTo(4,j);c.stroke()}for(let i=-3;i<=3;i++){c.beginPath();c.moveTo(0,-4);c.quadraticCurveTo(i*4,-17,i*7,-27);c.stroke()}
 }else if(id==='stromatolite'){
  for(let j=0;j<6;j++){c.strokeStyle=j%2?base:dark;c.lineWidth=3;c.beginPath();c.ellipse(0,16-j*4,26-j*2,11,0,Math.PI,TAU);c.stroke()}
 }else if(id==='microfossil'){
  for(let j=0;j<6;j++){let a=j*.95,rrr=6+j*2;circle(c,Math.cos(a)*rrr,Math.sin(a)*rrr,4+j*.8,base);c.strokeStyle=dark;c.stroke()}
 }else if(id==='track'){
  for(let j=0;j<4;j++){let xx=j%2?10:-10,yy=j*11-18;circle(c,xx,yy,4,base);for(let k=-1;k<=1;k++)circle(c,xx+k*4,yy-6,1.7,base)}
 }else{c.beginPath();c.moveTo(-24,17);c.bezierCurveTo(30,10,-20,-10,21,-23);c.stroke();}
 if(integrity<75){c.strokeStyle='#261f19';c.lineWidth=2;c.beginPath();c.moveTo(-24,4);c.lineTo(3,-2);c.lineTo(14,20);c.stroke()}c.restore();
}
function drawMineralSpecimen(c,x,y,size,m,time=0){
 if(!m){drawGem(c,x,y,size,time);return;}c.save();c.translate(x,y);let s=size/30;c.scale(s,s);c.shadowColor=m.color+'55';c.shadowBlur=5;
 if(['pyrite','magnetite','hematite','chalcopyrite','sphalerite','alloy'].includes(m.id)){
  for(let i=0;i<4;i++){let xx=(i-1.5)*8,yy=(i%2)*6;c.fillStyle=m.color;c.beginPath();c.moveTo(xx-8,yy-5);c.lineTo(xx+1,yy-13);c.lineTo(xx+10,yy-9);c.lineTo(xx+8,yy+7);c.lineTo(xx-7,yy+10);c.closePath();c.fill();c.strokeStyle='#eef0c544';c.stroke();c.beginPath();c.moveTo(xx+1,yy-13);c.lineTo(xx+1,yy+1);c.lineTo(xx+8,yy+7);c.stroke()}
 }else if(['clay','mica','feldspar','plagioclase','bridgmanite','ferropericlase'].includes(m.id)){
  for(let i=0;i<4;i++){c.fillStyle=m.color;c.globalAlpha=.7+i*.08;rr(c,-22+i*3,-10+i*3,40,13,3);c.fill();c.strokeStyle='#ffffff33';c.stroke()}
 }else{for(let i=0;i<5;i++){let xx=(i-2)*9,hh=15+hash(i,43)*22;c.fillStyle=m.color;c.beginPath();c.moveTo(xx-7,10);c.lineTo(xx-6,-hh+8);c.lineTo(xx,-hh);c.lineTo(xx+7,-hh+9);c.lineTo(xx+7,10);c.closePath();c.fill();c.strokeStyle='#f0efd455';c.stroke();c.beginPath();c.moveTo(xx,-hh);c.lineTo(xx,10);c.stroke()}}c.restore();
}
function drawExpeditionLandscape(c,g){
 let r=REGION(g.world.regionId);if(r.id==='earth')return;
 let W=g.w,H=g.h,z=g.zoom,l=g.cam.x-W/(2*z)-30,ri=g.cam.x+W/(2*z)+30;
 // Sky effects are clipped above the local terrain, never painted over the excavatable mask.
 c.save();c.beginPath();c.moveTo(0,0);c.lineTo(W,0);for(let xx=ri;xx>=l;xx-=10){let p=g.project(xx,regionSurface(r.id,xx));c.lineTo(p.x,p.y)}c.closePath();c.clip();
 let ocean=r.water>0,bg=c.createLinearGradient(0,0,0,H);bg.addColorStop(0,ocean?'#062839':r.kind==='snow'?'#506d83':r.kind==='canyon'?'#685c48':'#203d41');bg.addColorStop(1,ocean?'#04171e':r.kind==='snow'?'#a8bfc0':'#1b3334');c.fillStyle=bg;c.fillRect(0,0,W,H);
 if(ocean){c.save();c.globalAlpha=.12;for(let i=0;i<5;i++){c.fillStyle='#67c7d5';c.beginPath();c.moveTo(i*W/4-40,0);c.lineTo(i*W/4+60,0);c.lineTo(i*W/4+W*.28,H);c.lineTo(i*W/4-40+W*.28,H);c.fill()}c.restore();for(let i=0;i<24;i++){let xx=hash(i,39)*W,yy=(hash(i,51)*H+g.time*5)%H;circle(c,xx,yy,.7,'#b9e7d533')}}
 else{
  for(let n=0;n<3;n++){c.fillStyle=r.kind==='snow'?['#476476','#65848e','#809c9f'][n]:r.kind==='canyon'?['#6b5140','#795b43','#947153'][n]:['#173b3d','#255054','#396765'][n];c.beginPath();c.moveTo(0,H);for(let xx=-30;xx<W+40;xx+=12){let yy=H*.14+n*H*.13+Math.sin((xx+g.cam.x*.13)/170+n)*55+Math.sin((xx+g.cam.x*.09)/71+n*9)*22;if(r.kind==='snow'){let u=(xx+g.cam.x*.14)/180+n;yy=H*.10+n*H*.17+Math.abs(Math.sin(u))*110+Math.abs(Math.sin(u*2.8))*(10+n*3)}else if(r.kind==='canyon'){yy=H*.16+n*H*.14+Math.floor((Math.sin((xx+g.cam.x*.12)/90+n)+1)*3)*15;}c.lineTo(xx,yy)}c.lineTo(W,H);c.fill()}
  if(r.kind==='snow'){for(let i=0;i<30;i++){let xx=(hash(i,12)*W+Math.sin(g.time*.2+i)*14),yy=(hash(i,33)*H+g.time*8)%H;circle(c,xx,yy,1,'#e9eee55e')}}
 }
 c.restore();
 // Features attached to the true local surface: snow ridges, fern silhouettes, vent chimneys.
 for(let ix=Math.floor(l/70);ix<=Math.ceil(ri/70);ix++){
  let wx=ix*70,p=g.project(wx,regionSurface(r.id,wx));if(p.y<-100||p.y>H+60)continue;let hh=hash(ix,81);
  if(ocean){if(r.kind==='ocean'&&hh>.72){c.fillStyle='#173c3b';c.beginPath();c.moveTo(p.x-9*z,p.y);c.lineTo(p.x-5*z,p.y-(35+hh*20)*z);c.lineTo(p.x+6*z,p.y-37*z);c.lineTo(p.x+11*z,p.y);c.fill();for(let j=0;j<6;j++)circle(c,p.x+Math.sin(g.time+j)*8,p.y-(40+(g.time*16+j*11)%60)*z,(4+j)*z,'#0a151b39')}}
  else if(r.kind==='snow'){c.strokeStyle='#e5eee1b0';c.lineWidth=2*z;c.beginPath();c.moveTo(p.x-23*z,p.y);c.lineTo(p.x+24*z,p.y-3);c.stroke()}
  else if(r.kind!=='canyon'){c.strokeStyle='#70948599';c.lineWidth=1.3*z;let height=(r.kind==='coal'?55:25)+hh*30;for(let j=-3;j<=3;j++){c.beginPath();c.moveTo(p.x,p.y);c.quadraticCurveTo(p.x+j*4*z,p.y-height*.5*z,p.x+j*6*z,p.y-height*z+Math.abs(j)*7*z);c.stroke()}}
 }
 // Field flag labels tied to landmarks, not fixed wallpaper.
 let pos=g.project(120,regionSurface(r.id,120));if(pos.x>-150&&pos.x<W+150&&pos.y>-90&&pos.y<H+80){c.strokeStyle='#c5ab77';c.lineWidth=2;c.beginPath();c.moveTo(pos.x,pos.y);c.lineTo(pos.x,pos.y-64*z);c.stroke();c.fillStyle=r.color;rr(c,pos.x,pos.y-64*z,Math.min(165,130*z),25,4);c.fill();c.fillStyle='#f3f0de';c.font='11px system-ui';c.fillText(r.short+' · 数字考察区',pos.x+8,pos.y-47*z)}
}
function drawRigMiner(c,g,images){
 let e=g.expedition,hp=g.project(g.hero.x,g.hero.y),z=g.zoom,ctrl=g.controller,t=g.time,active=ctrl.held||ctrl.keys.size>0;
 let state=e?.poseState()||'观察',wave=g.settings.reduce?0:Math.sin(ctrl.walk*1.5),phase=g.settings.reduce?0:Math.sin(ctrl.phase*TAU),facing=ctrl.dir.x<-.05?-1:1;
 let underwater=REGION(g.world.regionId).water>0,kneel=state==='刷拭标本',worry=state==='风险警戒'||state==='补给不足',celebrate=e?.celebrateUntil>t;
 let bodySquash=kneel?.86:1+(active?phase*.02:Math.sin(t*2)*.012),bob=g.settings.reduce?0:(underwater?Math.sin(t*1.8)*3:active?Math.abs(wave)*1.8:Math.sin(t*2)*.7);
 c.save();c.translate(hp.x,hp.y+bob);c.scale(z*facing,z);c.rotate(celebrate?Math.sin(t*10)*.08:kneel?.11:active?Math.sin(ctrl.angle)*.055:0);
 let sh=c.createRadialGradient(0,29,0,0,29,34);sh.addColorStop(0,'#0008');sh.addColorStop(1,'#0000');c.fillStyle=sh;c.beginPath();c.ellipse(0,30,35,9,0,0,TAU);c.fill();
 // Feet move out of phase; the back arm swings independently of the body.
 for(let side of[-1,1]){c.save();c.translate(side*16,28+(active?wave*side*2:0));c.rotate(active?wave*side*.18:0);c.drawImage(images.minerFoot,-10,-5,21,13);c.restore()}
 c.save();c.translate(-24,5);c.rotate(celebrate?-1.7:active?wave*.25:.10);c.drawImage(images.minerPaw,-8,-9,18,24);c.restore();
 c.save();c.translate(0,4+(kneel?5:0));c.scale(1,bodySquash);c.drawImage(images.minerBody,-37,-8,74,33);c.restore();
 // Head tracks digging pitch; not the same whole-sprite bob every frame.
 c.save();c.translate(0,-6+(kneel?8:0));let pitch=clamp(Math.sin(ctrl.angle)*.13,-.13,.13);c.rotate(g.settings.reduce?0:pitch+(worry?Math.sin(t*14)*.026:0));c.drawImage(images.minerHead,-37,-51,74,56);
 if(underwater){c.strokeStyle='#b7e7e28c';c.lineWidth=1.2;c.fillStyle='#9acee512';c.beginPath();c.ellipse(0,-21,42,38,0,0,TAU);c.fill();c.stroke();c.strokeStyle='#edf8df99';c.beginPath();c.arc(-2,-25,32,-2.5,-1.85);c.stroke()}
 if(REGION(g.world.regionId).kind==='snow'){c.fillStyle='#ca7963';rr(c,-19,1,39,5,2);c.fill();c.fillRect(13,3,6,14)}
 c.restore();
 if(celebrate){c.save();c.translate(24,-5);c.rotate(-1.6+Math.sin(t*9)*.25);c.drawImage(images.minerPaw,-7,-15,18,23);c.restore()}
 c.restore();
 if(e?.labels){let role=underwater?'深海调查员':ctrl.tool==='brush'?'古生物调查员':ctrl.tool==='scan'?'地球物理调查员':'地质调查员';let text=role+' · '+state;c.font='600 10px system-ui';let width=c.measureText(text).width+20;let xx=clamp(hp.x-width/2,10,g.w-width-10),yy=hp.y-80*z;c.fillStyle=worry?'#682c28e8':'#142c31e0';rr(c,xx,yy,width,21,8);c.fill();c.strokeStyle=worry?'#e6a078':'#a8c6aa55';c.lineWidth=1;c.stroke();c.fillStyle='#efe5c5';c.fillText(text,xx+10,yy+14)}
}

const MODERN_BASINS=[
 {name:'浅海碳酸盐岩窗口',age:'ordovician',env:'程序化教学浅海沉积单元；非实测露头',mat:8,fossils:['brachiopod','crinoid'],minerals:['calcite','dolomite','pyrite'],note:'现代地表下的古岩层，时代为教学盆地设定，不由深度换算。'},
 {name:'古湖盆泥页岩窗口',age:'cretaceous',env:'程序化教学湖相沉积，非特定遗址',mat:9,fossils:['fish','leaf','feather'],minerals:['clay','pyrite','quartz'],note:'化石、围岩和沉积环境一起解释；本剖面并非全球标准层序。'},
 {name:'古湿地煤系窗口',age:'carboniferous',env:'程序化教学湿地 / 河流交互单元',mat:10,fossils:['bark','roottrace','leaf'],minerals:['pyrite','clay'],note:'煤属于富有机质岩石，不是单一矿物。'},
 {name:'海相细泥岩窗口',age:'cambrian',env:'程序化教学海相细粒沉积单元',mat:9,fossils:['trilobite','burrow'],minerals:['clay','quartz','pyrite'],note:'年代为地区地质背景设定，不可用深度直接推算。'}
];
function modernBed(x,y){
 let d=depthAt(x,y),z=RW-Math.hypot(x,y-RW);if(d>=.3)return deepBed(d);
 if(z<180)return {name:'现代壤土与根系',age:'quaternary',env:'现代表土、风化、生物与孔隙',mat:0,fossils:[],minerals:['quartz','clay'],note:'地表覆盖层示意。'};
 let arc=Math.atan2(x,RW-y)*RW,idx=((Math.floor((arc+330)/650)%4)+4)%4,b=MODERN_BASINS[idx],fold=z+Math.sin(arc/200)*80;
 if(fold<1250)return {...b,end:1250};
 let n=noise(x/400,y/280,777);return {name:n>.55?'冲积砾砂与再搬运颗粒':'风化基岩与裂隙',age:null,env:'矿物与围岩鉴定区；不给未知岩体硬套时代',mat:n>.55?15:3,fossils:[],minerals:['quartz','feldspar','magnetite','hematite','zircon'],note:'岩性与年代是两套描述；未知年龄不因变深自动变老。'};
}
function modernStrataOverview(){return [modernBed(0,80),...MODERN_BASINS,deepBed(5),deepBed(100),deepBed(450),deepBed(600),deepBed(800),deepBed(3000),deepBed(5500)];}
