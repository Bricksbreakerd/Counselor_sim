/**
 * 校验 tools/archive/memory-meta.js（P1-4 记忆元数据补全稿）。
 *
 * 检查项：
 *   1) 覆盖 data.js 中尚缺 eventMemoryMeta 的事件，且不覆盖已有条目
 *   2) 每个事件恰好 3 组 choiceTags，与该事件的 choice 数量一致
 *   3) 每个标签都在 engine.js 的 applyAttitudeTags() 白名单内
 *   4) studentScope 只取 class / single / pair
 *
 * 用法: node tools/validate-memory-meta.mjs
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const dataSrc = fs.readFileSync(path.join(root, "src", "data.js"), "utf8");
const engineSrc = fs.readFileSync(path.join(root, "src", "engine.js"), "utf8");
const metaSrc = fs.readFileSync(path.join(here, "archive", "memory-meta.js"), "utf8");

// ---- engine.js 的标签白名单 ----
const tagBlock = engineSrc.slice(engineSrc.indexOf("const tagEffects = {"));
const allowedTags = new Set([...tagBlock.matchAll(/^\s*"([^"]+)":\s*\{/gm)].map((m) => m[1]));

// ---- data.js 里的事件 id 与 choice 数量 ----
// 事件定义形如： { id: "E61", category: "...", title: "...", text: "...", choices: [
//     { label: ... }, ...
//   ]},
// 用「从 id 到 choices 数组结束」的窗口统计 label 数量。
const eventChoiceCounts = new Map();
const eventPattern = /id:\s*"(E\d+)"[\s\S]*?choices:\s*\[([\s\S]*?)\n\s*\]\s*\}/g;
for (const match of dataSrc.matchAll(eventPattern)) {
  const id = match[1];
  const count = (match[2].match(/label:/g) || []).length;
  if (count > 0) eventChoiceCounts.set(id, count);
}

// ---- data.js 已有的 eventMemoryMeta 键 ----
const existingStart = dataSrc.indexOf("const existingEventMemoryMeta = {");
const existingEnd = dataSrc.indexOf("\n  };", existingStart);
const existingBlock = existingStart >= 0 ? dataSrc.slice(existingStart, existingEnd) : "";
const existingIds = new Set([...existingBlock.matchAll(/(E\d+):\s*\{/g)].map((m) => m[1]));

// ---- 载入待校验的表 ----
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(metaSrc, sandbox, { filename: "memory-meta.js" });
const table = sandbox.window.GameDataMemoryMeta;

const errors = [];
const ALLOWED_SCOPES = new Set(["class", "single", "pair"]);
if (!table) errors.push("archive/memory-meta.js 未导出 window.GameDataMemoryMeta");

const entries = Object.entries(table || {});
const scopeCounts = { class: 0, single: 0, pair: 0 };
let tagTotal = 0;

for (const [id, meta] of entries) {
  if (!eventChoiceCounts.has(id)) {
    errors.push(`${id}: 在 data.js 中找不到该事件`);
    continue;
  }
  if (existingIds.has(id)) {
    errors.push(`${id}: 覆盖了 data.js 已有的 eventMemoryMeta 条目`);
  }
  if (!ALLOWED_SCOPES.has(meta.studentScope)) {
    errors.push(`${id}: studentScope=${meta.studentScope} 非法`);
  } else {
    scopeCounts[meta.studentScope] += 1;
  }
  if (!Array.isArray(meta.choiceTags)) {
    errors.push(`${id}: choiceTags 不是数组`);
    continue;
  }
  const expected = eventChoiceCounts.get(id);
  if (meta.choiceTags.length !== expected) {
    errors.push(`${id}: choiceTags 有 ${meta.choiceTags.length} 组，事件有 ${expected} 个 choice`);
  }
  meta.choiceTags.forEach((group, index) => {
    if (!Array.isArray(group)) {
      errors.push(`${id}[${index}]: 不是数组`);
      return;
    }
    if (group.length < 1 || group.length > 3) {
      errors.push(`${id}[${index}]: 标签数量 ${group.length} 不在 1-3 之间`);
    }
    group.forEach((tag) => {
      tagTotal += 1;
      if (!allowedTags.has(tag)) errors.push(`${id}[${index}]: 标签「${tag}」不在白名单`);
    });
  });
}

const missing = [...eventChoiceCounts.keys()].filter((id) => !existingIds.has(id) && !(id in (table || {})));

console.log("=== memory-meta.js 校验 ===");
console.log(`engine.js 白名单标签数: ${allowedTags.size}`);
console.log(`data.js 事件总数: ${eventChoiceCounts.size}`);
console.log(`data.js 已有 eventMemoryMeta: ${existingIds.size}`);
console.log(`本文件条目数: ${entries.length}`);
console.log(`scope 分布: class=${scopeCounts.class} single=${scopeCounts.single} pair=${scopeCounts.pair}`);
console.log(`标签总数: ${tagTotal}`);
console.log(`仍未被覆盖的事件: ${missing.length}${missing.length ? ` -> ${missing.slice(0, 12).join(", ")}` : ""}`);

if (errors.length) {
  console.log(`\n[FAIL] ${errors.length} 个问题:`);
  errors.slice(0, 30).forEach((error) => console.log(`  ✗ ${error}`));
  process.exit(1);
}
if (missing.length) {
  console.log(`\n[FAIL] 有 ${missing.length} 个事件没有任何记忆元数据`);
  process.exit(1);
}
console.log("\n[PASS] 全部检查通过");
