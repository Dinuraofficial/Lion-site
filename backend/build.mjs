import {mkdir, copyFile} from 'node:fs/promises';
await mkdir('build/admin',{recursive:true});
await copyFile('index.html','build/index.html');
await copyFile('public/admin/index.html','build/admin/index.html');
console.log('Static assets built in build/');
