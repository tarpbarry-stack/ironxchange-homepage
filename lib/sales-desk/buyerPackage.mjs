const text=v=>String(v ?? '').trim();
export function buyerMachine(item,{includePrice=true,includeSerial=true}={}) {
  const data=item.publicData || {},passportId=text(item.canonicalIdentity?.passportId || item.passportId || data.passportId || item.ixiMedia?.passportId),listingId=text(item.id?.uuid || item.id);
  const location=item.location || data.location;
  return {key:passportId ? `passport:${passportId}` : `listing:${listingId}`,passportId,title:text(item.title),year:text(item.year || data.year),make:text(item.make || data.make),model:text(item.model || data.model),hours:text(item.hours ?? data.hours),price:includePrice ? text(item.price) : '',serialNumber:includeSerial ? text(item.serialNumber || data.serialNumber) : '',location:text(typeof location==='string' ? location : location?.address),image:text(item.image || item.imageUrl || item.imageUrls?.[0] || item.images?.[0])};
}
export async function createBuyerPdf(record,{fontBytes,loadPhoto}={}) {
  const [{PDFDocument,rgb},{default:fontkit}]=await Promise.all([import('pdf-lib'),import('@pdf-lib/fontkit')]);
  const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);
  if(!fontBytes){const response=await fetch('/fonts/IXI-Document-Sans.ttf');if(!response.ok)throw new Error('PDF font could not be loaded. Retry the download.');fontBytes=await response.arrayBuffer();}
  const font=await pdf.embedFont(fontBytes,{subset:false}),supported=new Set(font.getCharacterSet());
  const printable=value=>Array.from(text(value)).map(c=>{if(c==='\n' || c==='\r' || supported.has(c.codePointAt(0)))return c;throw new Error('The PDF font cannot render a character in this package. Correct it before downloading.');}).join('');
  const dark=rgb(.08,.12,.09),muted=rgb(.35,.4,.35);let page,y;
  const pageStart=()=>{page=pdf.addPage([612,792]);y=704;page.drawRectangle({x:40,y:744,width:532,height:4,color:rgb(.91,.74,.13)});page.drawText('IXI  /  MACHINE PRESENTATION',{x:40,y:760,size:10,font,color:dark});};
  const write=(value,size=11,color=dark)=>{for(const paragraph of printable(value).split(/\r?\n/)){let line='';const lines=[];for(const char of paragraph){if(font.widthOfTextAtSize(line+char,size)>532){lines.push(line);line='';}line+=char;}lines.push(line);for(const next of lines){if(y<65)pageStart();page.drawText(next,{x:40,y,size,font,color});y-=size*1.55;}}y-=5;};
  pdf.setTitle(record.title);pdf.setAuthor(record.company);pageStart();write(record.company,20);write(record.title,24);write(`Prepared for ${record.customerName}`,14);write(`Prepared ${record.createdAt?.slice(0,10) || ''} · Version ${record.revision}`,10,muted);y-=15;if(record.message)write(record.message,12);write(`${record.machines.length} machine${record.machines.length===1 ? '' : 's'}`,12);write('Prices shown are asking prices. Availability, specifications and final terms are subject to confirmation.',10,muted);
  const missingPhotos=[];
  for(const machine of record.machines){pageStart();write(machine.title,22);let embedded=null;
    if(machine.image)try{let source=new URL(machine.image);if(source.protocol!=='https:')throw new Error('Invalid photo');if(source.hostname.endsWith('.imgix.net') && !source.searchParams.has('s')){source.searchParams.set('fm','jpg');source.searchParams.set('auto','compress');source.searchParams.set('w','1400');}const photo=loadPhoto ? await loadPhoto(source.href) : await fetch(source.href,{credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(15000)});if(!photo.ok)throw new Error('Photo unavailable');const bytes=await photo.arrayBuffer();if(bytes.byteLength>12*1024*1024)throw new Error('Photo too large');const type=photo.headers.get('content-type') || '';embedded=/png/i.test(type) ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);}catch{missingPhotos.push(machine.title);}
    if(embedded){const scale=Math.min(532/embedded.width,300/embedded.height);const width=embedded.width*scale,height=embedded.height*scale;page.drawImage(embedded,{x:40+(532-width)/2,y:y-height,width,height});y-=height+24;}else{write(machine.image ? 'Photo unavailable in this export' : 'Photo not recorded',11,muted);}
    for(const [label,value] of [['YEAR / MAKE / MODEL',[machine.year,machine.make,machine.model].filter(Boolean).join(' ')],['HOURS',machine.hours],['ASKING PRICE',machine.price],['LOCATION',machine.location],['SERIAL NUMBER',machine.serialNumber],['MACHINE ID',machine.passportId]])if(value){write(label,8,muted);write(value,13);}
  }
  const pages=pdf.getPages();pages.forEach((p,i)=>p.drawText(`${i+1} / ${pages.length}   ·   IXI SALES DESK`,{x:40,y:28,size:8,font,color:muted}));
  return {blob:new Blob([await pdf.save()],{type:'application/pdf'}),missingPhotos};
}
export function downloadBuyerPdf(blob,title){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${title.replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,100) || 'IXI-Buyer-Package'}.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
