// ── Quantum Footer — middle ground ──
let qShow2=true, qShow3=false, qShow4=false, qShowPhase=false, qPinned=-1;
window._qState = { psi: null, N: 0 };

function qToggle(k){
  // Exclusive radio-style: clicking an active button keeps it on,
  // clicking a different button switches to that mode exclusively.
  qShow2 = (k === 2);
  qShow3 = (k === 3);
  qShow4 = (k === 4);
  document.getElementById('qBtn2').classList.toggle('active', qShow2);
  document.getElementById('qBtn3').classList.toggle('active', qShow3);
  document.getElementById('qBtn4').classList.toggle('active', qShow4);
}
function qTogglePhase(){
  qShowPhase=!qShowPhase;
  document.getElementById('qBtnP').classList.toggle('active');
}
function qPerturb(){
  const {psi,N}=window._qState; if(!psi||!N)return;
  for(let i=0;i<N;i++){psi[i].re+=(Math.random()-0.5)*0.8;psi[i].im+=(Math.random()-0.5)*0.8;}
  let ns=0;for(let i=0;i<N;i++)ns+=psi[i].re**2+psi[i].im**2;
  const n=Math.sqrt(ns);for(let i=0;i<N;i++){psi[i].re/=n;psi[i].im/=n;}
}

