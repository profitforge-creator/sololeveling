import { requirePrivateAccess, sendJson, sendTest } from "../../server/privatePush.js";

export default async function handler(request,response) {
  if (request.method!=="POST") { response.setHeader("Allow","POST"); return sendJson(response,405,{ok:false,error:"method_not_allowed"}); }
  if (!requirePrivateAccess(request,response)) return;
  try { await sendTest(); return sendJson(response,200,{ok:true,message:"System connection confirmed."}); }
  catch (error) { return sendJson(response,503,{ok:false,error:error&&error.message?error.message:"test_notification_failed"}); }
}
