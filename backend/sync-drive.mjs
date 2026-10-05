/** Prepare a static publication snapshot from a curated Drive JSON manifest.
 * Credentials arrive through stdin only; never log or save the access token.
 * This does not change Drive permissions or deploy the website.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { validateContent } from '../dist/content.js';
const args = process.argv.slice(2);
const outIndex = args.indexOf('--out-dir');
if (outIndex < 0 || !args[outIndex + 1]) throw new Error('Pass --out-dir with an empty staging directory.');
const target = path.resolve(args[outIndex + 1]);
await fs.mkdir(target, {recursive:true});
if ((await fs.readdir(target)).length) throw new Error('Staging directory must be empty.');
let input = ''; for await (const chunk of process.stdin) { input += chunk; if (input.length > 20000) throw new Error('Invalid credentials input'); }
let credentials; try { credentials = JSON.parse(input); } catch { throw new Error('Expected credential JSON on stdin'); }
const {accessToken, manifestFileId} = credentials;
input = ''; credentials = null;
if (typeof accessToken !== 'string' || !accessToken || !/^[a-zA-Z0-9_-]+$/.test(manifestFileId || '')) throw new Error('Missing accessToken or manifestFileId');
async function drive(id, suffix='') {
  const res = await fetch('https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(id) + suffix, {headers:{Authorization:'Bearer '+accessToken},signal:AbortSignal.timeout(20000)});
  if(!res.ok) throw new Error('Drive request failed (' + res.status + '). Check file access and token.');
  return res;
}
const source = await drive(manifestFileId,'?alt=media');
const raw = await source.text(); if (raw.length > 2000000) throw new Error('Manifest too large');
const manifest = validateContent(JSON.parse(raw));
const types = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif','image/gif':'gif','video/mp4':'mp4','video/webm':'webm'};
const published = new Map();
async function visit(value) {
  if (!value || typeof value !== 'object') return;
  if (value.driveFileId) {
    const id = value.driveFileId; if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error('Invalid image file ID');
    if (!published.has(id)) {
      if (published.size >= 80) throw new Error('Snapshot exceeds 80 selected images');
      const meta = await (await drive(id,'?fields=mimeType,size')).json();
      const limit = meta.mimeType?.startsWith('video/') ? 60*1024*1024 : 15*1024*1024;
      if (!types[meta.mimeType] || Number(meta.size) > limit) throw new Error('Unsupported media or file too large (images: 15 MB; videos: 60 MB)');
      const response = await drive(id,'?alt=media');
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length > limit) throw new Error('Media too large');
      const name = createHash('sha256').update(bytes).digest('hex').slice(0,20)+'.'+types[meta.mimeType];
      await fs.mkdir(path.join(target,'assets/photos'),{recursive:true});
      await fs.writeFile(path.join(target,'assets/photos',name),bytes);
      published.set(id,'./assets/photos/'+name);
    }
    value.url = published.get(id); value.driveFileId = '';
  }
  for(const child of Object.values(value)) await visit(child);
}
await visit(manifest);
await fs.mkdir(path.join(target,'data'),{recursive:true});
await fs.writeFile(path.join(target,'data/portfolio.json'),JSON.stringify(manifest,null,2)+'\n');
process.stdout.write(JSON.stringify({status:'snapshot_ready',images:published.size,stagingDirectory:target,permissionsChanged:false,deployed:false})+'\n');
