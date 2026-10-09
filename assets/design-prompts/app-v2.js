(()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const motion=document.querySelector('.motion-toggle');
 const art=document.querySelector('.hero-art');
 const strips=[...document.querySelectorAll('.strip')],stack=[...document.querySelectorAll('.project-card')];
 const paragraph=document.querySelector('.animated-copy'),text=paragraph.textContent;
 let chars=[],initialized=false;
 function initializeParagraph(){if(initialized)return;initialized=true;
  const accessible=document.createElement('span');accessible.className='sr-only';accessible.textContent=text;
  const decorative=document.createElement('span');decorative.setAttribute('aria-hidden','true');
  chars=[...text].map(char=>{const span=document.createElement('span');span.className='reveal-character';span.textContent=char;decorative.append(span);return span});paragraph.replaceChildren(accessible,decorative);
 }
 const visible={strip:false,about:false,projects:false};
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){const key=entry.target.classList.contains('visual-strip')?'strip':entry.target.classList.contains('about')?'about':'projects';visible[key]=entry.isIntersecting;if(key==='about'&&entry.isIntersecting)initializeParagraph();}queue()});
 for(const selector of ['.visual-strip','.about','.projects'])observer.observe(document.querySelector(selector));
 let frame=0;
 function animate(){frame=0;const disabled=reduced.matches||document.documentElement.classList.contains('paused');const section=visible.strip?document.querySelector('.visual-strip').getBoundingClientRect():null;if(!disabled&&section&&section.top<innerHeight&&section.bottom>0){const offset=(innerHeight-section.top)*.3;const tile=innerWidth<=700?227:432;strips[0].style.transform=`translateX(${-tile*6-200+offset}px)`;strips[1].style.transform=`translateX(${-tile*6+200-offset}px)`}
  const r=visible.about?paragraph.getBoundingClientRect():null;if(r&&r.top<innerHeight&&r.bottom>0){const progress=Math.max(0,Math.min(1,(innerHeight*.8-r.top)/(innerHeight*.6+r.height)));chars.forEach((char,i)=>{char.style.opacity=disabled?'1':String(.65+.35*Math.max(0,Math.min(1,(progress*chars.length-i)/20)))})}
  if(visible.projects)for(let i=0;i<stack.length-1;i++){const next=stack[i+1].getBoundingClientRect(),current=stack[i].getBoundingClientRect();const progress=Math.max(0,Math.min(1,1-(next.top-current.top)/current.height));stack[i].style.transform=disabled?'none':`scale(${1-progress*(stack.length-1-i)*.03})`;}
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
 document.querySelector('.search-area').hidden=false;
 const input=document.getElementById('gallery-search'),status=document.getElementById('search-status'),cards=[...document.querySelectorAll('.example')];
 const params=new URLSearchParams(location.search);input.value=params.get('q')||'';
 function filter(){const q=input.value.toLocaleLowerCase('ru').trim();let count=0;for(const card of cards){const show=card.dataset.search.toLocaleLowerCase('ru').includes(q);card.hidden=!show;if(show)count++}for(const group of document.querySelectorAll('.gallery-section'))group.hidden=![...group.querySelectorAll('.example')].some(c=>!c.hidden);status.textContent=q?(count?`Найдено: ${count} из ${cards.length}`:'Нет совпадений. Попробуйте другое название.'):'';const url=new URL(location.href);if(q)url.searchParams.set('q',q);else url.searchParams.delete('q');history.replaceState(null,'',url)}
 input.addEventListener('input',filter);if(input.value)filter();
})();
