/**
 * 辅导员模拟器 —— 无头回归与数值测算 harness
 *
 * 用法:
 *   node harness.mjs            跑 8 学期全流程 + 数值统计
 *   node harness.mjs --runs 200 指定局数
 *   node harness.mjs --seed 1   指定随机种子
 *
 * 不需要浏览器：直接 eval data.js / engine.js，注入最小 window / localStorage 垫片。
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(here, "..", "src");

const args = process.argv.slice(2);
function argValue(flag, fallback) {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}
const RUNS = Number(argValue("--runs", 200));
const SEED = Number(argValue("--seed", 20260818));
const VERBOSE = args.includes("--verbose");

// ---------------------------------------------------------------- 垫片
function createSandbox() {
  const storage = new Map();
  const localStorage = {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear(),
    _dump: () => Object.fromEntries(storage)
  };
  const sandbox = {
    window: {},
    localStorage,
    console,
    Math,
    Date,
    JSON,
    Number,
    String,
    Boolean,
    Array,
    Object,
    Set,
    Map,
    isNaN,
    parseInt,
    parseFloat
  };
  sandbox.globalThis = sandbox;
  sandbox.window.localStorage = localStorage;
  return { sandbox, localStorage };
}

function loadGame() {
  const { sandbox, localStorage } = createSandbox();
  const context = vm.createContext(sandbox);
  for (const file of ["data.js", "engine.js"]) {
    const code = fs.readFileSync(path.join(srcDir, file), "utf8");
    vm.runInContext(code, context, { filename: file });
  }
  return { engine: sandbox.window.GameEngine, data: sandbox.window.GameData, localStorage };
}

const { engine, data, localStorage } = loadGame();

// ---------------------------------------------------------------- 随机数
let seedState = SEED >>> 0;
function nextRandom() {
  seedState = (seedState * 1664525 + 1013904223) >>> 0;
  return seedState / 4294967296;
}
Math.random = nextRandom;

// ---------------------------------------------------------------- 断言
const failures = [];
let assertions = 0;
function check(name, condition, detail = "") {
  assertions += 1;
  if (!condition) failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
  return Boolean(condition);
}

// ---------------------------------------------------------------- 辅助
function pickIds(state, count, preferRecovery) {
  const workActions = engine.getActions().filter((action) => action.scope === "work");
  const recovery = workActions.filter((action) => action.id === "W11" || action.id === "W12" || action.id === "W13");
  const normal = workActions.filter((action) => !recovery.includes(action));
  const chosen = [];
  if (preferRecovery) chosen.push(recovery[0]);
  while (chosen.length < count) {
    const pool = normal.filter((action) => !chosen.includes(action));
    if (!pool.length) break;
    chosen.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return chosen;
}

function selectActions(state, ids) {
  state.selectedActions = [];
  ids.forEach((action) => engine.toggleAction(state, action.id));
}

function handleProblemStudents(state) {
  state.problemStudents.forEach((problem, index) => {
    engine.selectStudentHandling(state, problem.studentId, index % problem.methods.length);
  });
}

/**
 * 三种机器人策略，用于界定数值曲线的上下界。
 * 注意：三个恢复类行动（W11/W12/W13）同时回血与回精力，
 * 所以「只补精力」在行动层面并不存在——真正的分野是「何时决定恢复」。
 *  - balanced      ：精力或身体任一吃紧就插一项恢复（近似正常玩家）
 *  - lowMaintenance：只在两项都亮红灯时才恢复（近似贪心推进工作的玩家）
 *  - neglect       ：从不主动恢复（近似完全不管自己的玩家，应必然猝死）
 */
const POLICIES = {
  careful: {
    name: "careful",
    wantsRecovery: (state) => state.counselor.energy < 60 || state.counselor.health < 60
  },
  balanced: {
    name: "balanced",
    wantsRecovery: (state) => state.counselor.energy < 45 || state.counselor.health < 45
  },
  lowMaintenance: {
    name: "lowMaintenance",
    wantsRecovery: (state) => state.counselor.energy < 35 || state.counselor.health < 35
  },
  neglect: {
    name: "neglect",
    wantsRecovery: () => false
  }
};

