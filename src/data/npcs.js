/**
 * ARISE — NPC / Hunter Network
 * Original NPCs with silhouettes, personalities, relationship meters and a
 * rule-based dialogue engine that reads real player data. Non-romantic.
 * Normal NPCs do NOT know the player has the System.
 */

/* Silhouette archetypes rendered as SVG in the view layer */
export const SILHOUETTES = ["boy", "girl", "adult", "mentor", "leader", "trainer", "rival"];

export const NPCS = [
  { id: "kael",   name: "Kael Dren",    silhouette: "rival",  age: 17, color: "#a05df5",
    role: "Rival Hunter · C-Rank", personality: "rival",
    bio: "Fast riser, faster mouth. Treats every board update like a scoreboard. Secretly checks your file more than his own." },
  { id: "mira",   name: "Mira Voss",    silhouette: "girl",   age: 16, color: "#4db8ff",
    role: "Guild Scout", personality: "genz",
    bio: "Scouts new hunters for mid-tier guilds. Talks casual, evaluates everything. Nothing you do this week goes unnoticed." },
  { id: "hale",   name: "Coach Hale",   silhouette: "trainer", age: 44, color: "#2ee88a",
    role: "Sprint Coach", personality: "coach",
    bio: "Two decades of track athletes. Believes speed is a skill, not a gift. Distrusts any program that can't explain itself." },
  { id: "orion",  name: "Guild Master Orion", silhouette: "leader", age: 52, color: "#6f8bd8",
    role: "Guild Master", personality: "pro",
    bio: "Runs his guild like an institution. Values raid completion rate over raw rank. Rarely impressed; permanently fair." },
  { id: "senna",  name: "Senna Okafor", silhouette: "adult",  age: 29, color: "#f5b65d",
    role: "Business Mentor · Founder", personality: "mentor",
    bio: "Shipped three products, killed two of them herself. Thinks most founders confuse motion with progress. Will tell you which one you're doing." },
  { id: "dax",    name: "Dax Iyer",     silhouette: "boy",    age: 15, color: "#6fae6f",
    role: "Training Partner · E-Rank", personality: "genz",
    bio: "Started two weeks after you. Copies your consistency, not your workouts. The closest thing to a mirror the network has." },
  { id: "lia",    name: "Lia Frost",    silhouette: "girl",   age: 19, color: "#f53d3d",
    role: "B-Rank Striker", personality: "elite",
    bio: "Top-50 board regular. Answers questions in as few words as possible. Respects exactly one thing: numbers that improve." },
  { id: "tomas",  name: "Tomas Wirth",  silhouette: "mentor", age: 61, color: "#c8a0e8",
    role: "Retired S-Rank", personality: "sage",
    bio: "Cleared gates before there were guides for them. Speaks slowly because he's already heard every excuse there is." },
];

/* Relationship tiers */
export function relTier(points) {
  if (points >= 50) return { label: "Trusted Ally", color: "#2ee88a" };
  if (points >= 25) return { label: "Respected",    color: "#4db8ff" };
  if (points >= 10) return { label: "Familiar",     color: "#f5b65d" };
  return              { label: "Acquaintance",  color: "#5b7aa0" };
}

/* ---------------------------------------------------------------------------
   DIALOGUE ENGINE — topic → reply(ctx). ctx carries real player data:
   { name, level, rankName, streak, energyScore, gatesCleared, shadows,
     fame, guildName, mainPathName, isDailyDone, rel, businessMilestones }
--------------------------------------------------------------------------- */
function greet(npc, ctx) {
  const r = ctx.rel || 0;
  switch (npc.personality) {
    case "rival":
      return r >= 25 ? "You again. Fine — honestly your consistency is starting to be a problem for my ego."
        : ctx.streak >= 5 ? "A " + ctx.streak + "-day streak? You're still " + ctx.rankName.split("-")[0] + "-Rank, but your consistency is weirdly high. It's annoying."
        : "Oh. The new one. Board says you're " + ctx.rankName + ". I'd say 'keep grinding' but statistically you won't.";
    case "genz":
      return r >= 25 ? "Ayy, there they are. You've been moving different lately, everyone in the network says it."
        : "Yo. " + (ctx.isDailyDone ? "Heard you already cleared today's quest — lowkey impressive." : "You cleared today's quest yet or are we procrastinating together?");
    case "coach":
      return ctx.energyScore < 40 ? "Before you say anything — your condition report is rough today. We talk recovery first, training second."
        : "Good. You showed up. Sit. How did the last session actually feel — not the numbers, the feel?";
    case "pro":
      return "Hunter " + ctx.name + ". Your file is open in front of me. Completion rate, streak integrity, raid record. Let's be efficient.";
    case "mentor":
      return ctx.businessMilestones > 0 ? "Progress log says you shipped something. Good. Shipping is the only metric that isn't a vanity metric. What's next?"
        : "So. You want to build things. Everyone does. Show me what you've finished, not what you've started.";
    case "elite":
      return ctx.fame >= 200 ? "Your name comes up now. Keep it that way." : "You're new. Numbers first, talk later.";
    case "sage":
      return "Sit down, hunter. I watched the board for forty years. It never once lied, and it never once hurried. What's on your mind?";
    default:
      return "Hunter.";
  }
}

