import { initChapterMotion } from './chapter-motion.js';
import { loadContent, mediaUrl, safeUrl } from './content.js';
import { initScrollMotion } from './motion.js';
import { initChapterViewer } from './viewer.js';
import { subjourneys } from './journey-model.js';
import { renderSubjourney } from './journey-render.js';
const $ = id => document.getElementById(id);
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
const lines = (node, value) => { node.replaceChildren(); (Array.isArray(value) ? value : String(value || '').split('\n')).forEach((text, index) => { if (index) node.append(document.createElement('br')); node.append(document.createTextNode(String(text))); }); };
let data, config, steps, activeFilter = 'all';
const art = {
  research: '<svg viewBox="0 0 400 310" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1"><path d="M70 225V87q65-28 130 0v138q-65-28-130 0ZM200 87q65-28 130 0v138q-65-28-130 0Z"/><path opacity=".2" d="M90 112q42-15 90 0M90 134q42-15 90 0M90 156q42-15 90 0M220 112q42-15 90 0M220 134q42-15 90 0M220 156q42-15 90 0"/><path d="M200 87v150"/><circle cx="310" cy="65" r="22"/><path d="M302 73l16-16m-13 0h13v13"/></g><text x="68" y="275" fill="currentColor" font-size="10" letter-spacing="3">A PLACE TO BEGIN.</text></svg>',
  creative: '<svg viewBox="0 0 400 310" aria-hidden="true"><g stroke="currentColor" fill="none"><circle cx="170" cy="155" r="92"/><circle cx="230" cy="155" r="92" opacity=".35"/><path d="M200 40v230M75 155h250" opacity=".15"/><circle cx="200" cy="155" r="4" fill="currentColor"/></g></svg>',
  build: '<svg viewBox="0 0 400 310" aria-hidden="true"><g fill="none" stroke="currentColor"><rect x="65" y="60" width="270" height="190" rx="10"/><path d="M65 92h270M94 220l62-55 50 24 103-65M298 124h11v11"/><circle cx="84" cy="76" r="2"/><circle cx="97" cy="76" r="2"/><circle cx="110" cy="76" r="2"/></g></svg>'
};
function mountMedia(container, media, eager = false) {
  const url = mediaUrl(media, config);
  if (!url) return;
  const img = el('img'); img.alt = media?.alt || ''; img.loading = eager ? 'eager' : 'lazy'; img.decoding = 'async';
  if(media?.fit==='contain')img.style.objectFit='contain';

  if (/^(\d{1,3}%\s+){1}\d{1,3}%$/.test(media?.position || '')) img.style.objectPosition = media.position;
  img.addEventListener('error', () => img.remove(), { once: true });
  img.addEventListener('load', () => { container.querySelectorAll('.visual-label,.image-note,.portrait-symbol,.project-word,.visual-grid,svg').forEach(n => n.hidden = true); }, { once: true });
  img.src = url; container.append(img);
}
function renderFields() {
  $('fieldList').replaceChildren();
  for (const field of data.fields) {
    const row = el('article', 'field-row'), copy = el('div', 'field-copy');
    const heading = el('h2', '', field.title); heading.style.fontSize = '34px';
    copy.append(el('p', 'eyebrow', field.label || ''), heading, el('p', '', field.description || ''));
    const list = el('ul', 'field-points'); for (const point of field.points || []) list.append(el('li', '', point)); copy.append(list);
    const visual = el('div', 'visual'); visual.innerHTML = art[field.art] || art.research;
    const label = el('div', 'visual-label'); label.append(el('span', '', 'THE EARLY CHAPTERS'), el('span', '', 'ẢNH SẼ ĐƯỢC BỔ SUNG')); visual.append(label);
    mountMedia(visual, field.media); row.append(copy, visual); $('fieldList').append(row);
  }
}
function renderStages() {
  renderSubjourney($('experienceTimeline'),'journey',steps.journey);
}
const categoryName = id => (data.storyCategories || data.fields).find(field => field.id === id)?.title || 'Câu chuyện';
function renderProjects() {
  const selected = data.projects.filter(project => activeFilter === 'all' || project.fieldId === activeFilter);
  $('emptyProjects').hidden = selected.length > 0;
  const ids=new Set(selected.map(project=>project.id));
  renderSubjourney($('projectGrid'),'work',steps.work.filter(step=>!step.projectId || ids.has(step.projectId)),id=>{const project=data.projects.find(p=>p.id===id);if(project)openProject(project);});
}
function renderFilters() {
  $('filters').replaceChildren();
  const categories = [{ id: 'all', title: 'Tất cả' }, ...(data.storyCategories || data.fields).filter(f => data.projects.some(p => p.fieldId === f.id))];
  for (const category of categories) {
    const button = el('button', 'filter', category.title); button.type = 'button'; button.setAttribute('aria-pressed', String(category.id === activeFilter));
    button.dataset.category = category.id;
    button.addEventListener('click', () => { activeFilter = category.id; for (const filter of $('filters').children) filter.setAttribute('aria-pressed', String(filter.dataset.category === activeFilter)); renderProjects(); }); $('filters').append(button);
  }
}
function renderLink(link, primary = false) {
  const url = safeUrl(link.url, true); if (!url) return null;
  const anchor = el('a', 'button' + (primary ? ' primary' : ''), link.label || 'Mở liên kết'); anchor.href = url;
  if (!url.startsWith('mailto:')) { anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; }
  anchor.append(el('span', '', '↗')); return anchor;
}
function openProject(project) {
  const body = $('dialogBody'); body.replaceChildren();
  const chapter = data.chapters.find(s => s.id === project.chapterId);
  const title = el('h2', '', project.title); title.id = 'storyTitle';
  body.append(el('p', 'dialog-label', categoryName(project.fieldId) + (chapter ? ' / ' + chapter.title : '')), title, el('p', 'muted', project.summary || ''));
  const cover = el('div', 'dialog-image' + (project.demoStory && !mediaUrl(project.media,config) ? ' demo-cover' : ''), project.coverWord || 'A chapter.'); mountMedia(cover, project.media, true); body.append(cover);
  const sections = project.sections || [{ title: 'Bối cảnh', text: project.context }, { title: 'Câu chuyện', text: project.process }, { title: 'Điều đọng lại', text: project.outcome }];
  for (const item of sections) { const section = el('div', 'dialog-section'); section.append(el('h3', '', item.title), el('p', '', item.text || '')); body.append(section); }
  for (const media of project.gallery || []) { const frame = el('div', 'dialog-image'); mountMedia(frame, media); body.append(frame); }
  const links = el('div', 'actions'); for (const link of project.links || []) { const anchor = renderLink(link); if (anchor) links.append(anchor); } body.append(links);
  $('projectDialog').showModal(); $('projectDialog').scrollTop = 0; document.body.classList.add('modal-open');
}
function renderProfile() {
  const p = data.profile; document.title = p.name + ' — Cuộc đời qua từng chặng';
  $('brandName').textContent = p.name; $('footerName').textContent = p.name; $('heroMeta').textContent = p.meta || ''; lines($('heroTitle'), p.headline); lines($('heroIntro'), (p.intro || '').replace(/\n/g, ' \n')); lines($('aboutTitle'), p.aboutTitle); $('aboutText').textContent = p.about || ''; $('contactIntro').textContent = p.contactIntro || ''; $('demoNotice').hidden = !data.isDemo;
  $('values').replaceChildren(); for (const value of p.values || []) { const row = el('div', 'value', value.title); row.append(el('span', '', value.detail)); $('values').append(row); }
  mountMedia($('portrait'), p.portrait);
  if(data.demoNotice)$('demoNotice').textContent=data.demoNotice;
  const hero=$('heroPhoto');if(hero&&mediaUrl(data.heroMedia,config)){hero.hidden=false;mountMedia(hero,data.heroMedia,true);}
  for(const [id,photos] of [['aboutGallery',data.aboutGallery||[]],['contactPhotos',[data.contactMedia,...(data.contactGallery||[])]].filter(Boolean)]){
    const gallery=$(id);if(!gallery)continue;gallery.replaceChildren();for(const photo of photos){if(!mediaUrl(photo,config))continue;const frame=el('figure','placed-photo');mountMedia(frame,photo);gallery.append(frame);}
  }
  const links = [...(p.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email) ? [{ label: 'Gửi email', url: 'mailto:' + p.email }] : []), ...(p.links || [])];
  $('contactLinks').replaceChildren(); for (const link of links) { const anchor = renderLink(link, !$('contactLinks').children.length); if (anchor) $('contactLinks').append(anchor); }
  $('contactPending').hidden = $('contactLinks').children.length > 0;
}
$('menuToggle').addEventListener('click', () => { const opened = $('navigation').classList.toggle('open'); $('menuToggle').setAttribute('aria-expanded', String(opened)); $('menuToggle').setAttribute('aria-label', opened ? 'Đóng menu' : 'Mở menu'); $('menuToggle').textContent = opened ? '×' : '☰'; });
$('navigation').addEventListener('click', event => { if (event.target.closest('a')) { $('navigation').classList.remove('open'); $('menuToggle').setAttribute('aria-expanded', 'false'); $('menuToggle').setAttribute('aria-label', 'Mở menu'); $('menuToggle').textContent = '☰'; } });
function setTheme(dark) { document.body.classList.toggle('dark', dark); $('themeToggle').setAttribute('aria-label', dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'); }
try { setTheme(localStorage.getItem('chapters-theme') === 'dark'); } catch { /* Storage may be disabled. */ }
$('themeToggle').addEventListener('click', () => { const dark = !document.body.classList.contains('dark'); setTheme(dark); try { localStorage.setItem('chapters-theme', dark ? 'dark' : 'light'); } catch {} });
$('closeDialog').addEventListener('click', () => $('projectDialog').close());
$('projectDialog').addEventListener('close', () => document.body.classList.remove('modal-open'));
$('projectDialog').addEventListener('click', event => { const box = $('projectDialog').getBoundingClientRect(); if (event.target === $('projectDialog') && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) $('projectDialog').close(); });
$('year').textContent = new Date().getFullYear();
try {
  const loaded = await loadContent(); data = loaded.data; config = loaded.config; steps = subjourneys(data); renderProfile(); renderFields();
  renderSubjourney($('schoolTimeline'),'fields',steps.fields);renderSubjourney($('personalTimeline'),'about',steps.about);
  renderStages(); renderFilters(); renderProjects();
  initScrollMotion(); initChapterMotion();
  initChapterViewer(data, config);
  if (loaded.fallback) { $('loadStatus').hidden = false; $('loadStatus').textContent = 'Nguồn nội dung tạm thời chưa khả dụng. Đang hiển thị bản đã lưu.'; }
} catch (error) { console.error('Portfolio initialization failed:',error); $('loadStatus').hidden = false; $('loadStatus').textContent = 'Chưa tải được nội dung. Vui lòng thử tải lại trang.'; }