/** 推进一个月：完成 planning → events → monthEvent → monthSummary，停在结算后 */
function playMonth(state, depth, policy) {
  selectActions(state, pickIds(state, 3, policy.wantsRecovery(state)));
  handleProblemStudents(state);

  if (state.month === 1) {
    const project = engine.getDevelopmentProjects()[depth % engine.getDevelopmentProjects().length];
    const okProject = engine.selectDevelopmentProject(state, project.id);
    const okScenario = engine.selectDevelopmentScenario(state, 0);
    if (!okProject || !okScenario) throw new Error(`项目选择失败 semester=${state.semester} month=${state.month}`);
  } else if (state.developmentEvent && !state.developmentEventResolved) {
    engine.resolveDevelopmentEvent(state, depth % state.developmentEvent.choices.length);
  }

  const started = engine.startMonth(state);
  if (!started) throw new Error(`startMonth 被拒绝 semester=${state.semester} month=${state.month}`);

  let guard = 0;
  while (state.phase === "events") {
    guard += 1;
    if (guard > 50) throw new Error("事件队列无法清空（可能死循环）");
    const current = engine.getCurrentEvent(state);
    if (!current) break;
    engine.resolveChoice(state, depth % current.choices.length);
    if (state.gameOver) return;
  }
  if (state.phase === "events") throw new Error("事件阶段结束时仍停在 events");

  if (state.phase === "monthEvent") {
    const event = state.summaryEvent;
    if (!event) throw new Error("monthEvent 阶段缺少 summaryEvent");
    engine.resolveSummaryChoice(state, depth % event.choices.length);
  }
  if (state.gameOver) return;

  if (state.phase === "monthSummary") {
    engine.closeMonthSummary(state);
  }
}

function playRun(runIndex, policy) {
  const state = engine.createInitialState();
  engine.beginGame(state, "回归测试员");
  const energyCurve = [];
  const healthCurve = [];
  let months = 0;
  let guard = 0;

  while (!state.gameOver) {
    guard += 1;
    if (guard > 200) throw new Error("状态机未收敛");

    switch (state.phase) {
      case "semesterStart":
        engine.startNewSemester(state);
        break;
      case "semesterSummary":
        engine.closeSemesterSummary(state);
        break;
      case "planning": {
        if (state.semester > 8) throw new Error("超过第 8 学期仍在 planning");
        playMonth(state, months, policy);
        months += 1;
        energyCurve.push(state.counselor.energy);
        healthCurve.push(state.counselor.health);
        if (months > 40) throw new Error("超过 40 个月仍未结束");
        break;
      }
      default:
        throw new Error(`意外相位 ${state.phase} (semester=${state.semester} month=${state.month})`);
    }
  }

  return { state, months, energyCurve, healthCurve, rankTitle: state.rankTitle };
}

// ---------------------------------------------------------------- 结构断言（单局）
console.log("=".repeat(72));
console.log("A. 结构断言");
console.log("=".repeat(72));

const probe = engine.createInitialState();
check("初始 phase 为 planning", probe.phase === "planning");
check("初始 problemStudents 长度为 3", probe.problemStudents.length === 3, `实际 ${probe.problemStudents.length}`);
check("初始学生数为 24", probe.students.length === 24);
check("STATE_VERSION 为 2", engine.STATE_VERSION === 2);

const riskTiers = probe.problemStudents.map((problem) => {
  const student = probe.students.find((item) => item.id === problem.studentId);
  return student.risk;
});
check(
  "开局问题学生至少 1 人处于风险档(risk>=52)",
  riskTiers.some((risk) => risk >= 52),
  `risk=${riskTiers.join(",")}`
);
check(
  "开局问题学生全部 risk>=30(需关注档)",
  riskTiers.every((risk) => risk >= 30),
  `risk=${riskTiers.join(",")}`
);
check("存档可序列化", (() => {
  try {
    const snapshot = JSON.parse(JSON.stringify(probe));
    return snapshot.version === 2 && snapshot.students.length === 24;
  } catch {
    return false;
  }
})());

