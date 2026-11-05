// Optional site overlay: the server is authoritative about whether it is enabled.
(()=>{'use strict';
let running=false, teardown=null, timer=null;
async function sync(){try{const r=await fetch('/api/crawler',{cache:'no-store'});if(!r.ok)throw Error('unavailable');const d=await r.json();const allowed=d.enabled===true&&!matchMedia('(prefers-reduced-motion: reduce)').matches;if(allowed&&!running){running=true;teardown=start()}else if(!allowed&&running){teardown();teardown=null;running=false}}catch(_){if(running){teardown();teardown=null;running=false}}}
sync();timer=setInterval(sync,30000);window.addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.type==='nexus-crawler-setting')sync()});
function start(){
const root=document.createElement('div');root.id='nexus-crawler';root.innerHTML=`<style>
#nexus-crawler-canvas{position:fixed;inset:0;width:100%;height:100%;z-index:18;pointer-events:none}
#nexus-crawler-menu{position:fixed;right:16px;bottom:calc(90px + env(safe-area-inset-bottom,0px));z-index:40;opacity:.32;transition:opacity .35s ease;font-family:system-ui,sans-serif;cursor:auto!important}
#nexus-crawler-menu:hover,#nexus-crawler-menu:focus-within,#nexus-crawler-menu.open,#nexus-crawler-menu.active{opacity:1}
#nexus-crawler-launch{width:48px;height:48px;border-radius:16px;border:1px solid #c4a06a;background:rgba(18,10,27,.88);color:#f8d998;font-size:21px;box-shadow:0 6px 24px #0009;touch-action:none;cursor:pointer!important}
#nexus-crawler-panel{position:absolute;right:0;bottom:58px;width:235px;max-height:min(75dvh,520px);overflow-y:auto;padding:15px;border-radius:14px;border:1px solid #a38255;background:rgba(14,8,23,.97);box-shadow:0 12px 40px #000b;color:#f7ecda;font-size:13px}
#nexus-crawler-panel[hidden]{display:none}#nexus-crawler-panel h2{font:600 11px system-ui;letter-spacing:.14em;color:#e6c68a;text-transform:uppercase;margin:0 0 12px}
#nexus-crawler-panel label{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:12px 0;font-size:12px}#nexus-crawler-panel select{background:#24172e;color:#fff;border:1px solid #6c5672;border-radius:6px;padding:5px;max-width:135px;cursor:pointer!important}#nexus-crawler-panel input{accent-color:#dbb777;cursor:pointer!important}#nexus-crawler-panel input[type=range]{width:100px}#nexus-crawler-panel p{color:#cdbfd0;font-size:10px;line-height:1.45;margin:10px 0 0}#nexus-crawler-panel *{user-select:auto}
</style><canvas id="nexus-crawler-canvas" aria-hidden="true"></canvas><div id="nexus-crawler-menu" class="active"><button id="nexus-crawler-launch" type="button" aria-label="Crawler settings" aria-expanded="false" aria-controls="nexus-crawler-panel">✣</button><div id="nexus-crawler-panel" hidden><h2>Crawler settings</h2><label>Show crawler<input type="checkbox" id="nc-visible" checked></label><label>Show babies<input type="checkbox" id="nc-babies" checked></label><label>Spider type<select id="nc-preset"><option value="longlegs">Daddy long-legs</option><option value="classic">Classic</option><option value="tarantula">Tarantula</option><option value="jumper">Jumper</option></select></label><label>Color<select id="nc-color"><option value="ember">Amber</option><option value="violet">Violet</option><option value="ice">Ice</option><option value="blood">Red</option><option value="venom">Green</option><option value="mono">Mono</option></select></label><label>Behavior<select id="nc-mode"><option value="wander">Wander</option><option value="follow">Follow</option><option value="shy">Shy</option><option value="orbit">Orbit</option><option value="still">Still</option></select></label><label>Gait<select id="nc-gait"><option value="wave">Wave</option><option value="alt">Alternating</option><option value="free">Free</option></select></label><label>Size<input type="range" id="nc-size" min="70" max="140" value="100"></label><label>Leg length<input type="range" id="nc-legLen" min="60" max="160" value="155"></label><label>Leg thickness<input type="range" id="nc-thick" min="10" max="60" value="13"></label><label>Joint dots<input type="checkbox" id="nc-dots" checked></label><label>Joint ghost boxes<input type="checkbox" id="nc-ghosts" checked></label><label>Foot brackets<input type="checkbox" id="nc-brackets" checked></label><label>Body plates<input type="checkbox" id="nc-plates" checked></label><label>Neon glow<input type="checkbox" id="nc-glow"></label><label>Eyes track cursor<input type="checkbox" id="nc-eyes" checked></label><label>Colorful word highlights<input type="checkbox" id="nc-words" checked></label><label>Footstep trails<input type="checkbox" id="nc-trails" checked></label><label>Sound<input type="checkbox" id="nc-sound" checked></label><label>Babies follow<input type="checkbox" id="nc-follow" checked></label><p>Drag the floating button to move it. Your settings apply only to this browser. Sound starts after your first tap or click.</p></div></div>`;document.body.appendChild(root);
const $=s=>root.querySelector(s),canvas=$('#nexus-crawler-canvas'),ctx=canvas.getContext('2d'),menu=$('#nexus-crawler-menu'),button=$('#nexus-crawler-launch'),panel=$('#nexus-crawler-panel');
const controls={preset:$('#nc-preset'),gait:$('#nc-gait'),legLen:$('#nc-legLen'),thick:$('#nc-thick'),dots:$('#nc-dots'),ghosts:$('#nc-ghosts'),brackets:$('#nc-brackets'),plates:$('#nc-plates'),glow:$('#nc-glow'),eyes:$('#nc-eyes'),visible:$('#nc-visible'),babies:$('#nc-babies'),color:$('#nc-color'),mode:$('#nc-mode'),size:$('#nc-size'),trails:$('#nc-trails'),words:$('#nc-words'),sound:$('#nc-sound'),followBabies:$('#nc-follow')};
const C={mode:controls.mode,gait:controls.gait,size:controls.size,legLen:controls.legLen,thick:controls.thick,dots:controls.dots,ghosts:controls.ghosts,brackets:controls.brackets,plates:controls.plates,glow:controls.glow,eyes:controls.eyes,sound:controls.sound,babyFollow:controls.followBabies,trail:controls.trails,speed:{value:'70'},stride:{value:'70'},stepSpd:{value:'85'},turn:{value:'60'}};
const THEMES={
  amber :{a:'#d18a2b',b:'#f0a63e',k:'#5ec3ad',core:'#ffffff',belly:'#7fb0aa',ghost:'150,150,150',foot:'205,150,50',sw:'#d18a2b'},
  ice   :{a:'#58b8e6',b:'#8fd8ff',k:'#ff8fb8',core:'#ffffff',belly:'#c0d6ff',ghost:'130,150,170',foot:'90,180,230',sw:'#58b8e6'},
  venom :{a:'#7bd23a',b:'#a8f05a',k:'#e6e15a',core:'#f4ffe8',belly:'#5d8f53',ghost:'130,160,130',foot:'130,210,70',sw:'#7bd23a'},
  blood :{a:'#c8352e',b:'#ff5a4a',k:'#f2c26b',core:'#ffffff',belly:'#9a5d5a',ghost:'160,130,130',foot:'210,70,60',sw:'#c8352e'},
  violet:{a:'#9d6ef0',b:'#c9a3ff',k:'#ffd27a',core:'#ffffff',belly:'#8a7bb0',ghost:'150,140,170',foot:'170,120,240',sw:'#9d6ef0'},
  mono  :{a:'#cfcfcf',b:'#ffffff',k:'#8a8a8a',core:'#ffffff',belly:'#888888',ghost:'150,150,150',foot:'200,200,200',sw:'#cfcfcf'}
};
let theme='amber',T=THEMES.amber;
// Rest pose traced from the reference image (body centre = origin, -y = forward). Left side; right is mirrored.
const REST_L=[
  [[-24,-22],[-101,-10],[-137,-90],[-137,-170],[-131,-212]],
  [[-24,-18],[-87,28],[-174,2],[-209,-65],[-214,-110]],
  [[-24,-14],[-51,60],[-124,113],[-197,97],[-222,58]],
  [[-24,-10],[-31,68],[-53,158],[-115,197],[-149,168]]
];
// alternating tetrapod groups: L1,R2,L3,R4 vs R1,L2,R3,L4
function buildRest(legMul){
  const legs=[];
  REST_L.forEach((pts,i)=>[-1,1].forEach(side=>{
    const root=pts[0];
    const p=pts.map(([x,y],j)=>j===0?[x,y]:[root[0]+(x-root[0])*legMul,root[1]+(y-root[1])*legMul]).map(([x,y])=>[side<0?x:-x,y]);
    legs.push({i,side,pose:p,group:(i+(side<0?0:1))%2,order:side<0?[0,4,2,6][i]:[3,7,1,5][i]});
  }));
  return legs;
}

let w,h,dpr,BASE=1,time=0,last=0,raf=0,audio=null,lastTick=0,fadeTimer=0,active=true,nextHatch=0;const pointer={x:0,y:0,down:false,last:-100,seen:false};
const marks=[],wordHits=[];let main=null,babies=[];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rand=(a,b)=>a+Math.random()*(b-a),lerp=(a,b,t)=>a+(b-a)*t;
function resize(){w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);BASE=clamp(Math.min(w,h)/1500,.18,.38)}
function rebuild(){if(main){main.build();main.solve()}babies.forEach(b=>{b.build();b.solve()})}
// Measure only the active slide under a landing foot. No wrapping or mutation of the site's text.
let lastWordCheck=-1;
function highlightWord(x,y){
 if(!controls.words.checked || time-lastWordCheck<.05)return false;
 lastWordCheck=time; let best=null,bestDistance=Infinity;
 const targets=document.querySelectorAll('.slide.active .slide-desc, .slide.active .slide-eyebrow, .slide.active .cause-tag, .slide.active .slide-title .char');
 for(const el of targets){const box=el.getBoundingClientRect(),pad=5;if(x<box.left-pad||x>box.right+pad||y<box.top-pad||y>box.bottom+pad)continue;
  const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let node;
  while((node=walker.nextNode())){const text=node.nodeValue;const matches=text.matchAll(/\S+/g);for(const match of matches){const range=document.createRange();range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);for(const r of range.getClientRects()){if(!r.width||!r.height||x<r.left-pad||x>r.right+pad||y<r.top-pad||y>r.bottom+pad)continue;const d=Math.abs(x-(r.left+r.right)/2)+Math.abs(y-(r.top+r.bottom)/2);if(d<bestDistance){bestDistance=d;best={left:r.left,top:r.top,width:r.width,height:r.height,until:time+1}}}range.detach()}}
 }
 if(!best)return false;const colors=['255,103,103','255,184,96','252,209,112','113,219,189','125,188,255','202,155,244','245,143,190'];best.color=colors[Math.floor(Math.random()*colors.length)];wordHits.push(best);if(wordHits.length>16)wordHits.shift();return true;
}
function mark(x,y){const hit=highlightWord(x,y);if(controls.trails.checked){marks.push({x,y,life:1});if(marks.length>24)marks.shift()}if(controls.sound.checked&&audio){const n=audio.currentTime;if(n-lastTick>.08){lastTick=n;const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=hit?rand(700,1100):rand(180,420);g.gain.setValueAtTime(.0001,n);g.gain.exponentialRampToValueAtTime(.015,n+.005);g.gain.exponentialRampToValueAtTime(.0001,n+.07);o.connect(g).connect(audio.destination);o.start(n);o.stop(n+.08)}}}
class Spider{
  constructor(x,y,opts={}){
    this.x=x;this.y=y;this.vx=0;this.vy=0;this.a=-Math.PI/2;
    this.k=opts.k||1;this.baby=!!opts.baby;this.theme=opts.theme||null;
    this.tx=x;this.ty=y;this.next=0;this.ox=opts.ox||0;this.oy=opts.oy||0;this.pace=opts.pace||1;this.grabbed=false;
    this.build();
  }
  unit(){return BASE*Number(C.size.value)/100*this.k}
  build(){
    const legMul=Number(C.legLen.value)/100;
    this.legs=buildRest(legMul).map(L=>{
      const len=[];for(let j=1;j<L.pose.length;j++)len.push(Math.hypot(L.pose[j][0]-L.pose[j-1][0],L.pose[j][1]-L.pose[j-1][1]));
      const f=L.pose[L.pose.length-1];const wf=this.toWorld(f[0],f[1]);
      return {...L,len,fx:wf[0],fy:wf[1],sx:0,sy:0,ex:0,ey:0,t:0,stepping:false,pts:[],ghost:null,lift:0};
    });
  }
  toWorld(bx,by){const u=this.unit(),c=Math.cos(this.a),s=Math.sin(this.a);// forward=(c,s) right=(-s,c)
    return [this.x+(-by)*u*c+bx*u*(-s), this.y+(-by)*u*s+bx*u*c];}
  update(dt,leader){
    const u=this.unit();let mode=C.mode.value,flee=false;
    if(this.grabbed){const k=1-Math.exp(-22*dt),nx=lerp(this.x,pointer.x,k),ny=lerp(this.y,pointer.y,k);this.vx=(nx-this.x)/dt;this.vy=(ny-this.y)/dt;this.x=nx;this.y=ny;this.tx=nx;this.ty=ny}
    else{
      const active=pointer.down||time-pointer.last<1.5;
      if(this.baby){
        if(C.babyFollow.checked&&leader){const c=Math.cos(leader.a),s=Math.sin(leader.a);this.tx=leader.x-c*this.oy+(-s)*this.ox;this.ty=leader.y-s*this.oy+c*this.ox}
        else if(time>this.next||Math.hypot(this.tx-this.x,this.ty-this.y)<20){this.tx=rand(60,w-60);this.ty=rand(60,h-60);this.next=time+rand(2,5)}
      }else if(mode==='follow'&&active&&pointer.seen){this.tx=pointer.x;this.ty=pointer.y}
      else if(mode==='shy'&&pointer.seen){const dx=this.x-pointer.x,dy=this.y-pointer.y,d=Math.hypot(dx,dy)||1;if(d<260*u&&active){flee=true;this.tx=clamp(this.x+dx/d*240*u,40,w-40);this.ty=clamp(this.y+dy/d*240*u,40,h-40)}}
      else if(mode==='orbit'&&pointer.seen){const r=170*u,ang=time*.7*Number(C.speed.value)/90;this.tx=pointer.x+Math.cos(ang)*r;this.ty=pointer.y+Math.sin(ang)*r}
      else if(mode==='wander'){if(time>this.next||Math.hypot(this.tx-this.x,this.ty-this.y)<25*u){const m=Math.min(w,h)*.18;this.tx=rand(m,w-m);this.ty=rand(m,h-m);this.next=time+rand(2.5,5)}}
      else if(mode==='still'){this.tx=this.x;this.ty=this.y}
      const dx=this.tx-this.x,dy=this.ty-this.y,dist=Math.hypot(dx,dy)||.001;
      const top=Number(C.speed.value)*3*u*this.pace*(flee?1.6:1)*(this.baby?1.15:1),want=dist<6*u?0:Math.min(top,dist*2.6),k=1-Math.exp(-5*dt);
      this.vx+=(dx/dist*want-this.vx)*k;this.vy+=(dy/dist*want-this.vy)*k;
      this.x=clamp(this.x+this.vx*dt,0,w);this.y=clamp(this.y+this.vy*dt,0,h);
    }
    const spd=Math.hypot(this.vx,this.vy),tr=Number(C.turn.value)/100*6;
    if(spd>14*u){let da=Math.atan2(this.vy,this.vx)-this.a;da=Math.atan2(Math.sin(da),Math.cos(da));this.a+=clamp(da,-tr*dt,tr*dt)}
    this.gait(dt,spd);this.solve();
  }
  gait(dt,spd){
    const u=this.unit(),stride=Number(C.stride.value)*u*(Number(C.legLen.value)/100),dur=clamp(110/Number(C.stepSpd.value)*.17,.05,.6)*(this.baby?.7:1);
    const g=C.gait.value;const anyStepping=this.legs.some(L=>L.stepping);
    const lead=Math.min(stride*.8,spd*dur*1.1);const vd=spd>1?[this.vx/spd,this.vy/spd]:[0,0];
    // rank legs by error, step worst first
    const cand=[];
    for(const L of this.legs){
      const f=L.pose[L.pose.length-1],home=this.toWorld(f[0],f[1]);L.hx=home[0]+vd[0]*lead;L.hy=home[1]+vd[1]*lead;
      if(L.stepping){L.t+=dt/dur;const t=Math.min(1,L.t),e=t*t*(3-2*t);L.fx=lerp(L.sx,L.ex,e);L.fy=lerp(L.sy,L.ey,e);L.lift=Math.sin(Math.PI*t);
        if(t>=1){L.stepping=false;L.lift=0;this.plant(L)}continue}
      const err=Math.hypot(L.fx-home[0],L.fy-home[1]);
      if(err>stride||(spd<6*u&&err>stride*.35&&!anyStepping))cand.push([err,L]);
    }
    cand.sort((a,b)=>b[0]-a[0]);
    for(const [,L] of cand){
      let ok=true;
      if(g==='alt')ok=!this.legs.some(o=>o.stepping&&o.group!==L.group);
      else if(g==='wave')ok=!this.legs.some(o=>o.stepping);
      else ok=!this.legs.some(o=>o.stepping&&o.i===L.i);
      if(!ok)continue;
      L.stepping=true;L.t=0;L.sx=L.fx;L.sy=L.fy;L.ex=L.hx;L.ey=L.hy;
    }
  }
  plant(L){if(!this.baby)mark(L.fx,L.fy)}
  // FABRIK seeded from the rest pose so every leg keeps its characteristic bend.
  solve(){
    const u=this.unit();
    for(const L of this.legs){
      const P=L.pose.map(([x,y])=>this.toWorld(x,y));const len=L.len.map(l=>l*u);
      // feet lifted mid-step pull slightly toward body (top-down 'raise')
      let tx=L.fx,ty=L.fy;if(L.lift>0){tx=lerp(tx,P[0][0],L.lift*.12);ty=lerp(ty,P[0][1],L.lift*.12)}
      const root=[P[0][0],P[0][1]],n=P.length,total=len.reduce((a,b)=>a+b,0);
      const d=Math.hypot(tx-root[0],ty-root[1]);
      if(d>=total*.999){const dx=(tx-root[0])/d,dy=(ty-root[1])/d;let acc=0;for(let j=1;j<n;j++){acc+=len[j-1];P[j]=[root[0]+dx*acc*.999,root[1]+dy*acc*.999]}}
      else for(let it=0;it<8;it++){
        P[n-1]=[tx,ty];for(let j=n-2;j>=0;j--){const dx=P[j][0]-P[j+1][0],dy=P[j][1]-P[j+1][1],l=Math.hypot(dx,dy)||1;P[j]=[P[j+1][0]+dx/l*len[j],P[j+1][1]+dy/l*len[j]]}
        P[0]=root;for(let j=1;j<n;j++){const dx=P[j][0]-P[j-1][0],dy=P[j][1]-P[j-1][1],l=Math.hypot(dx,dy)||1;P[j]=[P[j-1][0]+dx/l*len[j-1],P[j-1][1]+dy/l*len[j-1]]}
        if(Math.hypot(P[n-1][0]-tx,P[n-1][1]-ty)<.3)break;
      }
      L.pts=P;
      if(!L.ghost)L.ghost=P.map(p=>[p[0],p[1]]);
      else{const k=.12;L.ghost.forEach((g,j)=>{g[0]=lerp(g[0],P[j][0],k);g[1]=lerp(g[1],P[j][1],k)})}
    }
  }
  draw(){
    const u=this.unit(),t=this.theme||T,th=Number(C.thick.value)/10*u*(this.baby?1.2:1);
    // ghost boxes & foot brackets (behind)
    if(!this.baby&&(C.ghosts.checked||C.brackets.checked))for(const L of this.legs){
      const n=L.pts.length;
      for(let j=1;j<n;j++){
        const g=L.ghost[j],p=L.pts[j],q=L.pts[j-1],ang=Math.atan2(p[1]-q[1],p[0]-q[0]);
        if(j<n-1&&C.ghosts.checked){ctx.strokeStyle=`rgba(${t.ghost},.20)`;ctx.lineWidth=1.6*u;box(g[0],g[1],13*u,ang+.25)}
        if(j===n-1){
          if(C.ghosts.checked){ctx.strokeStyle=`rgba(${t.ghost},.16)`;ctx.lineWidth=1.6*u;box(g[0]+(q[0]-p[0])*.18,g[1]+(q[1]-p[1])*.18,11*u,ang-.3)}
          if(C.brackets.checked){ctx.strokeStyle=`rgba(${t.foot},${.28+L.lift*.4})`;ctx.lineWidth=2*u;brackets(g[0],g[1],(20+L.lift*6)*u,ang+.15)}
        }
      }
    }
    // body back plates
    ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.a+Math.PI/2);ctx.scale(u,u);
    if(C.plates.checked){ctx.fillStyle='rgba(255,255,255,.07)';ctx.strokeStyle='rgba(255,255,255,.12)';ctx.lineWidth=1.5;
      for(const x of [-44,-24,6,26]){ctx.beginPath();ctx.rect(x,-42,15,42);ctx.fill();ctx.stroke()}}
    ctx.restore();
    // legs
    if(C.glow.checked){ctx.shadowColor=t.b;ctx.shadowBlur=10*u}
    ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle=t.a;ctx.lineWidth=th;
    ctx.beginPath();for(const L of this.legs){const P=L.pts;ctx.moveTo(P[0][0],P[0][1]);for(let j=1;j<P.length;j++)ctx.lineTo(P[j][0],P[j][1])}ctx.stroke();
    ctx.shadowBlur=0;
    if(C.dots.checked){ctx.fillStyle=t.k;for(const L of this.legs){const P=L.pts;for(let j=1;j<P.length;j++){if(j===1&&!this.baby)continue;ctx.beginPath();ctx.arc(P[j][0],P[j][1],(j===P.length-1?2.6:2.1)*u*(this.baby?1.4:1),0,Math.PI*2);ctx.fill()}}}
    // body
    ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.a+Math.PI/2);ctx.scale(u,u);
    if(C.glow.checked){ctx.shadowColor=t.b;ctx.shadowBlur=12}
    ctx.fillStyle=t.b;
    // H-frame: two side rails with notched shoulders
    for(const s of [-1,1]){ctx.beginPath();ctx.rect(s>0?10:-17,-31,7,61);ctx.fill();ctx.beginPath();ctx.rect(s>0?10:-21,-31,11,8);ctx.fill();ctx.beginPath();ctx.rect(s>0?10:-21,22,11,8);ctx.fill();ctx.beginPath();ctx.rect(s>0?10:-21,-3,11,6);ctx.fill()}
    ctx.beginPath();ctx.rect(-4,-6,8,8);ctx.fill();
    ctx.shadowBlur=0;
    // leg sockets
    ctx.fillStyle=t.k;ctx.globalAlpha=.85;for(const s of [-1,1]){ctx.beginPath();ctx.rect(s>0?21:-27,-25,6,16);ctx.fill()}ctx.globalAlpha=1;
    ctx.strokeStyle=t.a;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-27,-17);ctx.lineTo(27,-17);ctx.stroke();
    // head
    ctx.fillStyle='#000';ctx.strokeStyle=t.core;ctx.lineWidth=3;ctx.beginPath();ctx.rect(-8,-25,16,17);ctx.fill();ctx.stroke();
    let ex=0,ey=0;if(C.eyes.checked&&pointer.seen&&!this.baby){const c=Math.cos(-(this.a+Math.PI/2)),s=Math.sin(-(this.a+Math.PI/2)),dx=pointer.x-this.x,dy=pointer.y-this.y,lx=dx*c-dy*s,ly=dx*s+dy*c,l=Math.hypot(lx,ly)||1;ex=lx/l*2.4;ey=ly/l*2.4}
    ctx.fillStyle=t.k;ctx.fillRect(-1.8+ex,-18.3+ey,3.6,3.6);ctx.fillStyle=t.core;ctx.globalAlpha=.6;ctx.fillRect(-.6+ex,-17.4+ey,1.2,1.2);ctx.globalAlpha=1;
    // abdomen
    ctx.fillStyle='#000';ctx.strokeStyle=t.core;ctx.lineWidth=3;ctx.beginPath();ctx.rect(-10,6,20,20);ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(200,200,200,.75)';ctx.fillRect(-7.5,8.5,15,6);ctx.fillStyle=t.belly;ctx.fillRect(-7.5,15,15,8.5);
    ctx.restore();
  }
  hit(x,y){return Math.hypot(x-this.x,y-this.y)<42*this.unit()}
}
function box(x,y,r,a){ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.beginPath();ctx.rect(-r,-r,2*r,2*r);ctx.stroke();ctx.restore()}
function brackets(x,y,r,a){const c=r*.42;ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.beginPath();
  for(const[sx,sy]of[[-1,-1],[1,-1],[1,1],[-1,1]]){ctx.moveTo(sx*r,sy*(r-c));ctx.lineTo(sx*r,sy*r);ctx.lineTo(sx*(r-c),sy*r)}ctx.stroke();ctx.restore()}

