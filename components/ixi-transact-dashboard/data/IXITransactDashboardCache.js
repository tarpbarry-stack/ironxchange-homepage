const MAX_ENTRIES=30;
const DEFAULT_TTL_MS=60000;
const cache=new Map();
const clean=value=>String(value??"").trim();
const stable=value=>{if(Array.isArray(value))return value.map(stable);if(value&&typeof value==="object"){return Object.keys(value).sort().reduce((out,key)=>{out[key]=stable(value[key]);return out},{});}return value;};

export function createIXITransactDashboardCacheKey(query={}){
 const source={scope:query.scope||{},period:query.period||{},currency:clean(query.currency||"USD").toUpperCase(),filters:query.filters||{},include:Array.isArray(query.include)?[...query.include].sort():[]};
 return JSON.stringify(stable(source));
}
export function getIXITransactDashboardCache(query={},ttlMs=DEFAULT_TTL_MS){
 const key=createIXITransactDashboardCacheKey(query),entry=cache.get(key);if(!entry)return null;
 const age=Date.now()-entry.cachedAt;if(age>Math.max(0,Number(ttlMs)||DEFAULT_TTL_MS)){cache.delete(key);return null;}
 return{...entry.value,cache:{hit:true,cachedAt:entry.cachedAt,ageMs:age,key}};
}
export function setIXITransactDashboardCache(query={},value={}){
 const key=createIXITransactDashboardCacheKey(query);cache.set(key,{cachedAt:Date.now(),value});
 while(cache.size>MAX_ENTRIES){cache.delete(cache.keys().next().value)}
 return key;
}
export function invalidateIXITransactDashboardCache(predicate=null){
 if(typeof predicate!=="function"){const count=cache.size;cache.clear();return count;}
 let removed=0;for(const[key,entry]of cache.entries()){if(predicate(entry.value,key)){cache.delete(key);removed+=1;}}return removed;
}
export function getIXITransactDashboardCacheStats(){return{entries:cache.size,maxEntries:MAX_ENTRIES,defaultTtlMs:DEFAULT_TTL_MS};}
export default{createIXITransactDashboardCacheKey,getIXITransactDashboardCache,setIXITransactDashboardCache,invalidateIXITransactDashboardCache,getIXITransactDashboardCacheStats};
