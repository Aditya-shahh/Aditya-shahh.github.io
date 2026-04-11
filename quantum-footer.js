// ── Quantum k-Body Attention Footer Engine ──
// Global flags read by the IIFE render loop
let qShow2=true, qShow3=true, qShow4=true, qShowPhase=false, qShowEntangle=false, qPinned=-1;

// Bridge: IIFE populates this so global functions can reach internal state
window._qState = { psi: null, N: 0 };

function qToggle(k){
  if(k===2) qShow2=!qShow2;
  if(k===3) qShow3=!qShow3;
  if(k===4) qShow4=!qShow4;
  document.getElementById('qBtn'+k).classList.toggle('active');
}
function qTogglePhase(){
  qShowPhase=!qShowPhase;
  document.getElementById('qBtnP').classList.toggle('active');
}
function qToggleEntangle(){
  qShowEntangle=!qShowEntangle;
  document.getElementById('qBtnE').classList.toggle('active');
}
function qPerturb(){
  // Kick |ψ⟩ into a random new superposition — visible as tokens reshuffling
  const {psi, N} = window._qState;
  if(!psi || !N) return;
  for(let i=0;i<N;i++){psi[i].re+=(Math.random()-0.5)*0.8; psi[i].im+=(Math.random()-0.5)*0.8;}
  let ns=0; for(let i=0;i<N;i++) ns+=psi[i].re**2+psi[i].im**2;
  const n=Math.sqrt(ns); for(let i=0;i<N;i++){psi[i].re/=n; psi[i].im/=n;}
}

