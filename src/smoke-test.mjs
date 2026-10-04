/**
 * 辅导员模拟器 —— 浏览器冒烟测试
 *
 * 用无头 Edge + CDP 真实加载 index.html，验证「在浏览器里能玩」这件事：
 *   A. 开始界面 → 命名入职 → 首次渲染
 *   B. 完成一个完整月份（工作/学生/发展 + 事件 + 月终插曲 + 月总结）
 *   C. 存档写入、相位恢复、读档
 *   D. 关键运行时错误为零
 *
 * 与 harness.mjs 的分工：
 *   harness.mjs  —— 纯逻辑回归（不开浏览器，可跑几千局，含数值曲线统计）
 *   smoke-test.mjs —— 集成验证（真实 DOM、真实事件绑定、真实 localStorage）
 *
 * 用法:
 *   node smoke-test.mjs
 *   node smoke-test.mjs --edge "D:\path\to\msedge.exe" --port 9333 --headed
 */
import { spawn, spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const sourceDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(sourceDir, "..");
const pageUrl = pathToFileURL(path.join(projectDir, "index.html")).href;

const args = process.argv.slice(2);
function argValue(flag, fallback) {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

// Edge 路径：优先命令行参数，其次环境变量，最后按常见安装位置探测。
function resolveEdgePath() {
  const candidates = [
    argValue("--edge", null),
    process.env.DSH_EDGE_PATH,
    process.env.EDGE_PATH,
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/microsoft-edge",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
  ].filter(Boolean);
  const found = candidates.find((candidate) => {
    try {
      return fs.statSync(candidate).isFile();
    } catch {
      return false;
    }
  });
  if (!found) {
    throw new Error(
      `找不到 Edge 可执行文件。请用 --edge "<路径>" 或设置环境变量 DSH_EDGE_PATH 指定。\n已尝试:\n  ${candidates.join("\n  ")}`
    );
  }
  return found;
}

const edgePath = resolveEdgePath();
const debugPort = Number(argValue("--port", 9333));
const headed = args.includes("--headed");
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "counselor-sim-smoke-"));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------- 断言
const failures = [];
let assertions = 0;
function check(name, condition, detail = "") {
  assertions += 1;
  const ok = Boolean(condition);
  console.log(`  ${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures.push(name);
  return ok;
}

async function getPageTarget() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json`);
      const targets = await response.json();
      const page = targets.find((target) => target.type === "page" && target.url.startsWith("file:"));
      if (page) return page;
    } catch {
      // Edge 可能仍在启动。
    }
    await sleep(250);
  }
  throw new Error("等待 Edge DevTools target 超时。");
}

