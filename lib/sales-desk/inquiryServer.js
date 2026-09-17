import {createInstance,types} from 'sharetribe-flex-integration-sdk';
import {normalizeInquiryPage} from './inquirySource.mjs';
export async function salesInquiries(actor,input={},sdk=null) {
  if(!actor.canManageTeam || !actor.canWrite)throw Object.assign(new Error('Only the company owner can sync marketplace inquiries.'),{status:403});
  const page=Number(input.page || 1),until=input.until || new Date().toISOString();
  if(!Number.isInteger(page) || page<1 || page>10000 || !Number.isFinite(Date.parse(until)))throw Object.assign(new Error('Choose a valid inquiry page and snapshot.'),{status:400});
  const client=sdk || createInstance({clientId:process.env.SHARETRIBE_CLIENT_ID,clientSecret:process.env.SHARETRIBE_CLIENT_SECRET});
  const response=await client.transactions.query({providerId:new types.UUID(actor.ownerUserId),processNames:['default-inquiry'],include:['listing','listing.author','customer','provider'],perPage:25,page,createdAtEnd:new Date(until)});
  return {...normalizeInquiryPage(response,actor.ownerUserId),until};
}
