import React, { useEffect, useRef, useState } from "react";

const STORY_KEY = "arise_story_campaign_v2";

const SPEAKERS = {
  system: { name: "THE SYSTEM", color: "#57d9ff" },
  narrator: { name: "OBSERVATION LOG", color: "#8ca6c7" },
  chairman: { name: "CHAIRMAN VEIL", color: "#f3c46b" },
  coach: { name: "COACH HALE", color: "#71efb0" },
  rival: { name: "HUNTER KAEL", color: "#b37aff" },
  architect: { name: "UNREGISTERED AUTHORITY", color: "#ff476b" },
  shadow: { name: "YOUR SHADOW", color: "#9d5cff" },
  commander: { name: "SHADOW COMMANDER", color: "#7e72ff" },
};

const PATHS = [
  { id: "speed", label: "SPEED / ATHLETICISM", note: "Acceleration, explosiveness, mechanics, recovery.", recommended: true },
  { id: "strength", label: "STRENGTH / POWER", note: "Force production, resilience, physical dominance." },
  { id: "scholar", label: "SCHOLAR / DISCIPLINE", note: "Focus, learning, planning, ruthless consistency." },
  { id: "builder", label: "BUILDER / BUSINESS", note: "Projects, revenue, creation, long campaigns." },
  { id: "balanced", label: "BALANCED / ADAPTIVE", note: "No fixed specialty. The System adapts to behavior." },
  { id: "irregular", label: "IRREGULAR / SHADOW", note: "Classification unavailable.", locked: true },
];

