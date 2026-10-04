/**
 * 把三个委派产出的数据模块合并进 src/data.js。
 *
 * 为什么需要这个脚本：index.html 的加载顺序是 data.js → engine.js → app.js，
 * 把数据拆成三个额外文件会让 engine 依赖加载顺序（而且 file:// 下更要小心）。
 * 合并成单一数据文件可以保持「一个数据源」的结构，脚本本身也保证这种合并可重复执行。
 *
 * 用法: node tools/merge-delegated-data.js
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const src = path.join(root, "src");
const archive = path.join(here, "archive");
const dataPath = path.join(src, "data.js");

function loadModule(file, globalName) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(archive, file), "utf8"), sandbox, { filename: file });
  const value = sandbox.window[globalName];
  if (!value) throw new Error(`${file} 未导出 window.${globalName}`);
  return value;
}

const crisisEffects = loadModule("crisis-effects.js", "GameDataCrisisEffects");
const semesterEffects = loadModule("semester-effects.js", "GameDataSemesterEffects");
const memoryMeta = loadModule("memory-meta.js", "GameDataMemoryMeta");

// 三个来源的效果表合并；后写的覆盖先写的（id 不重叠，这里只是形式统一）。
const allEffects = { ...crisisEffects, ...semesterEffects };

// 以 data.js 为准做交叉校验，避免把错误数据合并进去。
const dataSandbox = { window: {} };
vm.createContext(dataSandbox);
vm.runInContext(fs.readFileSync(dataPath, "utf8"), dataSandbox, { filename: "data.js" });
const GD = dataSandbox.window.GameData;
const eventsById = new Map(GD.events.map((e) => [e.id, e]));
const monthEndById = new Map(GD.monthEndEvents.map((e) => [e.id, e]));

const problems = [];
let effectChoices = 0;

for (const [id, arr] of Object.entries(allEffects)) {
  const event = eventsById.get(id) || monthEndById.get(id);
  if (!event) {
    problems.push(`效果表 ${id}: 事件不存在`);
    continue;
  }
  if (!Array.isArray(arr)) {
    problems.push(`效果表 ${id}: 不是数组`);
    continue;
  }
  if (arr.length > event.choices.length) {
    problems.push(`效果表 ${id}: 数组长度 ${arr.length} 超过 choices 数量 ${event.choices.length}`);
    continue;
  }
  arr.forEach((object, index) => {
    if (object === null || object === undefined) return;
    if (typeof object !== "object") {
      problems.push(`效果表 ${id}[${index}]: 不是对象`);
      return;
    }
    if (index >= event.choices.length) {
      problems.push(`效果表 ${id}[${index}]: 下标越界`);
      return;
    }
    effectChoices += 1;
  });
}

const ALLOWED_SCOPES = new Set(["class", "single", "pair"]);
// 白名单以 engine.js 的 applyAttitudeTags 为准，脚本会读出来做校验。
const engineSource = fs.readFileSync(path.join(src, "engine.js"), "utf8");
const tagBlock = engineSource.slice(engineSource.indexOf("const tagEffects = {"));
const allowedTags = new Set([...tagBlock.matchAll(/^\s*"([^"]+)":\s*\{/gm)].map((m) => m[1]));
if (allowedTags.size < 10) problems.push("无法从 engine.js 解析态度标签白名单");

let metaCount = 0;
for (const [id, meta] of Object.entries(memoryMeta)) {
  if (!eventsById.has(id)) {
    problems.push(`记忆表 ${id}: 事件不存在`);
    continue;
  }
  if (!ALLOWED_SCOPES.has(meta.studentScope)) {
    problems.push(`记忆表 ${id}: studentScope=${meta.studentScope} 非法`);
    continue;
  }
  if (!Array.isArray(meta.choiceTags) || meta.choiceTags.length !== 3) {
    problems.push(`记忆表 ${id}: choiceTags 长度不为 3`);
    continue;
  }
  for (const group of meta.choiceTags) {
    for (const tag of group) {
      if (!allowedTags.has(tag)) problems.push(`记忆表 ${id}: 标签「${tag}」不在白名单`);
    }
  }
  metaCount += 1;
}

if (problems.length) {
  console.error("合并前校验失败：");
  problems.slice(0, 40).forEach((p) => console.error(`  ✗ ${p}`));
  console.error(`共 ${problems.length} 个问题，未写入任何文件。`);
  process.exit(1);
}

console.log(`校验通过：效果表 ${Object.keys(allEffects).length} 个事件 / ${effectChoices} 个 choice；记忆表 ${metaCount} 个事件`);

// ---------------------------------------------------------------- 生成代码块
const stringify = (value) => JSON.stringify(value);

const effectLines = Object.entries(allEffects).map(([id, arr]) => {
  const items = arr.map((o) => (o === null || o === undefined ? "null" : stringify(o)));
  return `    ${JSON.stringify(id)}: [${items.join(", ")}]`;
});

const metaLines = Object.entries(memoryMeta).map(([id, meta]) => {
  const tags = meta.choiceTags.map((group) => `[${group.map((t) => JSON.stringify(t)).join(", ")}]`);
  return `    ${JSON.stringify(id)}: { studentScope: ${JSON.stringify(meta.studentScope)}, choiceTags: [${tags.join(", ")}] }`;
});

const block = [
  "",
  "  // ====================================================================",
  "  // 以下三段由 tools/merge-delegated-data.js 生成，请勿手工编辑——",
  "  // 改数据请编辑对应内容后重新运行该脚本，或直接修改本段并保持格式一致。",
  "  // ====================================================================",
  "",
  "  // 事件选择效果覆写表（P1-1 数据驱动）：",
  "  // 优先级——数据表显式 effects > 下面的覆写表 > tone/category 推导值。",
  "  // 数组允许比 choices 短，或元素为 null，表示该选项沿用 tone 推导值。",
  "  const eventChoiceEffects = {",
  effectLines.join(",\n"),
  "  };",
  "",
  "  // 事件记忆元数据（P1-4）：决定事件绑定哪些学生、给哪些态度标签。",
  "  const generatedEventMemoryMeta = {",
  metaLines.join(",\n"),
  "  };",
  "",
  "  // 把覆写表挂到 events / monthEndEvents 上，之后引擎只读 choice.effects。",
  "  function applyChoiceEffects(list) {",
  "    list.forEach((event) => {",
  "      const overrides = eventChoiceEffects[event.id];",
  "      if (!overrides) return;",
  "      event.choices = event.choices.map((choice, index) => {",
  "        const override = overrides[index];",
  "        if (!override) return choice;",
  "        return { ...choice, effects: override };",
  "      });",
  "    });",
  "    return list;",
  "  }",
  "",
  "  applyChoiceEffects(events);",
  "  applyChoiceEffects(monthEndEvents);",
  "",
  "  const eventMemoryMeta = { ...generatedEventMemoryMeta, ...existingEventMemoryMeta };",
  ""
].join("\n");

// ---------------------------------------------------------------- 替换
let source = fs.readFileSync(dataPath, "utf8");
if (source.includes("const eventChoiceEffects = {")) {
  console.error("data.js 里已经存在 eventChoiceEffects，请先手工清理再运行本脚本。");
  process.exit(1);
}

const anchor = "\n  window.GameData = {";
const anchorIndex = source.indexOf(anchor);
if (anchorIndex < 0) throw new Error("找不到 window.GameData 导出锚点");
source = `${source.slice(0, anchorIndex)}\n${block}${source.slice(anchorIndex)}`;

const originalName = "  const eventMemoryMeta = {\n";
if (source.split(originalName).length - 1 !== 1) {
  throw new Error("eventMemoryMeta 声明不唯一，无法重命名");
}
source = source.replace(originalName, "  const existingEventMemoryMeta = {");

fs.writeFileSync(dataPath, source, "utf8");
console.log("已写入 src/data.js");

// ---------------------------------------------------------------- 合并后验证
const verifySandbox = { window: {} };
vm.createContext(verifySandbox);
vm.runInContext(fs.readFileSync(dataPath, "utf8"), verifySandbox, { filename: "data.js" });
const merged = verifySandbox.window.GameData;

const withEffects = merged.events.filter((e) => e.choices.some((c) => c.effects)).length;
const monthEndWithEffects = merged.monthEndEvents.filter((e) => e.choices.every((c) => c.effects)).length;
console.log(`合并后：events ${merged.events.length} 条，其中 ${withEffects} 条带显式效果；monthEndEvents ${merged.monthEndEvents.length} 条，其中 ${monthEndWithEffects} 条全部选项带效果`);
console.log(`合并后：eventMemoryMeta ${Object.keys(merged.eventMemoryMeta).length} 条（应为 ${28 + metaCount}）`);
console.log(`合并后：monthlyChallenges 已移除 = ${merged.monthlyChallenges === undefined}`);
