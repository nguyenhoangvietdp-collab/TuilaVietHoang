// One scroll position drives the menu-to-chapter transfer in both directions.
export function initChapterMotion() {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const entries=['fields','about','journey','work'].map(id=>{
    const source=document.querySelector(`#navigation a[href="#${id}"]`);
    const label=document.querySelector(`#${id} > .section-label > span`);
    if(!source||!label)return null;
    const text=source.textContent.trim();
    const prefix=label.textContent.split('/')[0].trim();
    label.replaceChildren(document.createTextNode(prefix+' / '));
    const target=document.createElement('span');target.className='chapter-motion-target';target.textContent=text;label.append(target);
    const flyer=document.createElement('span');flyer.className='chapter-title-flight';flyer.textContent=text;flyer.setAttribute('aria-hidden','true');flyer.hidden=true;document.body.append(flyer);
    return {source,target,flyer};
  }).filter(Boolean);
  let frame=0;
  const clamp=n=>Math.max(0,Math.min(1,n));
  function render(){
    frame=0;
    const headerBottom=document.querySelector('header').getBoundingClientRect().bottom;
    for(const {source,target,flyer} of entries){
      const a=source.getBoundingClientRect(),b=target.getBoundingClientRect();
      const enabled=!reduced.matches&&a.width>0&&a.height>0&&innerWidth>640;
      const start=innerHeight*.86,end=Math.max(headerBottom+110,innerHeight*.38);
      const p=clamp((start-b.top)/Math.max(1,start-end));
      const flying=enabled&&p>0&&p<1;
      source.classList.toggle('chapter-link-in-flight',flying);

      target.style.opacity=flying?'0':'1';flyer.hidden=!flying;
      if(!flying)continue;
      const t=p*p*(3-2*p),style=getComputedStyle(source),to=getComputedStyle(target);
      flyer.style.font=style.font;flyer.style.letterSpacing=style.letterSpacing;
      const scale=1+(parseFloat(to.fontSize)/parseFloat(style.fontSize)-1)*t;
      const x=a.left+(b.left-a.left)*t,y=a.top+(b.top-a.top)*t;
      flyer.style.transform=`translate3d(${x}px,${y}px,0) scale(${scale})`;
    }
  }
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(render);};
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);
  reduced.addEventListener('change',schedule);document.fonts.ready.then(schedule);render();
}

