import { bundledData, bundledConfig } from './bundled-content.js';
// The presentation knows only this contract, not where Drive stores the source.
export function safeUrl(value, allowMail = false) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value, location.href);
    if (url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) return url.href;
    if (allowMail && url.protocol === 'mailto:') return url.href;
  } catch { /* Leave invalid URLs out of the rendered document. */ }
  return '';
}
export function validateContent(data) {
  if (data?.schemaVersion !== 1 || typeof data.profile?.name !== 'string') throw new Error('Invalid portfolio schema');
  const stringList = (value) => value === undefined || (Array.isArray(value) && value.every(item => typeof item === 'string'));
  const objectList = (value) => value === undefined || (Array.isArray(value) && value.every(item => item && typeof item === 'object' && !Array.isArray(item)));
  for (const key of ['headline', 'aboutTitle']) if (!stringList(data.profile[key])) throw new Error('Invalid profile lines');
  for (const key of ['intro', 'about', 'meta', 'email', 'contactIntro']) if (data.profile[key] != null && typeof data.profile[key] !== 'string') throw new Error('Invalid profile text');
  if (!objectList(data.profile.values) || !objectList(data.profile.links) || !objectList(data.storyCategories)) throw new Error('Invalid profile lists');
  if(data.subjourneys!==undefined) {
    if(!data.subjourneys || typeof data.subjourneys!=='object' || Array.isArray(data.subjourneys))throw new Error('Invalid subjourneys');
    for(const [chapter,steps] of Object.entries(data.subjourneys)) {
      if(!['fields','about','journey','work'].includes(chapter))throw new Error('Unknown life chapter');
      let count=0;
      function validateSteps(items,depth=0) {
        if(depth>5 || !Array.isArray(items))throw new Error('Invalid step hierarchy');
        const ids=new Set();
        for(const item of items) {
          if(++count>150 || !item || !/^[a-zA-Z0-9_-]+$/.test(item.id || '') || ids.has(item.id) || typeof item.title!=='string')throw new Error('Invalid subchapter');
          ids.add(item.id);
          for(const key of ['summary','period','projectId'])if(item[key]!=null && typeof item[key]!=='string')throw new Error('Invalid subchapter text');
          if(item.children!==undefined)validateSteps(item.children,depth+1);
        }
      }
      validateSteps(steps);
    }
  }
  for (const key of ['fields', 'chapters', 'projects']) {
    if (!Array.isArray(data[key])) throw new Error('Missing ' + key);
    const ids = new Set();
    for (const item of data[key]) {
      if (!item || typeof item.id !== 'string' || typeof item.title !== 'string' || ids.has(item.id)) throw new Error('Invalid ' + key);
      if (!stringList(item.points) || !stringList(item.tags) || !objectList(item.milestones) || !objectList(item.sections) || !objectList(item.links) || !objectList(item.gallery)) throw new Error('Invalid nested content');
      ids.add(item.id);
    }
  }
  return data;
}
async function json(url, timeout = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const local=new URL(url,location.href).origin===new URL(location.href).origin;
    const response = await fetch(url, { signal: controller.signal, credentials: local?'same-origin':'omit' });
    if (!response.ok) throw new Error('Content unavailable');
    return await response.json();
  } finally { clearTimeout(timer); }
}
export async function loadContent(publishedConfig = bundledConfig) {
  // Private hosting may authenticate JSON differently from script assets.
  // A network request must never prevent the saved story or viewer from mounting.
  const fallback = validateContent(structuredClone(bundledData));
  const config = structuredClone(publishedConfig);
  if (!config.contentEndpoint) return { data: fallback, config, fallback: false };
  const endpoint = safeUrl(config.contentEndpoint);
  if (endpoint) {
    try { return { data: validateContent(await json(endpoint, config.timeoutMs || 8000)), config, fallback: false }; }
    catch { /* Invalid, inaccessible or slow feeds fall back to the published snapshot. */ }
  }
  return { data: fallback, config, fallback: true };
}
export function mediaUrl(media, config) {
  const direct = safeUrl(media?.url);
  if (direct) return direct;
  if (media?.driveFileId && config.mediaEndpoint) {
    const endpoint = safeUrl(config.mediaEndpoint);
    if (endpoint) {
      const url = new URL(endpoint);
      url.searchParams.set('fileId', media.driveFileId);
      return url.href;
    }
  }
  return '';
}
