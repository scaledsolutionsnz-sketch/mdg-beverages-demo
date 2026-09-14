/* Restored from the rotating product experience in commit d06d9d2. */
function wirePosers(){
  if(window.__poserTimer) clearInterval(window.__poserTimer);
  const posers=[...document.querySelectorAll('.poser')];
  if(!posers.length) return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  function leads(p){
    const svg=p.querySelector('.leads'); const stage=p.querySelector('.pstage');
    if(!svg||!stage) return;
    const lines=[...svg.querySelectorAll('line')], bubs=[...p.querySelectorAll('.bub')];
    if(!lines.length) return;
    if(!p.classList.contains('sel')){ lines.forEach(l=>l.setAttribute('x2', l.getAttribute('x1')||0)); return; }
    const g=p.getBoundingClientRect(), s=stage.getBoundingClientRect();
    bubs.forEach((b,i)=>{
      const l=lines[i]; if(!l) return;
      const r=b.getBoundingClientRect();
      const x1=r.left+r.width/2-g.left;
      const y1=(i===0 ? r.bottom+4 : r.top-4)-g.top;
      const x2=s.left-g.left+s.width*0.5;
      const y2=s.top-g.top+s.height*(i===0 ? 0.10 : 0.90);
      l.setAttribute('x1',x1.toFixed(1)); l.setAttribute('y1',y1.toFixed(1));
      l.setAttribute('x2',x2.toFixed(1)); l.setAttribute('y2',y2.toFixed(1));
    });
  }
  function toggle(p){
    const wasOpen=p.classList.contains('sel');
    posers.forEach(q=>{ q.classList.remove('sel'); leads(q); });
    if(!wasOpen){ p.classList.add('sel'); leads(p); setTimeout(()=>leads(p),80); }
  }
  posers.forEach(p=>{
    p.addEventListener('click',ev=>{ ev.stopPropagation(); toggle(p); });
    p.addEventListener('keydown',ev=>{
      if(ev.key==='Enter'||ev.key===' '){ ev.preventDefault(); ev.stopPropagation(); toggle(p); }
    });
  });
  document.addEventListener('click',()=>posers.forEach(p=>{ p.classList.remove('sel'); leads(p); }));
  window.addEventListener('resize',()=>posers.forEach(leads),{passive:true});

  if(reduce) return;
  const idx=posers.map(()=>0);
  let tick=0;
  window.__poserTimer=setInterval(()=>{
    posers.forEach((p,i)=>{
      if((tick+i)%2!==0) return;                       // the two never turn at the same moment
      if(p.classList.contains('sel')) return;          // hold still while its notes are open
      const imgs=[...p.querySelectorAll('.pimg')];
      if(imgs.length<2) return;
      imgs[idx[i]].classList.remove('show');
      idx[i]=(idx[i]+1)%imgs.length;
      imgs[idx[i]].classList.add('show');
    });
    tick++;
  },1900);
}