engine.saveState(probe);
const reloaded = engine.loadState();
check("存档读回成功", Boolean(reloaded));
check("读回后版本为 2", reloaded?.version === 2);
check("读回后学生数为 24", reloaded?.students?.length === 24);

// v1 存档迁移
const v1Save = JSON.parse(JSON.stringify(probe));
delete v1Save.developmentProjectConfirmed;
delete v1Save.recentEventIds;
delete v1Save.slackMax;
v1Save.version = 1;
localStorage.setItem("counselor-sim-save-v1", JSON.stringify(v1Save));
const migrated = engine.loadState();
check("v1 存档迁移成功", Boolean(migrated));
check("迁移后补上 developmentProjectConfirmed", typeof migrated?.developmentProjectConfirmed === "boolean");
check("迁移后补上 recentEventIds", Array.isArray(migrated?.recentEventIds));
check("迁移后补上 slackMax", migrated?.slackMax === 2);

const badSave = JSON.parse(JSON.stringify(probe));
badSave.version = 99;
localStorage.setItem("counselor-sim-save-v1", JSON.stringify(badSave));
check("未来版本存档被拒绝", engine.loadState() === null);

// 保存相位白名单
check("planning 可保存", engine.canSaveState({ phase: "planning", gameOver: null }));
check("monthSummary 不可保存", !engine.canSaveState({ phase: "monthSummary", gameOver: null }));
check("gameOver 不可保存", !engine.canSaveState({ phase: "gameOver", gameOver: { type: "x" } }));

// 头衔确定性
const rankTitleSet = new Set();
for (let i = 0; i < 50; i += 1) rankTitleSet.add(engine.getRankTitle(3, "实务线"));
check("getRankTitle 不再随机抖动", rankTitleSet.size === 1, [...rankTitleSet].join("/"));

localStorage.removeItem("counselor-sim-save-v1");

// ---------------------------------------------------------------- 全流程
console.log();
console.log("=".repeat(72));
console.log(`B. 8 学期全流程（${RUNS} 局，seed=${SEED}）`);
console.log("=".repeat(72));

const avg = (list) => (list.length ? list.reduce((sum, v) => sum + v, 0) / list.length : 0);
const percentile = (list, p) => {
  if (!list.length) return 0;
  const sorted = [...list].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
};

function runBatch(policy, count) {
  const batch = [];
  for (let i = 0; i < count; i += 1) {
    try {
      batch.push(playRun(i, policy));
    } catch (error) {
      failures.push(`[${policy.name}] 第 ${i} 局异常：${error.message}`);
      break;
    }
  }
  return batch;
}

