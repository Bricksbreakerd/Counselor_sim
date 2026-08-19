(function () {
  const GameEngine = window.GameEngine;
  const GameData = window.GameData;

  const savedGame = GameEngine.loadState();
  let state = savedGame || GameEngine.createInitialState();
  let hasSavedGame = Boolean(savedGame && savedGame.started);
  let pendingProjectId = null;
  let pendingDevelopmentEvent = null;
  let pendingScenarioIndex = null;
  let tutorialIndex = 0;

  const tutorialSteps = [
    {
      title: "欢迎入职",
      content: "欢迎加入辅导员队伍。你将负责一个固定班级，从大一带到毕业，一共 8 个学期。\n你的选择会影响学生发展、领导评价、职业晋升，以及你能不能活着送走这届学生。\n从今天起，你就是光荣的牛马辅导员。",
      target: null
    },
    {
      title: "工作模块",
      content: "每个月需要选择 3 项重点工作。\n学生工作影响学生信任和班级风险，行政事务影响领导评价和材料风险，个人恢复影响身体、精力和心理。\n你不可能把所有事都做完，重点是你没做的那些会不会在月底爆炸。",
      tab: "work",
      target: "#workTab"
    },
    {
      title: "学生模块",
      content: "每个月会自动生成 3 名问题学生，你需要为每名学生选择处理方式。\n处理方式会影响学生属性、风险值、信任关系。没有解决的问题下个月还会继续出现。\n学生不是数据，但游戏里他们确实是数据。",
      tab: "student",
      target: "#studentTab"
    },
    {
      title: "发展模块",
      content: "每个学期先选择一个发展模块，再随机三选一具体方向。\n权威项目收益高，但风险和难度也高；野鸡项目可能容易，但含金量低。\n你可以认真搞科研，也可以报名“全国大学生校园锦鲤大赛”。",
      tab: "develop",
      target: "#developTab"
    },
    {
      title: "你的状态",
      content: "左边是你的身体、精力、心理、存款和外部关系。\n身体低于 15 可能猝死，精力过低会影响行动效率和月底生活支出，心理过低会触发负面状态。\n你可以把它当成一份体检报告。现在数值都很好，但它们不会一直很好。",
      target: "#counselorPanel"
    },
    {
      title: "战略性摸鱼",
      content: "每个周期可以摸鱼 2 次。\n点击进入本月后，本月结束前仍然可以摸鱼。摸鱼不能解决工作，但能让你活得更久。\n摸鱼不是偷懒，是战略性续命。",
      target: ".slack-box"
    },
    {
      title: "右侧时间线",
      content: "时间线会记录你的每一次选择、事件结果、月报和学期总结。\n它不可修改。你做出的选择会留下痕迹，并影响后续学生记忆和个人结局。\n这里以后会写满你的光辉事迹、翻车现场和“我当时为什么要选这个”。",
      target: "#timeline"
    },
    {
      title: "准备开始",
      content: "点击右上角的“进入本月”后，会自动进入事件页。\n你需要处理随机事件、校园动态和月终插曲。\n现在，去处理你的第一件烂摊子吧。",
      target: "#startMonthButton"
    }
  ];

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function clampText(value) {
    return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  }

  function formatEffectText(effects) {
    const labels = {
      energy: "精力",
      health: "身体",
      mental: "心理",
      savings: "存款",
      leadership: "领导",
      trust: "学生信任",
      parent: "家长",
      colleague: "同事",
      risk: "风险"
    };
    return Object.entries(effects || {})
      .filter(([, value]) => value !== 0)
      .map(([key, value]) => `${labels[key] || key} ${value > 0 ? "+" : ""}${value}`)
      .join(" · ");
  }

  function renderScore(value) {
    const safeValue = Math.round(Number(value) || 0);
    return `<span class="${safeValue < 45 ? "danger-score" : ""}">${safeValue}</span>`;
  }

  function getStatus(c) {
    if (c.health < 15) return "危险";
    if (c.health < 40) return "生病";
    if (c.mental < 25) return "焦虑";
    if (c.energy < 30) return "疲惫";
    if (c.mental < 50) return "低落";
    return "正常";
  }

  function hideStartScreen() {
    const screen = $("#startScreen");
    screen.classList.add("hidden");
  }

  function showStartScreen() {
    const screen = $("#startScreen");
    screen.classList.remove("hidden");
    $("#startStep1").classList.remove("hidden");
    $("#startStep2").classList.add("hidden");
    renderIntro();
  }

  function renderIntro() {
    const schools = window.GameData.introSchools;
    const school = schools[Math.floor(Math.random() * schools.length)];
    $("#introText").textContent = `你是一名研究生应届毕业生，经过不懈努力，终于上岸了【${school}】学校，现在开始你的工作吧。`;
  }

  function canStartMonth() {
    if (state.phase !== "planning" || state.gameOver) return false;
    const workReady = state.selectedActions.length >= state.minWorkActions;
    const developmentReady =
      state.month === 1
        ? Boolean(state.developmentProjectId && state.developmentScenario)
        : Boolean(state.developmentProjectId && state.developmentEvent && state.developmentEventResolved);
    const problemReady =
      state.problemStudents.length === 3 &&
      state.problemStudents.every((problem) => state.studentHandling[problem.studentId] !== undefined);
    return workReady && developmentReady && problemReady;
  }

  function getPlanHint() {
    if (state.phase !== "planning" || state.gameOver) return "本月计划已经进入执行阶段。";
    const parts = [];
    if (state.selectedActions.length < state.minWorkActions) {
      parts.push(`重点工作 ${state.selectedActions.length}/${state.minWorkActions}`);
    } else {
      parts.push(`重点工作已完成`);
    }
    const developmentReady =
      state.month === 1
        ? Boolean(state.developmentProjectId && state.developmentScenario)
        : Boolean(state.developmentProjectId && state.developmentEvent && state.developmentEventResolved);
    if (!developmentReady) {
      parts.push(state.month === 1 ? "未选择学期发展项目" : "未处理本月发展事件");
    } else {
      parts.push("发展项目已完成");
    }
    const handled = state.problemStudents.filter((problem) => state.studentHandling[problem.studentId] !== undefined).length;
    if (handled < state.problemStudents.length) {
      parts.push(`问题学生 ${handled}/${state.problemStudents.length}`);
    } else {
      parts.push(`问题学生已完成`);
    }
    return parts.join(" · ");
  }

  function renderTopbar() {
    $("#semesterLabel").textContent = `第 ${state.semester} 学期`;
    const monthName = state.month === 5 ? "假期月" : `第 ${state.month} 月`;
    $("#monthLabel").textContent = monthName;
    $("#weekLabel").textContent = `第 ${state.week} 周`;
    $(".topbar h1").textContent = "辅导员模拟器";
  }

  function renderCounselor() {
    const c = state.counselor;
    $("#counselorName").textContent = c.name;
    $("#counselorStatus").textContent = `状态：${getStatus(c)} · ${state.rankTitle}`;
    $("#counselorAvatar").textContent = c.name.slice(0, 1);

    $("#counselorStats").innerHTML = [
      ["身体", c.health],
      ["精力", c.energy],
      ["心理", c.mental],
      ["存款", c.savings]
    ]
      .map(([label, value]) => {
        const isMoney = label === "存款";
        const display = isMoney ? `${Number(value).toLocaleString("zh-CN")} 元` : `${clampText(value)} / 100`;
        return `
          <div class="stat-row">
            <div class="stat-label"><span>${label}</span><strong>${display}</strong></div>
            ${isMoney ? "" : `<div class="meter"><span style="width:${clampText(value)}%"></span></div>`}
          </div>
        `;
      })
      .join("");

    $("#relationStats").innerHTML = [
      ["领导评价", c.leadership],
      ["学生信任", c.trust],
      ["家长满意度", c.parent],
      ["同事关系", c.colleague],
      ["班级风险", c.risk]
    ]
      .map(([label, value]) => {
        const danger = label === "班级风险";
        return `
          <div class="stat-row relation-row">
            <div class="stat-label"><span>${label}</span><strong>${clampText(value)}</strong></div>
            <div class="meter ${danger ? "danger" : ""}"><span style="width:${clampText(value)}%"></span></div>
          </div>
        `;
      })
      .join("");

    $("#slackRemaining").textContent = `${state.slackRemaining} / 2`;
    $("#slackActions").innerHTML = GameEngine.getSlackItems()
      .map((item) => {
        const disabled = !["planning", "events"].includes(state.phase) || state.gameOver || state.slackRemaining <= 0;
        return `
          <button class="slack-button" data-slack-id="${item.id}" ${disabled ? "disabled" : ""}>
            ${escapeHtml(item.name)}
          </button>
        `;
      })
      .join("");
  }

  function renderActions() {
    const container = $("#actionGrid");
    const selected = new Set(state.selectedActions);
    container.innerHTML = GameEngine.getActions()
      .filter((action) => action.scope === "work")
      .map((action) => {
        const isSelected = selected.has(action.id);
        const disabled = state.phase !== "planning" || state.gameOver;
        const categoryClass =
          action.category === "学生工作" ? "work-category" : action.category === "行政事务" ? "admin-category" : "recovery-category";
        return `
          <button class="action-card ${categoryClass} ${isSelected ? "selected" : ""}" data-action-id="${action.id}" ${disabled ? "disabled" : ""}>
            <span class="action-category">${action.category}</span>
            <strong>${escapeHtml(action.name)}</strong>
            <span>${escapeHtml(action.summary)}</span>
          </button>
        `;
      })
      .join("");
    $("#actionCount").textContent = `已选 ${state.selectedActions.length} / ${state.maxActions}`;
    const ready = canStartMonth();
    $("#startMonthButton").disabled = state.phase !== "planning" || !!state.gameOver;
    $("#startMonthButton").textContent = "进入本月";
    $("#planHint").textContent = getPlanHint();
  }

  function renderMonthBrief() {
    const container = $("#monthBrief");
    if (!state.monthChallenges.length) {
      container.innerHTML = "";
      return;
    }
    container.innerHTML = `
      <div class="month-brief-head">
        <span>本月校园动态</span>
        <small>未处理会在月底付出代价</small>
      </div>
      <div class="challenge-list">
        ${state.monthChallenges
          .map(
            (challenge) => `
              <div class="challenge-card">
                <strong>${escapeHtml(challenge.title)}</strong>
                <span>${escapeHtml(challenge.desc)}</span>
                <small class="challenge-impact">未处理影响：${escapeHtml(formatEffectText(challenge.penalty))}</small>
              </div>
            `
          )
          .join("")}
      </div>
    `;
  }

  function renderStudents() {
    const problemIds = new Set(state.problemStudents.map((problem) => problem.studentId));
    const problemContainer = $("#problemStudents");

    if (state.problemStudents.length) {
      problemContainer.innerHTML = state.problemStudents
        .map((problem) => {
          const student = state.students.find((item) => item.id === problem.studentId);
          if (!student) return "";
          const selectedIndex = state.studentHandling[problem.studentId];
          return `
            <article class="focus-card problem-card">
              <div class="focus-card-head">
                <div>
                  <strong>${escapeHtml(student.name)}</strong>
                  <span class="issue-title">${escapeHtml(problem.title)}</span>
                </div>
                <span class="issue-risk">${problem.carryOver ? "上月未解决 · " : ""}风险 ${student.risk}</span>
              </div>
              <p>${escapeHtml(problem.desc)}</p>
              <div class="need-tags">
                ${problem.needs.map((need) => `<i>${escapeHtml(need)}</i>`).join("")}
              </div>
              <div class="handling-methods">
                ${problem.methods
                  .map(
                    (method, methodIndex) => `
                      <button class="method-button ${selectedIndex === methodIndex ? "selected" : ""}" data-student-id="${problem.studentId}" data-method-index="${methodIndex}" ${state.phase !== "planning" || state.gameOver ? "disabled" : ""}>
                        <strong>${escapeHtml(method.label)} <i class="method-tag">${escapeHtml(method.tag)}</i></strong>
                        <small>${escapeHtml(method.outcome)}</small>
                      </button>
                    `
                  )
                  .join("")}
              </div>
            </article>
          `;
        })
        .join("");
    } else {
      problemContainer.innerHTML = `<div class="empty-state compact"><p>正在生成问题学生。</p></div>`;
    }

    $("#studentTableBody").innerHTML = state.students
      .map((student) => {
        const attrs = student.attributes;
        return `
          <tr class="${problemIds.has(student.id) ? "focused" : ""}">
            <td>
              <span class="student-name" data-tooltip="${escapeHtml(student.backstory)}" title="${escapeHtml(student.backstory)}">${escapeHtml(student.name)}</span>
              <small>${student.traits.slice(0, 2).map(escapeHtml).join(" · ")}${student.issueState?.activeIssueId ? " · 问题待解决" : ""}</small>
            </td>
            <td>
              <span class="state-dot signal-dot state-${escapeHtml(student.state)}" data-tooltip="${escapeHtml(student.pendingEvent)}" title="${escapeHtml(student.pendingEvent)}">${escapeHtml(student.state)}</span>
            </td>
            <td>${renderScore(attrs.study)}</td>
            <td>${renderScore(attrs.mental)}</td>
            <td>${renderScore(attrs.employment)}</td>
            <td>${renderScore(attrs.social)}</td>
            <td>${student.relation.trust}</td>
          </tr>
        `;
      })
      .join("");
  }

  function renderEvent() {
    const container = $("#eventStage");
    const current = GameEngine.getCurrentEvent(state);

    if (state.gameOver) {
      container.innerHTML = `
        <div class="event-card ending-card">
          <p class="eyebrow">学期总结</p>
          <h2>${escapeHtml(state.gameOver.title)}</h2>
          <p>${escapeHtml(state.gameOver.text)}</p>
        </div>
      `;
      return;
    }

    if (!current) {
      container.innerHTML = `
        <div class="empty-state">
          <p class="eyebrow">事件中心</p>
          <h2>暂时风平浪静</h2>
          <p>选择本月工作后，随机事件会在这里出现。</p>
        </div>
      `;
      return;
    }

    const remaining = state.eventQueue.length;
    const eventLabel = current.isMonthEnd ? "月终事件" : current.category;
    container.innerHTML = `
      <article class="event-card">
        <div class="event-meta">
          <span>${escapeHtml(eventLabel)}</span>
          <span>待处理 ${remaining + 1}</span>
        </div>
        <p class="eyebrow">第 ${state.month} 月 · 第 ${state.week} 周</p>
        <h2>${escapeHtml(current.title)}</h2>
        <p class="event-text">${escapeHtml(current.text)}</p>
        <div class="choice-list">
          ${current.choices
            .map(
              (choice, index) => `
                <button class="choice-button" data-choice-index="${index}">
                  <span>${escapeHtml(choice.label)}</span>
                  <small>${escapeHtml(choice.outcome)}</small>
                </button>
              `
            )
            .join("")}
        </div>
      </article>
    `;
  }

  function renderDevelop() {
    const c = state.counselor;
    const projects = GameEngine.getDevelopmentProjects();
    const project = state.developmentProject;

    $("#developList").innerHTML = `
      <div class="develop-summary">
        <div class="develop-card">
          <span>当前等级</span>
          <strong>${escapeHtml(state.rankTitle)}</strong>
          <p>${escapeHtml(state.rankTrack || "尚未确定发展路线")}</p>
        </div>
        <div class="develop-card">
          <span>职业积分</span>
          <strong>${state.careerPoints}</strong>
          <p>通过学期项目和晋升逐步积累。</p>
        </div>
        <div class="develop-card">
          <span>本学期项目</span>
          <strong>${project ? escapeHtml(project.name) : "未选择"}</strong>
          <p>${project ? `${state.developmentScenario?.name || project.track} · 进度 ${project.progress} · 质量 ${project.quality} · 风险 ${project.risk}` : "请在学期初确定项目。"}</p>
        </div>
      </div>

      ${
        !state.developmentProjectId
          ? `
            <div class="develop-plan-head">
              <div>
                <p class="eyebrow">学期项目选择</p>
                <h2>选择本学期发展项目</h2>
              </div>
            </div>
            <div class="project-select-grid">
              ${projects
                .map(
                  (item) => `
                    <button class="project-select-card ${pendingProjectId === item.id ? "selected" : ""}" data-project-id="${item.id}" ${state.phase !== "planning" || state.gameOver ? "disabled" : ""}>
                      <span>${escapeHtml(item.track)}</span>
                      <strong>${escapeHtml(item.name)}</strong>
                      <small>${escapeHtml(item.desc)}</small>
                    </button>
                  `
                )
                .join("")}
            </div>
            ${
              pendingProjectId
                ? `<div class="project-confirm-bar"><button id="confirmProjectButton" class="primary-button">确认选择本项目</button><span>确认后本学期不可更换。</span></div>`
                : ""
            }
          `
          : !state.developmentScenario
          ? `
            <div class="develop-plan-head">
              <div>
                <p class="eyebrow">选择具体方向</p>
                <h2>${escapeHtml(project.name)}</h2>
              </div>
            </div>
            <div class="scenario-select-grid">
              ${(state.developmentScenarioOptions || [])
                .map(
                  (scenario, index) => `
                    <button class="scenario-select-card ${pendingScenarioIndex === index ? "selected" : ""}" data-scenario-index="${index}" ${state.phase !== "planning" || state.gameOver ? "disabled" : ""}>
                      <strong>${escapeHtml(scenario.name)}</strong>
                      <span>含金量：${escapeHtml(scenario.quality || "未知")}</span>
                    </button>
                  `
                )
                .join("")}
            </div>
            ${
              pendingScenarioIndex !== null
                ? `<div class="project-confirm-bar"><button id="confirmScenarioButton" class="primary-button">确认这个方向</button><span>确认后本学期不可更换。</span></div>`
                : ""
            }
          `
          : `
            <div class="develop-plan-head">
              <div>
                <p class="eyebrow">本学期发展项目</p>
                <h2>${escapeHtml(project.name)}</h2>
              </div>
            </div>
            <div class="project-dashboard">
              <div class="project-metric">
                <span>进度</span>
                <div class="meter"><span style="width:${project.progress}%"></span></div>
                <strong>${project.progress}</strong>
              </div>
              <div class="project-metric">
                <span>质量</span>
                <div class="meter"><span style="width:${project.quality}%"></span></div>
                <strong>${project.quality}</strong>
              </div>
              <div class="project-metric danger">
                <span>风险</span>
                <div class="meter danger"><span style="width:${project.risk}%"></span></div>
                <strong>${project.risk}</strong>
              </div>
            </div>
            ${
              state.developmentEvent
                ? `
                  <div class="development-event-card">
                    <p class="eyebrow">本月发展事件</p>
                    ${state.developmentScenario ? `<p class="development-scenario">${escapeHtml(state.developmentScenario.name)}</p>` : ""}
                    <h3>${escapeHtml(state.developmentEvent.title)}</h3>
                    <p>${escapeHtml(state.developmentEvent.text)}</p>
                    <div class="summary-choices">
                      ${state.developmentEvent.choices
                        .map((choice, index) => {
                          const selectedIndex = pendingDevelopmentEvent?.id === state.developmentEvent.id ? pendingDevelopmentEvent.index : -1;
                          return `
                            <button class="choice-button ${selectedIndex === index ? "selected" : ""}" data-development-event-choice="${index}" ${state.developmentEventResolved ? "disabled" : ""}>
                              <span>${escapeHtml(choice.label)}</span>
                              <small>${escapeHtml(choice.outcome)}</small>
                            </button>
                          `;
                        })
                        .join("")}
                    </div>
                    ${ 
                      state.developmentEventResolved
                        ? `
                          <div class="development-result-card">
                            <strong>本月发展事件已处理。</strong>
                            ${
                              state.monthDevelopmentResult
                                ? `
                                  <p>选择：${escapeHtml(state.monthDevelopmentResult.choiceLabel)}</p>
                                  <p>结果：${escapeHtml(state.monthDevelopmentResult.outcome)}</p>
                                  <div class="summary-result-meta">
                                    <span>进度 ${state.monthDevelopmentResult.progress}</span>
                                    <span>质量 ${state.monthDevelopmentResult.quality}</span>
                                    <span>风险 ${state.monthDevelopmentResult.risk}</span>
                                  </div>
                                `
                                : ""
                            }
                          </div>
                        `
                        : pendingDevelopmentEvent?.id === state.developmentEvent.id
                        ? `<div class="project-confirm-bar"><button id="confirmDevelopmentEventButton" class="primary-button">确认处理方式</button><span>确认后本月发展事件才会结算。</span></div>`
                        : ""
                    }
                  </div>
                `
                : ""
            }
          `
      }
    `;
  }

  function getClassAverage() {
    if (!state.students.length) return 0;
    const total = state.students.reduce((sum, student) => {
      const a = student.attributes;
      return sum + (a.study + a.mental + a.employment + a.social) / 4;
    }, 0);
    return Math.round(total / state.students.length);
  }

  function renderTimeline() {
    const container = $("#timeline");
    if (!state.timeline.length) {
      container.innerHTML = `<div class="empty-state compact"><p>还没有记录。</p><p>你的选择会在这里留下痕迹。</p></div>`;
      return;
    }
    container.innerHTML = state.timeline
      .slice(0, 80)
      .map(
        (entry) => `
          <article class="timeline-entry timeline-${escapeHtml(entry.type)}">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <div class="timeline-head">
                <strong>${escapeHtml(entry.title)}</strong>
                <time>${escapeHtml(entry.time)}</time>
              </div>
              <p>${escapeHtml(entry.text)}</p>
            </div>
          </article>
        `
      )
      .join("");
  }

  function renderGameOver() {
    const existing = $("#gameOverOverlay");
    if (state.gameOver && !existing) {
      const overlay = document.createElement("div");
      overlay.id = "gameOverOverlay";
      overlay.className = "overlay";
      overlay.innerHTML = `
        <div class="overlay-card">
          <p class="eyebrow">结局</p>
          <h2>${escapeHtml(state.gameOver.title)}</h2>
          <p>${escapeHtml(state.gameOver.text)}</p>
          ${
            state.playerEndingSummary
              ? `<div class="ending-summary">${escapeHtml(state.playerEndingSummary)}</div>`
              : ""
          }
          ${
            state.studentEndings?.length
              ? `<div class="ending-gallery">
                  ${state.studentEndings
                    .map(
                      (ending) => `
                        <div class="student-ending-card">
                          <div>
                            <strong>${escapeHtml(ending.name)}</strong>
                            <span>${escapeHtml(ending.attitude)} · 发展 ${ending.average}</span>
                          </div>
                          <p>“${escapeHtml(ending.quote)}”</p>
                        </div>
                      `
                    )
                    .join("")}
                </div>`
              : ""
          }
          <button id="restartButton" class="primary-button">重新开始</button>
        </div>
      `;
      document.body.appendChild(overlay);
      $("#restartButton").addEventListener("click", () => {
        state = GameEngine.resetState();
        hasSavedGame = false;
        document.body.removeChild(overlay);
        render();
        showStartScreen();
        $("#continueGameButton").hidden = true;
      });
    }
  }

  function renderMonthEvent() {
    const existing = $("#monthEventOverlay");
    if (state.phase !== "monthEvent" || !state.summaryEvent) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;

    const event = state.summaryEvent;
    const overlay = document.createElement("div");
    overlay.id = "monthEventOverlay";
    overlay.className = "overlay";
    overlay.innerHTML = `
      <div class="overlay-card">
        <p class="eyebrow">月末插曲</p>
        <h2>${escapeHtml(event.title)}</h2>
        <p>${escapeHtml(event.text)}</p>
        <div class="summary-choices">
          ${event.choices
            .map(
              (choice, index) => `
                <button class="choice-button" data-month-event-choice="${index}">
                  <span>${escapeHtml(choice.label)}</span>
                  <small>${escapeHtml(choice.outcome)}</small>
                </button>
              `
            )
            .join("")}
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (event) => {
      const button = event.target.closest("[data-month-event-choice]");
      if (!button) return;
      const result = GameEngine.resolveSummaryChoice(state, Number(button.dataset.monthEventChoice));
      if (result) {
        overlay.remove();
        render();
      }
    });
  }

  function renderMonthSummary() {
    const existing = $("#monthSummaryOverlay");
    if (state.phase !== "monthSummary" || !state.monthlySummary) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;

    const summary = state.monthlySummary;
    const project = summary.developmentProject;
    const overlay = document.createElement("div");
    overlay.id = "monthSummaryOverlay";
    overlay.className = "overlay";
    overlay.innerHTML = `
      <div class="overlay-card month-summary-card">
        <p class="eyebrow">第 ${summary.month} 月总结</p>
        <h2>这个月结束了</h2>
        <div class="summary-grid">
          <div><span>身体</span><strong>${summary.health}</strong></div>
          <div><span>心理</span><strong>${summary.mental}</strong></div>
          <div><span>精力</span><strong>${summary.energy}</strong></div>
          <div><span>存款</span><strong>${Number(summary.savings).toLocaleString("zh-CN")}</strong></div>
          <div><span>班级风险</span><strong>${summary.risk}</strong></div>
          <div><span>待解决问题</span><strong>${summary.unresolvedStudents}</strong></div>
        </div>
        <div class="summary-section">
          <p class="eyebrow">本月校园动态结果</p>
          ${(summary.challengeResults || [])
            .map(
              (challenge) => `
                <div class="summary-challenge ${challenge.status === "完全处理" ? "handled" : challenge.status === "部分处理" ? "partial" : "missed"}">
                  <strong>${escapeHtml(challenge.status)} · ${escapeHtml(challenge.title)}</strong>
                  <span>${escapeHtml(formatEffectText(challenge.effects))}</span>
                </div>
              `
            )
            .join("")}
        </div>
        <div class="summary-section">
          <p class="eyebrow">本月问题学生结果</p>
          ${(summary.studentResults || [])
            .map(
              (studentResult) => `
                <div class="summary-result-row ${studentResult.resolved ? "handled" : "missed"}">
                  <strong>${escapeHtml(studentResult.name)} · ${escapeHtml(studentResult.title)}</strong>
                  <span>${escapeHtml(studentResult.method)}：${escapeHtml(studentResult.outcome)}</span>
                </div>
              `
            )
            .join("") || `<p class="muted">本月没有问题学生处理记录。</p>`}
        </div>
        <div class="summary-section">
          <p class="eyebrow">本月发展结果</p>
          ${
            summary.developmentResult
              ? `
                <div class="summary-result-row handled">
                  <strong>${escapeHtml(summary.developmentResult.title)}</strong>
                  <span>${escapeHtml(summary.developmentResult.choiceLabel)}：${escapeHtml(summary.developmentResult.outcome)}</span>
                </div>
                <div class="summary-result-meta">
                  <span>进度 ${summary.developmentResult.progress}</span>
                  <span>质量 ${summary.developmentResult.quality}</span>
                  <span>风险 ${summary.developmentResult.risk}</span>
                </div>
              `
              : `<p class="muted">${project ? `本月为项目启动阶段，未产生发展事件。当前项目：${escapeHtml(project.name)}` : "本月没有发展项目记录。"}</p>`
          }
        </div>
        <button id="closeSummaryButton" class="primary-button">继续</button>
      </div>
    `;
    document.body.appendChild(overlay);
    $("#closeSummaryButton").addEventListener("click", () => {
      const closed = GameEngine.closeMonthSummary(state);
      if (closed) {
        overlay.remove();
        render();
        if (state.gameOver) {
          showToast("学期已经结束。");
        } else if (state.phase === "semesterSummary") {
          showToast("本学期结束，请查看学期总结。");
        } else {
          switchTab("work");
          showToast("新月份开始。");
        }
      }
    });
  }

  function renderSemesterSummary() {
    const existing = $("#semesterSummaryOverlay");
    if (state.phase !== "semesterSummary" || !state.semesterSummary) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;

    const summary = state.semesterSummary;
    const project = summary.projectResult;
    const overlay = document.createElement("div");
    overlay.id = "semesterSummaryOverlay";
    overlay.className = "overlay";
    overlay.innerHTML = `
      <div class="overlay-card semester-summary-card">
        <p class="eyebrow">第 ${summary.semester} 学期总结</p>
        <h2>本学期结束了</h2>
        <div class="summary-grid">
          <div><span>学期项目</span><strong>${project ? escapeHtml(project.projectName) : "未完成"}</strong></div>
          <div><span>项目等级</span><strong>${project?.grade || "C"}</strong></div>
          <div><span>职业积分</span><strong>${summary.careerPoints}</strong></div>
          <div><span>当前身份</span><strong>${escapeHtml(summary.rankTitle)}</strong></div>
          <div><span>累计解决问题</span><strong>${summary.resolvedCount}</strong></div>
          <div><span>仍未解决问题</span><strong>${summary.unresolvedCount}</strong></div>
        </div>
        ${
          project
            ? `
              <div class="semester-project-result">
                <strong>${escapeHtml(project.scenarioName || project.projectName)}：${escapeHtml(project.resultLabel || (project.grade === "S" || project.grade === "A" ? "成功完成" : project.grade === "B" ? "基本完成" : "未达到预期"))}</strong>
                <span>等级 ${project.grade} · 进度 ${project.progress} · 质量 ${project.quality} · 风险 ${project.risk}</span>
              </div>
            `
            : ""
        }
        <p class="semester-summary-note">本学期的选择已经写进学生记忆和你的职业履历，下一学期会继续产生影响。</p>
        <button id="closeSemesterSummaryButton" class="primary-button">进入新学期</button>
      </div>
    `;
    document.body.appendChild(overlay);
    $("#closeSemesterSummaryButton").addEventListener("click", () => {
      const closed = GameEngine.closeSemesterSummary(state);
      if (closed) {
        overlay.remove();
        render();
      }
    });
  }

  function renderSemesterStart() {
    const existing = $("#semesterStartOverlay");
    if (state.phase !== "semesterStart") {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;

    const overlay = document.createElement("div");
    overlay.id = "semesterStartOverlay";
    overlay.className = "overlay";
    overlay.innerHTML = `
      <div class="overlay-card">
        <p class="eyebrow">新学期</p>
        <h2>第 ${state.semester} 学期开始</h2>
        <p>你将重新选择本学期的职业发展项目，并继续处理学生问题与校园动态。</p>
        <button id="startNewSemesterButton" class="primary-button">开始本学期</button>
      </div>
    `;
    document.body.appendChild(overlay);
    $("#startNewSemesterButton").addEventListener("click", () => {
      const started = GameEngine.startNewSemester(state);
      if (started) {
        overlay.remove();
        render();
        switchTab("work");
        showToast("新学期已经开始。");
      }
    });
  }

  function switchTab(tabName) {
    $$(".tab-button").forEach((button) => button.classList.toggle("active", button.dataset.tab === tabName));
    $$(".tab-panel").forEach((panel) => panel.classList.toggle("active", panel.id === `${tabName}Tab`));
    const startBar = $("#monthStartBar");
    if (startBar) startBar.classList.toggle("hidden", tabName === "event");
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function clearTutorialHighlight() {
    $$(".tutorial-highlight").forEach((element) => element.classList.remove("tutorial-highlight"));
  }

  function showTutorialStep(index) {
    const overlay = $("#tutorialOverlay");
    if (!overlay) return;
    const step = tutorialSteps[index];
    if (!step) return;

    clearTutorialHighlight();
    if (step.tab) switchTab(step.tab);

    const progress = `${index + 1} / ${tutorialSteps.length}`;
    overlay.innerHTML = `
      <div class="tutorial-spotlight"></div>
      <div class="tutorial-card">
        <p class="eyebrow">入职培训 · ${progress}</p>
        <h2>${escapeHtml(step.title)}</h2>
        ${step.content.split("\n").map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
        <div class="tutorial-actions">
          <button id="tutorialPrevButton" class="ghost-button" ${index === 0 ? "disabled" : ""}>上一步</button>
          <button id="tutorialNextButton" class="primary-button">${index === tutorialSteps.length - 1 ? "开始搬砖" : "下一步"}</button>
          <button id="tutorialSkipButton" class="ghost-button">跳过</button>
        </div>
      </div>
    `;

    const card = overlay.querySelector(".tutorial-card");
    const spotlight = overlay.querySelector(".tutorial-spotlight");
    card.classList.remove("anchored");
    card.style.left = "50%";
    card.style.top = "50%";
    card.style.right = "auto";
    card.style.bottom = "auto";
    card.style.transform = "translate(-50%, -50%)";

    window.setTimeout(() => {
      if (step.target) {
        const target = $(step.target);
        if (target) {
          target.classList.add("tutorial-highlight");
          const rect = target.getBoundingClientRect();
          const cardRect = card.getBoundingClientRect();
          let left = rect.right + 16;
          if (left + cardRect.width > window.innerWidth - 16) {
            left = Math.max(16, rect.left - cardRect.width - 16);
          }
          const top = Math.max(16, Math.min(window.innerHeight - cardRect.height - 16, rect.top + 12));
          const pad = 10;
          spotlight.style.left = `${rect.left - pad}px`;
          spotlight.style.top = `${rect.top - pad}px`;
          spotlight.style.width = `${rect.width + pad * 2}px`;
          spotlight.style.height = `${rect.height + pad * 2}px`;
          card.classList.add("anchored");
          card.style.left = `${left}px`;
          card.style.top = `${top}px`;
          card.style.transform = "none";
        }
      } else {
        spotlight.style.left = "50%";
        spotlight.style.top = "50%";
        spotlight.style.width = "1px";
        spotlight.style.height = "1px";
      }
    }, 30);

    $("#tutorialPrevButton").addEventListener("click", () => {
      tutorialIndex = Math.max(0, tutorialIndex - 1);
      showTutorialStep(tutorialIndex);
    });

    $("#tutorialNextButton").addEventListener("click", () => {
      if (tutorialIndex >= tutorialSteps.length - 1) {
        finishTutorial();
      } else {
        tutorialIndex += 1;
        showTutorialStep(tutorialIndex);
      }
    });

    $("#tutorialSkipButton").addEventListener("click", finishTutorial);
  }

  function startTutorial() {
    if ($("#tutorialOverlay")) return;
    const overlay = document.createElement("div");
    overlay.id = "tutorialOverlay";
    overlay.className = "tutorial-overlay";
    document.body.appendChild(overlay);
    tutorialIndex = 0;
    showTutorialStep(0);
  }

  function finishTutorial() {
    const overlay = $("#tutorialOverlay");
    if (overlay) overlay.remove();
    clearTutorialHighlight();
    try {
      localStorage.setItem("counselor-sim-tutorial-done", "1");
    } catch (error) {
      console.warn("无法保存引导状态。", error);
    }
  }

  function hasCompletedTutorial() {
    try {
      return localStorage.getItem("counselor-sim-tutorial-done") === "1";
    } catch {
      return false;
    }
  }

  function bindEvents() {
    $("#continueGameButton").hidden = !hasSavedGame;

    $("#startGameButton").addEventListener("click", () => {
      $("#startStep1").classList.add("hidden");
      $("#startStep2").classList.remove("hidden");
    });

    $("#backToStartButton").addEventListener("click", () => {
      $("#startStep2").classList.add("hidden");
      $("#startStep1").classList.remove("hidden");
    });

    $("#randomNameButton").addEventListener("click", () => {
      const names = window.GameData.names;
      $("#counselorNameInput").value = names[Math.floor(Math.random() * names.length)];
    });

    $("#confirmNameButton").addEventListener("click", () => {
      if (hasSavedGame && !window.confirm("开始新游戏会覆盖当前存档，继续吗？")) return;
      const name = $("#counselorNameInput").value.trim();
      state = GameEngine.createInitialState();
      if (!GameEngine.beginGame(state, name || "林知远")) return;
      GameEngine.saveState(state);
      hasSavedGame = true;
      hideStartScreen();
      render();
      switchTab("work");
      showToast(`${state.counselor.name} 已入职。`);
      window.setTimeout(startTutorial, 80);
    });

    $("#continueGameButton").addEventListener("click", () => {
      state = savedGame || state;
      $("#startStep2").classList.add("hidden");
      $("#startStep1").classList.remove("hidden");
      hideStartScreen();
      render();
      switchTab(state.phase === "events" ? "event" : "work");
      showToast("已读取存档。");
      if (!hasCompletedTutorial()) window.setTimeout(startTutorial, 80);
    });

    $("#tutorialButton").addEventListener("click", startTutorial);

    $$(".tab-button").forEach((button) => {
      button.addEventListener("click", () => switchTab(button.dataset.tab));
    });

    $("#toggleProfile").addEventListener("click", () => {
      const profile = $("#counselorProfile");
      const collapsed = profile.classList.toggle("collapsed");
      $("#toggleProfile").textContent = collapsed ? "+" : "−";
    });

    $("#actionGrid").addEventListener("click", (event) => {
      const card = event.target.closest("[data-action-id]");
      if (!card) return;
      const changed = GameEngine.toggleAction(state, card.dataset.actionId);
      if (!changed) {
        showToast("最多只能选择 3 项重点工作。");
      }
      render();
    });

    $("#developList").addEventListener("click", (event) => {
      const projectCard = event.target.closest("[data-project-id]");
      if (projectCard) {
        pendingProjectId = projectCard.dataset.projectId;
        render();
        return;
      }

      if (event.target.closest("#confirmProjectButton")) {
        if (!pendingProjectId) return;
        const selected = GameEngine.selectDevelopmentProject(state, pendingProjectId);
        if (selected) {
          pendingProjectId = null;
          render();
          showToast("学期发展项目已确认。");
        }
        return;
      }

      const scenarioCard = event.target.closest("[data-scenario-index]");
      if (scenarioCard) {
        pendingScenarioIndex = Number(scenarioCard.dataset.scenarioIndex);
        render();
        return;
      }

      if (event.target.closest("#confirmScenarioButton")) {
        if (pendingScenarioIndex === null) return;
        const selected = GameEngine.selectDevelopmentScenario(state, pendingScenarioIndex);
        if (selected) {
          pendingScenarioIndex = null;
          render();
          showToast("具体发展方向已确认。");
        }
        return;
      }

      const choiceButton = event.target.closest("[data-development-event-choice]");
      if (choiceButton) {
        pendingDevelopmentEvent = {
          id: state.developmentEvent.id,
          index: Number(choiceButton.dataset.developmentEventChoice)
        };
        render();
        return;
      }

      if (event.target.closest("#confirmDevelopmentEventButton")) {
        if (!pendingDevelopmentEvent || pendingDevelopmentEvent.id !== state.developmentEvent.id) return;
        const resolved = GameEngine.resolveDevelopmentEvent(state, pendingDevelopmentEvent.index);
        if (resolved) {
          pendingDevelopmentEvent = null;
          render();
          showToast("本月发展事件已处理。");
        }
      }
    });

    $("#startMonthButton").addEventListener("click", () => {
      if (!canStartMonth()) {
        const missing = [];
        if (state.selectedActions.length < state.minWorkActions) missing.push(`重点工作 ${state.selectedActions.length}/${state.minWorkActions}`);
        if (!state.developmentProjectId) {
          missing.push("学期发展项目");
        } else if (state.month === 1 && !state.developmentScenario) {
          missing.push("具体发展方向");
        } else if (state.month > 1 && (!state.developmentEvent || !state.developmentEventResolved)) {
          missing.push("本月发展事件");
        }
        const handled = state.problemStudents.filter((problem) => state.studentHandling[problem.studentId] !== undefined).length;
        if (handled < state.problemStudents.length) missing.push(`问题学生 ${handled}/${state.problemStudents.length}`);
        showToast(`还需要完成：${missing.join("、")}`);
        return;
      }
      const started = GameEngine.startMonth(state);
      if (started) {
        switchTab("event");
        render();
        showToast("本月已经开始，事件正在等待处理。");
      }
    });

    $("#problemStudents").addEventListener("click", (event) => {
      const button = event.target.closest("[data-student-id][data-method-index]");
      if (!button) return;
      const changed = GameEngine.selectStudentHandling(
        state,
        button.dataset.studentId,
        Number(button.dataset.methodIndex)
      );
      if (changed) render();
    });

    $("#slackActions").addEventListener("click", (event) => {
      const button = event.target.closest("[data-slack-id]");
      if (!button) return;
      const item = GameEngine.chooseSlack(state, button.dataset.slackId);
      if (item) {
        render();
        showToast(`你摸鱼了：${item.name}`);
      }
    });

    $("#eventStage").addEventListener("click", (event) => {
      const button = event.target.closest("[data-choice-index]");
      if (!button) return;
      const result = GameEngine.resolveChoice(state, Number(button.dataset.choiceIndex));
      if (result) {
        render();
        if (state.currentEvent) {
          showToast(`已处理：${state.lastChoice.eventTitle}`);
        } else if (state.phase === "planning") {
          switchTab("work");
          showToast("本月结束，可以安排下个月了。");
        }
      }
    });

    $("#saveButton").addEventListener("click", () => {
      GameEngine.saveState(state);
      hasSavedGame = true;
      $("#continueGameButton").hidden = false;
      showToast("已保存。");
    });

    $("#resetButton").addEventListener("click", () => {
      const confirmed = window.confirm("确定重开？当前进度会被覆盖。");
      if (!confirmed) return;
      state = GameEngine.resetState();
      hasSavedGame = false;
      const overlay = $("#gameOverOverlay");
      if (overlay) overlay.remove();
      render();
      showStartScreen();
      $("#continueGameButton").hidden = true;
      showToast("已重置，请重新开始。");
    });
  }

  function render() {
    renderTopbar();
    renderCounselor();
    renderMonthBrief();
    renderActions();
    renderStudents();
    renderEvent();
    renderDevelop();
    renderTimeline();
    renderGameOver();
    renderMonthEvent();
    renderMonthSummary();
    renderSemesterSummary();
    renderSemesterStart();
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    renderIntro();
    render();
    showStartScreen();
  });
})();
