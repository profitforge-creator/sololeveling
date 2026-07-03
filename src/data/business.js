/**
 * ARISE — Business / Finance System
 * Business progress translated into game systems:
 *   features = Dungeons · launches = Boss Raids · revenue = Gold (display) ·
 *   savings = Treasury · outreach = Hunter Contracts · milestones = Gate Clears
 * All money values are user-entered real numbers; nothing is fabricated.
 */

export const BUSINESS_QUEST_CHAINS = [
  {
    id: "bq_dev", name: "App Development Dungeon", icon: "⬡", color: "#4db8ff",
    desc: "Build features like clearing dungeon rooms. Each step is a real work block.",
    steps: [
      { id: "dev1", name: "Define one feature in one sentence", xp: 30 },
      { id: "dev2", name: "25-min deep work: build the core of it", xp: 60 },
      { id: "dev3", name: "Second 25-min block: finish or cut scope", xp: 60 },
      { id: "dev4", name: "Test it yourself end-to-end", xp: 40 },
      { id: "dev5", name: "Ship / commit / mark the milestone done", xp: 80 },
    ],
    repeatable: true,
  },
  {
    id: "bq_launch", name: "Launch Boss Raid", icon: "◉", color: "#f53d3d",
    desc: "A launch is a boss. It regenerates HP if you stall.",
    steps: [
      { id: "l1", name: "Write the launch checklist (everything blocking release)", xp: 40 },
      { id: "l2", name: "Clear all blockers (deep work sessions)", xp: 100 },
      { id: "l3", name: "Prepare the announcement (post/page/demo)", xp: 50 },
      { id: "l4", name: "LAUNCH. Make it public.", xp: 200 },
      { id: "l5", name: "Respond to first feedback within 24h", xp: 60 },
    ],
    repeatable: true,
  },
  {
    id: "bq_marketing", name: "Marketing Quest Chain", icon: "✸", color: "#f5b65d",
    desc: "Guild Reputation grows when people see the work.",
    steps: [
      { id: "m1", name: "Identify where your users actually are (1 channel)", xp: 30 },
      { id: "m2", name: "Create one piece of content about the product", xp: 50 },
      { id: "m3", name: "Publish it", xp: 60 },
      { id: "m4", name: "Log what happened (views/replies/signups)", xp: 30 },
    ],
    repeatable: true,
  },
  {
    id: "bq_outreach", name: "Hunter Contracts (Outreach)", icon: "➤", color: "#a05df5",
    desc: "Every message sent to a real person is a contract attempt.",
    steps: [
      { id: "o1", name: "List 5 people/communities who'd care", xp: 30 },
      { id: "o2", name: "Send 3 genuine messages (no spam)", xp: 60 },
      { id: "o3", name: "Follow up on earlier threads", xp: 40 },
    ],
    repeatable: true,
  },
  {
    id: "bq_skill", name: "Developer Skill Gate", icon: "✦", color: "#2ee88a",
    desc: "Skill-building study blocks. The tree below unlocks from these.",
    steps: [
      { id: "s1", name: "30-min focused learning (docs, course, code-reading)", xp: 50 },
      { id: "s2", name: "Apply it: build a tiny example yourself", xp: 60 },
      { id: "s3", name: "Write 3 sentences on what you learned", xp: 30 },
    ],
    repeatable: true,
  },
];

export const BUSINESS_SKILLS = [
  { id: "sk_ship",    name: "Shipper",        req: 1,  desc: "Complete 1 quest chain",  bonus: "+1 Intelligence" },
  { id: "sk_builder", name: "Builder",        req: 3,  desc: "Complete 3 quest chains", bonus: "+2 Intelligence" },
  { id: "sk_founder", name: "Founder",        req: 6,  desc: "Complete 6 quest chains", bonus: "+2 Intelligence · +1 Aura" },
  { id: "sk_operator",name: "Operator",       req: 10, desc: "Complete 10 quest chains", bonus: "+3 Intelligence · +2 Aura" },
  { id: "sk_mogul",   name: "Guild Financier",req: 20, desc: "Complete 20 quest chains", bonus: "+4 Intelligence · +3 Aura" },
];

export function treasuryOf(business) {
  const sum = function (log) { return (log || []).reduce(function (s, e) { return s + (Number(e.amount) || 0); }, 0); };
  const income = sum(business.incomeLog);
  const spend  = sum(business.spendLog);
  return { income, spend, net: income - spend };
}

export function leakAlert(business) {
  const t = treasuryOf(business);
  if (t.income === 0 && t.spend === 0) return null;
  if (t.spend > t.income && t.spend > 0) {
    return "LEAK ALERT: spending (" + t.spend.toFixed(2) + ") exceeds income (" + t.income.toFixed(2) + "). The System recommends a spending review quest.";
  }
  return null;
}

export function completedChainCount(business) {
  const done = business && business.questDone ? business.questDone : {};
  return Object.keys(done).reduce(function (s, k) { return s + (Number(done[k]) || 0); }, 0);
}