const CHAPTERS = [
  {
    id: "prologue", number: "PROLOGUE", title: "THE WEAKEST",
    tagline: "A low rank is a measurement, not a sentence.", scene: "meadow", xp: 40, coins: 20,
    requirement: () => true, unlockHint: "Available now",
    scenes: [
      { speaker: "narrator", scene: "meadow", text: "The world looks ordinary because nobody else can see the interface waiting over it." },
      { speaker: "narrator", scene: "meadow", text: "You are not powerful. Your habits break under pressure. Your speed is unrealized. Your discipline is inconsistent." },
      { speaker: "coach", scene: "meadow", text: "That is the honest report. Do not confuse honesty with a verdict." },
      { speaker: "system", scene: "meadow", kind: "system", alert: "SUBJECT DETECTED", text: "Latent growth curve detected. Present capability: low. Adaptation potential: abnormal." },
      { speaker: "system", scene: "meadow", kind: "system", text: "Observation will continue. No reward will be issued for intention." },
      { speaker: "shadow", scene: "shadow", text: "Good. Starting at the bottom means every step can be proven." },
    ],
  },
  {
    id: "low_rank", number: "CHAPTER 01", title: "LOW-RANK HUNTER LIFE",
    tagline: "Small gates. Small rewards. No shortcuts.", scene: "meadow", xp: 55, coins: 25,
    requirement: () => true, unlockHint: "Complete the Prologue",
    scenes: [
      { speaker: "chairman", scene: "meadow", text: "Your evaluation file has no remarkable numbers. The Association sees another beginner." },
      { speaker: "rival", scene: "meadow", text: "E-Rank? Stay out of anything serious. People like us survive by knowing the ceiling." },
      { speaker: "coach", scene: "meadow", text: "He is wrong about one thing. A ceiling only matters when the work stops." },
      { speaker: "system", scene: "meadow", kind: "system", alert: "QUEST ROUTE AVAILABLE", text: "Low-rank assignments detected: hydration, mobility, room reset, focused work, sleep preparation." },
      { speaker: "system", scene: "meadow", kind: "system", text: "The tasks are small because your consistency has not earned heavier ones." },
      { speaker: "narrator", scene: "meadow", text: "Nothing dramatic happens. You begin anyway. That is the first difference." },
    ],
  },
  {
    id: "incident", number: "CHAPTER 02", title: "THE ABNORMAL GATE",
    tagline: "The safe route was never the real evaluation.", scene: "gate", xp: 80, coins: 35,
    requirement: () => true, unlockHint: "Complete Chapter 01",
    scenes: [
      { speaker: "system", scene: "gate", kind: "system", alert: "GATE SIGNAL LOST", text: "Routine evaluation interrupted. Unregistered space detected inside a familiar objective." },
      { speaker: "rival", scene: "gate", text: "That gate was blue a second ago. The exit marker is gone." },
      { speaker: "chairman", scene: "gate", text: "All candidates withdraw. That is an order." },
      { speaker: "narrator", scene: "gate", text: "The corridor changes behind you. Every unfinished promise is written across the walls like a record." },
      { speaker: "system", scene: "gate", kind: "system", text: "Emergency choice required.", choice: [
        { id: "leave", label: "FOLLOW THE RETREAT", response: "The passage closes. Something on the other side records your hesitation." },
        { id: "observe", label: "SEARCH FOR A PATTERN", response: "You notice the warnings are timed. The gate is testing attention, not courage." },
        { id: "stay", label: "STAY UNTIL OTHERS EXIT", response: "The final exit holds long enough. You remain alone when it seals." },
      ] },
      { speaker: "narrator", scene: "gate", text: "Silence. Then a blue line cuts through the dark." },
      { speaker: "system", scene: "gate", kind: "system", alert: "HIDDEN CONDITION SATISFIED", text: "Survival response, pattern recognition, and voluntary responsibility recorded." },
    ],
  },
  {
    id: "player", number: "CHAPTER 03", title: "PLAYER SELECTION",
    tagline: "Qualification is not consent.", scene: "system", xp: 100, coins: 50,
    requirement: () => true, unlockHint: "Survive the Abnormal Gate",
    scenes: [
      { speaker: "system", scene: "system", kind: "system", alert: "NOTIFICATION", text: "You have acquired the qualification to become a Player." },
      { speaker: "system", scene: "system", kind: "system", text: "As a Player, your real effort will convert into levels, stats, gold, access, and authority." },
      { speaker: "system", scene: "system", kind: "system", text: "Failure will carry safe consequences. Recovery will never be treated as weakness." },
      { speaker: "system", scene: "system", kind: "system", text: "Will you accept designation as the Player?", choice: [
        { id: "accept", label: "YES — ACCEPT", response: "PLAYER AUTHORITY GRANTED.", flag: "playerAccepted" },
        { id: "decline", label: "NO — DECLINE", response: "Selection refused. The System will not assume consent. Confirmation remains available.", block: true },
      ] },
      { speaker: "system", scene: "system", kind: "system", alert: "PLAYER REGISTERED", text: "From this moment, ordinary work will be processed as progression." },
      { speaker: "architect", scene: "gate", text: "A new Player. Let us see how long this one remains interesting." },
    ],
  },
  {
    id: "path", number: "CHAPTER 04", title: "PATH SELECTION",
    tagline: "Recommendation is not command.", scene: "system", xp: 100, coins: 50,
    requirement: () => true, unlockHint: "Accept Player status",
    scenes: [
      { speaker: "system", scene: "system", kind: "system", text: "Behavioral intent scan complete. Highest projected return: Speed / Athleticism." },
      { speaker: "system", scene: "system", kind: "system", text: "Recommendation basis: sprinting, explosiveness, core strength, discipline, and the stated objective of becoming extremely fast." },
      { speaker: "system", scene: "system", kind: "path", text: "Select the path you will prove through action." },
      { speaker: "system", scene: "item", kind: "system", alert: "PATH KEY ACQUIRED", text: "Path registered. Daily Quests may now adapt to your chosen direction." },
      { speaker: "shadow", scene: "shadow", text: "A path is not a personality. It is the direction you keep choosing when nobody is watching." },
    ],
  },
  {
    id: "training", number: "CHAPTER 05", title: "MANDATORY TRAINING",
    tagline: "The System tests repetition before power.", scene: "system", xp: 120, coins: 60,
    requirement: (c) => c.dailyDone || c.streak >= 1, unlockHint: "Clear one Daily Quest",
    scenes: [
      { speaker: "system", scene: "system", kind: "system", alert: "DAILY QUEST HAS ARRIVED", text: "Mandatory training protocol initialized." },
      { speaker: "system", scene: "system", kind: "system", text: "Body. Focus. Environment. Project. Recovery. Reflection. Each category protects a different stat." },
      { speaker: "coach", scene: "meadow", text: "Speed is not built by sprinting hard every day. High output needs fresh tissue, clean mechanics, and actual sleep." },
      { speaker: "system", scene: "system", kind: "system", text: "Daily clear reward: XP, gold, and three allocatable stat points. Unsafe substitutions will not be accepted." },
      { speaker: "system", scene: "item", kind: "item", alert: "ITEM ACQUIRED", text: "Recovery Crystal acquired. Effect: converts one high-fatigue training quest into a recovery protocol." },
    ],
  },
  {
    id: "penalty", number: "CHAPTER 06", title: "THE PENALTY ZONE",
    tagline: "Consequence without cruelty.", scene: "penalty", xp: 130, coins: 65,
    requirement: (c) => c.streak >= 2, unlockHint: "Reach a 2-day streak",
    scenes: [
      { speaker: "system", scene: "penalty", kind: "system", alert: "WARNING", text: "A required objective expired. Penalty protocol has been authorized." },
      { speaker: "system", scene: "penalty", kind: "system", text: "Possible consequences: small XP loss, combo reset, free-time seal, or recovery quest." },
      { speaker: "system", scene: "penalty", kind: "system", text: "Food restriction, sleep loss, unsafe exercise, and shame are forbidden penalty types." },
      { speaker: "shadow", scene: "shadow", text: "The point is not to suffer. The point is to return before one missed day becomes a direction." },
      { speaker: "system", scene: "system", kind: "system", alert: "RECOVERY QUEST ISSUED", text: "Complete a ten-minute reset. Reopen the route. Continue." },
    ],
  },
  {
    id: "first_gate", number: "CHAPTER 07", title: "FIRST REAL GATE",
    tagline: "The fiction is the wrapper. The effort is the entry fee.", scene: "gate", xp: 160, coins: 80,
    requirement: (c) => c.gates >= 1, unlockHint: "Clear your first Dungeon Gate",
    scenes: [
      { speaker: "system", scene: "gate", kind: "system", alert: "GATE CLEARED", text: "Room objectives authenticated. Abandonment: zero. Clear registered." },
      { speaker: "rival", scene: "gate", text: "You finished every room? Most beginners farm the easy objectives and call it progress." },
      { speaker: "coach", scene: "meadow", text: "The gate taught sequence: prepare, execute, recover, record. Keep that order." },
      { speaker: "system", scene: "item", kind: "item", alert: "WEAPON ACQUIRED", text: "Velocity Fang materialized. Passive effect: visual marker for completed acceleration work." },
      { speaker: "architect", scene: "gate", text: "The curve did not flatten. Increase resistance." },
    ],
  },
  {
    id: "shadow_self", number: "CHAPTER 08", title: "THE THING IN YOUR SHADOW",
    tagline: "Pressure reveals the voice you trained.", scene: "shadow", xp: 180, coins: 90,
    requirement: (c) => c.gates >= 2 || c.bosses >= 1, unlockHint: "Clear 2 Gates or defeat a Boss",
    scenes: [
      { speaker: "narrator", scene: "shadow", text: "The next gate goes badly. Fatigue makes every unfinished room feel final." },
      { speaker: "system", scene: "penalty", kind: "system", alert: "CLEAR PROBABILITY: 18%", text: "Player output has fallen below the projected threshold." },
      { speaker: "shadow", scene: "shadow", text: "Look at me." },
      { speaker: "shadow", scene: "shadow", text: "You have not lost. You are still inside the gate." },
      { speaker: "shadow", scene: "shadow", text: "Stand up. Reduce the problem. Clear the next room." },
      { speaker: "system", scene: "system", kind: "system", alert: "PASSIVE SKILL DETECTED", text: "Second Wind: when a task feels impossible, the Player may reduce it to the smallest valid action without abandoning it." },
    ],
  },
  {
    id: "job_change", number: "CHAPTER 09", title: "JOB CHANGE QUEST",
    tagline: "Your behavior has become evidence.", scene: "job", xp: 240, coins: 120,
    requirement: (c) => c.level >= 12, unlockHint: "Reach Level 12",
    scenes: [
      { speaker: "system", scene: "job", kind: "system", alert: "JOB CHANGE QUEST", text: "A major evolution route is available." },
      { speaker: "system", scene: "job", kind: "system", text: "Candidate classes were generated from completed work, dominant stats, recovery discipline, and chosen path." },
      { speaker: "system", scene: "job", kind: "system", text: "No class will be assigned automatically. Power without consent is not progression." },
      { speaker: "shadow", scene: "shadow", text: "Do not choose the name that sounds strongest. Choose the work you are willing to repeat." },
      { speaker: "system", scene: "item", kind: "item", alert: "CLASS SEAL ACQUIRED", text: "Evolution deferred until the Player confirms a class inside Specialization." },
    ],
  },
  {
    id: "architect_one", number: "CHAPTER 10", title: "THE ARCHITECT",
    tagline: "You were never using the System alone.", scene: "architect", xp: 300, coins: 150,
    requirement: (c) => c.rankIndex >= 2 && c.bosses >= 2, unlockHint: "Reach C-Rank and defeat 2 Bosses",
    scenes: [
      { speaker: "system", scene: "architect", kind: "system", alert: "SESSION AUTHORITY LOST", text: "Unregistered controller has assumed command." },
      { speaker: "architect", scene: "architect", text: "Do not be afraid. Fear would contaminate the data." },
      { speaker: "architect", scene: "architect", text: "I designed the tests that shaped the version of you now standing here." },
      { speaker: "architect", scene: "architect", text: "You believed the Daily Quests were the curriculum. They were the entrance examination." },
      { speaker: "architect", scene: "architect", text: "Continue exactly as you have. If the curve falls, I will intervene." },
      { speaker: "system", scene: "system", kind: "system", alert: "AUTHORITY RESTORED", text: "File classification changed: SUBJECT OF INTEREST." },
    ],
  },
  {
    id: "army", number: "CHAPTER 11", title: "THE SHADOW ARMY",
    tagline: "What you defeat becomes infrastructure.", scene: "army", xp: 340, coins: 170,
    requirement: (c) => c.shadows >= 1, unlockHint: "Extract your first Shadow",
    scenes: [
      { speaker: "system", scene: "army", kind: "system", alert: "EXTRACTION SUCCESSFUL", text: "A defeated obstacle has been converted into a permanent asset." },
      { speaker: "commander", scene: "army", text: "We are not trophies. Assign us. Train us. Use what you earned." },
      { speaker: "system", scene: "army", kind: "system", text: "Shadow candidates will only appear after authentic dungeon or boss clears." },
      { speaker: "shadow", scene: "shadow", text: "Every difficulty you survive leaves something useful behind." },
      { speaker: "system", scene: "army", kind: "system", alert: "ARMY COMMAND UNLOCKED", text: "Squads, missions, loyalty, upgrades, and deployed buffs are now available." },
    ],
  },
  {
    id: "higher_world", number: "CHAPTER 12", title: "THE HIGHER WORLD",
    tagline: "Growth becomes visible to everyone except those who need the secret.", scene: "meadow", xp: 380, coins: 190,
    requirement: (c) => c.guildJoined || c.rankIndex >= 3, unlockHint: "Join a Guild or reach B-Rank",
    scenes: [
      { speaker: "chairman", scene: "meadow", text: "Three guilds requested your file this week. They see the results. They do not see what produces them." },
      { speaker: "rival", scene: "meadow", text: "Your rank used to make sense. Now every time I catch up, the gap moves." },
      { speaker: "system", scene: "system", kind: "system", text: "Normal NPCs cannot perceive the System. Special entities may detect its effects." },
      { speaker: "coach", scene: "meadow", text: "Attention is another gate. Do not let recognition replace the work that earned it." },
      { speaker: "architect", scene: "architect", text: "The vessel is becoming socially visible. Proceed to the second phase." },
    ],
  },
  {
    id: "truth", number: "CHAPTER 13", title: "THE SECOND FACE",
    tagline: "The System was built for a purpose it never disclosed.", scene: "architect-two", xp: 500, coins: 250,
    requirement: (c) => c.rankIndex >= 4 && c.bosses >= 4, unlockHint: "Reach A-Rank and defeat 4 Bosses",
    scenes: [
      { speaker: "system", scene: "architect-two", kind: "system", alert: "CORE MEMORY UNSEALED", text: "The System was not created to make life convenient." },
      { speaker: "architect", scene: "architect-two", text: "It was built to determine whether a human life could carry impossible authority without collapsing." },
      { speaker: "architect", scene: "architect-two", text: "Every stat increase adapted you. Every penalty measured return. Every shadow tested command." },
      { speaker: "shadow", scene: "shadow", text: "It wanted a vessel. You became a successor instead." },
      { speaker: "system", scene: "architect-two", kind: "system", alert: "IRREGULAR PATH DETECTED", text: "The locked path no longer has a stable classification." },
      { speaker: "architect", scene: "architect-two", text: "The next choice will not belong to me." },
    ],
  },
  {
    id: "infinite", number: "ENDGAME", title: "INFINITE ASCENSION",
    tagline: "There is no final level. That is the point.", scene: "army", xp: 650, coins: 325,
    requirement: (c) => c.rankIndex >= 5, unlockHint: "Reach S-Rank and uncover the truth",
    scenes: [
      { speaker: "system", scene: "army", kind: "system", alert: "CAMPAIGN LIMIT REMOVED", text: "Infinite Ascension protocol initialized." },
      { speaker: "system", scene: "army", kind: "system", text: "New routes: Realm Gates, World Bosses, Monarch Trials, legendary titles, rare shadows, and seasonal prestige." },
      { speaker: "commander", scene: "army", text: "The army is ready. Give the next impossible thing a name." },
      { speaker: "shadow", scene: "shadow", text: "You are not finished. You finally became the person who does not need an ending." },
      { speaker: "system", scene: "system", kind: "system", text: "The System will continue for as long as the Player does." },
    ],
  },
];

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORY_KEY) || "null");
    if (parsed && Array.isArray(parsed.completed)) return parsed;
  } catch (_) {}
  return { completed: [], path: null, flags: {}, choices: {} };
}

