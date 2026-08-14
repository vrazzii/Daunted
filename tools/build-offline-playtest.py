from pathlib import Path
import base64, json

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dist" / "Daunted_Offline_Playtest.html"
OUT.parent.mkdir(parents=True, exist_ok=True)

FIGHTERS = {
    "knight": {"label": "Knight", "code": "kni"},
    "wolf": {"label": "Wolfbeast", "code": "wlf"},
    "veiled-saint": {"label": "Veiled Saint", "code": "vst"},
}

SPECS = [
    ("idle","Idle","neutral","assets/sprites/{fighter}/idle.png",(1448,1086),4,3,12,True),
    ("walk-forward","Walk Forward","movement","assets/library/daunted_walking_v01/daunted_{code}_walk_f_sheet_v01.png",(1448,1086),4,3,12,True),
    ("walk-backward","Walk Backward","movement","assets/library/daunted_walking_v01/daunted_{code}_walk_b_sheet_v01.png",(1448,1086),4,3,12,True),
    ("standing-light","Standing Light","attack","assets/library/daunted_standing_light_v01/daunted_{code}_atk_5l_sheet_v01.png",(1448,724),4,2,8,False),
    ("standing-heavy","Standing Heavy","attack","assets/library/daunted_standing_heavy_v01/daunted_{code}_atk_5h_sheet_v01.png",(1448,1086),4,3,12,False),
    ("crouching-light","Crouching Light","attack","assets/library/daunted_crouching_light_v01/daunted_{code}_atk_2l_sheet_v01.png",(1536,1024),4,2,8,False),
    ("crouching-heavy","Crouching Heavy","attack","assets/library/daunted_crouching_heavy_v01/daunted_{code}_atk_2h_sheet_v01.png",(1536,1024),4,2,8,False),
    ("jumping-light","Jumping Light","attack","assets/library/daunted_jumping_light_v01/daunted_{code}_atk_jl_sheet_v01.png",(1536,1024),4,2,8,False),
    ("jumping-heavy","Jumping Heavy","attack","assets/library/daunted_jumping_heavy_v01/daunted_{code}_atk_jh_sheet_v01.png",(1672,941),4,2,8,False),
    ("anti-air","Anti-Air","attack","assets/library/daunted_anti_air_v01/daunted_{code}_atk_aa_sheet_v01.png",(1536,1024),4,2,8,False),
    ("dash","Dash / Backdash","movement","assets/library/daunted_dash_v01/daunted_{code}_dash_sheet_v01.png",(1536,1024),4,3,12,False),
    ("jump-movement","Jump Movement","movement","assets/library/daunted_jump_movement_v01/daunted_{code}_jump_move_sheet_v01.png",(1536,1024),4,3,12,False),
    ("grab-suite","Grab / Throw","attack","assets/library/daunted_grab_suite_v01/daunted_{code}_grab_suite_sheet_v01.png",(1536,1024),4,3,12,False),
    ("defense","Defense / Guard Break","defense","assets/library/daunted_defense_v01/daunted_{code}_defense_sheet_v01.png",(1536,1536),4,4,16,False),
    ("damage-reactions","Damage Reactions","reaction","assets/library/daunted_damage_reactions_v01/daunted_{code}_damage_reactions_sheet_v01.png",(1600,1280),5,4,20,False),
]

SIZE_OVERRIDES = {
    ("knight","crouching-light"):(1491,1055),
    ("wolf","crouching-light"):(1672,941),
    ("wolf","crouching-heavy"):(1672,941),
    ("wolf","jumping-light"):(1672,941),
    ("wolf","anti-air"):(1448,1086),
}

library = {}
for fighter_id, fighter in FIGHTERS.items():
    entries = []
    for animation_id, label, category, pattern, size, columns, rows, count, loop in SPECS:
        path = pattern.format(fighter=fighter_id, code=fighter["code"])
        file_path = ROOT / path
        if not file_path.exists():
            continue
        actual_size = SIZE_OVERRIDES.get((fighter_id, animation_id), size)
        data = base64.b64encode(file_path.read_bytes()).decode("ascii")
        entries.append({
            "id": animation_id,
            "label": label,
            "category": category,
            "width": actual_size[0],
            "height": actual_size[1],
            "columns": columns,
            "rows": rows,
            "count": count,
            "loop": loop,
            "src": f"data:image/png;base64,{data}",
        })
    library[fighter_id] = entries

payload = json.dumps(library, separators=(",", ":"))
fighters_payload = json.dumps(FIGHTERS, separators=(",", ":"))

