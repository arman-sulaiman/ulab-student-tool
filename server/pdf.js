import {PDFDocument,rgb} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'node:fs/promises';
export async function coverPDF(d, regular, bold, logo){
 const doc=await PDFDocument.create();doc.registerFontkit(fontkit);
 const normal=await doc.embedFont(regular,{subset:true}),strong=await doc.embedFont(bold,{subset:true});
 const page=doc.addPage([595.28,841.89]);const blue=d.color==='black'?rgb(0,0,0):rgb(.10,.36,.64);
 const img=await doc.embedPng(logo);const scale=Math.min(295/img.width,120/img.height);page.drawImage(img,{x:(595.28-img.width*scale)/2,y:605+(120-img.height*scale)/2,width:img.width*scale,height:img.height*scale});
 let y=552;
 function line(text,size=14,isBold=false,col=rgb(0,0,0),gap=4){
  const font=isBold?strong:normal;let current='';const lines=[];
  for(const word of String(text).split(/\s+/)){const t=current?current+' '+word:word;if(font.widthOfTextAtSize(t,size)>485&&current){lines.push(current);current=word;}else current=t;}lines.push(current);
  for(const t of lines){if(font.widthOfTextAtSize(t,size)>490)throw new Error('A field contains an unbroken word too long to fit. Add spaces or shorten it.');page.drawText(t,{x:(595.28-font.widthOfTextAtSize(t,size))/2,y,size,font,color:col});y-=size+gap;}
 }
 const group=d.students.length>1;const project=['Project Report','Open-Ended Lab Report'].includes(d.type);
 line(d.type+(d.number?' – '+d.number:'')+(group&&!project?' (Group)':''),16,true);
 if(d.title){if(project)line('On',14);line((d.type==='Lab Report'?'Experiment Name: ':'')+d.title,16,true,blue);}
 y-=18;line('Semester: '+d.semester);line('Course Code: '+d.code,14,true);line('Course Title: '+d.course,16,true,blue);line('Section – '+d.section+(group&&d.group?' | Group – '+d.group:''),16);
 y-=20;line('Submitted by:',14,true);
 for(const s of d.students){
  if(!group){line(s.name.toUpperCase(),15,true,blue);line('ID: '+s.id,13,true);}
  else{const name=s.name.toUpperCase(),id=' ['+s.id+']';const nw=strong.widthOfTextAtSize(name,15),iw=strong.widthOfTextAtSize(id,13);if(nw+iw>485){line(name,15,true,blue);line(id,13,true);}else{const x=(595.28-nw-iw)/2;page.drawText(name,{x,y,font:strong,size:15,color:blue});page.drawText(id,{x:x+nw,y,font:strong,size:13,color:blue});y-=19;}}
 }
 line(d.department,13);y-=24;line('Submitted to:',14,true);line(d.faculty.toUpperCase(),15,true,blue);line(d.designation+', '+d.facultyDepartment,13,true);line(d.school,13);
 y-=22;line('Date of Submission:',14,true);line(new Date(d.date+'T12:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}),14);
 if(y<40)throw new Error('This cover is too long for one A4 page. Shorten the title, course or faculty details.');
 doc.setTitle(d.type+' — '+d.course);doc.setCreator('ULAB Student Tool');return doc.save();
}