function saveState(state) {
  try { localStorage.setItem(STORY_KEY, JSON.stringify(state)); } catch (_) {}
}

function StoryBackdrop({ scene }) {
  const shadowCount = scene === "army" ? 15 : 0;
  return (
    <div className={"story-backdrop scene-" + (scene || "meadow")} aria-hidden="true">
      <div className="story-moon" />
      <div className="pixel-cloud cloud-a" />
      <div className="pixel-cloud cloud-b" />
      <div className="pixel-hills" />
      <div className="pixel-field" />
      <div className="gate-rift"><span /><span /><span /></div>
      <div className="architect-entity"><i className="eye left"/><i className="eye right"/><b className="teeth"/></div>
      <div className="story-silhouette main"><i /></div>
      <div className="story-silhouette second"><i /></div>
      <div className="shadow-self-figure"><i/><b/></div>
      <div className="shadow-army">
        {Array.from({ length: shadowCount }).map((_, i) => <span key={i} style={{ "--i": i }}><i/><i/></span>)}
      </div>
      <div className="story-lightning"><i/><i/><i/><i/></div>
      <div className="story-vignette" />
      <div className="story-scanlines" />
    </div>
  );
}

function Typewriter({ text, speed = 12, onDone }) {
  const [count, setCount] = useState(0);
  const timer = useRef(null);
  useEffect(() => {
    setCount(0);
    timer.current = setInterval(() => {
      setCount((n) => {
        if (n >= text.length) {
          clearInterval(timer.current);
          if (typeof onDone === "function") onDone();
          return n;
        }
        return Math.min(text.length, n + 2);
      });
    }, speed);
    return () => clearInterval(timer.current);
  }, [text, speed]);
  return <>{text.slice(0, count)}{count < text.length && <span className="story-cursor">|</span>}</>;
}

