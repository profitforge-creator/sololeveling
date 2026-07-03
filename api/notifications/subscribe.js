import { requirePrivateAccess, sendJson, storeSubscription } from "../../server/privatePush.js";

export default async function handler(request,response) {
  if (request.method!=="POST") { response.setHeader("Allow","POST"); return sendJson(response,405,{ok:false,error:"method_not_allowed"}); }
  if (!requirePrivateAccess(request,response)) return;
  try {
    const profile=await storeSubscription(request.body || {});
    return sendJson(response,200,{ok:true,privateMode:true,stored:true,timezone:profile.timezone,updatedAt:profile.updatedAt});
  } catch (error) {
    return sendJson(response,error&&error.message==="invalid_push_subscription"?400:503,{ok:false,error:error&&error.message?error.message:"subscription_store_failed"});
  }
}