const PRESETS={classic:{speed:90,size:100,legLen:100,stride:42,stepSpd:110,turn:80,thick:30,gait:'alt'},tarantula:{speed:45,size:125,legLen:85,stride:34,stepSpd:60,turn:40,thick:52,gait:'alt'},longlegs:{speed:70,size:85,legLen:155,stride:70,stepSpd:85,turn:60,thick:13,gait:'wave'},jumper:{speed:190,size:75,legLen:72,stride:26,stepSpd:240,turn:190,thick:32,gait:'free'}};
function preset(name){const p=PRESETS[name]||PRESETS.longlegs;for(const k in p)C[k].value=String(p[k]);rebuild()}
function hatch(){if(babies.length>=3)return;const keys=Object.keys(THEMES),i=babies.length,ref=i?babies[i-1]:main;const baby=new Spider(ref.x+rand(-20,20),ref.y+rand(-20,20),{k:.16,baby:true,theme:THEMES[keys[Math.floor(rand(0,keys.length))]],ox:rand(-40,40)*BASE,oy:rand(90,130)*BASE,pace:rand(.9,1.3)});baby.age=0;baby.maxSize=rand(.32,.45);baby.growthTime=rand(22,40);baby.solve();babies.push(baby)}
function update(dt){time+=dt;if(controls.babies.checked&&time>=nextHatch&&babies.length<3){hatch();nextHatch=time+rand(8,17)}main.update(dt,null);for(let i=0;i<babies.length;i++){const b=babies[i];b.age+=dt;b.k=lerp(.16,b.maxSize,Math.min(1,b.age/b.growthTime));b.update(dt,i?babies[i-1]:main)}for(let i=wordHits.length-1;i>=0;i--)if(wordHits[i].until<=time)wordHits.splice(i,1);for(const m of marks)m.life-=dt*1.25;while(marks.length&&marks[0].life<=0)marks.shift()}
function draw(){ctx.clearRect(0,0,w,h);for(const hit of wordHits){const fade=clamp((hit.until-time)*3,0,1);ctx.fillStyle=`rgba(${hit.color},${.24*fade})`;ctx.fillRect(hit.left-1,hit.top,hit.width+2,hit.height);ctx.fillStyle=`rgba(${hit.color},${.8*fade})`;ctx.fillRect(hit.left,hit.top+hit.height-2,hit.width,1.5)}for(const m of marks){ctx.strokeStyle=`rgba(${T.foot},${Math.max(0,m.life)*.35})`;ctx.lineWidth=1.2;box(m.x,m.y,(2+(1-m.life)*8)*BASE,(1-m.life))}babies.forEach(b=>b.draw());main.draw()}