async function run() {
  const edgeArgs = [
    "--no-sandbox",
    "--disable-gpu",
    "--disable-gpu-sandbox",
    "--disable-software-rasterizer",
    "--allow-file-access-from-files",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    pageUrl
  ];
  if (!headed) edgeArgs.unshift("--headless");

  const edge = spawn(edgePath, edgeArgs, { stdio: "ignore" });

  try {
    const target = await getPageTarget();
    const socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });

    let messageId = 0;
    const pending = new Map();
    const consoleErrors = [];
    const pageExceptions = [];

    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && pending.has(message.id)) {
        pending.get(message.id)(message);
        pending.delete(message.id);
        return;
      }
      if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
        consoleErrors.push(message.params.args.map((a) => a.value ?? a.description ?? "").join(" "));
      }
      if (message.method === "Runtime.exceptionThrown") {
        pageExceptions.push(message.params.exceptionDetails?.text || "unknown exception");
      }
    });

    const send = (method, params = {}) =>
      new Promise((resolve) => {
        const id = ++messageId;
        pending.set(id, resolve);
        socket.send(JSON.stringify({ id, method, params }));
      });

    const evaluate = async (expression) => {
      const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
      const details = response.result?.exceptionDetails;
      if (details) throw new Error(details.text || details.exception?.description || "Runtime evaluation failed.");
      return response.result?.result?.value;
    };

    await send("Runtime.enable");
    await sleep(600);

    console.log("\nA. 开始界面与入职");
    check("开始界面可见", await evaluate("Boolean(document.querySelector('#startScreen:not(.hidden)'))"));
    check("介绍文案已生成", (await evaluate("document.querySelector('#introText').textContent.length")) > 20);
    check("无存档时不显示继续按钮", await evaluate("document.querySelector('#continueGameButton').hidden"));

    await evaluate("document.querySelector('#startGameButton').click()");
    check("进入命名步骤", await evaluate("!document.querySelector('#startStep2').classList.contains('hidden')"));
    await evaluate("document.querySelector('#counselorNameInput').value = '冒烟测试员'");
    await evaluate("document.querySelector('#confirmNameButton').click()");
    await sleep(300);

    check("开始界面已隐藏", await evaluate("document.querySelector('#startScreen').classList.contains('hidden')"));
    check(
      "姓名已写入侧栏",
      (await evaluate("document.querySelector('#counselorName').textContent")) === "冒烟测试员"
    );

    const tutorialVisible = await evaluate("Boolean(document.querySelector('#tutorialOverlay'))");
    check("自动弹出入职培训", tutorialVisible);
    if (tutorialVisible) {
      await evaluate("document.querySelector('#tutorialSkipButton').click()");
      await sleep(150);
    }
    check("培训可跳过", !(await evaluate("Boolean(document.querySelector('#tutorialOverlay'))")));

    console.log("\nB. 首次渲染");
    const actionCards = await evaluate("document.querySelectorAll('#actionGrid .action-card').length");
    check("工作行动卡为 13 张", actionCards === 13, `实际 ${actionCards}`);
    const studentRows = await evaluate("document.querySelectorAll('#studentTableBody tr').length");
    check("花名册为 24 人", studentRows === 24, `实际 ${studentRows}`);
    const problemCards = await evaluate("document.querySelectorAll('.problem-card').length");
    check("问题学生卡为 3 张", problemCards === 3, `实际 ${problemCards}`);
    const uniqueCards = await evaluate(
      "new Set([...document.querySelectorAll('.problem-card .focus-student-name')].map((n) => n.textContent)).size"
    );
    check("3 名问题学生不重复", uniqueCards === 3, `唯一 ${uniqueCards}`);
    const challengeCards = await evaluate("document.querySelectorAll('.challenge-card').length");
    check("本月校园动态为 2 条", challengeCards === 2, `实际 ${challengeCards}`);
    check(
      "底部「开始本月」操作条存在",
      await evaluate("Boolean(document.querySelector('#monthStartBar'))")
    );

    console.log("\nC. 完成一个完整月份");
    // 选 3 项重点工作
    const actionIds = await evaluate(
      "JSON.stringify([...document.querySelectorAll('#actionGrid .action-card')].map((b) => b.dataset.actionId))"
    );
    const picks = JSON.parse(actionIds).slice(0, 3);
    for (const id of picks) {
      await evaluate(`document.querySelector('[data-action-id="${id}"]').click()`);
    }
    const selectedCount = await evaluate("document.querySelector('#actionCount').textContent");
    check("重点工作已选 3 项", selectedCount.includes("3 / 3"), selectedCount);

    // 选择学期发展项目 + 具体方向
    await evaluate("document.querySelector('[data-project-id=\"DP01\"]').click()");
    await evaluate("document.querySelector('#confirmProjectButton').click()");
    await sleep(80);
    check("项目已确认进入方向选择", await evaluate("document.querySelectorAll('[data-scenario-index]').length") > 0);
    await evaluate("document.querySelector('[data-scenario-index=\"0\"]').click()");
    await evaluate("document.querySelector('#confirmScenarioButton').click()");
    await sleep(80);
    check("方向确认后显示项目面板", await evaluate("Boolean(document.querySelector('.project-dashboard'))"));

    // 3 名学生各选一种处理方式
    for (let index = 0; index < 3; index += 1) {
      await evaluate(`document.querySelectorAll('.problem-card .method-button')[${index * 3}].click()`);
    }
    const methodsSelected = await evaluate("document.querySelectorAll('.problem-card .method-button.selected').length");
    check("3 名学生已选处理方式", methodsSelected === 3, `实际 ${methodsSelected}`);
    const hint = await evaluate("document.querySelector('#planHint').textContent");
    check("计划提示显示三项均已完成", hint.includes("重点工作已完成") && hint.includes("问题学生已完成"), hint);
    check("底部操作条同步了提示", (await evaluate("document.querySelector('#monthStartHint').textContent")) === hint);

    // 进入本月
    await evaluate("document.querySelector('#startMonthButton').click()");
    await sleep(250);
    check("自动切到事件页", await evaluate("document.querySelector('#eventTab').classList.contains('active')"));
    check("事件卡已显示", await evaluate("Boolean(document.querySelector('.event-card'))"));
    const choiceCount = await evaluate("document.querySelectorAll('.event-stage .choice-button').length");
    check("事件提供 3 个选项", choiceCount === 3, `实际 ${choiceCount}`);

    // 把本月事件全部处理完
    for (let step = 0; step < 12; step += 1) {
      const hasChoice = await evaluate("Boolean(document.querySelector('.event-stage .choice-button'))");
      if (!hasChoice) break;
      await evaluate("document.querySelector('.event-stage .choice-button').click()");
      await sleep(90);
    }

    const monthEventVisible = await evaluate("Boolean(document.querySelector('#monthEventOverlay'))");
    check("月末插曲弹窗出现", monthEventVisible);
    if (monthEventVisible) {
      await evaluate("document.querySelector('#monthEventOverlay .choice-button').click()");
      await sleep(250);
    }
    const summaryVisible = await evaluate("Boolean(document.querySelector('#monthSummaryOverlay'))");
    check("月总结弹窗出现", summaryVisible);
    if (summaryVisible) {
      const resultRows = await evaluate("document.querySelectorAll('#monthSummaryOverlay .summary-result-row').length");
      check("月总结包含学生处理结果", resultRows >= 3, `实际 ${resultRows}`);
      const challengeRows = await evaluate("document.querySelectorAll('#monthSummaryOverlay .summary-challenge').length");
      check("月总结包含校园动态结算", challengeRows === 2, `实际 ${challengeRows}`);
      await evaluate("document.querySelector('#closeSummaryButton').click()");
      await sleep(250);
    }

    check("已回到 planning 相位", (await evaluate("window.__dshPhase()")) === "planning");
    check("月份已推进到第 2 月", (await evaluate("document.querySelector('#monthLabel').textContent")) === "第 2 月");
    check("时间线已记录选择", (await evaluate("document.querySelectorAll('.timeline-entry').length")) > 0);

    console.log("\nD. 存档与相位恢复");
    await evaluate("document.querySelector('#saveButton').click()");
    await sleep(150);
    const savedRaw = await evaluate("localStorage.getItem('counselor-sim-save-v1') ? 'yes' : 'no'");
    check("已写入 localStorage", savedRaw === "yes");
    const savedVersion = await evaluate("JSON.parse(localStorage.getItem('counselor-sim-save-v1')).version");
    check("存档版本为 2", savedVersion === 2, `实际 ${savedVersion}`);
    const savedEvents = await evaluate("JSON.parse(localStorage.getItem('counselor-sim-save-v1')).recentEventIds.length");
    check("存档包含事件冷却窗口", savedEvents > 0, `实际 ${savedEvents}`);

    // 重新加载页面，走「继续游戏」路径
    await send("Page.enable");
    await send("Page.reload", { ignoreCache: true });
    await sleep(900);
    check("重载后回到开始界面", await evaluate("Boolean(document.querySelector('#startScreen:not(.hidden)'))"));
    const continueShown = await evaluate("!document.querySelector('#continueGameButton').hidden");
    check("重载后「继续游戏」可用", continueShown);
    await evaluate("document.querySelector('#continueGameButton').click()");
    await sleep(300);
    check("读档后回到第 2 月", (await evaluate("document.querySelector('#monthLabel').textContent")) === "第 2 月");
    check("读档后相位为 planning", (await evaluate("window.__dshPhase()")) === "planning");

    for (let index = 0; index < 4; index += 1) {
      const visible = await evaluate("Boolean(document.querySelector('#tutorialOverlay'))");
      if (!visible) break;
      await evaluate("document.querySelector('#tutorialSkipButton').click()");
      await sleep(100);
    }

    console.log("\nE. 运行时健康检查");
    check("无未捕获异常", pageExceptions.length === 0, pageExceptions.slice(0, 3).join(" | "));
    check("无 console.error", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));

    socket.close();
  } finally {
    edge.kill();
    await sleep(300);
    if (!edge.killed) {
      spawnSync("taskkill", ["/pid", String(edge.pid), "/t", "/f"], { stdio: "ignore" });
    }
    try {
      fs.rmSync(profileDir, { recursive: true, force: true });
    } catch {
      // 临时目录清理失败不影响结论。
    }
  }
}

run()
  .then(() => {
    console.log(`\n断言: ${assertions - failures.length}/${assertions} 通过`);
    if (failures.length) {
      console.log("失败项:");
      failures.forEach((failure) => console.log(`  ✗ ${failure}`));
      process.exit(1);
    }
    console.log("浏览器冒烟测试全部通过 ✓");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
