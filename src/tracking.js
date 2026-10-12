export async function track(kind,quantity=1){try{await fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,quantity,id:crypto.randomUUID()}),keepalive:true});}catch{/* Analytics must not block local PDF exports. */}}
export async function screenshotPayload(file){
 if(file.size<=2.8*1024*1024)return {mimeType:file.type,image:await read(file)};
 const bitmap=await createImageBitmap(file);const scale=Math.min(1,2400/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
 const data=canvas.toDataURL('image/jpeg',.88);if(data.length>3900000)throw new Error('Screenshot is too large after compression. Crop it to the routine and retry.');return {image:data.split(',')[1],mimeType:'image/jpeg'};
}
function read(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.onerror=()=>reject(new Error('Image could not be read.'));r.readAsDataURL(file);});}