function PathChoices({ selected, onChoose }) {
  return (
    <div className="path-choice-grid">
      {PATHS.map((path) => (
        <button key={path.id} disabled={path.locked} onClick={() => !path.locked && onChoose(path)} className={selected === path.id ? "selected" : ""}>
          <span className="path-glyph">{path.locked ? "?" : path.id === "speed" ? ">>" : path.id.slice(0, 2).toUpperCase()}</span>
          <span className="path-copy"><strong>{path.label}</strong><small>{path.note}</small></span>
          {path.recommended && <em>RECOMMENDED</em>}
          {path.locked && <em>LOCKED</em>}
        </button>
      ))}
    </div>
  );
}

function ScenePlayer({ chapter, state, onState, onClose, onFinish }) {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState(false);
  const [response, setResponse] = useState("");
  const [resolved, setResolved] = useState(false);
  const scene = chapter.scenes[index];
  const speaker = SPEAKERS[scene.speaker] || SPEAKERS.system;
  const isLast = index >= chapter.scenes.length - 1;

  useEffect(() => { setTyped(false); setResponse(""); setResolved(false); }, [index]);

  function advance() {
    if (!typed || (scene.choice && !resolved) || (scene.kind === "path" && !state.path)) return;
    if (isLast) onFinish(); else setIndex((n) => n + 1);
  }

  function choose(option) {
    setResponse(option.response || "Choice recorded.");
    if (option.block) {
      setResolved(false);
      onState({ ...state, choices: { ...state.choices, [chapter.id + ":refused"]: true } });
      return;
    }
    const next = {
      ...state,
      flags: option.flag ? { ...state.flags, [option.flag]: true } : state.flags,
      choices: { ...state.choices, [chapter.id]: option.id },
    };
    onState(next);
    setResolved(true);
  }

  function choosePath(path) {
    onState({ ...state, path: path.id, choices: { ...state.choices, path: path.id } });
    setResponse(path.label + " registered. This may be changed later, but it will not be chosen for you.");
    setResolved(true);
  }

  return (
    <div className={"story-player " + (scene.kind === "item" ? "item-reveal" : "")}>
      <StoryBackdrop scene={scene.scene || chapter.scene} />
      <div className="story-stage-top">
        <button onClick={onClose} aria-label="Exit story">EXIT</button>
        <div><span>{chapter.number}</span><strong>{chapter.title}</strong></div>
        <small>{String(index + 1).padStart(2, "0")} / {String(chapter.scenes.length).padStart(2, "0")}</small>
      </div>

      {scene.alert && (
        <div className="story-top-alert">
          <b>!</b><span><small>SYSTEM NOTIFICATION</small><strong>{scene.alert}</strong></span>
        </div>
      )}

      {scene.kind === "item" && (
        <div className="item-materialization"><div className="item-core">V</div><span>ACQUISITION COMPLETE</span></div>
      )}

      <div className={"story-dialogue " + (scene.kind === "system" || scene.kind === "path" ? "system-dialogue" : "") }>
        <div className="speaker-portrait" style={{ "--speaker": speaker.color }}><span>{scene.speaker === "architect" ? ":)" : scene.speaker === "shadow" ? "S" : "!"}</span></div>
        <div className="dialogue-copy">
          <div className="speaker-name" style={{ color: speaker.color }}>{speaker.name}</div>
          <p><Typewriter key={index} text={scene.text} onDone={() => setTyped(true)} /></p>
          {typed && scene.choice && (
            <div className="story-choices">
              {scene.choice.map((option) => <button key={option.id} onClick={() => choose(option)}>{option.label}</button>)}
            </div>
          )}
          {typed && scene.kind === "path" && <PathChoices selected={state.path} onChoose={choosePath} />}
          {response && <div className="choice-response">{response}</div>}
          {typed && (!scene.choice || resolved) && (scene.kind !== "path" || state.path) && (
            <button className="story-continue" onClick={advance}>{isLast ? "COMPLETE CHAPTER" : "CONTINUE"}<span>&gt;</span></button>
          )}
        </div>
      </div>
    </div>
  );
}

