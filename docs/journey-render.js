import { flattenSteps } from './journey-model.js';
const el=(tag,className,text)=> {const node=document.createElement(tag);node.className=className || '';if(text!=null)node.textContent=text;return node;};
export function renderSubjourney(container,chapterId,steps,openProject) {
  container.replaceChildren(); container.classList.add('subjourney');
  const lookup=new Map(flattenSteps(chapterId,steps).map(node=>[node.key,node]));
  function list(items,path=[]) {
    const ordered=el('ol','subjourney-list');
    for(const step of items) {
      const key=[chapterId,...path,step.id].join('/'), node=lookup.get(key);
      const li=el('li','subjourney-item'), article=el('article','journey-step');
      article.id=node.domId; article.dataset.stepKey=key; article.dataset.chapter=chapterId; article.dataset.depth=String(node.depth);article.tabIndex=-1;
      const marker=el('span','step-marker',node.number.padStart(2,'0'));marker.setAttribute('aria-hidden','true');
      const copy=el('div','step-copy');if(step.period)copy.append(el('p','step-period',step.period));
      const title=el('h3','',step.title);title.id=node.domId+'-title';article.setAttribute('aria-labelledby',title.id);
      copy.append(title,el('p','step-summary',step.summary || ''));
      if(step.projectId && openProject) {const button=el('button','step-read','Đọc câu chuyện ↗');button.type='button';button.addEventListener('click',()=>openProject(step.projectId));copy.append(button);}
      article.append(marker,copy);li.append(article);
      if(step.children?.length)li.append(list(step.children,[...path,step.id]));
      ordered.append(li);
    }
    return ordered;
  }
  container.append(list(steps));
  document.dispatchEvent(new CustomEvent('journey:structure'));
}