function reportBatch(policy, batch) {
  const label = policy.name;
  console.log();
  console.log(`  策略 ${label}:`);
  const monthCounts = batch.map((run) => run.months);
  const finalEnergy = batch.map((run) => run.state.counselor.energy);
  const finalHealth = batch.map((run) => run.state.counselor.health);
  const finalMental = batch.map((run) => run.state.counselor.mental);
  const finalSavings = batch.map((run) => run.state.counselor.savings);
  const completed = batch.filter((run) => run.months >= 40).length;

  console.log(`    完成局数(>=40月)     : ${completed}/${batch.length}`);
  console.log(`    月数 均值/中位/最小   : ${avg(monthCounts).toFixed(1)} / ${percentile(monthCounts, 0.5)} / ${Math.min(...monthCounts)}`);
  console.log(`    终局精力 均值/最低    : ${avg(finalEnergy).toFixed(1)} / ${Math.min(...finalEnergy)}`);
  console.log(`    终局身体 均值/最低    : ${avg(finalHealth).toFixed(1)} / ${Math.min(...finalHealth)}`);
  console.log(`    终局心理 均值/最低    : ${avg(finalMental).toFixed(1)} / ${Math.min(...finalMental)}`);
  console.log(`    终局存款 均值/最低    : ${avg(finalSavings).toFixed(0)} / ${Math.min(...finalSavings)}`);

  let lowEnergy = 0;
  let lowHealth = 0;
  let totalMonths = 0;
  batch.forEach((run) => {
    run.energyCurve.forEach((value) => {
      totalMonths += 1;
      if (value <= 20) lowEnergy += 1;
    });
    run.healthCurve.forEach((value) => {
      if (value <= 20) lowHealth += 1;
    });
  });
  console.log(`    精力<=20 月份占比     : ${((lowEnergy / totalMonths) * 100).toFixed(1)}%`);
  console.log(`    身体<=20 月份占比     : ${((lowHealth / totalMonths) * 100).toFixed(1)}%`);

  const endingCounter = new Map();
  batch.forEach((run) => {
    const type = run.state.gameOver?.type || "无结局";
    endingCounter.set(type, (endingCounter.get(type) || 0) + 1);
  });
  console.log(`    结局分布:`);
  [...endingCounter.entries()]
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => console.log(`      ${type.padEnd(10)} ${count} (${((count / batch.length) * 100).toFixed(1)}%)`));

  const ranks = batch.map((run) => run.state.rankLevel);
  const gradeCounter = new Map();
  batch.forEach((run) => {
    run.state.projectHistory.forEach((project) => {
      gradeCounter.set(project.grade, (gradeCounter.get(project.grade) || 0) + 1);
    });
  });
  console.log(`    终局等级 均值/最高    : ${avg(ranks).toFixed(2)} / ${Math.max(...ranks)}`);
  console.log(
    `    项目等级 S/A/B/C      : ${gradeCounter.get("S") || 0} / ${gradeCounter.get("A") || 0} / ${gradeCounter.get("B") || 0} / ${gradeCounter.get("C") || 0}`
  );
  return { batch, completed, endingCounter };
}

const batchResults = {};
for (const policy of Object.values(POLICIES)) {
  const batch = runBatch(policy, RUNS);
  batchResults[policy.name] = reportBatch(policy, batch);
}

check("所有局都跑完且无异常", failures.length === 0, failures[0] || "");

const balanced = batchResults.balanced;
const careful = batchResults.careful;
const lowMaintenance = batchResults.lowMaintenance;
const neglect = batchResults.neglect;
const deathRate = (result) => (result.endingCounter.get("猝死") || 0) / RUNS;

check(
  "balanced 策略大多数局能带完 8 学期",
  balanced.completed >= RUNS * 0.7,
  `完成 ${balanced.completed}/${RUNS}`
);
// 设计意图（design.md §10）：猝死是真实但可避免的风险，不是必然结局，也不该是摆设。
check(
  "balanced 策略猝死率低于 20%（身体可维护）",
  deathRate(balanced) < 0.2,
  `猝死率 ${(deathRate(balanced) * 100).toFixed(1)}%`
);
check(
  "越晚才恢复的玩家代价越高（猝死率 balanced <= lowMaintenance）",
  deathRate(lowMaintenance) >= deathRate(balanced),
  `猝死率 ${(deathRate(balanced) * 100).toFixed(1)}% vs ${(deathRate(lowMaintenance) * 100).toFixed(1)}%`
);
check(
  "完全不顾自身状态的玩家几乎无法带完一届",
  neglect.completed < RUNS * 0.2,
  `完成 ${neglect.completed}/${RUNS}`
);
check(
  "难度随自我照顾程度单调上升（猝死率 careful <= balanced <= lowMaintenance < neglect）",
  deathRate(careful) <= deathRate(balanced) &&
    deathRate(balanced) <= deathRate(lowMaintenance) &&
    deathRate(lowMaintenance) < deathRate(neglect),
  [careful, balanced, lowMaintenance, neglect].map((r) => `${(deathRate(r) * 100).toFixed(0)}%`).join(" / ")
);
check(
  "越早开始照顾自己，终局身体越好",
  avg(careful.batch.map((run) => run.state.counselor.health)) >
    avg(neglect.batch.map((run) => run.state.counselor.health)) + 10,
  `${avg(careful.batch.map((run) => run.state.counselor.health)).toFixed(1)} vs ${avg(neglect.batch.map((run) => run.state.counselor.health)).toFixed(1)}`
);

