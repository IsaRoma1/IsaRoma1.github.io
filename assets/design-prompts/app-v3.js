(()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const motion=document.querySelector('.motion-toggle');
 const art=document.querySelector('.hero-art');
 const strips=[...document.querySelectorAll('.strip')];
 const paragraph=document.querySelector('.animated-copy'),text=paragraph.textContent;
 let chars=[],initialized=false;
 function initializeParagraph(){if(initialized)return;initialized=true;
  const accessible=document.createElement('span');accessible.className='sr-only';accessible.textContent=text;
  const decorative=document.createElement('span');decorative.setAttribute('aria-hidden','true');
  chars=[...text].map(char=>{const span=document.createElement('span');span.className='reveal-character';span.textContent=char;decorative.append(span);return span});paragraph.replaceChildren(accessible,decorative);
 }
 const visible={strip:false,about:false};
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){const key=entry.target.classList.contains('visual-strip')?'strip':'about';visible[key]=entry.isIntersecting;if(key==='about'&&entry.isIntersecting)initializeParagraph();}queue()});
 for(const selector of ['.visual-strip','.about'])observer.observe(document.querySelector(selector));
 let frame=0;
 function animate(){frame=0;const disabled=reduced.matches||document.documentElement.classList.contains('paused');const section=visible.strip?document.querySelector('.visual-strip').getBoundingClientRect():null;if(!disabled&&section&&section.top<innerHeight&&section.bottom>0){const offset=(innerHeight-section.top)*.3;const tile=innerWidth<=700?227:432;strips[0].style.transform=`translateX(${-tile*6-200+offset}px)`;strips[1].style.transform=`translateX(${-tile*6+200-offset}px)`}
  const r=visible.about?paragraph.getBoundingClientRect():null;if(r&&r.top<innerHeight&&r.bottom>0){const progress=Math.max(0,Math.min(1,(innerHeight*.8-r.top)/(innerHeight*.6+r.height)));chars.forEach((char,i)=>{char.style.opacity=disabled?'1':String(.65+.35*Math.max(0,Math.min(1,(progress*chars.length-i)/20)))})}
 }
 function queue(){if(!frame)frame=requestAnimationFrame(animate)}addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue,{passive:true});reduced.addEventListener('change',queue);queue();
 motion.addEventListener('click',()=>{const paused=document.documentElement.classList.toggle('paused');motion.setAttribute('aria-pressed',String(paused));motion.textContent=paused?'Включить движение':'Остановить движение';queue()});
 if(matchMedia('(pointer:fine) and (min-width:701px)').matches){const hero=document.querySelector('.hero');hero.addEventListener('pointermove',e=>{if(reduced.matches||document.documentElement.classList.contains('paused'))return;const r=art.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;const inRange=e.clientX>=r.left-150&&e.clientX<=r.right+150&&e.clientY>=r.top-150&&e.clientY<=r.bottom+150;art.style.transform=inRange?`translate3d(${Math.max(-55,Math.min(55,(e.clientX-cx)/3))}px,${Math.max(-40,Math.min(40,(e.clientY-cy)/3))}px,0)`:''});hero.addEventListener('pointerleave',()=>art.style.transform='');}
 const toast=document.querySelector('.toast');let timer;
 document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
  const pre=document.getElementById(button.dataset.copy);
  try{await navigator.clipboard.writeText(pre.textContent);toast.textContent='Запрос скопирован';toast.classList.add('show');clearTimeout(timer);timer=setTimeout(()=>toast.classList.remove('show'),2400)}catch{
   const range=document.createRange();range.selectNodeContents(pre);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);toast.textContent='Выделенный запрос можно скопировать вручную';toast.classList.add('show');clearTimeout(timer);timer=setTimeout(()=>toast.classList.remove('show'),4000);
  }
 }));
})();
