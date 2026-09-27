from pathlib import Path
from playwright.sync_api import sync_playwright
import subprocess, os, time, json
P=Path(__file__).resolve().parents[1]
xv=subprocess.Popen(['/usr/bin/Xvfb',':105','-screen','0','1280x900x24'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
results=[]
try:
 time.sleep(.8)
 with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=False,env={**os.environ,'DISPLAY':':105'},args=['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  p=b.new_page(viewport={'width':1200,'height':820});p.set_default_timeout(30000);errors=[]
  p.on('pageerror',lambda e:errors.append(str(e)))
  p.set_content((P/'just_one_scoop_v13_complete.html').read_text(),wait_until='load');p.wait_for_function('!!window.SCOOP')
  p.click('#startBtn');p.wait_for_timeout(300)
  mode=p.evaluate('SCOOP.game.renderer.mode');assert 'WebGL' in mode,mode
  p.evaluate("()=>{let g=SCOOP.game;g.settings.quality='medium';g.resize();g.controller.keys.add('s');for(let i=0;i<220;i++)g.tick(1/60);g.stopInput();g.notifyQueue=[];g.toastUntil=0;document.querySelector('#toast').hidden=true;g.draw();}")
  p.screenshot(path=str(P/'previews/release_webgl_modern.png'),timeout=60000)
  results.append({'test':'WebGL modern rendering and digging','pass':True,'renderer':mode,'dug':p.evaluate('SCOOP.game.world.dug.size')})
  p.evaluate("SCOOP.game.journey.open()");p.wait_for_timeout(100);assert p.locator('#journeySkills').count()==1
  p.click('#journeySkills');assert p.locator('[data-research="coolloop"]').count()==1
  p.keyboard.press('Escape');p.click('#openHome');p.click('[data-campaign=field]');p.click('#startBtn');p.evaluate("SCOOP.game.expedition.travel('himalaya')");p.wait_for_timeout(200)
  p.evaluate("()=>{let g=SCOOP.game;g.notifyQueue=[];g.toastUntil=0;g.chapterUntil=0;document.querySelector('#toast').hidden=true;document.querySelector('#chapterToast').hidden=true;g.draw()}")
  p.screenshot(path=str(P/'previews/release_webgl_field.png'),timeout=60000)
  results.append({'test':'WebGL field and modern workshop share engine','pass':True,'region':p.evaluate('SCOOP.game.world.regionId')})
  p.click('#openHome');p.click('[data-campaign=earth]');p.click('#startBtn');assert p.evaluate('SCOOP.game.world.regionId')=='earth'
  p.evaluate("SCOOP.game.science.open('k023')");p.wait_for_timeout(100);assert p.locator('#labCanvas').count()==1;p.keyboard.press('Escape');assert p.evaluate('SCOOP.game.science.lab') is None
  results.append({'test':'WebGL mode switching and experiment lifecycle','pass':True,'errors':errors});assert not errors,errors
  b.close()
except Exception as e:
 results.append({'test':'WebGL run','pass':False,'error':repr(e)})
finally:
 xv.terminate()
 (P/'tests/webgl_results.json').write_text(json.dumps({'environment':'Headed Chromium / Xvfb / ANGLE SwiftShader software WebGL; not hardware or FPS benchmarking.','tests':results},ensure_ascii=False,indent=2))
 print(json.dumps(results,ensure_ascii=False,indent=2),flush=True)