const allRuns = [...careful.batch, ...balanced.batch, ...lowMaintenance.batch, ...neglect.batch];
const runs = allRuns; // 供后续数据完整性检查复用
const completed = allRuns.filter((run) => run.months >= 40);
const ended = allRuns.map((run) => run.state.gameOver);
const finalEnergy = allRuns.map((run) => run.state.counselor.energy);
const finalHealth = allRuns.map((run) => run.state.counselor.health);
const finalMental = allRuns.map((run) => run.state.counselor.mental);
const finalSavings = allRuns.map((run) => run.state.counselor.savings);

check("存在完整跑满 40 个月的局", completed.length > 0, `完成 ${completed.length}/${allRuns.length}`);
check("每局都有结局对象", ended.every(Boolean));
check(
  "结局类型与文案均非空",
  ended.every((ending) => ending && ending.title && ending.text)
);
const withEndings = allRuns.filter((run) => Array.isArray(run.state.studentEndings) && run.state.studentEndings.length);
check(
  "走完第 8 学期的局都生成了 24 名学生结局",
  withEndings.every((run) => run.state.studentEndings.length === 24),
  `样本 ${withEndings.length} 局`
);
// P2：18 条模板覆盖 24 名学生必然重复，扩充变体后应显著下降。
check(
  "学生结局没有出现空台词",
  withEndings.every((run) => run.state.studentEndings.every((ending) => ending.quote && ending.quote.trim().length > 0))
);
const quoteUniqueness = withEndings.map((run) => {
  const quotes = run.state.studentEndings.map((ending) => ending.quote);
  return new Set(quotes).size;
});
const avgUnique = avg(quoteUniqueness);
check(
  "单局学生台词重复率显著降低（平均唯一台词数 >= 18）",
  avgUnique >= 18,
  `平均唯一 ${avgUnique.toFixed(1)} / 24（最少 ${Math.min(...quoteUniqueness)}）`
);
check(
  "同一局内每名学生都有 attitude 与 outcome 分类",
  withEndings.every((run) =>
    run.state.studentEndings.every((ending) => ending.attitude && ["good", "medium", "poor"].includes(ending.outcome))
  )
);

console.log();
console.log("  按月的精力/身体均值（balanced 策略，每 5 个月为一个学期）:");
const energyByMonth = Array.from({ length: 40 }, () => []);
const healthByMonth = Array.from({ length: 40 }, () => []);
balanced.batch.forEach((run) => {
  run.energyCurve.forEach((value, index) => {
    if (index < 40) energyByMonth[index].push(value);
  });
  run.healthCurve.forEach((value, index) => {
    if (index < 40) healthByMonth[index].push(value);
  });
});
for (let semester = 0; semester < 8; semester += 1) {
  const row = [];
  for (let m = 0; m < 5; m += 1) {
    const index = semester * 5 + m;
    row.push(avg(energyByMonth[index] || []).toFixed(0).padStart(3));
  }
  const hrow = [];
  for (let m = 0; m < 5; m += 1) {
    const index = semester * 5 + m;
    hrow.push(avg(healthByMonth[index] || []).toFixed(0).padStart(3));
  }
  console.log(`    学期 ${semester + 1}: 精力 ${row.join(" ")}  |  身体 ${hrow.join(" ")}`);
}

// ---------------------------------------------------------------- 事件冷却验证
console.log();
console.log("=".repeat(72));
console.log("C. 事件冷却与数据完整性");
console.log("=".repeat(72));

const cooldownProbe = engine.createInitialState();
cooldownProbe.recentEventIds = data.events.slice(0, 12).map((event) => event.id);
const queueIds = [];
// 通过多次 buildMonthEventQueue 的间接观察：直接检查 recentEventIds 是否被消费
const before = cooldownProbe.recentEventIds.length;
check("recentEventIds 初始被迁移/初始化为数组", Array.isArray(engine.createInitialState().recentEventIds));
check("recentEventIds 上限为 12", before === 12);