export function getTopics(npc, ctx) {
  const topics = [
    { id: "training", label: "Ask about training" },
    { id: "rank",     label: "Compare rank" },
    { id: "advice",   label: "Ask for advice" },
  ];
  if (npc.personality === "mentor") topics.push({ id: "business", label: "Talk business" });
  if (npc.personality === "coach")  topics.push({ id: "speed", label: "Ask about getting faster" });
  if (npc.personality === "rival")  topics.push({ id: "challenge", label: "Talk trash (respectfully)" });
  if (npc.personality === "pro")    topics.push({ id: "guild", label: "Ask about guild standing" });
  if (npc.personality === "sage" || npc.personality === "elite") topics.push({ id: "gates", label: "Ask about higher gates" });
  return topics;
}

export function npcReply(npc, topicId, ctx) {
  const r = ctx.rel || 0;
  if (topicId === "greet") return greet(npc, ctx);

  if (topicId === "training") {
    switch (npc.personality) {
      case "coach": return ctx.energyScore < 40
        ? "Today? Nothing fast. Your readiness score is in the basement. Mobility, easy core, walk, sleep. Speed is built on days like this — by NOT wasting them on junk sprints."
        : "Your path is " + ctx.mainPathName + ", so protect the split: hard days hard, easy days actually easy. If every session feels 'medium', you're training to be mediocre.";
      case "rival": return "My training? Nice try. But fine — I do less than you think, more consistently than you'd believe. That's the whole trick. Don't tell anyone I said something useful.";
      case "genz": return "Bro I just follow the plan and log everything. The logging is lowkey the secret — the days I skip logging are the days I skip everything else too.";
      case "elite": return "Volume is cheap. Intent is expensive. " + (ctx.streak >= 7 ? "Your streak says you have intent. Now add precision." : "Get a real streak first, then we talk precision.");
      case "sage": return "In my era we trained twice as much and improved half as fast. Nobody periodized. Nobody slept. Do not romanticize suffering, hunter — organize it.";
      default: return "Consistency compounds. That's the entire lecture.";
    }
  }
  if (topicId === "rank") {
    const ahead = npc.personality === "rival" ? "I'm still ahead of you on the board — for now, and I intend to keep it that way"
      : "you're " + ctx.rankName + " with " + ctx.fame + " fame";
    return npc.personality === "rival"
      ? ahead + ". But your curve is steeper than mine was. I checked. Twice. It's fine. Everything is fine."
      : "Current read: " + ctx.rankName + ", fame " + ctx.fame + ", streak " + ctx.streak + ". " +
        (ctx.streak >= 7 ? "Higher guilds notice streaks like that before they notice rank." : "Rank moves when the streak survives the boring weeks.");
  }
  if (topicId === "advice") {
    switch (npc.personality) {
      case "sage": return "One thing, then. The hunters who lasted did not have better days than the others. They had better bad days. Build your floor, not your ceiling.";
      case "mentor": return "Decide what you're NOT doing this month. Focus is subtraction. Every dead project you refuse to kill is stealing from the one that could live.";
      case "coach": return "Sleep by " + (ctx.sleepTarget || "22:30") + ". I'm serious. I can coach everything about you except a nervous system you keep sabotaging at midnight.";
      case "pro": return "Raid completion rate is the number guilds actually buy. Enter fewer gates. Finish all of them.";
      case "genz": return "Honestly? Delete the apps that eat your evenings. I did it for a month and accidentally became a different person.";
      case "elite": return "Stop asking for advice you already have. Execute the last advice first.";
      default: return "Show up tomorrow. That's it. That's the advice.";
    }
  }
  if (topicId === "business") {
    return ctx.businessMilestones > 0
      ? "You've hit " + ctx.businessMilestones + " milestone" + (ctx.businessMilestones > 1 ? "s" : "") + ". Now the dangerous part: don't redesign what works. Distribution next — a great product nobody sees is a diary."
      : "Rule one: revenue is the only user feedback that can't lie to you. Rule two: ship the embarrassing version. Rule three: track every dollar in and out — founders who don't log spend are funding their own leak.";
  }
  if (topicId === "speed") {
    return "Getting faster is three things stacked: sprint often but short, land stiff (ankles, core), and recover like it's your job. Most athletes fail the third one and blame the first two. Your energy log is your speed log — treat it that way.";
  }
  if (topicId === "challenge") {
    return r >= 25
      ? "Okay, truce. Real talk: race me on the next Weekly Speed Evaluation. Log your time, I'll log mine. Loser buys respect."
      : "Trash talk requires a resume. Come back with a bigger streak. ...That was trash talk. See how it works?";
  }
  if (topicId === "guild") {
    return ctx.guildName
      ? "Your standing in " + ctx.guildName + " is tracked weekly: contribution, streak, raid record. The member above you is beatable — they always are. Consistency outscores talent in every guild ledger I've ever kept."
      : "You're unaffiliated. Fix that. A guild is a measuring instrument you can't buy alone — join one at your level, out-contribute it, then let a bigger one poach you.";
  }
  if (topicId === "gates") {
    return "Higher gates aren't harder versions of low gates. They're longer. The difficulty is sustaining quality when nobody would blame you for coasting. Train boredom tolerance. That is the S-Rank stat nobody puts on the board.";
  }
  return "...";
}

export function getGreeting(npc, ctx) { return greet(npc, ctx); }
