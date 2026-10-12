import fs from 'node:fs';import path from 'node:path';
fs.mkdirSync('fonts',{recursive:true});
const roots=[process.env.WINDIR&&path.join(process.env.WINDIR,'Fonts'),'/Library/Fonts','/System/Library/Fonts/Supplemental'].filter(Boolean);
for(const [target,candidates] of [['times.ttf',['times.ttf','Times New Roman.ttf']],['timesbd.ttf',['timesbd.ttf','Times New Roman Bold.ttf']]]){
 if(fs.existsSync('fonts/'+target))continue;
 const source=roots.flatMap(r=>candidates.map(f=>path.join(r,f))).find(f=>fs.existsSync(f));
 if(source){fs.copyFileSync(source,'fonts/'+target);console.log('Installed '+target+' from your system.');}else{console.error('Missing '+target+'. Copy your licensed Times New Roman font into fonts/.');process.exitCode=1;}
}
