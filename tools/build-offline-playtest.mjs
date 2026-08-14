import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ANIMATION_LIBRARY } from "../src/data/animation-library.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const args = new Set(process.argv.slice(2));
const full = args.has("--full");
const fighterArg = [...args].find(value => value.startsWith("--fighter="))?.split("=")[1];
const animationArg = [...args].find(value => value.startsWith("--animation="))?.split("=")[1];

const fighters = Object.keys(ANIMATION_LIBRARY).filter(id => !fighterArg || id === fighterArg);
if (!fighters.length) throw new Error(`Unknown fighter: ${fighterArg}`);

const payload = {};
let embeddedBytes = 0;
for (const fighterId of fighters) {
  const animations = Object.values(ANIMATION_LIBRARY[fighterId]).filter(animation => {
    if (animation.status !== "ready") return false;
    if (animationArg) return animation.id === animationArg;
    return full || animation.id === "idle";
  });

  if (!animations.length) throw new Error(`No matching ready animations for ${fighterId}`);
  payload[fighterId] = [];
  for (const animation of animations) {
    const bytes = await readFile(resolve(root, animation.sheet));
    embeddedBytes += bytes.length;
    payload[fighterId].push({
      id: animation.id,
      label: animation.label,
      frameCount: animation.frameCount,
      columns: animation.columns,
      rows: animation.rows,
      sheetWidth: animation.sheetWidth,
      sheetHeight: animation.sheetHeight,
      sequence: animation.sequence,
      frameTicks: animation.frameTicks,
      ticksPerFrame: animation.ticksPerFrame,
      loop: animation.loop,
      src: `data:image/png;base64,${bytes.toString("base64")}`
    });
  }
}

const json = JSON.stringify(payload).replaceAll("</script", "<\\/script");
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no"><title>Daunted Sprite Playtest</title>
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}html,body{margin:0;min-height:100%;background:#08070d;color:#f3efff;font-family:system-ui,-apple-system,sans-serif}body{padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left))}header{display:flex;justify-content:space-between;align-items:end;gap:12px;margin-bottom:10px}h1{margin:0;font-size:24px}.sub{font-size:11px;color:#9b73ff;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.controls{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}select,button{width:100%;min-height:42px;border:1px solid #484158;border-radius:10px;background:#171522;color:white;font:inherit;padding:8px}.buttons{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:10px}button{font-weight:800;padding:8px 4px}.stage{border:1px solid #302b3d;border-radius:14px;background:linear-gradient(#151220,#090811);overflow:hidden;min-height:52vh;display:grid;place-items:center}canvas{display:block;max-width:100%;max-height:64vh;image-rendering:pixelated}.status{font:11px ui-monospace,monospace;color:#aaa2b7;margin-top:8px;line-height:1.5}.error{color:#ef6f86}.good{color:#72d89b}@media(orientation:landscape){.stage{min-height:62vh}canvas{max-height:68vh}}
</style></head><body>
<header><div><div class="sub">Daunted embedded sprite build</div><h1>Sprite Playtest</h1></div><div class="sub">NO NETWORK ASSETS</div></header>
<div class="controls"><select id="fighter"></select><select id="anim"></select></div>
<div class="buttons"><button id="prev">◀</button><button id="play">Pause</button><button id="next">▶</button><button id="mirror">Mirror</button><button id="reset">Reset</button></div>
<div class="stage"><canvas id="canvas" width="640" height="480"></canvas></div><div id="status" class="status">Starting…</div>
<script id="library" type="application/json">${json}</script>
<script>
(()=>{'use strict';
const status=document.getElementById('status');
try{
const LIB=JSON.parse(document.getElementById('library').textContent);const fighter=document.getElementById('fighter'),anim=document.getElementById('anim'),canvas=document.getElementById('canvas'),ctx=canvas.getContext('2d');let current=null,image=null,frame=0,playing=true,mirrored=false,last=0,acc=0;
for(const id of Object.keys(LIB)){const o=document.createElement('option');o.value=id;o.textContent=id.replaceAll('-',' ');fighter.appendChild(o)}
function fill(){anim.innerHTML='';for(const a of LIB[fighter.value]){const o=document.createElement('option');o.value=a.id;o.textContent=a.label;anim.appendChild(o)}}
function rect(a,index){const sheetFrame=a.sequence[index%a.frameCount],col=sheetFrame%a.columns,row=Math.floor(sheetFrame/a.columns),x0=Math.round(col*a.sheetWidth/a.columns),x1=Math.round((col+1)*a.sheetWidth/a.columns),y0=Math.round(row*a.sheetHeight/a.rows),y1=Math.round((row+1)*a.sheetHeight/a.rows);return{x:x0,y:y0,w:x1-x0,h:y1-y0}}
function draw(){if(!current||!image||!image.complete)return;const r=rect(current,frame);if(canvas.width!==r.w||canvas.height!==r.h){canvas.width=r.w;canvas.height=r.h}ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();if(mirrored){ctx.translate(canvas.width,0);ctx.scale(-1,1)}ctx.drawImage(image,r.x,r.y,r.w,r.h,0,0,r.w,r.h);ctx.restore();status.innerHTML='<span class="good">'+fighter.value+' / '+current.label+'</span> · frame '+(frame+1)+'/'+current.frameCount+' · '+r.w+'×'+r.h}
function load(){current=LIB[fighter.value].find(a=>a.id===anim.value)||LIB[fighter.value][0];frame=0;acc=0;playing=true;document.getElementById('play').textContent='Pause';image=new Image();image.onload=draw;image.onerror=()=>{status.className='status error';status.textContent='Embedded sprite failed to decode.'};image.src=current.src}
fighter.onchange=()=>{fill();load()};anim.onchange=load;document.getElementById('prev').onclick=()=>{playing=false;frame=(frame-1+current.frameCount)%current.frameCount;draw()};document.getElementById('next').onclick=()=>{playing=false;frame=(frame+1)%current.frameCount;draw()};document.getElementById('play').onclick=()=>{playing=!playing;document.getElementById('play').textContent=playing?'Pause':'Play'};document.getElementById('mirror').onclick=()=>{mirrored=!mirrored;draw()};document.getElementById('reset').onclick=()=>{frame=0;acc=0;draw()};
function tick(t){if(!last)last=t;const delta=Math.min(100,t-last);last=t;if(playing&&current&&image&&image.complete){acc+=delta;const ticks=current.frameTicks?.[frame]??current.ticksPerFrame;const duration=ticks*(1000/60);if(acc>=duration){acc%=duration;if(frame+1<current.frameCount)frame++;else if(current.loop)frame=0;else playing=false;draw()}}requestAnimationFrame(tick)}fill();load();requestAnimationFrame(tick);
}catch(error){status.className='status error';status.textContent='Startup failed: '+error.message;console.error(error)}
})();
</script></body></html>`;

const suffix = full ? "full" : animationArg ?? "smoke";
const out = resolve(root, "dist", `Daunted_Sprite_Playtest_${suffix}.html`);
await mkdir(dirname(out), { recursive: true });
await writeFile(out, html, "utf8");
console.log(`Built ${out}`);
console.log(`Embedded ${(embeddedBytes / 1024 / 1024).toFixed(1)} MB of PNG data; HTML ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(1)} MB.`);
