import {useCallback,useEffect,useMemo,useRef,useState} from "react";
const clean=value=>String(value??"").trim();
const obj=value=>value&&typeof value==="object"&&!Array.isArray(value)?value:{};
export default function useIXIWorkspaceFilters({filters={},onFiltersChange=null,defaultStatus="all",defaultSort="",defaultDirection="asc",searchDebounceMs=300}={}){
 const source=obj(filters);const externalQuery=clean(source.q),externalStatus=clean(source.status||defaultStatus)||defaultStatus;
 const[search,setSearchState]=useState(externalQuery),timerRef=useRef(null);
 useEffect(()=>{setSearchState(externalQuery)},[externalQuery]);
 useEffect(()=>()=>{if(timerRef.current)clearTimeout(timerRef.current)},[]);
 const commit=useCallback(patch=>{const next={...source,...patch};Object.keys(next).forEach(key=>{if(next[key]===undefined||next[key]===null||next[key]==="")delete next[key]});onFiltersChange?.(next)},[JSON.stringify(source),onFiltersChange]);
 const setSearch=useCallback(value=>{const next=String(value??"");setSearchState(next);if(timerRef.current)clearTimeout(timerRef.current);timerRef.current=setTimeout(()=>commit({q:clean(next),cursor:undefined}),searchDebounceMs)},[commit,searchDebounceMs]);
 const flushSearch=useCallback(()=>{if(timerRef.current)clearTimeout(timerRef.current);commit({q:clean(search),cursor:undefined})},[commit,search]);
 const setStatus=useCallback(status=>commit({status:clean(status||defaultStatus)||defaultStatus,cursor:undefined}),[commit,defaultStatus]);
 const setSort=useCallback((sort,direction)=>commit({sort:clean(sort||defaultSort),direction:clean(direction||defaultDirection),cursor:undefined}),[commit,defaultSort,defaultDirection]);
 const setCursor=useCallback(cursor=>commit({cursor:clean(cursor)}),[commit]);
 return useMemo(()=>({search,setSearch,flushSearch,status:externalStatus,sort:clean(source.sort||defaultSort),direction:clean(source.direction||defaultDirection)==="desc"?"desc":"asc",cursor:clean(source.cursor),setStatus,setSort,setCursor,raw:source}),[search,setSearch,flushSearch,externalStatus,source,defaultSort,defaultDirection,setStatus,setSort,setCursor]);
}
