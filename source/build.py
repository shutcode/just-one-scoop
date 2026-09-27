from pathlib import Path
import json,sys
P=Path(__file__).parent
out=Path(sys.argv[1]) if len(sys.argv)>1 else P.parent/'just_one_scoop_v13_complete.html'
mode=sys.argv[2] if len(sys.argv)>2 else 'explorer'
s=(P/'index.template.html').read_text()
data={'assets':json.loads((P/'assets.json').read_text()),'knowledge':json.loads((P/'knowledge.json').read_text()),'expedition':json.loads((P/'expedition.json').read_text()),'defaultMode':'explorer'}
js='\n'.join((P/f).read_text() for f in ['core.js','science.js','map.js','geology.js','research_labs.js','expedition.js','journey.js','session.js','app.js'])
css='\n'.join((P/f).read_text() for f in ['style.css','expedition.css','session.css'])
s=s.replace('/*__CSS__*/',css).replace('/*__DATA__*/',json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')).replace('/*__JS__*/',js)
out.write_text(s);(P/'game.js').write_text(js)
print(out, 'bytes',out.stat().st_size,'topics',len(data['knowledge']['nodes']))
