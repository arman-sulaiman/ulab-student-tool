import {randomBytes,scryptSync} from 'node:crypto';import fs from 'node:fs';
const password=randomBytes(18).toString('base64url'),salt=randomBytes(16).toString('hex');
let env=fs.existsSync('.env')?fs.readFileSync('.env','utf8'):fs.readFileSync('.env.example','utf8');
const values={ADMIN_PASSWORD_HASH:salt+':'+scryptSync(password,salt,64).toString('hex'),SESSION_SECRET:randomBytes(32).toString('hex')};
for(const [key,value] of Object.entries(values)){const regex=new RegExp('^'+key+'=.*$','m');env=regex.test(env)?env.replace(regex,key+'='+value):env+'\n'+key+'='+value;}
if(!/^AI_CONFIG_ENCRYPTION_KEY=[a-fA-F0-9]{64}$/m.test(env)){const key='AI_CONFIG_ENCRYPTION_KEY='+randomBytes(32).toString('hex');env=/^AI_CONFIG_ENCRYPTION_KEY=.*$/m.test(env)?env.replace(/^AI_CONFIG_ENCRYPTION_KEY=.*$/m,key):env+'\n'+key;}
fs.writeFileSync('.env',env+'\n',{mode:0o600});console.log('Admin password (save securely): '+password+'\nSettings written to .env. Restart the app. This command resets admin credentials and invalidates sessions.');