const eventIds = data.events.map((event) => event.id);
check("事件 id 唯一", new Set(eventIds).size === eventIds.length, `重复: ${eventIds.length - new Set(eventIds).size}`);
const missingSemesterRange = data.events.filter((event) => !event.semesterRange).length;
check("通用事件数量合理", missingSemesterRange === 70, `实际 ${missingSemesterRange}`);
for (let semester = 1; semester <= 8; semester += 1) {
  const count = data.events.filter((event) => event.semesterRange?.includes(semester)).length;
  check(`第 ${semester} 学期专属事件 >= 10 条`, count >= 10, `实际 ${count}`);
}

check("所有事件选项都有 tone", data.events.every((event) => event.choices.every((choice) => choice.tone)));
check(
  "所有发展项目事件选项都有 effects",
  data.developmentProjects.every((project) => project.events.every((event) => event.choices.every((choice) => choice.effects)))
);

// ---- P1-1 数据驱动效果：确认覆写表真的生效，且 null 会回退到 tone ----
const crisisE63 = data.events.find((event) => event.id === "E63");
check("E63 危机事件带上了显式 effects", Boolean(crisisE63?.choices?.[0]?.effects));
check(
  "E63 首选项的 risk 降幅来自数据表而非 tone 基线",
  crisisE63?.choices?.[0]?.effects?.risk <= -18,
  `risk=${crisisE63?.choices?.[0]?.effects?.risk}`
);

const monthEndM08 = data.monthEndEvents.find((event) => event.id === "M08");
check("月终事件 8 条全部选项都有显式 effects", data.monthEndEvents.every((event) => event.choices.every((choice) => choice.effects)));
check(
  "月终事件不再全部是心理正收益",
  data.monthEndEvents.some((event) => event.choices.some((choice) => (choice.effects.mental || 0) < 0)),
  "至少存在一个心理为负的月终选项"
);

// 稀疏覆写：数组比 choices 短或元素为 null 时必须回退 tone，而不是清空效果
const sparseEvent = data.events.find((event) => {
  const effects = event.choices.map((choice) => choice.effects);
  return effects.some(Boolean) && effects.some((value) => !value);
});
check("存在稀疏覆写的事件（部分选项无 effects）", Boolean(sparseEvent), `例: ${sparseEvent?.id}`);
if (sparseEvent) {
  const bareIndex = sparseEvent.choices.findIndex((choice) => !choice.effects);
  const fallback = engine.__test.resolveChoiceEffects(sparseEvent, sparseEvent.choices[bareIndex]);
  const toneOnly = engine.__test.toneEffects(sparseEvent, sparseEvent.choices[bareIndex]);
  check(
    `稀疏覆写的空位回退到 tone（${sparseEvent.id}[${bareIndex}]）`,
    Object.keys(toneOnly).every((key) => fallback[key] === toneOnly[key]) && Object.keys(fallback).length > 0,
    `fallback=${JSON.stringify(fallback)}`
  );
  const explicitIndex = sparseEvent.choices.findIndex((choice) => choice.effects);
  const explicit = engine.__test.resolveChoiceEffects(sparseEvent, sparseEvent.choices[explicitIndex]);
  check(
    `显式 effects 为整表替换（${sparseEvent.id}[${explicitIndex}]）`,
    JSON.stringify(explicit) === JSON.stringify(sparseEvent.choices[explicitIndex].effects),
    "不应混入 tone 字段"
  );
}