function initWheel(gal){
  const items = [...gal.querySelectorAll('.gitem')];
  if(!items.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const n = items.length;
  let t = 0, last = performance.now(), onScreen = true, hovered = -1, target = null, opened = -1;
  const frontT = i => { let w = -i/n; while(w < t) w += 1; if(w - t > 0.5) w -= 1; return w; };

  function openCan(i){
    opened = i;
    items.forEach((el,k)=>el.classList.toggle('open', k===i));
    gal.classList.add('sel');
  }
  function closeCan(){
    opened = -1;
    items.forEach(el=>el.classList.remove('open'));
    gal.classList.remove('sel');
  }

  items.forEach((el,i)=>{
    el.tabIndex=0; el.setAttribute('role','button'); el.setAttribute('aria-label',el.querySelector('img').alt+', show tasting notes');
    el.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();el.click();}});
    el.addEventListener('pointerenter',()=>{           // hover just holds the roll still
      hovered = i; el.classList.add('on');
    });
    el.addEventListener('pointerleave',()=>{ if(hovered===i) hovered = -1; el.classList.remove('on'); });
    el.addEventListener('click',ev=>{
      ev.stopPropagation();
      if(opened === i){ closeCan(); } else { target = frontT(i); openCan(i); }
    });
  });
  document.addEventListener('click',()=>{ if(opened !== -1) closeCan(); });   // click away closes it
  new IntersectionObserver(es=>es.forEach(e=>onScreen=e.isIntersecting),{threshold:.05}).observe(gal);

  const bubs = [...gal.querySelectorAll('.bub')];
  const leadSvg = gal.querySelector('.leads');
  const leadLines = leadSvg ? [...leadSvg.querySelectorAll('line')] : [];
  const stacked = gal.closest('.wheels') !== null;
  const aim = stacked
    ? [{side:'center',fx:.5,fy:.04},{side:'center',fx:.5,fy:.96}]
    : [{side:'right',fx:.20,fy:.26},{side:'right',fx:.22,fy:.74},{side:'left',fx:.82,fy:.07}];

  function drawLeads(){
    if(!leadLines.length) return;
    if(opened === -1){ leadLines.forEach(l=>l.setAttribute('x2', l.getAttribute('x1')||0)); return; }
    const g = gal.getBoundingClientRect(), c = items[opened].getBoundingClientRect();
    bubs.forEach((bub,k)=>{
      const l = leadLines[k], a = aim[k]; if(!l || !a) return;
      const r = bub.getBoundingClientRect();
      const x1 = (a.side === 'center' ? (r.left + r.width/2) : a.side === 'right' ? r.right + 4 : r.left - 4) - g.left;
      const y1 = (a.side === 'center' ? (k === 0 ? r.bottom + 4 : r.top - 4) : r.top + 9) - g.top;
      const x2 = c.left - g.left + c.width * a.fx;
      const y2 = c.top - g.top + c.height * a.fy;
      l.setAttribute('x1',x1.toFixed(1)); l.setAttribute('y1',y1.toFixed(1));
      l.setAttribute('x2',x2.toFixed(1)); l.setAttribute('y2',y2.toFixed(1));
    });
  }

  function frame(now){
    const dt = Math.min((now-last)/1000, .05); last = now;
    if(!reduce && onScreen){
      if(target !== null){
        t += (target - t) * Math.min(1, dt * 5.5);        // ease into the clicked can
        if(Math.abs(target - t) < 0.0015){ t = target; target = null; }
      } else if(hovered === -1 && opened === -1){
        t += dt * 0.075;                                   // free rotation
      }
    }
    const rx = gal.clientWidth * 0.27;
    items.forEach((el,i)=>{
      const a = (t + i/n) * Math.PI * 2;
      const depth = (Math.cos(a) + 1) / 2;                 // 0 back, 1 front
      const focus = (opened===i) ? 0.30 : 0;   // only a clicked can enlarges
      const s = 0.72 + depth * 0.28 + focus;
      const spread = 1 + (1 - depth) * 0.30;   // keep a receding can from hiding behind the front one
      el.style.transform = `translate(-50%,-100%) translateX(${(Math.sin(a)*rx*spread).toFixed(1)}px) scale(${s.toFixed(3)})`;
      el.style.zIndex = 10 + Math.round(depth*100) + ((opened===i || hovered===i) ? 200 : 0);
      el.style.opacity = (0.76 + depth*0.24).toFixed(3);
      el.style.filter = `brightness(${(0.82 + depth*0.18).toFixed(3)}) drop-shadow(0 24px 30px rgba(0,0,0,.6))`;
    });
    drawLeads();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function initBrandShowcase(){wirePosers(); document.querySelectorAll(".orbit").forEach(gal=>{gal.classList.add("lifted");initWheel(gal);});}

/* Restore the original brand films without starting motion for reduced-motion users. */
(function(){
  const video=document.getElementById('brandFilm'),toggle=document.querySelector('.film-toggle');
  if(!video||!toggle||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  video.muted=true;video.src=video.dataset.src;
  video.addEventListener('playing',()=>{document.getElementById('bgvid').hidden=false;document.body.classList.add('bgvid-on');toggle.hidden=false;toggle.textContent='Pause video';toggle.setAttribute('aria-pressed','false');});
  toggle.addEventListener('click',()=>{if(video.paused){video.play().catch(()=>{});}else{video.pause();toggle.textContent='Play video';toggle.setAttribute('aria-pressed','true');}});
  video.play().catch(()=>{});
})();