html = f'''<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no"><title>Daunted Offline Playtest</title>
<style>
*{{box-sizing:border-box;-webkit-tap-highlight-color:transparent}}html,body{{margin:0;min-height:100%;background:#08070d;color:#f3efff;font-family:system-ui,-apple-system,sans-serif}}body{{padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left))}}header{{display:flex;justify-content:space-between;gap:12px;align-items:end;margin-bottom:10px}}h1{{margin:0;font-size:24px}}.sub{{font-size:11px;color:#9b73ff;font-weight:800;letter-spacing:.12em;text-transform:uppercase}}.controls{{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}}select,button{{width:100%;min-height:42px;border:1px solid #484158;border-radius:10px;background:#171522;color:white;font:inherit;padding:8px}}.buttons{{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:10px}}button{{font-weight:800;padding:8px 4px}}button:active{{transform:scale(.98)}}.stage{{position:relative;border:1px solid #302b3d;border-radius:14px;background:linear-gradient(#151220,#090811);overflow:hidden;min-height:52vh;display:grid;place-items:center}}canvas{{display:block;max-width:100%;max-height:64vh;image-rendering:pixelated}}.status{{font:11px ui-monospace,monospace;color:#aaa2b7;margin-top:8px;line-height:1.5;word-break:break-word}}.good{{color:#72d89b}}@media (orientation:landscape){{body{{padding-top:max(6px,env(safe-area-inset-top))}}header{{margin-bottom:6px}}h1{{font-size:19px}}.controls{{grid-template-columns:220px 1fr}}.stage{{min-height:62vh}}canvas{{max-height:68vh}}}}
</style></head><body>
<header><div><div class="sub">Daunted offline</div><h1>Sprite Playtest</h1></div><div class="sub">NO NETWORK NEEDED</div></header><div class="controls"><select id="fighter"></select><select id="anim"></select></div><div class="buttons"><button id="prev">◀</button><button id="play">Pause</button><button id="next">▶</button><button id="mirror">Mirror</button><button id="reset">Reset</button></div><div class="stage"><canvas id="c" width="640" height="480"></canvas></div><div id="status" class="status">Starting…</div>
<script>
const FIGHTERS={fighters_payload};const LIB={payload};const fighter=document.getElementById('fighter'),anim=document.getElementById('anim'),canvas=document.getElementById('c'),ctx=canvas.getContext('2d'),statusEl=document.getElementById('status');ctx.imageSmoothingEnabled=false;let current=null,img=null,frame=0,playing=true,mirrored=false,last=0,acc=0;const frameMs=1000/12;
for(const [id,f] of Object.entries(FIGHTERS)){{const o=document.createElement('option');o.value=id;o.textContent=f.label;fighter.appendChild(o)}}
function fillAnimations(){{anim.innerHTML='';for(const a of LIB[fighter.value]){{const o=document.createElement('option');o.value=a.id;o.textContent=a.label;anim.appendChild(o)}}}}
function sourceRect(a,i){{const sf=i%a.count,col=sf%a.columns,row=Math.floor(sf/a.columns);const x0=Math.round(col*a.width/a.columns),x1=Math.round((col+1)*a.width/a.columns),y0=Math.round(row*a.height/a.rows),y1=Math.round((row+1)*a.height/a.rows);return{{x:x0,y:y0,w:x1-x0,h:y1-y0}}}}
function draw(){{if(!current||!img)return;const r=sourceRect(current,frame);if(canvas.width!==r.w||canvas.height!==r.h){{canvas.width=r.w;canvas.height=r.h;ctx.imageSmoothingEnabled=false}}ctx.fillStyle='#0b0911';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.save();if(mirrored){{ctx.translate(canvas.width,0);ctx.scale(-1,1)}}ctx.drawImage(img,r.x,r.y,r.w,r.h,0,0,r.w,r.h);ctx.restore();statusEl.innerHTML=`<span class="good">${{FIGHTERS[fighter.value].label}} / ${{current.label}}</span> · frame ${{frame+1}}/${{current.count}} · ${{r.w}}×${{r.h}}`}}
function load(){{current=LIB[fighter.value].find(x=>x.id===anim.value)||LIB[fighter.value][0];frame=0;playing=true;document.getElementById('play').textContent='Pause';img=new Image();img.onload=draw;img.src=current.src}}
fighter.onchange=()=>{{fillAnimations();load()}};anim.onchange=load;document.getElementById('prev').onclick=()=>{{playing=false;document.getElementById('play').textContent='Play';frame=(frame-1+current.count)%current.count;draw()}};document.getElementById('next').onclick=()=>{{playing=false;document.getElementById('play').textContent='Play';frame=(frame+1)%current.count;draw()}};document.getElementById('play').onclick=()=>{{playing=!playing;document.getElementById('play').textContent=playing?'Pause':'Play'}};document.getElementById('mirror').onclick=()=>{{mirrored=!mirrored;draw()}};document.getElementById('reset').onclick=()=>{{frame=0;draw()}};
function loop(t){{if(!last)last=t;const d=t-last;last=t;if(playing&&current&&img&&img.complete){{acc+=d;while(acc>=frameMs){{acc-=frameMs;if(frame+1>=current.count)frame=current.loop?0:current.count-1;else frame++}}draw()}}requestAnimationFrame(loop)}}fillAnimations();load();requestAnimationFrame(loop);
</script></body></html>'''

OUT.write_text(html, encoding="utf-8")
print(f"Built {OUT} ({OUT.stat().st_size / (1024*1024):.1f} MB)")
