"""Original, offline SVG illustrations; no third-party images or runtime requests."""
from pathlib import Path
import math, html, json
items = [
('Pac-Man Reimagined','maze','Games & Interactive Apps'),('Retro Arcade Lab','arcade','Games & Interactive Apps'),('WebGL Shader Explorer','shader','Games & Interactive Apps'),('3D Gaussian Splatting','points','Games & Interactive Apps'),
('Neural Synthesis','neural','Creative & Technical Projects'),('Spatial UI Experiments','ui','Creative & Technical Projects'),('Industrial Automation Model','robot','Creative & Technical Projects'),('Vector Architecture','building','Creative & Technical Projects'),
('Moonbase Runner','space','Games & Interactive Apps'),('Voxel Garden','voxel','Games & Interactive Apps'),('Orbit Racing','race','Games & Interactive Apps'),('Pixel Platformer','platform','Games & Interactive Apps'),
('Creative Apps Studio','ui','Creative & Technical Projects'),('Procedural City','building','Creative & Technical Projects'),('Audio Spectrum Lab','audio','Creative & Technical Projects'),('Generative Type Foundry','type','Creative & Technical Projects'),
('Electric Maze','maze','Games & Interactive Apps'),('Cosmic Pinball','pinball','Games & Interactive Apps'),('3D Canvas Playground','voxel','Games & Interactive Apps'),('Point Cloud Observatory','points','Creative & Technical Projects'),
('Synthwave Sequencer','audio','Creative & Technical Projects'),('Machine Vision Studio','robot','Creative & Technical Projects'),('Interactive Data Atlas','data','Creative & Technical Projects'),('Shader Ocean','shader','Creative & Technical Projects'),
('Night Drive Arcade','race','Games & Interactive Apps'),('Orbital Station','space','Games & Interactive Apps'),('Tiny Planet Builder','voxel','Games & Interactive Apps'),('Pixel Quest','platform','Games & Interactive Apps'),
('Neural Network Atlas','neural','Creative & Technical Projects'),('Motion Design Canvas','ui','Creative & Technical Projects'),('Parametric Pavilion','building','Creative & Technical Projects'),('Chromatic Letterpress','type','Creative & Technical Projects'),
('Arcade Cabinet Collection','arcade','Games & Interactive Apps'),('Lunar Pinball','pinball','Games & Interactive Apps'),('Particle Sculpture','points','Creative & Technical Projects'),('Robotic Assembly Line','robot','Creative & Technical Projects'),
('Soundscape Composer','audio','Creative & Technical Projects'),('Open Data Explorer','data','Creative & Technical Projects'),('Creative Coding Workspace','ui','Creative & Technical Projects'),('Deep Space Navigation','space','Games & Interactive Apps'),
]
# Six curated shelves, sixteen entries each. Existing IDs remain in their original order.
category_for_scene = {
 'maze':'Games/Interactive', 'arcade':'Games/Interactive', 'race':'Games/Interactive',
 'platform':'Games/Interactive', 'pinball':'Games/Interactive', 'space':'Games/Interactive',
 'shader':'Generative Graphics', 'points':'Generative Graphics',
 'voxel':'WebGL/Canvas', 'ui':'WebGL/Canvas',
 'neural':'System Architecture', 'robot':'System Architecture', 'building':'System Architecture',
 'data':'System Architecture', 'audio':'Audio/Synth', 'type':'Document Studies',
}
items = [(name, scene, category_for_scene[scene]) for name,scene,_ in items]
pools = {
 'Games/Interactive': [('Prism Breaker','arcade'),('Labyrinth Courier','maze'),('Solar Circuit','race'),('Clockwork Jumper','platform'),('Magnetic Bumpers','pinball'),('Comet Delivery','space')],
 'Generative Graphics': [('Flow Field Botanica','flow'),('Reaction Diffusion Atlas','shader'),('Lissajous Light Garden','flow'),('Kinetic Topography','points'),('Chromatic Interference','shader'),('Recursive Fern Studio','flow'),('Harmonic Ribbon Loom','flow'),('Voronoi Weather','points'),('Fractal Coastlines','shader'),('Particle Calligraphy','flow'),('Moiré Observatory','shader'),('Cellular Constellations','points'),('Contour Bloom','flow'),('Wavefront Textile','shader'),('Spectral Geometry','points'),('Golden Spiral Studies','flow')],
 'WebGL/Canvas': [('Canvas Compositor','ui'),('Instanced Forest','voxel'),('Raymarching Workshop','shader'),('Fluid Dynamics Canvas','flow'),('Signed Distance Studio','points'),('Terrain Sculptor','voxel'),('Interactive Lighting Rig','ui'),('Volumetric Cloud Lab','points'),('Mesh Deformation Bench','voxel'),('Canvas Timeline Editor','ui'),('WebGPU Material Gallery','shader'),('Depth Buffer Explorer','ui'),('Sculpted Light Canvas','voxel'),('Camera Projection Lab','ui'),('Vector Field Sandbox','flow'),('Isometric Tile Foundry','voxel')],
 'System Architecture': [('Event Stream Topology','network'),('Distributed Cache Atlas','network'),('Service Mesh Blueprint','network'),('Edge Computing Observatory','data'),('Resilient Queue Design','network'),('Digital Twin Factory','robot'),('Observability Control Room','data'),('Network Routing Canvas','network'),('Storage Engine Internals','network'),('Deployment Pipeline Map','network'),('Compute Cluster Planner','data'),('Access Control Graph','network'),('Message Bus Explorer','network'),('System Trace Console','data'),('Topology Design Kit','network'),('Autonomous Cell Model','robot')],
 'Audio/Synth': [('Modular Synth Rack','synth'),('Granular Sound Garden','audio'),('FM Operator Playground','synth'),('Polyrhythm Drum Machine','synth'),('Tape Echo Workshop','audio'),('Wavetable Morph Studio','audio'),('Harmonic Resonator','synth'),('Spectrogram Notebook','audio'),('Ambient Patch Bay','synth'),('Physical Modelling Lab','audio'),('Step Sequencer Grid','synth'),('Spatial Mixer Console','synth'),('Frequency Shifter','audio'),('Analog Oscillator Bank','synth'),('Resonance Cabinet','synth'),('Stereo Field Atlas','audio')],
 'Document Studies': [('Editorial Grid Handbook','document'),('Research Paper Anatomy','document'),('Technical Specification Folio','document'),('Annual Report System','sheet'),('Blueprint Field Notes','blueprint'),('Typography Specimen Book','type'),('Data Table Design Study','sheet'),('Invoice Layout Workshop','sheet'),('Design System Guidelines','document'),('Architecture Decision Records','blueprint'),('Scientific Poster Studio','document'),('Accessible Form Patterns','sheet'),('Release Notes Journal','document'),('Engineering Drawing Index','blueprint'),('Reference Manual Atlas','document'),('Document Rhythm Studies','type')],
}
for category,pool in pools.items():
 count=sum(item[2]==category for item in items)
 items.extend((name,scene,category) for name,scene in pool[:16-count])
