import {fetchSharetribeListingsByAuthor} from '../listings/fetchSharetribeListingsByAuthor';
import {normalizeSharetribeListings} from '../listings/normalizeSharetribeListings';
import {filterAosOwnedMachines} from '../listings/IXIAosOwnedInventoryPolicy.mjs';
import {applyInventoryProjection} from '../listings/IXISoldInventory.mjs';
import {loadInventoryAvailability} from '../server/aos/ixiInventoryAvailability';
import {requestIxCoreFinancial} from '../server/aos/ixiMosInternalClient';
import {projectDealFinancials} from './dealFinancials.mjs';
export async function salesInventory(actor) {
  const [raw,availability]=await Promise.all([fetchSharetribeListingsByAuthor(actor.ownerUserId),loadInventoryAvailability(actor.ownerUserId)]);
  const items=filterAosOwnedMachines(applyInventoryProjection(normalizeSharetribeListings(raw),availability));
  if(actor.canEditMachines)return items;
  return items.map(item=>({...Object.fromEntries(['id','title','year','make','model','hours','price','location','image','imageUrl','images','imageUrls'].map(key=>[key,item[key]])),passportId:item.passportId || item.publicData?.passportId || item.ixiMedia?.passportId || '',serialNumber:item.serialNumber || item.publicData?.serialNumber || '',salesReadOnly:true}));
}
export async function salesFinancials({actor,deal}) {
  if(!actor.canFinancial)throw Object.assign(new Error('Financial records require the existing company-owner authority.'),{status:403});
  const request=options=>requestIxCoreFinancial({...options,principalId:actor.actorId,entityId:actor.entityId});
  const access=await request({path:'/financial/access-context',method:'GET'});
  const passport=access.data?.defaults?.entityPassportId;
  if(!passport)throw Object.assign(new Error('Financial company identity is unavailable.'),{status:403});
  const [documents,inventory]=await Promise.all([request({path:`/financial/passports/${encodeURIComponent(passport)}/documents`,method:'GET'}),request({path:'/financial/inventory?all=1',method:'GET'})]);
  if(!documents.ok || !inventory.ok)throw new Error('The financial source could not be refreshed.');
  return projectDealFinancials(deal,documents.data?.documents || [],inventory.data || {});
}
