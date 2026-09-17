const id=value=>String(value?.uuid || value || "");
const field=(value,max)=>String(value || "").trim().slice(0,max);
export function normalizeInquiryPage(response,ownerUserId) {
  const body=response?.data || {},included=body.included || [];
  const lookup=(type,key)=>included.find(row=>row.type===type && id(row.id)===key);
  const rows=[],issues=[];
  for(const tx of body.data || []) {
    const sourceId=id(tx.id),provider=id(tx.relationships?.provider?.data?.id),customerSourceId=id(tx.relationships?.customer?.data?.id),listingId=id(tx.relationships?.listing?.data?.id);
    if(provider!==ownerUserId)throw Object.assign(new Error("The inquiry source returned another seller's records."),{status:403,code:"SALES_INQUIRY_OWNER"});
    if(tx.attributes?.processName!=="default-inquiry")continue;
    const listing=lookup("listing",listingId),customer=lookup("user",customerSourceId),p=tx.attributes?.protectedData || {};
    const author=id(listing?.relationships?.author?.data?.id);
    if(!listing || !customer || !customerSourceId || author!==ownerUserId){issues.push({sourceId,message:"The original customer or seller listing could not be verified."});continue;}
    const pub=listing.attributes?.publicData || {},passportId=field(pub.passportId || pub.ixiPassportId,60),received=new Date(tx.attributes.createdAt);
    if(!Number.isFinite(received.getTime())){issues.push({sourceId,message:"The original inquiry date is unavailable."});continue;}
    if(String(p.message || "").length>10000){issues.push({sourceId,message:"The original message exceeds 10,000 characters and needs review. It has not been truncated or imported."});continue;}
    rows.push({sourceId,providerUserId:provider,customerSourceId,receivedAt:received.toISOString(),message:field(p.message,10000),buyer:{name:field(p.buyerName || customer.attributes?.profile?.displayName || "Marketplace buyer",150),email:field(p.buyerEmail,254),phone:field(p.buyerPhone,60),company:field(p.buyerCompany,150)},machine:{key:passportId ? `passport:${passportId}` : `listing:${listingId}`,passportId,listingId,title:field(listing.attributes?.title || "Machine inquiry",200)}});
  }
  const page=Number(body.meta?.page || 1),totalPages=Number(body.meta?.totalPages || body.meta?.total_pages || 1);
  return {rows,issues,page,totalPages,total:Number(body.meta?.totalItems || body.meta?.total_items || 0)};
}
