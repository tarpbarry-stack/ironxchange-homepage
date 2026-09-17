export const ACTIVITY_TYPES=[['follow-up','Follow-up'],['call','Call'],['appointment','Appointment'],['inspection','Inspection'],['demonstration','Demonstration'],['pickup','Pickup'],['delivery','Delivery']];
export function localZone(){return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';}
const dateFormatters=new Map();
export function dateInZone(value=new Date(),zone=localZone()) {let formatter=dateFormatters.get(zone);if(!formatter){formatter=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'});if(dateFormatters.size>50)dateFormatters.clear();dateFormatters.set(zone,formatter);}const p=Object.fromEntries(formatter.formatToParts(value).map(p=>[p.type,p.value]));return `${p.year}-${p.month}-${p.day}`;}
export function plusDays(value,n){const d=new Date(`${value}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
export function calendarRange(anchor,view){
  const d=new Date(`${anchor}T12:00:00Z`);
  if(view==='month'){const start=`${anchor.slice(0,7)}-01`,first=new Date(`${start}T12:00:00Z`);const from=plusDays(start,-((first.getUTCDay()+6)%7));return {from,to:plusDays(from,41)};}
  const from=view==='week' ? plusDays(anchor,-((d.getUTCDay()+6)%7)) : anchor;
  return {from,to:plusDays(from,view==='day' ? 0 : view==='agenda' ? 29 : 6)};
}
export function calendarDays(from,to){const days=[];for(let day=from;day<=to;day=plusDays(day,1))days.push(day);return days;}
export function moveAnchor(anchor,view,direction){if(view!=='month')return plusDays(anchor,direction*(view==='week' ? 7 : view==='agenda' ? 30 : 1));const d=new Date(`${anchor.slice(0,7)}-01T12:00:00Z`);d.setUTCMonth(d.getUTCMonth()+direction);return d.toISOString().slice(0,10);}
export function dateLabel(value,options={}){return new Intl.DateTimeFormat('en-US',{timeZone:'UTC',month:'short',day:'numeric',...options}).format(new Date(`${value}T12:00:00Z`));}
export function nextSchedule(value={}) {return {dueDate:dateInZone(),timeZone:localZone(),allDay:true,startTime:'09:00',durationMinutes:30,reminderMinutes:15,activityType:'follow-up',...value};}
export function scheduleDefaults(record){return {...nextSchedule(),...record};}
export function eventOnDate(event,date,zone){if(event.allDay)return event.date===date;const start=dateInZone(new Date(event.startAt),zone),end=dateInZone(new Date(Date.parse(event.endAt)-1),zone);return date>=start && date<=end;}
export function moveRecord(event,date,zone=event.timeZone){return {...event.record,dueDate:date,...(!event.allDay ? {timeZone:zone,startTime:event.time} : {}),actionCompleted:false,completed:false,canceled:false};}

export function eventsByDay(items,days,zone){const grouped=new Map(days.map(d=>[d,[]]));for(const event of items){const start=event.allDay ? event.date : dateInZone(new Date(event.startAt),zone),end=event.allDay ? start : dateInZone(new Date(Date.parse(event.endAt)-1),zone);for(const day of days)if(day>=start && day<=end)grouped.get(day).push(event);}return grouped;}