assert len(items)==96 and len({item[0] for item in items})==96
summaries = {
 'maze':'A luminous maze study with pixel characters, collectible trails and a playful arcade rhythm.',
 'arcade':'A cabinet collection exploring retro controls, screen composition and vibrant arcade identities.',
 'shader':'A real-time graphics study of wave interference, surface colour and mathematical light.',
 'points':'A sculptural point-cloud study that reveals volume through thousands of coloured samples.',
 'neural':'A layered network diagram exploring connections, signal flow and learning systems.',
 'robot':'An industrial cell study featuring articulated robots, workstations and coordinated motion.',
 'building':'An architectural study of modular volumes, structural rhythm and isometric space.',
 'ui':'A creative workspace concept combining visual canvases, layered tools and modular panels.',
 'voxel':'A three-dimensional world study built from colourful blocks and isometric terrain.',
 'audio':'A sound-design study translating frequency, amplitude and rhythm into a visual score.',
 'race':'A neon racing concept with geometric roads, luminous vehicles and a synthwave horizon.',
 'platform':'A pixel-world composition of floating platforms, collectibles and playful movement.',
 'pinball':'An arcade table study of bumpers, rails, flippers and energetic ball paths.',
 'space':'A spaceflight concept exploring planetary forms, navigation and orbital travel.',
 'type':'A typography specimen examining letterform scale, colour and editorial hierarchy.',
 'data':'An analytical workspace balancing charts, readable measures and compact dashboards.',
 'flow':'A generative drawing study of curved trajectories, organic growth and layered linework.',
 'network':'A system blueprint of connected services, message paths and resilient infrastructure.',
 'synth':'A modular instrument concept with patch cables, sequencers and expressive sound controls.',
 'document':'An editorial document study of page hierarchy, annotations and clear information design.',
 'sheet':'A structured document study exploring tables, measured spacing and useful data summaries.',
 'blueprint':'A technical notebook of dimensioned drawings, construction lines and engineering notes.',
}
out=Path(__file__).resolve().parents[1]/'public/showcase'
out.mkdir(parents=True,exist_ok=True)
def rect(x,y,w,h,fill,rx=0,extra=''):
 return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" {extra}/>'