(function(){
  const canvas=document.getElementById('footerCanvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  let W,H,cx,cy;

  function resize(){
    const dpr=window.devicePixelRatio||1;
    W=canvas.clientWidth;H=canvas.clientHeight;
    canvas.width=W*dpr;canvas.height=H*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    cx = W / 2; cy = H / 2;
  }
  resize();window.addEventListener('resize',resize);

  let mx=-9999,my=-9999,mouseIn=false;
  canvas.addEventListener('mousemove',e=>{
    const r=canvas.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top;mouseIn=true;
  });
  canvas.addEventListener('mouseleave',()=>{mx=-9999;my=-9999;mouseIn=false;});
  canvas.addEventListener('click',e=>{
    const r=canvas.getBoundingClientRect();
    const cx2=e.clientX-r.left,cy2=e.clientY-r.top;
    let minD=Infinity,minI=-1;
    for(let i=0;i<qN;i++){const dx=toks[i].sx-cx2,dy=toks[i].sy-cy2;const d=Math.sqrt(dx*dx+dy*dy);if(d<25&&d<minD){minD=d;minI=i;}}
    qPinned=(qPinned===minI)?-1:minI;
  });

  // ── Quantum state ──
  const qN=20,EMB=8;
  const qPsi=[];
  let ns0=0;
  for(let i=0;i<qN;i++){const re=(Math.random()-0.5)*2,im=(Math.random()-0.5)*2;qPsi.push({re,im});ns0+=re*re+im*im;}
  const n0=Math.sqrt(ns0);for(let i=0;i<qN;i++){qPsi[i].re/=n0;qPsi[i].im/=n0;}
  window._qState={psi:qPsi,N:qN};

  function bP(i){return qPsi[i].re**2+qPsi[i].im**2;}
  function qPh(i){return Math.atan2(qPsi[i].im,qPsi[i].re);}
  function entropy(){let s=0;for(let i=0;i<qN;i++){const p=bP(i);if(p>1e-10)s-=p*Math.log2(p);}return s;}

  function evolve(dt){
    const np=qPsi.map(a=>({re:a.re,im:a.im}));
    for(let i=0;i<qN;i++){
      let hR=0,hI=0;
      for(let j=0;j<qN;j++){let c=0;for(let d=0;d<EMB;d++)c+=toks[i].emb[d]*toks[j].emb[d];c*=0.02;hR+=c*qPsi[j].re;hI+=c*qPsi[j].im;}
      np[i].re+=hI*dt;np[i].im+=-hR*dt;
    }
    let ns=0;for(let i=0;i<qN;i++)ns+=np[i].re**2+np[i].im**2;
    const n=Math.sqrt(ns);for(let i=0;i<qN;i++){qPsi[i].re=np[i].re/n;qPsi[i].im=np[i].im/n;}
  }

  let decoF=0;
  function collapse(t){
    for(let i=0;i<qN;i++){const f=i===t?1.05:0.98;qPsi[i].re*=f;qPsi[i].im*=f;}
    let ns=0;for(let i=0;i<qN;i++)ns+=qPsi[i].re**2+qPsi[i].im**2;
    const n=Math.sqrt(ns);for(let i=0;i<qN;i++){qPsi[i].re/=n;qPsi[i].im/=n;}
  }

  // ── Tokens on 3D sphere ──
  const toks=[];const sR=80;
  for(let i=0;i<qN;i++){
    const phi=Math.acos(1-2*(i+0.5)/qN),theta=Math.PI*(1+Math.sqrt(5))*i;
    toks.push({bx:sR*Math.sin(phi)*Math.cos(theta),by:sR*Math.sin(phi)*Math.sin(theta),bz:sR*Math.cos(phi),
      sx:0,sy:0,z:0,scale:1,ph:Math.random()*Math.PI*2,emb:Array.from({length:EMB},()=>(Math.random()-0.5)*2)});
  }

  function proj(bx,by,bz,t){
    let x=bx,y=by,z=bz;
    const ca=Math.cos(t*0.09),sa=Math.sin(t*0.09);let nx=x*ca+z*sa,nz=-x*sa+z*ca;x=nx;z=nz;
    const tilt=0.28+(mouseIn?(my-cy)/H*0.25:0);const ct=Math.cos(tilt),st=Math.sin(tilt);
    let ny=y*ct-z*st;nz=y*st+z*ct;y=ny;z=nz;
    if(mouseIn){const mr=(mx-cx)/W*0.35;const cm=Math.cos(mr),sm=Math.sin(mr);nx=x*cm+z*sm;nz=-x*sm+z*cm;x=nx;z=nz;}
    const fov=420,p=fov/(fov+z);return{sx:cx+x*p,sy:cy+y*p,z,scale:p};
  }

  function a2(i,j){let dot=0;for(let d=0;d<EMB;d++)dot+=toks[i].emb[d]*toks[j].emb[d];
    const interf=qPsi[i].re*qPsi[j].re+qPsi[i].im*qPsi[j].im;
    return Math.max(0,(Math.exp(dot*0.2)/(1+Math.exp(dot*0.2)))*(0.3+Math.abs(interf)*2));}
  function a3(i,j,k){let t=0;for(let d=0;d<EMB;d++)t+=toks[i].emb[d]*toks[j].emb[d]*toks[k].emb[d];
    return Math.max(0,Math.exp(t*0.4)/(1+Math.exp(t*0.4))*Math.pow(bP(i)*bP(j)*bP(k),0.33)*3);}
  function a4(i,j,k,l){let q=0;for(let d=0;d<EMB;d++)q+=toks[i].emb[d]*toks[j].emb[d]*toks[k].emb[d]*toks[l].emb[d];
    return Math.max(0,Math.exp(q*0.6)/(1+Math.exp(q*0.6))*Math.pow(bP(i)*bP(j)*bP(k)*bP(l),0.25)*4);}

  let b2=[],b3=[],b4=[];
  function recomp(){
    b2=[];b3=[];b4=[];
    for(let i=0;i<qN;i++)for(let j=i+1;j<qN;j++){const s=a2(i,j);if(s>0.35)b2.push({i,j,s});}
    b2.sort((a,b)=>b.s-a.s);b2.length=Math.min(b2.length,30);
    for(let i=0;i<qN;i++)for(let j=i+1;j<qN;j++)for(let k=j+1;k<qN;k++){const s=a3(i,j,k);if(s>0.4)b3.push({i,j,k,s});}
    b3.sort((a,b)=>b.s-a.s);b3.length=Math.min(b3.length,14);
    for(let i=0;i<qN;i+=2)for(let j=i+1;j<qN;j+=2)for(let k=j+1;k<qN;k+=2)for(let l=k+1;l<qN;l+=2){const s=a4(i,j,k,l);if(s>0.45)b4.push({i,j,k,l,s});}
    b4.sort((a,b)=>b.s-a.s);b4.length=Math.min(b4.length,8);
  }

  function hsl(h,s,l,a){return`hsla(${h},${s}%,${l}%,${a})`;}

  let t=0,lastR=0;
  function frame(){
    ctx.clearRect(0,0,W,H);t+=0.005;evolve(0.28);

    if(mouseIn){
      decoF=Math.min(1,decoF+0.02);
      let minD=Infinity,minI=0;
      for(let i=0;i<qN;i++){const dx=toks[i].sx-mx,dy=toks[i].sy-my;const d=Math.sqrt(dx*dx+dy*dy);if(d<minD){minD=d;minI=i;}}
      if(minD<120)collapse(minI);
    }else{decoF=Math.max(0,decoF-0.008);}

    if(t-lastR>0.6){recomp();lastR=t;}

    for(let i=0;i<qN;i++){
      const tk=toks[i];
      const p=proj(tk.bx+Math.sin(t*0.35+tk.ph)*6,tk.by+Math.cos(t*0.3+tk.ph*1.3)*5,tk.bz+Math.sin(t*0.25+tk.ph*0.7)*5,t);
      tk.sx=p.sx;tk.sy=p.sy;tk.z=p.z;tk.scale=p.scale;
    }

    // 4-body tetrahedra (blue topologies) with central emergent glow
    if(qShow4)for(const c of b4){const a=toks[c.i],b_=toks[c.j],ck=toks[c.k],d=toks[c.l];const al=c.s*0.1;
      for(const[p1,p2,p3]of[[a,b_,ck],[a,b_,d],[a,ck,d],[b_,ck,d]]){ctx.beginPath();ctx.moveTo(p1.sx,p1.sy);ctx.lineTo(p2.sx,p2.sy);ctx.lineTo(p3.sx,p3.sy);ctx.closePath();ctx.fillStyle=`rgba(80,110,160,${al*0.2})`;ctx.fill();ctx.strokeStyle=`rgba(80,110,160,${al*0.4})`;ctx.lineWidth=0.3;ctx.stroke();}
      const gx=(a.sx+b_.sx+ck.sx+d.sx)/4,gy=(a.sy+b_.sy+ck.sy+d.sy)/4;const gr=ctx.createRadialGradient(gx,gy,0,gx,gy,12);gr.addColorStop(0,`rgba(80,110,160,${al*0.9})`);gr.addColorStop(1,'rgba(80,110,160,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(gx,gy,12,0,Math.PI*2);ctx.fill();}

    // 3-body triangles (rust topologies) with central emergent glow
    if(qShow3)for(const c of b3){const a=toks[c.i],b_=toks[c.j],ck=toks[c.k];const al=c.s*0.16;
      ctx.beginPath();ctx.moveTo(a.sx,a.sy);ctx.lineTo(b_.sx,b_.sy);ctx.lineTo(ck.sx,ck.sy);ctx.closePath();ctx.fillStyle=`rgba(179,75,54,${al*0.3})`;ctx.fill();ctx.strokeStyle=`rgba(179,75,54,${al*0.6})`;ctx.lineWidth=0.4;ctx.stroke();
      const gx=(a.sx+b_.sx+ck.sx)/3,gy=(a.sy+b_.sy+ck.sy)/3;const gr=ctx.createRadialGradient(gx,gy,0,gx,gy,8);gr.addColorStop(0,`rgba(179,75,54,${al*0.8})`);gr.addColorStop(1,'rgba(179,75,54,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(gx,gy,8,0,Math.PI*2);ctx.fill();}

    // 2-body arcs — grey
    if(qShow2)for(const c of b2){const a=toks[c.i],b_=toks[c.j];const al=c.s*0.35*Math.min(a.scale,b_.scale);
      const midX=(a.sx+b_.sx)/2,midY=(a.sy+b_.sy)/2,dc=(a.z-b_.z)*0.003,dx=b_.sx-a.sx,dy=b_.sy-a.sy;
      ctx.beginPath();ctx.moveTo(a.sx,a.sy);ctx.quadraticCurveTo(midX-dy*dc,midY+dx*dc,b_.sx,b_.sy);ctx.strokeStyle=`rgba(90,86,80,${al})`;ctx.lineWidth=0.3+c.s;ctx.stroke();}

    // Pinned token rays
    if(qPinned>=0)for(let j=0;j<qN;j++){if(j===qPinned)continue;const s=a2(qPinned,j);if(s>0.1){ctx.beginPath();ctx.moveTo(toks[qPinned].sx,toks[qPinned].sy);ctx.lineTo(toks[j].sx,toks[j].sy);ctx.strokeStyle=`rgba(179,75,54,${s*0.5})`;ctx.lineWidth=s*2;ctx.stroke();}}

    // Phase fringes
    if(qShowPhase){ctx.globalAlpha=0.3;
      for(let x=0;x<W;x+=8)for(let y=0;y<H;y+=8){let rS=0,iS=0;
        for(let i=0;i<qN;i++){const dx=x-toks[i].sx,dy=y-toks[i].sy;const dist=Math.sqrt(dx*dx+dy*dy);
          if(dist<80){const amp=(80-dist)/80,ph=qPh(i),pr=Math.sqrt(bP(i));rS+=amp*pr*Math.cos(ph+dist*0.1);iS+=amp*pr*Math.sin(ph+dist*0.1);}}
        const inten=rS*rS+iS*iS;if(inten>0.01){ctx.beginPath();ctx.arc(x,y,Math.min(2.5,inten*4),0,Math.PI*2);ctx.fillStyle=`rgba(90,86,80,${Math.min(0.2,inten*0.35)})`;ctx.fill();}}
      ctx.globalAlpha=1;}

    // Observer cursor
    if(mouseIn){
      for(let i=0;i<qN;i++){const dx=toks[i].sx-mx,dy=toks[i].sy-my;const dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<180){const a=0.18*(1-dist/180)*bP(i)*3;ctx.beginPath();ctx.moveTo(mx,my);ctx.quadraticCurveTo((mx+toks[i].sx)/2-dy*0.03,(my+toks[i].sy)/2+dx*0.03,toks[i].sx,toks[i].sy);ctx.strokeStyle=`rgba(179,75,54,${a})`;ctx.lineWidth=0.4+a*2;ctx.stroke();}}
      ctx.beginPath();ctx.arc(mx,my,3,0,Math.PI*2);ctx.fillStyle='rgba(179,75,54,0.5)';ctx.fill();
      for(let r=1;r<=2;r++){ctx.beginPath();ctx.arc(mx,my,7+r*10,0,Math.PI*2);ctx.strokeStyle=`rgba(179,75,54,${0.08/r})`;ctx.lineWidth=0.5;ctx.stroke();}
    }

    // Tokens — depth sorted
    const sorted=toks.map((tk,i)=>({tk,i})).sort((a,b)=>a.tk.z-b.tk.z);
    for(const{tk,i}of sorted){
      const prob=bP(i),ph=qPh(i),bSz=1.8+tk.scale*2.8,sz=bSz*(0.5+prob*2.8),alpha=0.18+tk.scale*0.55;
      const phaseHue=((ph/Math.PI)*180+360)%360;
      if(prob>0.02){const cr=sz*(2+prob*10);const gr=ctx.createRadialGradient(tk.sx,tk.sy,0,tk.sx,tk.sy,cr);
        if(qShowPhase){gr.addColorStop(0,hsl(phaseHue,50,50,prob*0.18));gr.addColorStop(1,hsl(phaseHue,50,50,0));}
        else{gr.addColorStop(0,`rgba(90,86,80,${prob*0.13})`);gr.addColorStop(1,'rgba(90,86,80,0)');}
        ctx.fillStyle=gr;ctx.beginPath();ctx.arc(tk.sx,tk.sy,cr,0,Math.PI*2);ctx.fill();}
      ctx.beginPath();ctx.arc(tk.sx,tk.sy,sz,0,Math.PI*2);
      ctx.fillStyle=qShowPhase?hsl(phaseHue,55,42,alpha):`rgba(90,86,80,${alpha})`;ctx.fill();
      if(qPinned===i){ctx.beginPath();ctx.arc(tk.sx,tk.sy,sz+5,0,Math.PI*2);ctx.strokeStyle='rgba(179,75,54,0.6)';ctx.lineWidth=1;ctx.stroke();}
      // Specular highlight
      ctx.beginPath();ctx.arc(tk.sx-sz*0.2,tk.sy-sz*0.25,sz*0.22,0,Math.PI*2);ctx.fillStyle=`rgba(235,229,223,${alpha*0.25})`;ctx.fill();
    }

    // Update entropy display
    const eEl=document.getElementById('qEntropy');
    if(eEl)eEl.textContent=entropy().toFixed(3);

    requestAnimationFrame(frame);
  }
  recomp();frame();
})();