(function(){
  const canvas=document.getElementById('footerCanvas');
  if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const matC=document.getElementById('qMatrix');
  const matCtx=matC ? matC.getContext('2d') : null;
  let W,H,cx,cy;

  function resize(){
    const dpr=window.devicePixelRatio||1;
    W=canvas.clientWidth; H=canvas.clientHeight;
    canvas.width=W*dpr; canvas.height=H*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    cx=W/2; cy=H/2;
  }
  resize(); window.addEventListener('resize',resize);

  let mx=-9999,my=-9999,mouseIn=false;
  canvas.addEventListener('mousemove',e=>{
    const r=canvas.getBoundingClientRect(); mx=e.clientX-r.left; my=e.clientY-r.top; mouseIn=true;
  });
  canvas.addEventListener('mouseleave',()=>{mx=-9999; my=-9999; mouseIn=false;});
  canvas.addEventListener('click',e=>{
    const r=canvas.getBoundingClientRect();
    const cx2=e.clientX-r.left, cy2=e.clientY-r.top;
    let minD=Infinity,minI=-1;
    for(let i=0;i<qN;i++){
      const dx=toks[i].sx-cx2, dy=toks[i].sy-cy2;
      const d=Math.sqrt(dx*dx+dy*dy);
      if(d<25 && d<minD){minD=d; minI=i;}
    }
    qPinned = (qPinned===minI) ? -1 : minI;
  });

  // ── Quantum state ──
  const qN=20, EMB=8;
  const qPsi=[];
  let ns0=0;
  for(let i=0;i<qN;i++){
    const re=(Math.random()-0.5)*2, im=(Math.random()-0.5)*2;
    qPsi.push({re,im}); ns0+=re*re+im*im;
  }
  const n0=Math.sqrt(ns0);
  for(let i=0;i<qN;i++){qPsi[i].re/=n0; qPsi[i].im/=n0;}

  // Expose to global qPerturb
  window._qState = { psi: qPsi, N: qN };

  function bP(i){return qPsi[i].re**2+qPsi[i].im**2;}
  function qPh(i){return Math.atan2(qPsi[i].im,qPsi[i].re);}
  function entropy(){
    let s=0;
    for(let i=0;i<qN;i++){const p=bP(i); if(p>1e-10) s-=p*Math.log2(p);}
    return s;
  }

  function evolve(dt){
    const np=qPsi.map(a=>({re:a.re,im:a.im}));
    for(let i=0;i<qN;i++){
      let hR=0,hI=0;
      for(let j=0;j<qN;j++){
        let c=0; for(let d=0;d<EMB;d++) c+=toks[i].emb[d]*toks[j].emb[d];
        c*=0.02; hR+=c*qPsi[j].re; hI+=c*qPsi[j].im;
      }
      np[i].re+=hI*dt; np[i].im+=-hR*dt;
    }
    let ns=0; for(let i=0;i<qN;i++) ns+=np[i].re**2+np[i].im**2;
    const n=Math.sqrt(ns);
    for(let i=0;i<qN;i++){qPsi[i].re=np[i].re/n; qPsi[i].im=np[i].im/n;}
  }

  let decoF=0;
  function collapse(t){
    for(let i=0;i<qN;i++){const f=i===t?1.05:0.98; qPsi[i].re*=f; qPsi[i].im*=f;}
    let ns=0; for(let i=0;i<qN;i++) ns+=qPsi[i].re**2+qPsi[i].im**2;
    const n=Math.sqrt(ns);
    for(let i=0;i<qN;i++){qPsi[i].re/=n; qPsi[i].im/=n;}
  }

  // ── Tokens on 3D Fibonacci sphere ──
  const toks=[]; const sR=160;
  for(let i=0;i<qN;i++){
    const phi=Math.acos(1-2*(i+0.5)/qN);
    const theta=Math.PI*(1+Math.sqrt(5))*i;
    toks.push({
      bx:sR*Math.sin(phi)*Math.cos(theta),
      by:sR*Math.sin(phi)*Math.sin(theta),
      bz:sR*Math.cos(phi),
      sx:0,sy:0,z:0,scale:1,
      ph:Math.random()*Math.PI*2,
      emb:Array.from({length:EMB},()=>(Math.random()-0.5)*2)
    });
  }

  function proj(bx,by,bz,t){
    let x=bx,y=by,z=bz;
    const ca=Math.cos(t*0.1),sa=Math.sin(t*0.1);
    let nx=x*ca+z*sa, nz=-x*sa+z*ca; x=nx; z=nz;
    const tilt=0.3+(mouseIn?(my-cy)/H*0.3:0);
    const ct=Math.cos(tilt),st=Math.sin(tilt);
    let ny=y*ct-z*st; nz=y*st+z*ct; y=ny; z=nz;
    if(mouseIn){
      const mr=(mx-cx)/W*0.4;
      const cm=Math.cos(mr),sm=Math.sin(mr);
      nx=x*cm+z*sm; nz=-x*sm+z*cm; x=nx; z=nz;
    }
    const fov=500, p=fov/(fov+z);
    return{sx:cx+x*p, sy:cy+y*p, z, scale:p};
  }

  // ── Attention scores ──
  function a2(i,j){
    let dot=0; for(let d=0;d<EMB;d++) dot+=toks[i].emb[d]*toks[j].emb[d];
    const interf=qPsi[i].re*qPsi[j].re+qPsi[i].im*qPsi[j].im;
    return Math.max(0,(Math.exp(dot*0.2)/(1+Math.exp(dot*0.2)))*(0.3+Math.abs(interf)*2));
  }
  function a3(i,j,k){
    let t=0; for(let d=0;d<EMB;d++) t+=toks[i].emb[d]*toks[j].emb[d]*toks[k].emb[d];
    return Math.max(0,Math.exp(t*0.4)/(1+Math.exp(t*0.4))*Math.pow(bP(i)*bP(j)*bP(k),0.33)*3);
  }
  function a4(i,j,k,l){
    let q=0; for(let d=0;d<EMB;d++) q+=toks[i].emb[d]*toks[j].emb[d]*toks[k].emb[d]*toks[l].emb[d];
    return Math.max(0,Math.exp(q*0.6)/(1+Math.exp(q*0.6))*Math.pow(bP(i)*bP(j)*bP(k)*bP(l),0.25)*4);
  }

  let b2=[],b3=[],b4=[];
  function recomp(){
    b2=[];b3=[];b4=[];
    for(let i=0;i<qN;i++) for(let j=i+1;j<qN;j++){const s=a2(i,j); if(s>0.35) b2.push({i,j,s});}
    b2.sort((a,b)=>b.s-a.s); b2.length=Math.min(b2.length,35);
    for(let i=0;i<qN;i++) for(let j=i+1;j<qN;j++) for(let k=j+1;k<qN;k++){const s=a3(i,j,k); if(s>0.4) b3.push({i,j,k,s});}
    b3.sort((a,b)=>b.s-a.s); b3.length=Math.min(b3.length,18);
    for(let i=0;i<qN;i+=2) for(let j=i+1;j<qN;j+=2) for(let k=j+1;k<qN;k+=2) for(let l=k+1;l<qN;l+=2){
      const s=a4(i,j,k,l); if(s>0.45) b4.push({i,j,k,l,s});
    }
    b4.sort((a,b)=>b.s-a.s); b4.length=Math.min(b4.length,10);
  }

  function hsl(h,s,l,a){return`hsla(${h},${s}%,${l}%,${a})`;}

  function drawMatrix(){
    if(!matCtx) return;
    const s=200, cell=s/qN;
    matCtx.fillStyle='#EBE5DF'; matCtx.fillRect(0,0,s,s);
    for(let i=0;i<qN;i++) for(let j=0;j<qN;j++){
      const sc=a2(i,j); const intensity=Math.min(1,sc*2);
      if(qShowPhase){
        const ph=qPh(i)-qPh(j); const hue=((ph/Math.PI)*180+360)%360;
        matCtx.fillStyle=hsl(hue,50,40+intensity*30,intensity);
      } else {
        const r=Math.floor(intensity*179),g=Math.floor(intensity*75),b=Math.floor(intensity*54);
        matCtx.fillStyle=`rgba(${r},${g},${b},${0.1+intensity*0.9})`;
      }
      matCtx.fillRect(j*cell,i*cell,cell-0.3,cell-0.3);
    }
    if(qPinned>=0){
      matCtx.strokeStyle='rgba(179,75,54,0.7)'; matCtx.lineWidth=1;
      matCtx.strokeRect(0,qPinned*cell,s,cell);
      matCtx.strokeRect(qPinned*cell,0,cell,s);
    }
  }

  // ── Render loop ──
  let t=0, lastR=0;
  function frame(){
    ctx.clearRect(0,0,W,H); t+=0.006; evolve(0.3);

    if(mouseIn){
      decoF=Math.min(1,decoF+0.02);
      let minD=Infinity,minI=0;
      for(let i=0;i<qN;i++){const dx=toks[i].sx-mx,dy=toks[i].sy-my;const d=Math.sqrt(dx*dx+dy*dy);if(d<minD){minD=d;minI=i;}}
      if(minD<150) collapse(minI);
    } else { decoF=Math.max(0,decoF-0.01); }

    if(t-lastR>0.5){recomp(); lastR=t;}

    for(let i=0;i<qN;i++){
      const tk=toks[i];
      const wx=Math.sin(t*0.35+tk.ph)*8, wy=Math.cos(t*0.3+tk.ph*1.3)*7, wz=Math.sin(t*0.25+tk.ph*0.7)*7;
      const p=proj(tk.bx+wx,tk.by+wy,tk.bz+wz,t);
      tk.sx=p.sx; tk.sy=p.sy; tk.z=p.z; tk.scale=p.scale;
    }

    // Subtle grid
    ctx.strokeStyle='rgba(90,86,80,0.025)'; ctx.lineWidth=0.5;
    for(let x=0;x<W;x+=50){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=50){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

    // 4-body tetrahedra — blue (qShow4 toggle)
    if(qShow4) for(const c of b4){
      const a=toks[c.i],b_=toks[c.j],ck=toks[c.k],d=toks[c.l]; const al=c.s*0.12;
      for(const [p1,p2,p3] of [[a,b_,ck],[a,b_,d],[a,ck,d],[b_,ck,d]]){
        ctx.beginPath(); ctx.moveTo(p1.sx,p1.sy); ctx.lineTo(p2.sx,p2.sy); ctx.lineTo(p3.sx,p3.sy); ctx.closePath();
        ctx.fillStyle=`rgba(80,110,160,${al*0.2})`; ctx.fill();
        ctx.strokeStyle=`rgba(80,110,160,${al*0.4})`; ctx.lineWidth=0.3; ctx.stroke();
      }
      const gx=(a.sx+b_.sx+ck.sx+d.sx)/4, gy=(a.sy+b_.sy+ck.sy+d.sy)/4;
      const gr=ctx.createRadialGradient(gx,gy,0,gx,gy,14);
      gr.addColorStop(0,`rgba(80,110,160,${al})`); gr.addColorStop(1,'rgba(80,110,160,0)');
      ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(gx,gy,14,0,Math.PI*2); ctx.fill();
    }

    // 3-body triangles — rust red (qShow3 toggle)
    if(qShow3) for(const c of b3){
      const a=toks[c.i],b_=toks[c.j],ck=toks[c.k]; const al=c.s*0.18;
      ctx.beginPath(); ctx.moveTo(a.sx,a.sy); ctx.lineTo(b_.sx,b_.sy); ctx.lineTo(ck.sx,ck.sy); ctx.closePath();
      ctx.fillStyle=`rgba(179,75,54,${al*0.3})`; ctx.fill();
      ctx.strokeStyle=`rgba(179,75,54,${al*0.6})`; ctx.lineWidth=0.5; ctx.stroke();
      const gx=(a.sx+b_.sx+ck.sx)/3, gy=(a.sy+b_.sy+ck.sy)/3;
      const gr=ctx.createRadialGradient(gx,gy,0,gx,gy,8);
      gr.addColorStop(0,`rgba(179,75,54,${al})`); gr.addColorStop(1,'rgba(179,75,54,0)');
      ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(gx,gy,8,0,Math.PI*2); ctx.fill();
    }

    // 2-body geodesic arcs — grey (qShow2 toggle)
    if(qShow2) for(const c of b2){
      const a=toks[c.i],b_=toks[c.j]; const al=c.s*0.4*Math.min(a.scale,b_.scale);
      const midX=(a.sx+b_.sx)/2, midY=(a.sy+b_.sy)/2;
      const dc=(a.z-b_.z)*0.003; const dx=b_.sx-a.sx,dy=b_.sy-a.sy;
      ctx.beginPath(); ctx.moveTo(a.sx,a.sy);
      ctx.quadraticCurveTo(midX-dy*dc,midY+dx*dc,b_.sx,b_.sy);
      ctx.strokeStyle=`rgba(90,86,80,${al})`; ctx.lineWidth=0.4+c.s*1.2; ctx.stroke();
    }

    // Entanglement — purple dashed overlay (qShowEntangle toggle)
    if(qShowEntangle) for(let i=0;i<qN;i++) for(let j=i+1;j<qN;j++){
      const ent=Math.abs(qPsi[i].re*qPsi[j].re+qPsi[i].im*qPsi[j].im);
      if(ent>0.05){
        ctx.beginPath(); ctx.moveTo(toks[i].sx,toks[i].sy); ctx.lineTo(toks[j].sx,toks[j].sy);
        ctx.strokeStyle=`rgba(139,80,168,${ent*0.5})`; ctx.lineWidth=ent*2;
        ctx.setLineDash([2,4]); ctx.stroke(); ctx.setLineDash([]);
      }
    }

    // Pinned token — show its attention to all others
    if(qPinned>=0) for(let j=0;j<qN;j++){
      if(j===qPinned) continue;
      const s=a2(qPinned,j);
      if(s>0.1){
        ctx.beginPath(); ctx.moveTo(toks[qPinned].sx,toks[qPinned].sy); ctx.lineTo(toks[j].sx,toks[j].sy);
        ctx.strokeStyle=`rgba(179,75,54,${s*0.6})`; ctx.lineWidth=s*2.5; ctx.stroke();
      }
    }

    // Phase fringes — interference wave pattern (qShowPhase toggle)
    if(qShowPhase){
      ctx.globalAlpha=0.35;
      for(let x=0;x<W;x+=8) for(let y=0;y<H;y+=8){
        let rS=0,iS=0;
        for(let i=0;i<qN;i++){
          const dx=x-toks[i].sx, dy=y-toks[i].sy; const dist=Math.sqrt(dx*dx+dy*dy);
          if(dist<80){const amp=(80-dist)/80;const ph=qPh(i);const pr=Math.sqrt(bP(i));rS+=amp*pr*Math.cos(ph+dist*0.1);iS+=amp*pr*Math.sin(ph+dist*0.1);}
        }
        const inten=rS*rS+iS*iS;
        if(inten>0.01){ctx.beginPath();ctx.arc(x,y,Math.min(3,inten*4),0,Math.PI*2);ctx.fillStyle=`rgba(90,86,80,${Math.min(0.25,inten*0.4)})`;ctx.fill();}
      }
      ctx.globalAlpha=1;
    }

    // Observer cursor
    if(mouseIn){
      for(let i=0;i<qN;i++){
        const dx=toks[i].sx-mx, dy=toks[i].sy-my; const dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<200){
          const a=0.2*(1-dist/200)*bP(i)*3;
          ctx.beginPath(); ctx.moveTo(mx,my);
          ctx.quadraticCurveTo((mx+toks[i].sx)/2-dy*0.03,(my+toks[i].sy)/2+dx*0.03,toks[i].sx,toks[i].sy);
          ctx.strokeStyle=`rgba(179,75,54,${a})`; ctx.lineWidth=0.5+a*2; ctx.stroke();
        }
      }
      ctx.beginPath(); ctx.arc(mx,my,4,0,Math.PI*2); ctx.fillStyle='rgba(179,75,54,0.6)'; ctx.fill();
      for(let r=1;r<=3;r++){ctx.beginPath();ctx.arc(mx,my,8+r*12,0,Math.PI*2);ctx.strokeStyle=`rgba(179,75,54,${0.12/r})`;ctx.lineWidth=0.5;ctx.stroke();}
    }

    // Tokens — depth sorted, phase-colored when phase mode on
    const sorted=toks.map((tk,i)=>({tk,i})).sort((a,b)=>a.tk.z-b.tk.z);
    for(const {tk,i} of sorted){
      const prob=bP(i), ph=qPh(i);
      const bSz=2.5+tk.scale*3.5, sz=bSz*(0.5+prob*3), alpha=0.2+tk.scale*0.6;
      const phaseHue=((ph/Math.PI)*180+360)%360;
      if(prob>0.02){
        const cr=sz*(2+prob*12);
        const gr=ctx.createRadialGradient(tk.sx,tk.sy,0,tk.sx,tk.sy,cr);
        if(qShowPhase){gr.addColorStop(0,hsl(phaseHue,50,50,prob*0.2));gr.addColorStop(1,hsl(phaseHue,50,50,0));}
        else{gr.addColorStop(0,`rgba(90,86,80,${prob*0.15})`);gr.addColorStop(1,'rgba(90,86,80,0)');}
        ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(tk.sx,tk.sy,cr,0,Math.PI*2); ctx.fill();
      }
      ctx.beginPath(); ctx.arc(tk.sx,tk.sy,sz,0,Math.PI*2);
      ctx.fillStyle=qShowPhase ? hsl(phaseHue,60,45,alpha) : `rgba(90,86,80,${alpha})`; ctx.fill();
      if(qPinned===i){ctx.beginPath();ctx.arc(tk.sx,tk.sy,sz+6,0,Math.PI*2);ctx.strokeStyle='rgba(179,75,54,0.7)';ctx.lineWidth=1.5;ctx.stroke();}
      ctx.beginPath(); ctx.arc(tk.sx-sz*0.2,tk.sy-sz*0.2,sz*0.25,0,Math.PI*2);
      ctx.fillStyle=`rgba(235,229,223,${alpha*0.3})`; ctx.fill();
    }

    // HUD live updates
    const el=id=>document.getElementById(id);
    const ent=entropy();
    if(el('qHilbert')) el('qHilbert').textContent=qN;
    if(el('qEntropy')) el('qEntropy').textContent=ent.toFixed(4);
    if(el('qDecohere')) el('qDecohere').textContent=(decoF*100).toFixed(1)+'%';
    if(el('qPhaseVal')) el('qPhaseVal').textContent=qPh(0).toFixed(3)+' rad';
    if(el('qNTokens')) el('qNTokens').textContent=qN;
    if(el('qN2')) el('qN2').textContent=b2.length+' active';
    if(el('qN3')) el('qN3').textContent=b3.length+' active';
    if(el('qN4')) el('qN4').textContent=b4.length+' active';

    const lbl=el('qStateLabel');
    if(lbl){
      if(decoF>0.7){lbl.textContent='COLLAPSED';lbl.style.borderColor='#B34B36';lbl.style.color='#B34B36';}
      else if(qShowEntangle){lbl.textContent='ENTANGLED';lbl.style.borderColor='#3d7cc9';lbl.style.color='#3d7cc9';}
      else{lbl.textContent='SUPERPOSITION';lbl.style.borderColor='#8b50a8';lbl.style.color='#8b50a8';}
    }

    const mi=el('qMouseInfo');
    if(mi){
      if(qPinned>=0) mi.textContent=`pinned: token ${qPinned} · P(${qPinned}) = ${bP(qPinned).toFixed(4)} · φ = ${qPh(qPinned).toFixed(3)}`;
      else if(mouseIn) mi.textContent=`observing · decoherence ${(decoF*100).toFixed(0)}% · click to pin`;
      else mi.textContent='hover to observe · click to pin token';
    }

    if(Math.floor(t*100)%10===0) drawMatrix();
    requestAnimationFrame(frame);
  }
  recomp(); frame();
})();