function onMove(e){if(root.contains(e.target))return;pointer.x=e.clientX;pointer.y=e.clientY;pointer.last=time;pointer.seen=true}
function unlockAudio(){if(!controls.sound.checked||!controls.visible.checked)return;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audio=audio||new AC();if(audio.state==='suspended')audio.resume().catch(()=>{})}catch(_){}}
function onDown(e){unlockAudio();if(root.contains(e.target)||e.target.closest('a,button,input,select,textarea,[role=dialog]'))return;onMove(e)}
function onResize(){resize();main.x=clamp(main.x,0,w);main.y=clamp(main.y,0,h);rebuild()}
function onVisible(){last=0}window.addEventListener('pointermove',onMove,{passive:true});window.addEventListener('pointerdown',onDown,{passive:true});window.addEventListener('keydown',unlockAudio);window.addEventListener('resize',onResize);document.addEventListener('visibilitychange',onVisible);
function save(){try{localStorage.setItem('nexus-crawler-preferences',JSON.stringify({preset:controls.preset.value,gait:controls.gait.value,legLen:controls.legLen.value,thick:controls.thick.value,dots:controls.dots.checked,ghosts:controls.ghosts.checked,brackets:controls.brackets.checked,plates:controls.plates.checked,glow:controls.glow.checked,eyes:controls.eyes.checked,visible:controls.visible.checked,babies:controls.babies.checked,color:controls.color.value,mode:controls.mode.value,size:controls.size.value,trails:controls.trails.checked,words:controls.words.checked,sound:controls.sound.checked,follow:controls.followBabies.checked}))}catch(_){}}
try{const p=JSON.parse(localStorage.getItem('nexus-crawler-preferences')||'{}');if(PRESETS[p.preset]){controls.preset.value=p.preset;preset(p.preset)}else preset('longlegs');for(const key of ['dots','ghosts','brackets','plates','glow','eyes'])if(typeof p[key]==='boolean')controls[key].checked=p[key];if(['wave','alt','free'].includes(p.gait))controls.gait.value=p.gait;if(Number(p.legLen)>=60&&Number(p.legLen)<=160)controls.legLen.value=p.legLen;if(Number(p.thick)>=10&&Number(p.thick)<=60)controls.thick.value=p.thick;if(typeof p.visible==='boolean')controls.visible.checked=p.visible;if(typeof p.babies==='boolean')controls.babies.checked=p.babies;if(['ember','ice','blood','venom','violet','mono'].includes(p.color))controls.color.value=p.color;if(['wander','follow','shy','orbit','still'].includes(p.mode))controls.mode.value=p.mode;if(Number(p.size)>=70&&Number(p.size)<=140)controls.size.value=p.size;if(typeof p.trails==='boolean')controls.trails.checked=p.trails;if(typeof p.words==='boolean')controls.words.checked=p.words;if(typeof p.sound==='boolean')controls.sound.checked=p.sound;if(typeof p.follow==='boolean')controls.followBabies.checked=p.follow}catch(_){}theme=controls.color.value==='ember'?'amber':controls.color.value;T=THEMES[theme]||THEMES.amber;
controls.visible.onchange=()=>{if(!controls.visible.checked){ctx.clearRect(0,0,w,h);marks.length=0;wordHits.length=0}last=0;save()};controls.babies.onchange=()=>{if(!controls.babies.checked)babies.length=0;else nextHatch=time+rand(3,8);save()};controls.color.onchange=()=>{theme=controls.color.value==='ember'?'amber':controls.color.value;T=THEMES[theme];save()};controls.mode.onchange=save;controls.trails.onchange=save;controls.words.onchange=()=>{if(!controls.words.checked)wordHits.length=0;save()};controls.followBabies.onchange=save;for(const key of ['dots','ghosts','brackets','plates','glow','eyes'])controls[key].onchange=save;controls.size.oninput=()=>{rebuild();save()};controls.preset.onchange=()=>{preset(controls.preset.value);save()};controls.legLen.oninput=()=>{rebuild();save()};controls.thick.oninput=save;controls.gait.onchange=save;controls.sound.onchange=()=>{if(controls.sound.checked)unlockAudio();save()};
function reveal(){menu.classList.add('active');clearTimeout(fadeTimer);fadeTimer=setTimeout(()=>menu.classList.remove('active'),2800)}
let drag=null;button.addEventListener('pointerdown',e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:menu.getBoundingClientRect().left,top:menu.getBoundingClientRect().top,moved:false};button.setPointerCapture(e.pointerId);reveal()});button.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>5)drag.moved=true;if(drag.moved){menu.style.left=clamp(drag.left+dx,0,innerWidth-48)+'px';menu.style.top=clamp(drag.top+dy,0,innerHeight-48)+'px';menu.style.right='auto';menu.style.bottom='auto'}});button.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.id)return;const moved=drag.moved;drag=null;if(!moved){panel.hidden=!panel.hidden;menu.classList.toggle('open',!panel.hidden);button.setAttribute('aria-expanded',String(!panel.hidden))}reveal()});button.addEventListener('click',e=>{if(e.detail===0){panel.hidden=!panel.hidden;menu.classList.toggle('open',!panel.hidden);button.setAttribute('aria-expanded',String(!panel.hidden));reveal()}});button.addEventListener('pointercancel',()=>{drag=null;reveal()});
resize();main=new Spider(w*.5,h*.55);main.solve();nextHatch=rand(5,12);update(.00001);reveal();
function frame(now){if(!active)return;if(!last)last=now;const dt=Math.min(.033,(now-last)/1000);last=now;if(dt>0&&controls.visible.checked){update(dt);draw()}raf=requestAnimationFrame(frame)}raf=requestAnimationFrame(frame);
return ()=>{active=false;cancelAnimationFrame(raf);clearTimeout(fadeTimer);window.removeEventListener('pointermove',onMove);window.removeEventListener('pointerdown',onDown);window.removeEventListener('keydown',unlockAudio);window.removeEventListener('resize',onResize);document.removeEventListener('visibilitychange',onVisible);if(audio)audio.close();root.remove()};
}
})();
