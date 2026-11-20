// Assembles the demo build into one self-contained page fragment for publishing.
import fs from 'node:fs';
const css = fs.readFileSync('dist-demo/assets/app.css', 'utf8');
const js = fs.readFileSync('dist-demo/assets/app.js', 'utf8').replace(/<\/script/g, '<\\/script');
const out = `<title>AE Vault</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap">
<style>${css}</style>
<div id="root"></div>
<script>${js}</script>
`;
fs.writeFileSync('contact-vault-demo.html', out);
fs.writeFileSync('contact-vault-demo.preview.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${out}</body></html>`);
console.log('bytes', out.length);
