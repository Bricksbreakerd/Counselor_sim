// 校验脚本：语法 + 结构 + 数值区间 + 与 data.js 的 choice 数对齐。
// 源数据已合并进 src/data.js，本脚本现在校验 tools/archive 下的原始稿，
// 以便日后重新生成时仍能先验证再合并。
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const effectsPath = path.join(__dirname, "archive", "semester-effects.js");
const dataPath = path.join(root, "src", "data.js");

// 1) 语法检查
new vm.Script(fs.readFileSync(effectsPath, "utf8"), { filename: effectsPath });

// 2) 载入 effects
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(effectsPath, "utf8"), sandbox);
const FX = sandbox.window.GameDataSemesterEffects;

// 3) 载入 data.js 取得每个事件的 choices 长度与 category
const dataSandbox = { window: {} };
vm.createContext(dataSandbox);
vm.runInContext(fs.readFileSync(dataPath, "utf8"), dataSandbox);
const GD = dataSandbox.window.GameData;
const allEvents = [...GD.events, ...GD.monthEndEvents];
const byId = new Map(allEvents.map((e) => [e.id, e]));

const FIELDS = ["energy", "mental", "health", "savings", "leadership", "trust", "parent", "colleague", "risk", "development"];
const RANGE = {
  energy: [-16, 8], mental: [-14, 8], health: [-5, 3], risk: [-22, 15],
  trust: [-8, 8], leadership: [-8, 8], parent: [-8, 8], colleague: [-8, 8],
  savings: [-1500, 500], development: [-6, 8],
};
// 月终事件是「辅导员自己的时间」，定位是恢复窗口：
// 精力/心理的正收益上限更高（这是它存在的意义），而 risk 必须保持小幅度。
const MONTH_END_RANGE = {
  ...RANGE,
  energy: [-14, 12], mental: [-14, 14], risk: [-6, 8],
};
const errors = [];
const warns = [];
let overriddenChoices = 0;
let overriddenEvents = 0;
const monthEndSummary = [];

for (const [id, arr] of Object.entries(FX)) {
  const ev = byId.get(id);
  if (!ev) { errors.push(`${id}: 在 data.js 中不存在`); continue; }
  if (!Array.isArray(arr)) { errors.push(`${id}: 值不是数组`); continue; }
  if (arr.length !== ev.choices.length) {
    errors.push(`${id}: 数组长度 ${arr.length} != choices 长度 ${ev.choices.length}`);
  }
  const isMonthEnd = ev.category === "月终事件";
  if (isMonthEnd && arr.some((x) => x === null)) errors.push(`${id}: 月终事件不允许 null`);
  let wrote = 0;
  arr.forEach((obj, i) => {
    if (obj === null) return;
    wrote++;
    overriddenChoices++;
    const label = ev.choices[i] ? ev.choices[i].label : "(缺失)";
    if (typeof obj !== "object") { errors.push(`${id}[${i}]: 不是对象`); return; }
    for (const k of FIELDS) {
      if (!(k in obj)) { errors.push(`${id}[${i}]「${label}」: 缺少字段 ${k}`); continue; }
      if (typeof obj[k] !== "number" || !Number.isFinite(obj[k])) { errors.push(`${id}[${i}]「${label}」: ${k} 不是有限数字`); continue; }
      const [lo, hi] = (isMonthEnd ? MONTH_END_RANGE : RANGE)[k];
      if (obj[k] < lo || obj[k] > hi) errors.push(`${id}[${i}]「${label}」: ${k}=${obj[k]} 超出 ${lo}~${hi}`);
    }
    // 无脑最优解检查：energy/mental/health 全 >=0 且 savings>=0 且 risk<=0 且 trust>=0 且 leadership>=0
    const free =
      obj.energy >= 0 && obj.mental >= 0 && obj.health >= 0 && obj.savings >= 0 &&
      obj.risk <= 0 && obj.trust >= 0 && obj.leadership >= 0 && obj.parent >= 0 && obj.colleague >= 0;
    if (free) warns.push(`${id}[${i}]「${label}」: 疑似“全正无代价”选项 ${JSON.stringify(obj)}`);
    if (isMonthEnd && (obj.risk < -6 || obj.risk > 8)) errors.push(`${id}[${i}]「${label}」: 月终 risk=${obj.risk} 超出 -6~+8`);
    if (isMonthEnd) {
      const scale = (v, k) => (v < 0 ? Math.round(v * (k === "energy" ? 0.6 : k === "mental" ? 0.75 : 1)) : v);
      monthEndSummary.push(`${id}[${i}] ${label}: 名义 ${JSON.stringify(obj)} / 生效 energy=${scale(obj.energy, "energy")} mental=${scale(obj.mental, "mental")}`);
    }
  });
  if (wrote > 0) overriddenEvents++;
  if (isMonthEnd && wrote !== 3) errors.push(`${id}: 月终事件必须 3 项全写，实际 ${wrote}`);
}

// 月终事件是否 8 个全覆盖
const monthIds = GD.monthEndEvents.map((e) => e.id);
const missing = monthIds.filter((id) => !FX[id]);
if (missing.length) errors.push(`月终事件未覆盖: ${missing.join(",")}`);

// 学期事件 id 覆盖统计
const semIds = GD.events.filter((e) => e.category === "学期事件").map((e) => e.id);
const semCovered = semIds.filter((id) => FX[id] && FX[id].some((x) => x !== null));
console.log(`学期事件总数: ${semIds.length} (${semIds[0]} - ${semIds[semIds.length - 1]})`);
console.log(`覆写事件数: ${overriddenEvents}，覆写 choice 数: ${overriddenChoices}`);
console.log(`学期事件中被覆写的事件数: ${semCovered.length}`);
console.log(`学期事件列表: ${semCovered.join(", ")}`);
console.log(`无事项数组（事件级 null 占位）: ${Object.entries(FX).filter(([, v]) => !Array.isArray(v)).map(([k]) => k).join(",") || "无"}`);
console.log("\n月终事件生效值：");
monthEndSummary.forEach((l) => console.log("  " + l));
if (warns.length) { console.log("\n警告:"); warns.forEach((w) => console.log("  " + w)); }
if (errors.length) { console.log("\n错误:"); errors.forEach((e) => console.log("  " + e)); process.exit(1); }
console.log("\n全部检查通过");
