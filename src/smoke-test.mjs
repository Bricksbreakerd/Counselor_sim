import { spawn, spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const sourceDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(sourceDir, "..");
const pageUrl = pathToFileURL(path.join(projectDir, "index.html")).href;
const debugPort = 9333;
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "counselor-sim-smoke-"));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getPageTarget() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json`);
      const targets = await response.json();
      const page = targets.find((target) => target.type === "page" && target.url.startsWith("file:"));
      if (page) return page;
    } catch {
      // Edge may still be starting.
    }
    await sleep(200);
  }
  throw new Error("Timed out waiting for Edge DevTools target.");
}

async function run() {
  const edge = spawn(
    edgePath,
    [
      "--headless",
      "--no-sandbox",
      "--disable-gpu",
      "--disable-gpu-sandbox",
      "--disable-software-rasterizer",
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${profileDir}`,
      pageUrl
    ],
    { stdio: "ignore" }
  );

  try {
    const target = await getPageTarget();
    const socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });

    let messageId = 0;
    const pending = new Map();
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && pending.has(message.id)) {
        pending.get(message.id)(message);
        pending.delete(message.id);
      }
    });

    const send = (method, params = {}) =>
      new Promise((resolve) => {
        const id = ++messageId;
        pending.set(id, resolve);
        socket.send(JSON.stringify({ id, method, params }));
      });

    const evaluate = async (expression) => {
      const response = await send("Runtime.evaluate", {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      if (response.result?.exceptionDetails) {
        throw new Error(response.result.exceptionDetails.text || "Runtime evaluation failed.");
      }
      return response.result?.result?.value;
    };

    await send("Runtime.enable");
    await sleep(500);

    const results = {};
    results.startScreenVisible = await evaluate("Boolean(document.querySelector('#startScreen:not(.hidden)'))");
    results.continueHidden = await evaluate("document.querySelector('#continueGameButton').hidden");
    results.introTextLength = await evaluate("document.querySelector('#introText').textContent.length");

    await evaluate("document.querySelector('#startGameButton').click()");
    await evaluate("document.querySelector('#counselorNameInput').value = '测试辅导员'");
    await evaluate("document.querySelector('#confirmNameButton').click()");
    await sleep(200);

    results.startScreenHidden = await evaluate("document.querySelector('#startScreen').classList.contains('hidden')");
    const tutorialVisible = await evaluate("Boolean(document.querySelector('#tutorialOverlay'))");
    if (tutorialVisible) {
      await evaluate("document.querySelector('#tutorialSkipButton').click()");
      await sleep(100);
    }
    results.actionCards = await evaluate("document.querySelectorAll('#actionGrid .action-card').length");
    results.developmentCards = await evaluate("document.querySelectorAll('.project-select-card').length");
    results.studentRows = await evaluate("document.querySelectorAll('#studentTableBody tr').length");

    await evaluate("document.querySelector('[data-action-id=\"W01\"]').click()");
    await evaluate("document.querySelector('[data-action-id=\"W03\"]').click()");
    await evaluate("document.querySelector('[data-action-id=\"W04\"]').click()");
    results.selectedCount = await evaluate("document.querySelector('#actionCount').textContent");

    await evaluate("document.querySelector('[data-project-id=\"DP01\"]').click()");
    await evaluate("document.querySelector('#confirmProjectButton').click()");
    await evaluate("document.querySelector('[data-scenario-index=\"0\"]').click()");
    await evaluate("document.querySelector('#confirmScenarioButton').click()");
    results.developmentSelected = await evaluate("Boolean(document.querySelector('.project-dashboard'))");

    results.problemCards = await evaluate("document.querySelectorAll('.problem-card').length");
    await evaluate("document.querySelectorAll('.problem-card .method-button')[0].click()");
    await evaluate("document.querySelectorAll('.problem-card .method-button')[3].click()");
    await evaluate("document.querySelectorAll('.problem-card .method-button')[6].click()");
    results.studentMethodsSelected = await evaluate("document.querySelectorAll('.problem-card .method-button.selected').length");

    await evaluate("document.querySelector('#startMonthButton').click()");
    await sleep(200);
    results.eventCardVisible = await evaluate("Boolean(document.querySelector('.event-card'))");
    results.choiceCount = await evaluate("document.querySelectorAll('.choice-button').length");
    results.eventTabActive = await evaluate("document.querySelector('#eventTab').classList.contains('active')");
    results.eventTabDisplay = await evaluate("getComputedStyle(document.querySelector('#eventTab')).display");
    results.monthChallenges = await evaluate("document.querySelectorAll('.challenge-card').length");

    for (let index = 0; index < 10; index += 1) {
      const hasChoice = await evaluate("Boolean(document.querySelector('.event-stage .choice-button'))");
      if (!hasChoice) break;
      await evaluate("document.querySelector('.event-stage .choice-button').click()");
      await sleep(80);
    }

    results.eventCardAfterChoices = await evaluate("Boolean(document.querySelector('.event-card'))");
    results.monthEventOverlayVisible = await evaluate("Boolean(document.querySelector('#monthEventOverlay'))");
    results.monthEventChoiceCount = await evaluate("document.querySelectorAll('#monthEventOverlay .choice-button').length");
    if (results.monthEventOverlayVisible) {
      await evaluate("document.querySelector('#monthEventOverlay .choice-button').click()");
      await sleep(200);
    }
    results.monthSummaryOverlayVisible = await evaluate("Boolean(document.querySelector('#monthSummaryOverlay'))");
    results.studentResultRows = await evaluate("document.querySelectorAll('#monthSummaryOverlay .summary-result-row').length");
    if (results.monthSummaryOverlayVisible) {
      await evaluate("document.querySelector('#closeSummaryButton').click()");
      await sleep(200);
    }
    results.timelineEntries = await evaluate("document.querySelectorAll('.timeline-entry').length");
    results.monthLabel = await evaluate("document.querySelector('#monthLabel').textContent");

    await evaluate("document.querySelector('#saveButton').click()");
    results.saved = true;

    console.log(JSON.stringify(results, null, 2));
    socket.close();
  } finally {
    edge.kill();
    await sleep(300);
    if (!edge.killed) {
      spawnSync("taskkill", ["/pid", String(edge.pid), "/t", "/f"], { stdio: "ignore" });
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
