export const days = ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'];
export const types = ['Assignment','Lab Assignment','Lab Report','Project Report','Open-Ended Lab Report'];
export function filename(value, ext='pdf') { return (String(value||'document').replace(/[<>:"/\\|?*\x00-\x1f]/g,'-').replace(/\.(pdf|json|csv)$/i,'').trim().replace(/[. ]+$/,'').slice(0,100)||'document')+'.'+ext; }
export function validateRoutine(data) {
 if (!data || !Array.isArray(data.classes) || data.classes.length>100) throw new Error('Expected a routine with up to 100 classes.');
 const classes=data.classes.map((c,i)=>{
  if(!days.includes(c.day)) throw new Error(`Class ${i+1}: choose a valid day.`);
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(c.start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(c.end)||c.start>=c.end) throw new Error(`Class ${i+1}: use valid start/end times, with end after start.`);
  if(typeof c.course!=='string'||!c.course.trim()) throw new Error(`Class ${i+1}: course is required.`);
  return Object.fromEntries(['day','start','end','course','room','teacher','section'].map(k=>[k,String(c[k]??'').slice(0,160)]));
 });
 return {classes,warnings:Array.isArray(data.warnings)?data.warnings.map(String).slice(0,30):[]};
}
export function conflicts(classes){return classes.flatMap((a,i)=>classes.slice(i+1).filter(b=>a.day===b.day&&a.start<b.end&&b.start<a.end).map(b=>`${a.day}: ${a.course} overlaps ${b.course}`));}
export function validateCover(d){
 if(!types.includes(d.type))throw new Error('Choose a valid cover type.');
 for(const k of ['semester','code','course','section','department','faculty','designation','facultyDepartment','school','date']) if(typeof d[k]!=='string'||!d[k].trim()||d[k].length>220)throw new Error(`Check ${k}: required, maximum 220 characters.`);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(d.date)||Number.isNaN(Date.parse(d.date)))throw new Error('Choose a valid submission date.');
 if(!Array.isArray(d.students)||![1,2,3,5].includes(d.students.length)||d.students.some(s=>!s.name?.trim()||!s.id?.trim()||s.name.length>100||s.id.length>40))throw new Error('Enter names and IDs for 1, 2, 3 or 5 students.');
 if(String(d.title||'').length>250)throw new Error('Keep the title within 250 characters.');
 return d;
}