function chapterState(chapter, index, state, context) {
  if (state.completed.includes(chapter.id)) return "complete";
  const previous = CHAPTERS[index - 1];
  const previousDone = !previous || state.completed.includes(previous.id);
  return previousDone && chapter.requirement(context, state) ? "ready" : "locked";
}

export default function StoryModeView({ player, rank, clearedGates, bosses, shadowArmy, guildId, dailyDone, onReward }) {
  const [state, setState] = useState(loadState);
  const [playing, setPlaying] = useState(null);
  const [notice, setNotice] = useState(true);

  useEffect(() => saveState(state), [state]);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(false), 4200);
    return () => clearTimeout(timer);
  }, [notice]);

  const bossCount = Object.values(bosses || {}).filter((boss) => boss && (boss.defeated || boss.hp <= 0)).length;
  const context = {
    level: player?.level || 1,
    streak: player?.streak || 0,
    rankIndex: rank?.minRankIndex || 0,
    gates: Array.isArray(clearedGates)
      ? clearedGates.length
      : Object.keys(clearedGates || {}).filter((id) => Boolean(clearedGates[id])).length,
    bosses: bossCount,
    shadows: Array.isArray(shadowArmy) ? shadowArmy.length : 0,
    guildJoined: Boolean(guildId),
    dailyDone: Boolean(dailyDone),
  };

  function finishChapter(chapter) {
    const alreadyDone = state.completed.includes(chapter.id);
    const next = alreadyDone ? state : { ...state, completed: [...state.completed, chapter.id] };
    setState(next);
    setPlaying(null);
    setNotice(true);
    if (!alreadyDone && typeof onReward === "function") onReward(chapter);
  }

  if (playing) {
    return <ScenePlayer chapter={playing} state={state} onState={setState} onClose={() => setPlaying(null)} onFinish={() => finishChapter(playing)} />;
  }

  return (
    <div className="story-mode-view fade-in">
      {notice && <div className="campaign-notice"><b>!</b><span><small>SYSTEM NOTIFICATION</small><strong>STORY CAMPAIGN SYNCHRONIZED</strong></span></div>}
      <section className="story-hero">
        <div className="hero-grid" />
        <div className="hero-shadow"><i/><i/></div>
        <div className="hero-copy">
          <span className="eyebrow">PRIVATE PLAYER CAMPAIGN</span>
          <h1>STORY <em>MODE</em></h1>
          <p>Your real progress unlocks the campaign. The System observes choices, but never chooses your path for you.</p>
          <div className="story-meta">
            <span><small>PLAYER</small>{player?.name || "HUNTER"}</span>
            <span><small>PATH</small>{PATHS.find((p) => p.id === state.path)?.label || "UNSELECTED"}</span>
            <span><small>SYNC</small>{Math.round((state.completed.length / CHAPTERS.length) * 100)}%</span>
          </div>
        </div>
      </section>

      <div className="campaign-heading"><span>CAMPAIGN ARCHIVE</span><small>{state.completed.length} / {CHAPTERS.length} CLEARED</small></div>
      <div className="chapter-timeline">
        {CHAPTERS.map((chapter, index) => {
          const status = chapterState(chapter, index, state, context);
          return (
            <article key={chapter.id} className={"chapter-entry " + status}>
              <div className="timeline-node"><span>{String(index).padStart(2, "0")}</span></div>
              <button disabled={status === "locked"} onClick={() => status !== "locked" && setPlaying(chapter)}>
                <div className={"chapter-art art-" + chapter.scene}><span/><i/><b/></div>
                <div className="chapter-copy">
                  <small>{chapter.number}</small>
                  <h2>{chapter.title}</h2>
                  <p>{chapter.tagline}</p>
                  <div className="chapter-reward">+{chapter.xp} XP&nbsp;&nbsp; +{chapter.coins} GOLD</div>
                </div>
                <div className="chapter-status">
                  {status === "complete" ? "CLEARED" : status === "ready" ? "ENTER" : "SEALED"}
                  <small>{status === "locked" ? chapter.unlockHint : status === "complete" ? "REPLAY AVAILABLE" : "CHAPTER READY"}</small>
                </div>
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