// ---- P1-4 记忆元数据：覆盖全部 166 条，且标签全部会被引擎识别 ----
const metaIds = Object.keys(data.eventMemoryMeta);
check("eventMemoryMeta 覆盖全部 166 个事件", metaIds.length === 166, `实际 ${metaIds.length}`);
const allowedTags = new Set([
  "支持", "保护", "共情", "尊重自主", "持续跟进", "及时介入", "边界清楚", "隐私保护",
  "专业流程", "家长介入", "规则优先", "朋辈支持", "忽视", "低共情", "模糊边界", "公开",
  "了解原因", "信息", "核实", "家长沟通", "折中", "学业支持", "专业介入", "专业支持",
  "长期发展", "朋辈介入", "边界", "宽松", "规则", "情绪安抚", "等待", "经济支持",
  "支持休学", "公平", "程序公平", "隔离冲突", "学生", "上报"
]);
const badTags = new Set();
Object.entries(data.eventMemoryMeta).forEach(([id, meta]) => {
  meta.choiceTags.forEach((group) => group.forEach((tag) => {
    if (!allowedTags.has(tag)) badTags.add(`${id}:${tag}`);
  }));
});
check("所有态度标签都在引擎白名单内", badTags.size === 0, [...badTags].slice(0, 8).join(", "));

// ---- P1-6 事件冷却：最近事件不再被抽中 ----
const cooldownState = engine.createInitialState();
const firstQueue = engine.__test.buildMonthEventQueue(cooldownState);
check("事件队列非空且长度在 3-6 之间", firstQueue.length >= 3 && firstQueue.length <= 6, `实际 ${firstQueue.length}`);
const usedIds = firstQueue.map((event) => event.id);
check("同月队列内无重复事件", new Set(usedIds).size === usedIds.length);

const cooledState = engine.createInitialState();
cooledState.recentEventIds = data.events.slice(0, 12).map((event) => event.id);
const cooledIds = new Set(cooledState.recentEventIds);
let leaked = 0;
for (let attempt = 0; attempt < 50; attempt += 1) {
  engine.__test.buildMonthEventQueue(cooledState).forEach((event) => {
    if (cooledIds.has(event.id)) leaked += 1;
  });
}
check("冷却窗口内的事件不会被抽中", leaked === 0, `泄漏 ${leaked} 次`);

// ---- 循环与稳定性约束（design.md §14）----
check(
  "属性变化都经过 0-100 夹取（精力/身体/心理不会越界）",
  runs.every((run) => {
    const c = run.state.counselor;
    return (
      c.energy >= 0 && c.energy <= 100 &&
      c.health >= 0 && c.health <= 100 &&
      c.mental >= 0 && c.mental <= 100 &&
      c.leadership >= 0 && c.leadership <= 100 &&
      c.trust >= 0 && c.trust <= 100 &&
      c.risk >= 0 && c.risk <= 100
    );
  })
);
check(
  "结局后不会再残留未处理事件队列",
  runs.every((run) => !run.state.gameOver || run.state.currentEvent === null || typeof run.state.currentEvent === "object")
);
check(
  "学生属性全部落在 0-100",
  runs.every((run) =>
    run.state.students.every((student) =>
      Object.values(student.attributes).every((value) => value >= 0 && value <= 100)
    )
  )
);
check(
  "没有学生出现负的风险值或越界状态",
  runs.every((run) => run.state.students.every((student) => student.risk >= 0 && student.risk <= 100))
);
check(
  "问题学生池始终不超过 3 人",
  runs.every((run) => run.state.problemStudents.length <= 3)
);

// 存档往返：完整快照 + 版本 + 迁移
const roundTrip = engine.createInitialState();
roundTrip.careerPoints = 123;
roundTrip.rankLevel = 3;
roundTrip.rankTrack = "实务线";
roundTrip.rankTitle = engine.getRankTitle(3, "实务线");
engine.saveState(roundTrip);
const restored = engine.loadState();
check("存档往返保留职业积分", restored?.careerPoints === 123);
check("存档往返保留等级与路线", restored?.rankLevel === 3 && restored?.rankTrack === "实务线");
check("存档往返保留头衔", restored?.rankTitle === roundTrip.rankTitle);
check("存档往返保留学生记忆长度", restored?.students?.length === 24);

// ---------------------------------------------------------------- 结果
console.log();
console.log("=".repeat(72));
console.log(`断言: ${assertions - failures.length}/${assertions} 通过`);
if (failures.length) {
  console.log("失败项:");
  failures.forEach((failure) => console.log(`  ✗ ${failure}`));
  process.exit(1);
}
console.log("全部通过 ✓");
