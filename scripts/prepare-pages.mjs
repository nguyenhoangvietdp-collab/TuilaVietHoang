import fs from 'node:fs/promises';
import '../backend/bundle-content.mjs';
const source = new URL('../dist/', import.meta.url);
const target = new URL('../docs/', import.meta.url);
await fs.cp(source, target, { recursive: true, force: true });
await fs.writeFile(new URL('.nojekyll', target), '');
console.log('GitHub Pages ready: docs/');
