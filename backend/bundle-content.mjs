import fs from 'node:fs/promises';
const root=new URL('../dist/',import.meta.url);
const data=JSON.parse(await fs.readFile(new URL('data/portfolio.json',root),'utf8'));
const config=JSON.parse(await fs.readFile(new URL('data/config.json',root),'utf8'));
await fs.writeFile(new URL('bundled-content.js',root),'// Generated from data/*.json by backend/bundle-content.mjs.\nexport const bundledData='+JSON.stringify(data)+';\nexport const bundledConfig='+JSON.stringify(config)+';\n');