def circle(x,y,r,fill,extra=''):
 return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" {extra}/>'
def path(d,fill='none',stroke='none',sw=1):
 return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"/>'
def text(x,y,words,size=20,fill='#edfaff',extra=''):
 return f'<text x="{x}" y="{y}" font-family="system-ui,sans-serif" font-size="{size}" fill="{fill}" {extra}>{html.escape(words)}</text>'
manifest=[]
for n,(name,scene,category) in enumerate(items):
 accent=['#59e5ff','#ff659d','#b5f36c','#ae95ff','#ffba60'][n%5]
 second=['#7c6cff','#ffd064','#45d9ba','#fd81ba','#5cafff'][n%5]
 s=rect(0,0,1280,800,'#0b1227')
 # Deliberate scene composition on a 1280×800 artboard, crisp at preview size.
 if scene=='maze':
  for x,y,w,h in [(80,140,180,100),(350,140,190,100),(660,140,260,100),(1010,140,170,100),(80,330,320,80),(520,330,240,80),(880,330,300,80),(80,510,180,100),(380,510,360,100),(860,510,320,100)]:
   s+=rect(x,y,w,h,'#111e55',14,f'stroke="{accent}" stroke-width="8"')
  for y in [285,460,665]:
   for x in range(70,1220,55):s+=circle(x,y,5,'#ffe6aa')
  s+=path('M465 460L531 419A78 78 0 1 0 531 501Z','#ffdd33')+circle(457,416,7,'#241b23')
  for i,c in enumerate(['#ff6386','#70cfff','#ffb155']):
   x=790+i*110;s+=path(f'M{x} 476v-45a37 37 0 0 1 74 0v45l-12-12-12 12-13-12-13 12-12-12Z',c)
   s+=circle(x+25,430,11,'white')+circle(x+51,430,11,'white')+circle(x+28,431,5,'#15274c')+circle(x+54,431,5,'#15274c')
 elif scene=='arcade':
  s+=rect(0,620,1280,180,'#201b40')
  for i in range(4):
   x=90+i*300;s+=path(f'M{x} 650V260l30-115h200l30 115-30 175 40 75v140Z','#252f56',accent,4)
   s+=rect(x+42,166,177,50,second,8)+text(x+58,200,['ARCADE','PLAYER 01','HI SCORE','INSERT COIN'][i],20,'#11172a')
   s+=rect(x+32,245,200,169,'#070c22',12)+rect(x+57,274,150,98,'#182453',8)
   for k in range(6):s+=rect(x+65+k*22,300+(k%2)*24,14,14,accent,2)
   s+=path(f'M{x+30} 441h200l40 58H{x-10}Z','#3b426a')+circle(x+75,472,13,second)+circle(x+176,474,10,accent)
 elif scene in ['shader','audio']:
  s+=rect(70,140,1140,520,'#111c36',24)
  for i in range(58):
   x=98+i*19;h=50+abs(math.sin(i*.24+n)*math.cos(i*.07))*360
   if scene=='audio':s+=rect(x,410-h/2,10,h,accent if i%3 else second,5)
   else:
    d=' '.join(('M' if j==0 else 'L')+f'{100+j*11} {230+i*6+math.sin(j*.06+i*.13+n)*75}' for j in range(98))
    s+=path(d,stroke=accent if i%2 else second,sw=2)
  s+=text(110,620,'FREQUENCY / FORM / REALTIME',20,second)
 elif scene=='points':
  for i in range(1800):
   a=i*2.3999;b=math.acos(1-2*(i+.5)/1800);r=230+38*math.sin(a*3+n)
   x=640+r*math.sin(b)*math.cos(a)*1.65;y=390+r*math.cos(b)
   s+=circle(round(x,1),round(y,1),round(1.5+2.5*(1+math.sin(a))/2,1),accent if i%4 else second,extra='opacity=".8"')
  s+=path('M300 645h680M640 140v530',stroke='#546489',sw=1)
 elif scene=='neural':
  for layer in range(5):
   for i in range(6):
    x=180+layer*230;y=170+i*83
    if layer<4:
     for j in range(6):s+=path(f'M{x} {y}L{x+230} {170+j*83}',stroke='#314366',sw=1.4)
    s+=circle(x,y,18,accent if (i+layer)%3 else second)+circle(x,y,7,'#102039')
 elif scene=='robot':
  for x in range(80,1250,90):s+=path(f'M{x} 600l170-60',stroke='#35475c',sw=3)
  s+=path('M100 600h1060l-80 100H30Z','#233955')
  for i in range(3):
   x=200+i*370;s+=rect(x-60,520,155,45,'#4e6585',12)
   s+=path(f'M{x} 510V380l120-125 65 100',stroke=accent,sw=42)
   for a,b in [(x,400),(x+120,255),(x+185,355)]:s+=circle(a,b,29,second)+circle(a,b,13,'#233955')
   s+=path(f'M{x+170} 372v55m30-55v55',stroke='#e2eef6',sw=12)+rect(x+135,469,100,65,second,6)
 elif scene in ['building','voxel']:
  for i in range(22):
   col=i%7;row=i//7;x=170+col*139+row*47;y=600-row*75;h=65+((i*53+n*19)%255)
   if scene=='voxel':h=50+(i%4)*42
   s+=path(f'M{x} {y}V{y-h}l70-40 65 38v{h}l-65 40Z','#284768',accent,2)
   s+=path(f'M{x} {y-h}l70-40 65 38-65 40Z',accent)+path(f'M{x+70} {y-h+38}v{h}l65-40V{y-h-2}Z',second)
   if scene=='building':
    for k in range(max(1,int(h/36))):s+=path(f'M{x+12} {y-h+38+k*30}l42 24',stroke='#c7f0ed',sw=6)
 elif scene=='ui':
  s+=rect(100,145,1080,515,'#edf2f5',18)+rect(100,145,1080,42,'#34405e',18)
  for i in range(3):s+=circle(128+i*24,166,7,['#fa7e83','#ffca67','#6adcaf'][i])
  s+=rect(120,210,178,425,'#18243c',10)
  for i in range(8):s+=rect(141,235+i*46,125-(i%3)*18,9,'#71849c',4)
  for i in range(6):
   x=325+(i%3)*277;y=214+(i//3)*209;s+=rect(x,y,250,187,'#d6e0eb',12)+rect(x+12,y+12,226,111,accent if i%2 else second,8)
   s+=path(f'M{x+30} {y+101}l50-65 41 44 53-49 42 70Z','#1d3555')+rect(x+16,y+142,160,10,'#435771',5)+rect(x+16,y+163,100,6,'#74869b',3)
 elif scene=='flow':
  for i in range(95):
   d=' '.join(('M' if j==0 else 'L')+f'{80+j*13} {390+math.sin(j*.08+i*.09+n)*140+math.cos(j*.04-i*.05)*70+i*.7}' for j in range(88))
   s+=path(d,stroke=accent if i%3 else second,sw=1.7)
 elif scene=='network':
  for i in range(9):
   x=160+(i%3)*380;y=180+(i//3)*160
   if i%3<2:s+=path(f'M{x+200} {y+50}h180',stroke=accent,sw=4)
   if i<6:s+=path(f'M{x+100} {y+95}v65',stroke=second,sw=3)
   s+=rect(x,y,200,100,'#213451',12,extra=f'stroke="{accent}" stroke-width="2"')
   s+=text(x+16,y+34,['GATEWAY','QUEUE','WORKER','CACHE','API','EVENTS','STORE','METRICS','CLIENT'][i],18)
   for k in range(3):s+=circle(x+24+k*30,y+72,6,accent if k else second)
 elif scene=='synth':
  s+=rect(100,150,1080,500,'#202c45',18)
  for i in range(6):
   x=130+i*175;s+=rect(x,175,150,440,'#39465e',8)
   for row in range(3):
    s+=circle(x+42,235+row*90,24,'#112138',extra=f'stroke="{accent}" stroke-width="4"')
    s+=path(f'M{x+42} {235+row*90}l{13+(n+i)%9}-15',stroke=second,sw=4)
    s+=rect(x+95,215+row*90,22,42,accent,3)
   for k in range(3):s+=circle(x+28+k*46,560,10,second)
  for i in range(5):s+=path(f'M{158+i*175} 560C{200+i*100} 360 {530+i*70} 690 {508+i*110} 560',stroke=accent if i%2 else second,sw=5)
 elif scene in ['document','sheet','blueprint']:
  paper='#173755' if scene=='blueprint' else '#edf0e8'
  ink='#b8def7' if scene=='blueprint' else '#29465b'
  s+=rect(245,135,790,545,paper,8)+rect(280,168,56,8,accent,4)+text(280,223,name.upper()[:28],24,ink,extra='font-weight="700"')
  if scene=='sheet':
   for row in range(9):
    for col in range(5):
     x=280+col*144;y=260+row*36;s+=rect(x,y,138,30,ink if row==0 else '#d8e0d8',3)
     if row:s+=text(x+8,y+20,str((n+row+3)*(col+2)),14,ink)
  elif scene=='blueprint':
   for x in range(280,990,30):s+=path(f'M{x} 255v340',stroke='#315876',sw=1)
   for y in range(255,630,30):s+=path(f'M280 {y}h690',stroke='#315876',sw=1)
   s+=path('M370 590V320h210v110h260v160Zm0-170h210M700 430v160',stroke=accent,sw=5)
   s+=path('M340 610h530M350 300v280',stroke=ink,sw=2)+text(560,646,'DIMENSIONS / 01:100',18,ink)
  else:
   for col in range(2):
    for row in range(15):
     s+=rect(280+col*365,265+row*21,300-((row+n+col)%5)*22,6,ink,2)
   s+=rect(650,480,330,118,accent,6)+path('M675 570l40-35 47 17 70-45 90 39',stroke=ink,sw=5)
 elif scene=='race':
  s+=circle(640,305,168,second)
  for i in range(12):s+=path(f'M0 {520+i*i*1.5}h1280',stroke=accent,sw=2)
  for x in range(-600,1900,140):s+=path(f'M640 390L{x} 800',stroke=accent,sw=2)
  s+=path('M405 610l60-137h350l60 137-40 53H443Z','#172749',accent,5)+path('M493 488h294l28 78H465Z','#487b9d')
  s+=rect(440,591,126,22,second,5)+rect(714,591,126,22,second,5)+rect(580,625,120,12,'#fff3bc',3)
 elif scene=='platform':
  s+=circle(1000,240,86,second)
  for x,y,w in [(60,610,320),(470,490,240),(800,380,370),(0,265,310)]:
   s+=rect(x,y,w,60,'#244365',6)+rect(x,y,w,14,accent,4)
   for i in range(int(w/40)):s+=rect(x+i*40+8,y+25,24,16,'#466386',2)
  s+=rect(545,400,40,60,second,4)+rect(535,380,60,30,accent,6)+circle(577,393,5,'#142338')
  for x in [550,650,850,950,1050]:s+=circle(x,320,15,'#ffce50',extra='stroke="#fff0a8" stroke-width="3"')
 elif scene=='pinball':
  s+=rect(240,140,800,520,'#233151',48,extra=f'stroke="{accent}" stroke-width="7"')
  for x,y in [(440,265),(710,275),(600,420),(860,460)]:s+=circle(x,y,48,second)+circle(x,y,30,'#263858',extra=f'stroke="{accent}" stroke-width="6"')
  s+=path('M350 570l170 38m400-38-170 38',stroke=accent,sw=24)+circle(790,550,15,'white')
  s+=path('M295 560V235q0-60 65-60h560q65 0 65 60v300',stroke=second,sw=6)
 elif scene=='type':
  s+=rect(150,170,980,475,'#efe4d5',18)+text(200,475,'Aa',340,'#17253e',extra='font-weight="800"')
  s+=text(780,330,'BOLD',65,'#17253e',extra='font-weight="800"')+text(780,410,'Form',54,'#525d77')
  for i,c in enumerate([accent,second,'#17253e','#ed987f']):s+=circle(813+i*70,525,27,c)
 elif scene=='data':
  s+=rect(95,150,1090,510,'#17253e',18)
  for i in range(12):s+=rect(145+i*58,570-(70+i*29)%290,35,(70+i*29)%290,accent if i%2 else second,4)
  s+=circle(1010,355,108,second)+circle(1010,355,60,'#17253e')+path('M145 590h730',stroke='#90a8c2',sw=2)
 else:
  for i in range(95):s+=circle((i*139)%1280,140+(i*83)%530,1+i%3,'#c1d6e5')
  s+=circle(890,340,174,second)+path('M670 405q220-240 440-30',stroke=accent,sw=24)
  s+=path('M215 520l260-180-75 200-105-27-60 85Z','#e6eef4')+path('M340 434l100-66-37 106Z',accent)+path('M243 541l-80 76 117-34Z',second)
 s+=rect(0,0,1280,95,'#101a30')+text(42,57,name.upper(),30,extra='font-weight="700" letter-spacing="2"')
 s+=text(44,756,category.upper(),18,accent,extra='letter-spacing="4"')+text(1120,756,f'{n+1:02d} / 96',18,'#90a8c2')
 slug=name.lower().replace(' ','-')
 filename=f'{slug}.svg'
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800"><title>{html.escape(name)}</title>{s}</svg>'
 (out/filename).write_text(svg)
 manifest.append({'name':name,'file':filename,'category':category,'color':accent,'summary':summaries[scene]})
root=out.parents[1]
(root/'src/data/showcase.ts').write_text('''import type { LibraryEntry } from "../core/types";
import { keyFor } from "../core/storage";
// Original SVG illustrations in public/showcase; regenerate with scripts/generate-showcase.py.
const covers = '''+json.dumps(manifest,indent=2)+''';
export function makeShowcase(now = Date.now()): LibraryEntry[] {
  return covers.map((cover, index) => {
    const id = `showcase-${index}`;
    return {
      key: keyFor(id, "showcase"), id, space: "showcase", kind: "asset", parentId: null,
      name: cover.name, category: cover.category, headerColor: cover.color,
      desc: cover.summary,
      demoUrl: index === 0 || index === 16 ? "https://pacman-reimagined.vercel.app" : undefined,
      type: "Image", mime: "image/svg+xml", demoArt: true,
      thumbnail: `/showcase/${cover.file}`, seed: index, art: "landscape",
      created: now - index * 86400000, updated: now - index * 86400000,
    };
  });
}
''')
print(f'Generated {len(manifest)} original 1280×800 SVG covers.')
