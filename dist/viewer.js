import { mediaUrl, safeUrl } from './content.js';
import { CHAPTERS, subjourneys, flattenSteps, activeAt, clampProgress } from './journey-model.js';
const illustrations = {
  fields: '<svg viewBox="0 0 560 470" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.1"><path d="M100 300V150q90-38 180 0v150q-90-38-180 0ZM280 150q90-38 180 0v150q-90-38-180 0Z"/><path opacity=".2" d="M125 183q60-18 125 0M125 212q60-18 125 0M125 241q60-18 125 0M306 183q60-18 125 0M306 212q60-18 125 0M306 241q60-18 125 0"/><path d="M280 150v168"/><circle cx="435" cy="106" r="30"/><path d="M423 118l24-24m-20 0h20v20"/></g><text x="100" y="370" fill="currentColor" font-size="10" letter-spacing="4">WHERE IT ALL BEGINS</text></svg>',
  about: '<div class="viewer-portrait-art"><span>↗</span><div>Nguyễn<br>Hoàng Việt.</div><small>THE PERSON BEHIND THE STORY</small></div>',
  journey: '<svg viewBox="0 0 560 470" aria-hidden="true"><g fill="none" stroke="currentColor"><path d="M85 330H200V230H335V130H465" stroke-width="1.2"/><path d="M85 115v240h390" opacity=".12"/><circle cx="200" cy="330" r="5" fill="currentColor"/><circle cx="335" cy="230" r="5" fill="currentColor"/><circle cx="465" cy="130" r="5" fill="currentColor"/></g><g fill="currentColor" font-size="13"><text x="153" y="365">01</text><text x="290" y="270">02</text><text x="420" y="173">03</text></g><text x="85" y="405" fill="currentColor" font-size="10" letter-spacing="3">EVERY EXPERIENCE LEAVES SOMETHING.</text></svg>',
  work: '<div class="viewer-collage"><div><span>01</span><strong>Đời sống.</strong></div><div><span>02</span><strong>Khoảnh khắc.</strong></div><div><span>03</span><strong>Ghi chép.</strong></div><p>Life, between the lines.</p></div>'
};
export function initChapterViewer(data, config) {
  const $=id=>document.getElementById(id);
  const steps=subjourneys(data);
  const chapters=CHAPTERS.map(chapter=>({...chapter,media:data.chapterMedia?.[chapter.mediaKey] || (chapter.id==='fields'?data.fields[0]?.media:chapter.id==='about'?data.profile.portrait:chapter.id==='work'?data.projects[0]?.media:undefined)}));
  const viewer=$('chapterViewer'), reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let nodes=[],currentKey='',currentChapter='',frame=0;
  const timers=new Set();
  function rebuild() {
    nodes=chapters.flatMap(chapter=> {
      const root={key:chapter.id,chapterId:chapter.id,element:$(chapter.id),title:chapter.name,media:chapter.media,depth:-1,pathTitles:[chapter.name],domId:chapter.id};
      const flat=flattenSteps(chapter.id,steps[chapter.id]);
      const map=new Map(flat.map(node=>[node.key,node]));
      return [root,...flat.map(node=>({...node,chapterId:chapter.id,element:$(node.domId),pathTitles:[chapter.name,...node.ancestors.map((_,i)=>map.get([chapter.id,...node.ancestors.slice(0,i+1)].join('/')).title),node.title]})).filter(node=>node.element)];
    });
    currentKey='';schedule();
  }
  function readingLine() {
    const header=document.querySelector('header').getBoundingClientRect().bottom;
    if(matchMedia('(max-width:640px)').matches) return Math.min(innerHeight-64,Math.max(innerHeight*.6,document.querySelector('.story-media').getBoundingClientRect().bottom+20));
    return Math.max(header+70,innerHeight*.38);
  }
  function navigate(key) {
    const node=nodes.find(item=>item.key===key);if(!node)return;
    const top=scrollY+node.element.getBoundingClientRect().top-readingLine()+14;
    // Scroll is never synthesized in the other column; both use this one document.
    window.scrollTo({top:Math.max(0,top),behavior:reduced.matches?'instant':'smooth'});
    history.replaceState(null,'','#'+node.domId);
  }
  function renderMedia(node,chapter) {
    const outgoing=viewer.querySelector('.viewer-frame:not(.outgoing)');
    if(outgoing) {
      outgoing.querySelector('video')?.pause();
      if(reduced.matches)outgoing.remove();else {
        outgoing.classList.add('outgoing');
        const timer=setTimeout(()=>{outgoing.remove();timers.delete(timer);},480);timers.add(timer);
      }
    }
    // At most one outgoing frame remains even after a rapid multi-chapter jump.
    [...viewer.querySelectorAll('.outgoing')].slice(0,-1).forEach(layer=>layer.remove());
    const layer=document.createElement('div');layer.className='viewer-frame';layer.dataset.chapter=chapter.id;layer.dataset.stepKey=node.key;
    layer.innerHTML=illustrations[chapter.id];
    if(node.depth>=0) {
      const summary=document.createElement('div');summary.className='viewer-step-art';
      const number=document.createElement('span');number.textContent='MỐC '+node.number;
      const title=document.createElement('strong');title.textContent=node.title;
      summary.append(number,title);layer.append(summary);
    }
    viewer.append(layer);
    let media=node.media;
    if(!mediaUrl(media,config)) {
      for(let i=node.ancestors?.length || 0;i>0;i--) {
        const parent=nodes.find(item=>item.key===[chapter.id,...node.ancestors.slice(0,i)].join('/'));
        if(mediaUrl(parent?.media,config)){media=parent.media;break;}
      }
    }
    if(!mediaUrl(media,config))media=chapter.media;
    const url=mediaUrl(media,config);
    $('viewerNote').textContent=url?(media?.caption || 'Ảnh/video của mốc đang đọc.'):'Minh họa bố cục · Chờ ảnh hoặc video của Việt';
    if(url) {
      const video=media?.type==='video';
      const element=document.createElement(video?'video':'img');element.className='chapter-asset';
      if(video){element.controls=true;element.playsInline=true;element.preload='metadata';element.setAttribute('aria-label',media.alt || node.title);const poster=safeUrl(media.poster);if(poster)element.poster=poster;}
      else{element.alt=media?.alt || node.title;element.decoding='async';}
      if(media?.fit==='contain')element.style.objectFit='contain';

      if(/^(\d{1,3}%\s+){1}\d{1,3}%$/.test(media?.position || ''))element.style.objectPosition=media.position;
      element.addEventListener('error',()=>{element.remove();if(currentKey===node.key)$('viewerNote').textContent='Ảnh/video chưa tải được. Đang hiển thị minh họa.';},{once:true});
      element.addEventListener('load',()=>{for(const child of [...layer.children])if(child!==element)child.hidden=true;},{once:true});
      element.src=url;layer.append(element);
    }
  }
  function select(node) {
    const chapter=chapters.find(item=>item.id===node.chapterId);
    const chapterNodes=nodes.filter(item=>item.chapterId===chapter.id);
    viewer.dataset.activeKey=node.key;viewer.dataset.activeChapter=chapter.id;
    $('viewerChapter').textContent=chapter.label;$('viewerCaption').textContent=node.title;
    $('viewerBreadcrumb').textContent=node.pathTitles.join(' / ');
    document.querySelectorAll('.journey-step').forEach(element=>element.classList.toggle('is-current',element.dataset.stepKey===node.key));
    document.querySelectorAll('.story-copy > section').forEach(section=>section.classList.toggle('reading',section.id===chapter.id));
    document.querySelectorAll('.viewer-dots button').forEach(button=>{const selected=button.dataset.chapter===chapter.id;button.setAttribute('aria-pressed',String(selected));});
    if(currentChapter!==chapter.id || !$('viewerStepSelect').options.length || ![...$('viewerStepSelect').options].some(option=>option.value===node.key)) {
      $('viewerStepSelect').replaceChildren();
      for(const item of chapterNodes){const option=document.createElement('option');option.value=item.key;option.textContent=item.depth<0?'Tổng quan':('　'.repeat(item.depth)+item.number+' · '+item.title);$('viewerStepSelect').append(option);}
    }
    $('viewerStepSelect').value=node.key;
    $('viewerStepCount').textContent=node.depth<0?'Tổng quan':`Mốc ${chapterNodes.findIndex(item=>item.key===node.key)} / ${chapterNodes.length-1}`;
    const index=nodes.findIndex(item=>item.key===node.key);$('viewerPrevious').disabled=index===0;$('viewerNext').disabled=index===nodes.length-1;
    currentKey=node.key;currentChapter=chapter.id;renderMedia(node,chapter);
  }
  function update() {
    frame=0;if(!nodes.length)return;
    const line=readingLine();
    const node=activeAt(nodes.map(item=>({...item,top:item.element.getBoundingClientRect().top})),line);
    if(node.key!==currentKey)select(node);
    const box=$(node.chapterId).getBoundingClientRect();
    const progress=clampProgress(box.top,box.height,line);
    $('viewerProgress').style.setProperty('--chapter-progress',String(progress));
    $('viewerProgress').setAttribute('aria-valuenow',String(Math.round(progress*100)));
    viewer.dataset.readingLine=String(Math.round(line));
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(update);}
  $('viewerStepSelect').addEventListener('change',event=>navigate(event.target.value));
  $('viewerPrevious').addEventListener('click',()=>{const index=nodes.findIndex(item=>item.key===currentKey);if(index>0)navigate(nodes[index-1].key);});
  $('viewerNext').addEventListener('click',()=>{const index=nodes.findIndex(item=>item.key===currentKey);if(index<nodes.length-1)navigate(nodes[index+1].key);});
  document.querySelectorAll('.viewer-dots button').forEach(button=>button.addEventListener('click',()=>navigate(button.dataset.chapter)));
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
  document.addEventListener('journey:structure',()=>{currentChapter='';$('viewerStepSelect').replaceChildren();rebuild();});
  const observer=new ResizeObserver(schedule);observer.observe(document.querySelector('.story-flow'));observer.observe(document.querySelector('.media-pin'));
  document.fonts.ready.then(schedule);
  rebuild();update();
  const hash=decodeURIComponent(location.hash.slice(1));
  if(hash.startsWith('step-'))requestAnimationFrame(()=>{const node=nodes.find(item=>item.domId===hash);if(node){const top=scrollY+node.element.getBoundingClientRect().top-readingLine()+14;window.scrollTo({top:Math.max(0,top),behavior:'instant'});}});
}
