from pathlib import Path
from playwright.sync_api import sync_playwright
import json
P=Path(__file__).resolve().parents[1]
(P/'tests/fixtures').mkdir(exist_ok=True)
records=[]
def record(name,fn):
 try:v=fn();records.append({'test':name,'pass':True,'details':v})
 except Exception as e:records.append({'test':name,'pass':False,'error':repr(e)})
 print(records[-1],flush=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'])
 p=b.new_page(viewport={'width':1200,'height':860});errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.on('dialog',lambda d:d.accept())
 p.set_content((P/'just_one_scoop_v13_complete.html').read_text(),wait_until='load');p.wait_for_function('!!window.SCOOP');ev=p.evaluate
 record('all four opening selections store isolated complete snapshots',lambda:ev("""()=>{let g=SCOOP.game,ids=['earth/explorer','field/explorer','earth/hell','field/hell'],out=[];for(let i=0;i<ids.length;i++){let[c,d]=ids[i].split('/');g.sessions.open();g.sessions.select(c,d);g.sessions.start(true);g.research=200+i*11;g.world.cut(g.hero.x+60+i*45,g.hero.y+220,30,20,0,10000);g.save();out.push({id:ids[i],edits:g.world.edits.size,research:g.research,region:g.world.regionId});}for(let o of out){let[c,d]=o.id.split('/');g.sessions.open();g.sessions.select(c,d);g.sessions.start(false);if(g.research!==o.research||g.world.edits.size!==o.edits||g.world.regionId!==o.region||g.expedition.mode!==d)throw Error('profile '+o.id)}return out;}"""))
 record('restarting one slot leaves the other three unchanged',lambda:ev("""()=>{let g=SCOOP.game;g.sessions.open();let a=['earth/explorer','earth/hell','field/explorer'].map(k=>{let[c,d]=k.split('/');return JSON.stringify(g.sessions.read(c,d))});g.sessions.select('field','hell');g.sessions.start(true);let b=['earth/explorer','earth/hell','field/explorer'].map(k=>{let[c,d]=k.split('/');return JSON.stringify(g.sessions.read(c,d))});if(a.some((s,i)=>s!==b[i]))throw Error('overwrite');return{current:g.expedition.mode,otherProfilesUnchanged:3}}"""))
 record('100 km vehicle cuts world without normal-loot pity inflation',lambda:ev("""()=>{let g=SCOOP.game;g.sessions.open();g.sessions.select('earth','explorer');g.sessions.start(false);g.charges.machine=1;g.dashCooldown=0;g.controller.dir={x:.6,y:.8};let a=SCOOP.worldGeo(g.hero.x,g.hero.y),n=g.stats.normalDug,e=g.world.edits.size;g.controller.beginDash('machine');for(let i=0;i<250;i++){g.tick(1/60);if(!g.controller.dash)break}let z=SCOOP.worldGeo(g.hero.x,g.hero.y),km=Math.hypot(z.x-a.x,z.y-a.y);if(Math.abs(km-100)>1e-6||g.stats.normalDug!==n||g.world.edits.size<=e)throw Error('dash');g.stopInput();return{km:km,edits:g.world.edits.size-e,normalLootCounterUnchanged:true}}"""))
 record('every deep Earth difficulty stage checks distinct prerequisites',lambda:ev("""()=>{let g=SCOOP.game;g.sessions.open();g.sessions.select('earth','hell');g.sessions.start(false);let e=g.expedition,out=[];for(let d of [2,13,40,450,800,3200,5300]){e.skills=new Set(['record']);let missing=g.journey.missingFor(d);if(!missing.length||g.journey.permitDepth(d,false))throw Error('gate '+d);for(let s of SCOOP.EXP.skills)e.skills.add(s.id);if(!g.journey.permitDepth(d,false))throw Error('unreachable '+d);out.push({depth:d,required:missing})}return out}"""))
 # Generate small, real legacy fixtures using the provided original games.
 for v in [11,12]:
  fp=P/'tests/fixtures'/('v'+str(v)+'-save.json');op=Path('/mnt/data/just_one_scoop_v'+str(v)+'.html')
  if op.exists():
   page=b.new_page();page.set_content(op.read_text(),wait_until='load');page.wait_for_function('!!window.SCOOP');page.click('#startBtn');snap=page.evaluate("()=>{let g=SCOOP.game;g.world.cut(g.hero.x+80,g.hero.y+110,33,24,0,10000);return g.snapshot()}");fp.write_text(json.dumps(snap,ensure_ascii=False));page.close()
  if fp.exists():
   def check_upload(v=v,fp=fp):
    p.click('#openHome')
    with p.expect_file_chooser() as fc:p.click('#importProfile')
    fc.value.set_files(str(fp))
    p.wait_for_function('SCOOP.game.mode==="play" && document.querySelector("#intro").hidden')
    s=p.evaluate('SCOOP.game.snapshot()');expected='earth' if v==11 else 'field';assert s['campaign']==expected,s['campaign'];old=json.loads(fp.read_text());assert len(s['edits'])==len(old['edits']);return{'inputFormat':old['format'],'campaign':s['campaign'],'edits':len(s['edits'])}
   record('actual file-chooser import V'+str(v)+' JSON',check_upload)
 record('supplemental tests have no browser errors',lambda:True if not errors else (_ for _ in ()).throw(Exception(str(errors))))
 b.close()
(P/'tests/profile_results.json').write_text(json.dumps({'tests':records},ensure_ascii=False,indent=2))
