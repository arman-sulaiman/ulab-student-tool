import fs from 'node:fs';
import {defineConfig} from 'vite';export default defineConfig({plugins:[{name:'pdf-standard-fonts',closeBundle(){fs.cpSync('node_modules/pdfjs-dist/standard_fonts','dist/pdf-fonts',{recursive:true});}}],server:{proxy:{'/api':'http://127.0.0.1:3001','/fonts':'http://127.0.0.1:3001'}},build:{outDir:'dist'}});
