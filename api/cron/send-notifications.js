import { requireCronAccess, sendJson, sendScheduledReminders } from "../../server/privatePush.js";

export default async function handler(request,response) {
  if (request.method!=="GET") { response.setHeader("Allow","GET"); return sendJson(response,405,{ok:false,error:"method_not_allowed"}); }
  if (!requireCronAccess(request,response)) return;
  try { return sendJson(response,200,await sendScheduledReminders()); }
  catch (error) { return sendJson(response,503,{ok:false,error:error&&error.message?error.message:"scheduler_failed"}); }
}
