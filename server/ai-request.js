import {setTimeout as sleep} from 'node:timers/promises';

// Only fixed diagnostic phrases leave this function: never provider-echoed input or keys.
export function providerDetail(body) {
 const status=body?.error?.status;
 const allowed=['UNAVAILABLE','RESOURCE_EXHAUSTED','INVALID_ARGUMENT','PERMISSION_DENIED','UNAUTHENTICATED','NOT_FOUND','INTERNAL','DEADLINE_EXCEEDED'];
 const message=String(body?.error?.message||'').toLowerCase();
 const reasons=[[/high demand|overload/,'high demand or overload'],[/location|region|country/,'location or region restriction'],[/api key|api_key/,'API key issue'],[/quota|rate limit/,'quota or rate limit'],[/not found|not supported/,'model or operation unavailable'],[/temporarily unavailable|service unavailable/,'service unavailable']];
 const reason=reasons.find(([pattern])=>pattern.test(message))?.[1]||'provider gave no recognized diagnostic';
 return `${allowed.includes(status)?status:'UNKNOWN'}: ${reason}`;
}

export async function requestAI(url,options,{fetcher=fetch,wait=sleep,now=Date.now}={}) {
 const started=now();
 // One shared deadline includes retries, response bodies and backoff.
 const signal=AbortSignal.timeout(50000);
 for(let attempt=1;attempt<=3;attempt++) {
  const response=await fetcher(url,{...options,signal});
  if(response.ok)return {response};
  let body;try{body=await response.json();}catch{}
  const detail=`${providerDetail(body)}; attempts ${attempt}`;
  const delay=attempt*1000;
  if(![502,503,504].includes(response.status)||attempt===3||now()-started+delay>45000)
   return {response,detail};
  await wait(delay,undefined,{signal});
 }
}
