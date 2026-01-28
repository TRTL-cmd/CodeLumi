const fs=require('fs'); const s=fs.readFileSync('dist/temp_script.js','utf8');
let inSingle=false,inDouble=false,inTemplate=false,inSlash=false; let prev='';
for(let i=0;i<s.length;i++){
  const ch=s[i];
  if(inTemplate){ if(ch==='`' && prev!=='\\') inTemplate=false; prev=ch; continue; }
  if(inSingle){ if(ch==="'" && prev!=='\\') inSingle=false; prev=ch; continue; }
  if(inDouble){ if(ch==='"' && prev!=='\\') inDouble=false; prev=ch; continue; }
  if(ch==='`') { inTemplate=true; prev=ch; continue; }
  if(ch==="'") { inSingle=true; prev=ch; continue; }
  if(ch==='"') { inDouble=true; prev=ch; continue; }
  prev=ch;
}
console.log('inTemplate', inTemplate, 'inSingle', inSingle, 'inDouble', inDouble);
process.exitCode = (inTemplate||inSingle||inDouble)?2:0;
