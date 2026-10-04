(function () {
  const STORAGE_KEY = "counselor-sim-save-v1";
  const STATE_VERSION = 2;
  const DEVELOPMENT_EFFECT_SCALE = 1.4;

  // ---- 数值调参集中区（A 档）--------------------------------------------
  // 设计意图：让 data.js 里的原始数字重新有意义，并把「精力」从慢性失血
  // 改造成月度预算型资源，同时保留「精力低 → 更穷」的弱反馈。
  const ENERGY_NEGATIVE_SCALE = 0.6; // 精力负向缩放（原 0.45，过度掩盖真实值）
  const MENTAL_NEGATIVE_SCALE = 0.75; // 心理负向缩放（保持原值）
  // 精力定位为「月度预算」而非慢性失血：恢复量应略低于典型月消耗，
  // 这样玩家的选择（而不是算术）决定它是否会成为瓶颈。
  const MONTHLY_ENERGY_RECOVERY = 22; // settleMonth 精力恢复（原 14，低于月度消耗）
  const LIVING_COST_PER_LOW_ENERGY = 8; // 每点低于 80 的精力带来的额外生活支出（原 15）
  const LIVING_COST_BASE = 2800;
  const LOW_ENERGY_THRESHOLD = 80;
  // 身体是唯一能杀死玩家的资源，必须能撑过 40 个月：
  // 40 个月基础消耗应显著小于「8 学期恢复 + 恢复类行动收益」，否则全员猝死。
  const MONTHLY_HEALTH_DRAIN = 1; // settleMonth 固定身体消耗（原 6，会导致第 2-3 学期暴毙）
  const MONTHLY_MENTAL_DRAIN = 2; // settleMonth 固定心理消耗
  const MONTHLY_RISK_DRIFT = 2; // settleMonth 班级风险自然上涨
  const SEMESTER_HEALTH_RECOVERY = 10; // 原 5，低于每学期 5 个月的基础消耗 + 精力惩罚
  const SEMESTER_ENERGY_RECOVERY = 12;
  const SEMESTER_MENTAL_RECOVERY = 18;
  const SEMESTER_LEADERSHIP_RECOVERY = 2;
  const HEALTH_WARNING_THRESHOLD = 40; // 低于此值开始受伤病影响（与 UI「生病」对齐）
  const EVENT_HISTORY_LIMIT = 12; // 事件冷却窗口：最近 N 条事件不再重复抽取
  const DEFAULT_SLACK_MAX = 2;
  // ----------------------------------------------------------------------
  const { actions, events, slackItems, names, traits, monthlySituationTemplates, monthEndEvents, problemIssues, storyFragments, developmentProjects, developmentProjectScenarios, eventMemoryMeta } = window.GameData;

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(items) {
    return items[rand(0, items.length - 1)];
  }

  /**
   * P2：替换 `sort(() => Math.random() - 0.5)`。比较函数非传递，
   * 会让抽签结果严重偏向原顺序靠前的元素。
   */
  function shuffle(items) {
    const list = [...items];
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = rand(0, i);
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function scaleEffects(effects, scale) {
    return Object.fromEntries(Object.entries(effects || {}).map(([key, value]) => [key, Math.round(value * scale)]));
  }

  function getStudentState(risk) {
    if (risk >= 72) return "危机";
    if (risk >= 52) return "风险";
    if (risk >= 30) return "需关注";
    return "正常";
  }

  function getSuggestedIssue(student) {
    const entries = Object.entries(student.attributes).sort((a, b) => a[1] - b[1]);
    const lowestKey = entries[0]?.[0];
    const issueMap = {
      study: "PI01",
      mental: "PI02",
      social: "PI10",
      employment: "PI04",
      health: "PI11",
      family: "PI05",
      economy: "PI08",
      discipline: "PI06"
    };
    return problemIssues.find((issue) => issue.id === issueMap[lowestKey]) || problemIssues[0];
  }

  function refreshStudentSignal(student) {
    student.state = getStudentState(student.risk);
    if (student.issueState?.activeIssueId) {
      const issue = problemIssues.find((item) => item.id === student.issueState.activeIssueId);
      student.pendingEvent = issue ? `${issue.title}：${issue.desc}` : "暂无明确风险事件。";
    } else {
      const issue = getSuggestedIssue(student);
      student.pendingEvent = `${issue.title}：${issue.desc}`;
    }
  }

  /**
   * 本月校园动态。原实现有两套数据：
   *   - monthlySituationTemplates（24 条，实际被使用）
   *   - monthlyChallenges（12 条，只在读旧档时按 id 回查——但 id 前缀不同，
   *     永远匹配不到，是纯粹的死数据）
   * 这里统一为模板池，并保证同月两条动态不重复。
   */
  function generateMonthChallenges() {
    const pool = shuffle(monthlySituationTemplates);
    return pool.slice(0, 2).map((template) => ({
      id: `SIT-${template.id}`,
      title: template.title,
      desc: template.desc,
      primaryTag: template.primaryTag,
      partialTags: template.partialTags,
      direction: template.direction,
      penalty: template.penalty
    }));
  }

  function generateProblemStudents(state) {
    const existing = [];
    const usedStudentIds = new Set();
    const usedIssueIds = new Set();

    state.students
      .filter((student) => student.issueState?.activeIssueId)
      .sort((a, b) => b.risk - a.risk)
      .forEach((student) => {
        const issueId = student.issueState.activeIssueId;
        const issue = problemIssues.find((item) => item.id === issueId);
        if (!issue || existing.length >= 3) return;
        usedStudentIds.add(student.id);
        usedIssueIds.add(issue.id);
        existing.push(createProblemStudent(student, issue, true));
      });

    const newPool = state.students
      .filter((student) => !usedStudentIds.has(student.id))
      .sort((a, b) => b.risk - a.risk);
    const issuePool = problemIssues.filter((issue) => !usedIssueIds.has(issue.id)).sort(() => Math.random() - 0.5);
    const fallbackIssues = [...problemIssues].sort(() => Math.random() - 0.5);

    // P0-1：按风险分层取人。原先只按 risk 降序硬凑 3 人，开局学生 risk 可能只有 20 出头，
    // 与 design.md §6「风险更高的学生优先进入问题学生池」不符。
    // 先用「风险档(>=52)」，不足再放宽到「需关注档(>=30)」，最后才兜底。
    const RISK_TIERS = [
      (student) => student.risk >= 52,
      (student) => student.risk >= 30,
      () => true
    ];
    let tierPool = newPool.filter(RISK_TIERS[0]);
    let tierIndex = 0;
    while (existing.length < 3) {
      if (!tierPool.length) {
        tierIndex += 1;
        if (tierIndex >= RISK_TIERS.length) break;
        tierPool = newPool.filter(RISK_TIERS[tierIndex]).sort((a, b) => b.risk - a.risk);
        continue;
      }
      const student = tierPool.shift();
      const issue = issuePool.shift() || fallbackIssues[existing.length % fallbackIssues.length];
      if (!issue) break;
      usedStudentIds.add(student.id);
      usedIssueIds.add(issue.id);
      student.issueState.activeIssueId = issue.id;
      refreshStudentSignal(student);
      existing.push(createProblemStudent(student, issue, false));
    }

    return existing.slice(0, 3);
  }

  function createProblemStudent(student, issue, carryOver) {
    return {
      studentId: student.id,
      issueId: issue.id,
      title: issue.title,
      desc: issue.desc,
      needs: issue.needs,
      methods: issue.methods.map((method) => ({ ...method })),
      carryOver
    };
  }

  function createStudent(index) {
    const usedNames = [...names];
    const name = usedNames[index % usedNames.length];
    const student = {
      id: `STU-${String(index + 1).padStart(2, "0")}`,
      name,
      gender: Math.random() > 0.48 ? "女" : "男",
      attributes: {
        study: rand(32, 92),
        mental: rand(28, 90),
        employment: rand(25, 88),
        social: rand(30, 92),
        health: rand(35, 92),
        family: rand(25, 90),
        discipline: rand(35, 90),
        economy: rand(25, 90)
      },
      traits: [],
      relation: {
        familiarity: 0,
        trust: 32,
        respect: 30
      },
      issueState: {
        activeIssueId: null,
        history: [],
        resolvedCount: 0
      },
      memory: [],
      attitudeProfile: {
        support: 0,
        respect: 0,
        empathy: 0,
        consistency: 0,
        boundary: 0
      },
      backstory: "",
      state: "正常",
      risk: rand(8, 40),
      pendingEvent: ""
    };

    const traitCount = rand(2, 4);
    const shuffledTraits = [...traits].sort(() => Math.random() - 0.5);
    student.traits = shuffledTraits.slice(0, traitCount);
    student.backstory = `${name}来自${pick(storyFragments.hometowns)}。${pick(storyFragments.familyFragments)}${pick(storyFragments.hobbyFragments)}${pick(storyFragments.worryFragments)}`;
    const lowScoreCount = Object.values(student.attributes).filter((value) => value < 45).length;
    student.risk = clamp(rand(8, 40) + lowScoreCount * 10 + rand(0, 10), 8, 88);
    refreshStudentSignal(student);
    return student;
  }

  function enrichStudent(student) {
    const fallback = createStudent(0);
    const enriched = {
      ...fallback,
      ...student,
      attributes: { ...fallback.attributes, ...(student.attributes || {}) },
      relation: { ...fallback.relation, ...(student.relation || {}) },
      issueState: {
        activeIssueId: null,
        history: [],
        resolvedCount: 0,
        ...(student.issueState || {})
      },
      memory: Array.isArray(student.memory) ? student.memory : [],
      attitudeProfile: {
        support: 0,
        respect: 0,
        empathy: 0,
        consistency: 0,
        boundary: 0,
        ...(student.attitudeProfile || {})
      },
      backstory: student.backstory || fallback.backstory
    };
    refreshStudentSignal(enriched);
    return enriched;
  }

  function createInitialState() {
    const students = Array.from({ length: 24 }, (_, index) => createStudent(index));
    const state = {
      version: STATE_VERSION,
      started: false,
      phase: "planning",
      semester: 1,
      month: 1,
      week: 1,
      counselor: {
        name: "林知远",
        health: 100,
        energy: 100,
        mental: 100,
        savings: 8000,
        leadership: 60,
        trust: 50,
        parent: 50,
        colleague: 55,
        risk: 35,
        development: 0
      },
      students,
      selectedActions: [],
      selectedDevelopment: [],
      developmentProjectId: null,
      developmentProject: null,
      developmentProjectConfirmed: false,
      developmentScenario: null,
      developmentScenarioOptions: [],
      developmentEvent: null,
      developmentEventResolved: false,
      careerPoints: 0,
      rankLevel: 1,
      rankTrack: null,
      rankTitle: "牛马辅导员",
      promotionHistory: [],
      projectHistory: [],
      lastProjectResult: null,
      studentEndings: [],
      playerEndingSummary: "",
      problemStudents: [],
      studentHandling: {},
      minWorkActions: 3,
      summaryEvent: null,
      eventQueue: [],
      currentEvent: null,
      monthlySummary: null,
      monthStudentResults: [],
      monthDevelopmentResult: null,
      semesterSummary: null,
      semesterStartInfo: null,
      monthChallenges: [],
      handledChallengeIds: [],
      monthChallengeResults: [],
      timeline: [],
      slackRemaining: DEFAULT_SLACK_MAX,
      slackMax: DEFAULT_SLACK_MAX,
      recentEventIds: [],
      maxActions: 3,
      maxDevelopment: 1,
      lastChoice: null,
      gameOver: null
    };
    state.monthChallenges = generateMonthChallenges();
    state.problemStudents = generateProblemStudents(state);
    return state;
  }

  /**
   * 版本迁移（design.md §14：旧版本缺失字段必须用迁移函数补齐）。
   * MIGRATIONS[n] 负责把 v(n) 的快照升到 v(n+1)，只补齐/转换字段，不重算玩法状态。
   */
  const MIGRATIONS = {
    // v1 → v2：补项目确认标记、事件冷却窗口、摸鱼上限；修正头衔随机抖动。
    1: (raw) => {
      const next = { ...raw };
      if (typeof next.developmentProjectConfirmed !== "boolean") {
        // v1 没有确认标记：已选方向视为已确认，未选方向视为未确认。
        next.developmentProjectConfirmed = Boolean(next.developmentScenario);
      }
      if (!Array.isArray(next.recentEventIds)) next.recentEventIds = [];
      if (typeof next.slackMax !== "number" || next.slackMax <= 0) next.slackMax = DEFAULT_SLACK_MAX;
      if (typeof next.slackRemaining !== "number") next.slackRemaining = next.slackMax;
      if (typeof next.maxDevelopment !== "number") next.maxDevelopment = 1;
      // 旧档的实务线头衔是每次渲染随机生成的，这里固化为一个确定值。
      if (next.rankLevel >= 3 && next.rankTrack === "实务线") {
        next.rankTitle = getRankTitle(next.rankLevel, "实务线");
      }
      return next;
    }
  };

  function migrateState(raw) {
    if (!raw || typeof raw !== "object") return null;
    const fromVersion = typeof raw.version === "number" ? raw.version : 0;
    if (fromVersion < 1 || fromVersion > STATE_VERSION) return null;

    let migrated = raw;
    for (let version = fromVersion; version < STATE_VERSION; version += 1) {
      const migration = MIGRATIONS[version];
      if (!migration) return null;
      try {
        migrated = migration(migrated);
      } catch (error) {
        console.warn(`存档迁移 v${version} → v${version + 1} 失败，已忽略该存档。`, error);
        return null;
      }
    }
    return normalizeState(migrated);
  }

  function normalizeState(raw) {
    const initial = createInitialState();
    return {
      ...initial,
      ...raw,
      version: STATE_VERSION,
      counselor: { ...initial.counselor, ...(raw.counselor || {}) },
      students: Array.isArray(raw.students) && raw.students.length ? raw.students.map(enrichStudent) : initial.students,
      selectedActions: Array.isArray(raw.selectedActions) ? raw.selectedActions : [],
      selectedDevelopment: Array.isArray(raw.selectedDevelopment) ? raw.selectedDevelopment : [],
      developmentProjectId: raw.developmentProjectId || null,
      developmentProject: raw.developmentProject || null,
      developmentProjectConfirmed: Boolean(raw.developmentProjectConfirmed),
      developmentScenario: raw.developmentScenario || null,
      developmentScenarioOptions: Array.isArray(raw.developmentScenarioOptions) ? raw.developmentScenarioOptions : [],
      developmentEvent: raw.developmentEvent || null,
      developmentEventResolved: Boolean(raw.developmentEventResolved),
      careerPoints: Number(raw.careerPoints) || 0,
      rankLevel: Number(raw.rankLevel) || 1,
      rankTrack: raw.rankTrack || null,
      rankTitle: raw.rankTitle || "牛马辅导员",
      promotionHistory: Array.isArray(raw.promotionHistory) ? raw.promotionHistory : [],
      projectHistory: Array.isArray(raw.projectHistory) ? raw.projectHistory : [],
      lastProjectResult: raw.lastProjectResult || null,
      studentEndings: Array.isArray(raw.studentEndings) ? raw.studentEndings : [],
      playerEndingSummary: raw.playerEndingSummary || "",
      problemStudents: Array.isArray(raw.problemStudents) ? raw.problemStudents : [],
      studentHandling: raw.studentHandling && typeof raw.studentHandling === "object" ? raw.studentHandling : {},
      eventQueue: Array.isArray(raw.eventQueue) ? raw.eventQueue : [],
      monthStudentResults: Array.isArray(raw.monthStudentResults) ? raw.monthStudentResults : [],
      monthDevelopmentResult: raw.monthDevelopmentResult || null,
      semesterSummary: raw.semesterSummary || null,
      semesterStartInfo: raw.semesterStartInfo || null,
      monthChallenges: Array.isArray(raw.monthChallenges) ? raw.monthChallenges : generateMonthChallenges(),
      handledChallengeIds: Array.isArray(raw.handledChallengeIds) ? raw.handledChallengeIds : [],
      monthChallengeResults: Array.isArray(raw.monthChallengeResults) ? raw.monthChallengeResults : [],
      timeline: Array.isArray(raw.timeline) ? raw.timeline : [],
      recentEventIds: Array.isArray(raw.recentEventIds) ? raw.recentEventIds : [],
      slackMax: Number(raw.slackMax) > 0 ? Number(raw.slackMax) : DEFAULT_SLACK_MAX,
      slackRemaining: typeof raw.slackRemaining === "number" ? raw.slackRemaining : DEFAULT_SLACK_MAX,
      maxActions: Number(raw.maxActions) > 0 ? Number(raw.maxActions) : 3,
      maxDevelopment: Number(raw.maxDevelopment) > 0 ? Number(raw.maxDevelopment) : 1,
      summaryEvent: raw.summaryEvent || null,
      gameOver: raw.gameOver || null
    };
  }

  function loadState() {
    try {
      const rawText = localStorage.getItem(STORAGE_KEY);
      if (!rawText) return null;
      return migrateState(JSON.parse(rawText));
    } catch (error) {
      console.warn("读取存档失败，已忽略。", error);
      return null;
    }
  }

  function saveState(state) {
    const snapshot = JSON.parse(JSON.stringify(state));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }

  function addTimeline(state, type, title, text) {
    state.timeline.unshift({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      semester: state.semester,
      month: state.month,
      week: state.week,
      type,
      title,
      text,
      time: new Date().toLocaleString("zh-CN", { hour12: false })
    });
  }

  function applyCounselorEffects(state, effects) {
    const c = state.counselor;
    function scaled(key, value) {
      if (!value) return value;
      if (key === "energy" && value < 0) return Math.round(value * ENERGY_NEGATIVE_SCALE);
      if (key === "mental" && value < 0) return Math.round(value * MENTAL_NEGATIVE_SCALE);
      return value;
    }
    c.health = clamp(c.health + (effects.health || 0), 0, 100);
    c.energy = clamp(c.energy + scaled("energy", effects.energy || 0), 0, 100);
    c.mental = clamp(c.mental + scaled("mental", effects.mental || 0), 0, 100);
    c.savings += effects.savings || 0;
    c.leadership = clamp(c.leadership + (effects.leadership || 0), 0, 100);
    c.trust = clamp(c.trust + (effects.trust || 0), 0, 100);
    c.parent = clamp(c.parent + (effects.parent || 0), 0, 100);
    c.colleague = clamp(c.colleague + (effects.colleague || 0), 0, 100);
    c.risk = clamp(c.risk + (effects.risk || 0), 0, 100);
    c.development = Math.max(0, c.development + (effects.development || 0));
  }

  function applyClassEffects(state, effects) {
    state.students.forEach((student) => {
      student.attributes.study = clamp(student.attributes.study + (effects.study || 0), 0, 100);
      student.attributes.employment = clamp(student.attributes.employment + (effects.employment || 0), 0, 100);
      student.attributes.social = clamp(student.attributes.social + (effects.social || 0), 0, 100);
      student.attributes.discipline = clamp(student.attributes.discipline + (effects.discipline || 0), 0, 100);
    });
  }

  function applyStudentEffects(state, effects, studentIds) {
    // P2：原 `state.problemStudents.map(...).slice(0, 3)` 中 slice 恒等于全集，已移除。
    const targets = studentIds && studentIds.length
      ? studentIds
      : state.problemStudents.map((problem) => problem.studentId);
    state.students.forEach((student) => {
      if (!targets.includes(student.id)) return;
      Object.keys(effects).forEach((key) => {
        if (student.attributes[key] !== undefined) {
          student.attributes[key] = clamp(student.attributes[key] + effects[key], 0, 100);
        }
        if (student.relation[key] !== undefined) {
          student.relation[key] = clamp(student.relation[key] + effects[key], 0, 100);
        }
      });
      student.risk = clamp(student.risk - (effects.mental || 0) * 0.3 - (effects.trust || 0) * 0.2, 0, 100);
      refreshStudentSignal(student);
    });
  }

  function applyAttitudeTags(student, tags) {
    if (!Array.isArray(tags) || !tags.length) return;
    const profile = student.attitudeProfile;
    // 早期的 eventMemoryMeta 里使用了一批不在表内的标签（如「了解原因」「专业介入」
    // 「边界」），会被这里静默忽略，导致整个事件不产生任何画像变化。
    // 现在把这些语义补进表内，使标签词表与数据实际用法对齐。
    const tagEffects = {
      // —— 核心语义 ——
      "支持": { support: 2 },
      "保护": { support: 2, empathy: 1 },
      "共情": { empathy: 2, support: 1 },
      "尊重自主": { respect: 2, boundary: 1 },
      "持续跟进": { consistency: 2, support: 1 },
      "及时介入": { support: 2, consistency: 1 },
      "边界清楚": { boundary: 2 },
      "隐私保护": { respect: 2, boundary: 1 },
      "专业流程": { boundary: 1, consistency: 1 },
      "家长介入": { boundary: 1, respect: -1 },
      "规则优先": { boundary: 2, empathy: -1 },
      "朋辈支持": { empathy: 1, boundary: 1 },
      "忽视": { support: -2, empathy: -2, consistency: -2 },
      "低共情": { empathy: -2 },
      "模糊边界": { boundary: -2 },
      "公开": { boundary: -1, respect: -1 },
      // —— 补充语义（原有数据已在使用的词）——
      "了解原因": { empathy: 1, consistency: 1 },
      "信息": { consistency: 1 },
      "核实": { consistency: 1, boundary: 1 },
      "家长沟通": { boundary: 1, support: 1 },
      "折中": { boundary: 1 },
      "学业支持": { support: 1, consistency: 1 },
      "专业介入": { boundary: 1, consistency: 2 },
      "专业支持": { boundary: 1, consistency: 2 },
      "长期发展": { consistency: 1, support: 1 },
      "朋辈介入": { empathy: 1, boundary: -1 },
      "边界": { boundary: 2 },
      "宽松": { empathy: 1, boundary: -1 },
      "规则": { boundary: 2, empathy: -1 },
      "情绪安抚": { empathy: 2 },
      "等待": { consistency: -1 },
      "经济支持": { support: 2 },
      "支持休学": { respect: 2, support: 1 },
      "公平": { respect: 2 },
      "程序公平": { respect: 2, consistency: 1 },
      "隔离冲突": { boundary: 1, empathy: -1 },
      "学生": { support: 1 },
      "上报": { consistency: 1, boundary: 1 }
    };
    tags.forEach((tag) => {
      const effect = tagEffects[tag] || {};
      Object.entries(effect).forEach(([key, value]) => {
        profile[key] = clamp(profile[key] + value, -20, 20);
      });
    });
  }

  function recordStudentMemory(state, studentId, entry) {
    const student = state.students.find((item) => item.id === studentId);
    if (!student) return;
    student.memory.unshift({
      semester: state.semester,
      month: state.month,
      ...entry
    });
    applyAttitudeTags(student, entry.attitudeTags || []);
  }

  function toggleAction(state, actionId) {
    if (state.phase !== "planning" || state.gameOver) return false;
    const index = state.selectedActions.indexOf(actionId);
    if (index >= 0) {
      state.selectedActions.splice(index, 1);
      return true;
    }
    if (state.selectedActions.length >= state.maxActions) return false;
    state.selectedActions.push(actionId);
    return true;
  }

  function toggleDevelopment(state, actionId) {
    if (state.phase !== "planning" || state.gameOver) return false;
    const action = actions.find((item) => item.id === actionId && item.scope === "development");
    if (!action) return false;
    const index = state.selectedDevelopment.indexOf(actionId);
    if (index >= 0) {
      state.selectedDevelopment.splice(index, 1);
      return true;
    }
    if (state.selectedDevelopment.length >= state.maxDevelopment) return false;
    state.selectedDevelopment.push(actionId);
    return true;
  }

  function selectStudentHandling(state, studentId, methodIndex) {
    if (state.phase !== "planning" || state.gameOver) return false;
    const problem = state.problemStudents.find((item) => item.studentId === studentId);
    if (!problem) return false;
    if (!problem.methods[methodIndex]) return false;
    state.studentHandling[studentId] = methodIndex;
    return true;
  }

  function selectDevelopmentProject(state, projectId) {
    if (state.phase !== "planning" || state.gameOver) return false;
    // P0-2：确认后整学期不可更换（原先只在非第 1 月拦截，第 1 月可反复改选）。
    if (state.developmentProjectConfirmed) return false;
    const project = developmentProjects.find((item) => item.id === projectId);
    if (!project) return false;
    state.developmentProjectId = project.id;
    state.developmentProject = {
      id: project.id,
      name: project.name,
      track: project.track,
      progress: 0,
      quality: 50,
      risk: 20
    };
    const scenarioPool = developmentProjectScenarios[project.id] || [];
    const shuffledScenarios = shuffle(scenarioPool);
    state.developmentScenarioOptions = shuffledScenarios.slice(0, 3);
    state.developmentScenario = null;
    state.developmentProjectConfirmed = false;
    if (!state.rankTrack) state.rankTrack = project.track;
    state.developmentEvent = null;
    state.developmentEventResolved = false;
    addTimeline(state, "发展项目", `选择学期项目：${project.name}`, `${project.track}，${project.desc}。请从三个具体方向中选择一个。`);
    return true;
  }

  function selectDevelopmentScenario(state, optionIndex) {
    if (state.phase !== "planning" || state.gameOver) return false;
    if (!state.developmentProjectId || !state.developmentScenarioOptions.length) return false;
    const scenario = state.developmentScenarioOptions[optionIndex];
    if (!scenario) return false;
    state.developmentScenario = scenario;
    state.developmentScenarioOptions = [];
    state.developmentEventResolved = true;
    state.developmentProjectConfirmed = true;
    addTimeline(state, "发展项目", `确定具体方向：${scenario.name}`, "本学期发展项目方向已确认，本学期内不可更换。");
    return true;
  }

  function generateDevelopmentEvent(state) {
    const project = developmentProjects.find((item) => item.id === state.developmentProjectId);
    if (!project || !state.developmentProject) return;
    const event = pick(project.events);
    state.developmentEvent = {
      ...event,
      choices: event.choices.map((choice) => ({ ...choice, effects: { ...choice.effects } }))
    };
    state.developmentEventResolved = false;
  }

  function resolveDevelopmentEvent(state, choiceIndex) {
    if (state.phase !== "planning" || state.gameOver || !state.developmentEvent) return null;
    const choice = state.developmentEvent.choices[choiceIndex];
    if (!choice) return null;

    const project = state.developmentProject;
    if (project) {
      project.progress = clamp(project.progress + (choice.effects.progress || 0) * DEVELOPMENT_EFFECT_SCALE, 0, 100);
      project.quality = clamp(project.quality + (choice.effects.quality || 0) * DEVELOPMENT_EFFECT_SCALE, 0, 100);
      project.risk = clamp(project.risk + (choice.effects.risk || 0), 0, 100);
    }

    const counselorEffects = { ...choice.effects };
    delete counselorEffects.progress;
    delete counselorEffects.quality;
    delete counselorEffects.risk;
    applyCounselorEffects(state, counselorEffects);
    state.developmentEventResolved = true;
    state.monthDevelopmentResult = {
      title: state.developmentEvent.title,
      choiceLabel: choice.label,
      outcome: choice.outcome,
      progress: state.developmentProject?.progress || 0,
      quality: state.developmentProject?.quality || 0,
      risk: state.developmentProject?.risk || 0
    };
    addTimeline(state, "发展事件", state.developmentEvent.title, `选择「${choice.label}」：${choice.outcome}`);
    return choice;
  }

  function settleDevelopmentProject(state) {
    const project = state.developmentProject;
    if (!project) return;
    const score = project.progress * 0.5 + project.quality * 0.4 - project.risk * 0.1;
    // 阈值重新标定：原 S>=80 在数学上几乎不可达（需要 进度100/质量100/风险0），
    // 实测 8 学期 1200 次结算里 S 仅出现 1 次，A 也只有约 25%。
    let grade = "C";
    if (score >= 72) grade = "S";
    else if (score >= 62) grade = "A";
    else if (score >= 48) grade = "B";

    const pointsMap = { S: 45, A: 30, B: 18, C: 8 };
    const points = pointsMap[grade];
    state.careerPoints += points;
    const scenario = state.developmentScenario;
    const resultLabel = scenario?.resultMap?.[grade] || `${grade} 级完成`;
    state.lastProjectResult = {
      projectId: project.id,
      projectName: project.name,
      track: project.track,
      scenarioName: scenario?.name || project.name,
      grade,
      resultLabel,
      points,
      progress: project.progress,
      quality: project.quality,
      risk: project.risk
    };
    state.projectHistory.push({ ...state.lastProjectResult, semester: state.semester });
    addTimeline(state, "项目结算", `${project.name}：${grade}`, `进度 ${project.progress}，质量 ${project.quality}，风险 ${project.risk}，获得职业积分 ${points}。`);
  }

  function getSalaryByRank(level) {
    return 6500 + (level - 1) * 1500;
  }

  function getRankTitle(level, track) {
    const isPractice = track === "实务线";
    if (level <= 1) return "牛马辅导员";
    if (level === 2) return "高级牛马辅导员";
    if (level === 3) return isPractice ? "学工办副主任" : "讲师级辅导员";
    if (level === 4) return isPractice ? "学工办主任" : "副教授级辅导员";
    if (level >= 5) return isPractice ? "学生工作专家" : "教授级辅导员";
    return "牛马辅导员";
  }

  /**
   * P1-2：头衔只在晋升那一刻用随机数决定一次并写回 state，
   * 之后所有渲染与结局判定都读取 state.rankTitle，避免每次重绘抖动。
   */
  function resolveRankTitle(level, track) {
    const isPractice = track === "实务线";
    if (level === 3 && isPractice) return pick(["学工办副主任", "团委副书记"]);
    if (level === 4 && isPractice) return pick(["学工办主任", "团委书记"]);
    if (level === 5 && isPractice) return pick(["学生工作专家", "学院副书记"]);
    return getRankTitle(level, track);
  }

  // P1-3：晋升门槛。gradeMin 用「等级 + 需要的达标项目数」表达，
  // 与 completion-plan.md §3.2 的「1 个 B+/1 个 A/1 个 S/2 个 S」一一对应。
  const PROMOTION_REQUIREMENTS = [
    { level: 2, minSemester: 2, points: 30, projects: 1, gradeMin: "B", gradeMinCount: 1, leadership: 50 },
    { level: 3, minSemester: 4, points: 80, projects: 2, gradeMin: "A", gradeMinCount: 1, leadership: 60, trust: 50 },
    { level: 4, minSemester: 6, points: 150, projects: 3, gradeMin: "A", gradeMinCount: 2, leadership: 70, trust: 60 },
    { level: 5, minSemester: 8, points: 240, projects: 4, gradeMin: "S", gradeMinCount: 2, leadership: 75, trust: 70, sCount: 2 }
  ];

  // P1-3：晋升奖励。原先只加工资 + 领导 +3/心理 +5/存款 +1000，
  // 设计与文档承诺的「解锁行动 / 提高行动上限 / 解锁项目事件 / 影响结局」均未实现。
  const PROMOTION_REWARDS = {
    2: { maxActions: 3, maxDevelopment: 1, salaryNote: "工资提升" },
    3: { maxActions: 4, maxDevelopment: 1, salaryNote: "工资提升，每月可安排 4 项重点工作" },
    4: { maxActions: 4, maxDevelopment: 2, salaryNote: "工资提升，每月最多 2 项职业发展行动" },
    5: { maxActions: 5, maxDevelopment: 2, salaryNote: "工资提升，每月可安排 5 项重点工作" }
  };

  function checkPromotion(state) {
    if (state.rankLevel >= 5) return null;
    const target = state.rankLevel + 1;
    const requirement = PROMOTION_REQUIREMENTS.find((item) => item.level === target);
    if (!requirement) return null;
    if (state.semester < requirement.minSemester || state.careerPoints < requirement.points) return null;
    if (state.counselor.leadership < (requirement.leadership || 0)) return null;
    if (requirement.trust && state.counselor.trust < requirement.trust) return null;
    if (state.projectHistory.length < requirement.projects) return null;

    const gradeRank = { C: 1, B: 2, A: 3, S: 4 };
    const qualifiedProjects = state.projectHistory.filter(
      (project) => (gradeRank[project.grade] || 0) >= gradeRank[requirement.gradeMin]
    );
    if (qualifiedProjects.length < (requirement.gradeMinCount || 1)) return null;
    if (requirement.sCount) {
      const sCount = state.projectHistory.filter((project) => project.grade === "S").length;
      if (sCount < requirement.sCount) return null;
    }

    const previousLevel = state.rankLevel;
    state.rankLevel = target;
    state.rankTrack = state.rankTrack || "职称线";
    state.rankTitle = resolveRankTitle(target, state.rankTrack);
    const reward = PROMOTION_REWARDS[target] || {};
    if (reward.maxActions) state.maxActions = reward.maxActions;
    if (reward.maxDevelopment) state.maxDevelopment = reward.maxDevelopment;
    state.promotionHistory.push({
      semester: state.semester,
      level: target,
      title: state.rankTitle,
      careerPoints: state.careerPoints,
      salary: getSalaryByRank(target),
      reward: reward.salaryNote || "工资提升"
    });
    state.counselor.leadership = clamp(state.counselor.leadership + 3, 0, 100);
    state.counselor.mental = clamp(state.counselor.mental + 5, 0, 100);
    state.counselor.savings += 1000;
    addTimeline(
      state,
      "晋升",
      `晋升为${state.rankTitle}`,
      `从 Lv${previousLevel} 提升到 Lv${target}，工资提升至 ${getSalaryByRank(target)} 元。` +
        (reward.salaryNote ? `${reward.salaryNote}。` : "")
    );
    return state.rankTitle;
  }

  function beginGame(state, name) {
    if (!name || !name.trim()) return false;
    state.counselor.name = name.trim();
    state.started = true;
    addTimeline(state, "入职", "辅导员入职", `${state.counselor.name} 成为了这个班级的新辅导员。`);
    return true;
  }

  function chooseSlack(state, slackId) {
    if (!["planning", "events"].includes(state.phase) || state.gameOver || state.slackRemaining <= 0) return null;
    const item = slackItems.find((slack) => slack.id === slackId);
    if (!item) return null;
    state.slackRemaining -= 1;
    const effects = {
      energy: item.energy,
      health: item.health,
      mental: item.mental,
      savings: -(item.savings || 0),
      colleague: item.colleague || 0,
      risk: item.risk || 0
    };
    applyCounselorEffects(state, effects);
    addTimeline(state, "摸鱼", item.name, `${item.text}。你短暂离开了工作。`);
    return item;
  }

  function getEventTargetStudents(state, event) {
    if (event.studentScope === "class" || !event.studentScope) return [];
    const highRisk = state.students.filter((student) => student.risk >= 45).sort((a, b) => b.risk - a.risk);
    if (event.studentScope === "pair") {
      const first = highRisk[0] || pick(state.students);
      const second = highRisk.find((student) => student.id !== first.id) || state.students.find((student) => student.id !== first.id);
      return [first.id, second.id].filter(Boolean);
    }
    if (event.studentScope === "problem") {
      return state.problemStudents.map((problem) => problem.studentId);
    }
    return [highRisk[0]?.id || state.students[0]?.id].filter(Boolean);
  }

  function buildMonthEventQueue(state) {
    const queue = [];
    const usedIds = new Set();
    // P1-6：事件冷却。最近 EVENT_HISTORY_LIMIT 条事件不再抽取（design.md §14）。
    const cooldown = new Set(state.recentEventIds || []);
    const eligible = events.filter(
      (event) => (!event.semesterRange || event.semesterRange.includes(state.semester)) && !cooldown.has(event.id)
    );
    // 冷却可能导致池子过小（尤其是学期专属事件较多的学期），此时逐步放宽。
    const eventPool = eligible.length >= 8
      ? shuffle(eligible)
      : shuffle(events.filter((event) => !event.semesterRange || event.semesterRange.includes(state.semester)));
    const targetCount = state.month === 5 ? rand(4, 6) : rand(3, 5);
    let fallbackCount = 0;

    while (queue.length < targetCount && fallbackCount < eventPool.length) {
      const event = eventPool[fallbackCount];
      fallbackCount += 1;
      if (usedIds.has(event.id)) continue;
      usedIds.add(event.id);
      const meta = eventMemoryMeta[event.id] || { studentScope: "class", choiceTags: event.choices.map(() => []) };
      const scopedEvent = {
        ...event,
        studentScope: meta.studentScope,
        choices: event.choices.map((choice, index) => ({
          ...choice,
          attitudeTags: meta.choiceTags?.[index] || []
        }))
      };
      scopedEvent.targetStudentIds = getEventTargetStudents(state, scopedEvent);
      queue.push(scopedEvent);
    }

    return queue;
  }

  // 事件消费后写入冷却窗口，超过窗口的旧记录被挤出。
  function rememberEvent(state, eventId) {
    if (!eventId) return;
    if (!Array.isArray(state.recentEventIds)) state.recentEventIds = [];
    state.recentEventIds = [eventId, ...state.recentEventIds.filter((id) => id !== eventId)].slice(
      0,
      EVENT_HISTORY_LIMIT
    );
  }

  function startMonth(state) {
    if (state.phase !== "planning" || state.gameOver) return false;

    const selectedActionObjects = state.selectedActions
      .map((id) => actions.find((action) => action.id === id))
      .filter(Boolean);

    const problemStudentIds = state.problemStudents.map((item) => item.studentId);
    const allStudentsHandled =
      state.problemStudents.length === 3 && problemStudentIds.every((id) => state.studentHandling[id] !== undefined);
    const hasEnoughWork = selectedActionObjects.length >= state.minWorkActions;
    const hasDevelopment =
      state.month === 1
        ? Boolean(state.developmentProjectId && state.developmentScenario)
        : Boolean(state.developmentProjectId && state.developmentEvent && state.developmentEventResolved);

    if (!hasEnoughWork || !hasDevelopment || !allStudentsHandled) return false;

    selectedActionObjects.forEach((action) => {
      applyCounselorEffects(state, action.effects);
      if (action.classEffect) applyClassEffects(state, action.classEffect);
      if (action.studentEffect) applyStudentEffects(state, action.studentEffect, problemStudentIds);
    });

    state.problemStudents.forEach((problem) => {
      const methodIndex = state.studentHandling[problem.studentId];
      const method = problem.methods[methodIndex];
      if (!method) return;
      applyStudentEffects(state, method.effect, [problem.studentId]);
      const student = state.students.find((item) => item.id === problem.studentId);
      if (student) {
        student.risk = clamp(student.risk + (method.risk || 0), 0, 100);
        refreshStudentSignal(student);
      }
      const selectedActionTagSet = new Set(selectedActionObjects.flatMap((action) => action.tags || []));
      if (method.tag && selectedActionTagSet.has(method.tag)) {
        applyStudentEffects(state, { mental: 4, trust: 4, social: 2 }, [problem.studentId]);
        if (student) {
          student.risk = clamp(student.risk - 5, 0, 100);
          refreshStudentSignal(student);
        }
        addTimeline(state, "协同处理", `${student?.name || "学生"}：协同处理生效`, "你选择的工作重点和问题学生需求匹配，处理效果更好。");
      }
      addTimeline(
        state,
        "学生处理",
        `${student?.name || "学生"}：${problem.title}`,
        `选择「${method.label}」：${method.outcome}`
      );
    });

    addTimeline(
      state,
      "月计划",
      `第 ${state.month} 月计划`,
      selectedActionObjects.length
        ? [
            selectedActionObjects.map((action) => action.name).join("、"),
            state.developmentProject?.name ? `发展项目：${state.developmentProject.name}` : "",
            `问题学生：${problemStudentIds.length} 人已处理`
          ]
            .filter(Boolean)
            .join("；")
        : "你没有安排任何重点工作，日子只能随机漂流。"
    );

    state.eventQueue = buildMonthEventQueue(state);
    state.phase = "events";
    state.summaryEvent = null;
    state.monthChallengeResults = [];
    state.monthStudentResults = [];
    state.monthDevelopmentResult = null;
    state.currentEvent = state.eventQueue.shift() || null;
    state.week = 1;
    state.lastChoice = null;
    return true;
  }

  function toneEffects(event, choice) {
    const base = {
      safe: { energy: -2, mental: -1, risk: -4, trust: 2, leadership: 1 },
      bold: { energy: -6, mental: -2, risk: -9, trust: 5, leadership: 2, health: -1 },
      hard: { energy: -7, mental: -4, risk: -6, trust: -3, leadership: 4, health: -2 },
      neglect: { energy: -1, mental: 2, risk: 9, trust: -4, leadership: -3 },
      fun: { energy: 3, mental: 5, risk: 2, trust: 2 }
    }[choice.tone] || {};

    const categoryModifier = {
      "辅导员状态": { mental: -3, health: -2 },
      "学生属性": { trust: 2, risk: -2 },
      "时间节点": { leadership: 2, risk: -2 },
      "趣味荒诞": { mental: 3, trust: 1 },
      "危机事件": { mental: -4, trust: 3, risk: -3 },
      // 96 条学期专属事件原先落在表外，只吃到基础 tone 效果，与通用事件毫无区别。
      "学期事件": { risk: -1, trust: 1, mental: -1 },
      "月终事件": { mental: 4, health: 1 }
    }[event.category] || {};

    const merged = { ...base };
    Object.keys(categoryModifier).forEach((key) => {
      merged[key] = (merged[key] || 0) + categoryModifier[key];
    });
    return merged;
  }

  /**
   * 事件选择的最终效果（P1-1 数据驱动）。
   * 优先使用 choice.effects（与 data.js 中发展项目事件同一套写法）。
   *
   * 语义选择：`choice.effects` 存在时**整表替换**，不做字段级合并。
   * 字段级合并会让「作者没写 risk」变成「静默继承 tone 的 risk」，
   * 这正是最难排查的一类数据 bug。tone/category 只在没有显式效果时兜底。
   *
   * 数据侧允许用稀疏数组表达「只覆写部分选项」：
   * 数组比 choices 短，或元素为 null，都表示该选项沿用 tone 推导值。
   */
  function resolveChoiceEffects(event, choice) {
    if (choice.effects && typeof choice.effects === "object") return { ...choice.effects };
    return toneEffects(event, choice);
  }

  function checkSuddenDeath(state) {
    if (state.counselor.health >= 20) return;
    // 阈值与 UI 的「危险」状态对齐，给出真实的预警窗口。
    const danger = clamp((20 - state.counselor.health) / 100, 0.05, 0.5);
    if (Math.random() < danger) {
      state.gameOver = {
        type: "猝死",
        title: "身体先于工作倒下了",
        text: "连续高压没有给你留出喘息的余地。你倒在了办公室，这个故事提前结束。"
      };
      state.phase = "gameOver";
      addTimeline(state, "结局", "猝死", state.gameOver.text);
    }
  }

  function resolveChoice(state, choiceIndex) {
    if (state.phase !== "events" || state.gameOver) return null;
    const event = state.currentEvent;
    if (!event) return null;
    const choice = event.choices[choiceIndex];
    if (!choice) return null;

    const effects = resolveChoiceEffects(event, choice);
    applyCounselorEffects(state, effects);

    if (event.category === "学生属性") {
      applyStudentEffects(
        state,
        { mental: choice.tone === "bold" ? 8 : choice.tone === "safe" ? 4 : choice.tone === "hard" ? -3 : -5, trust: choice.tone === "bold" ? 6 : choice.tone === "safe" ? 3 : -4 },
        state.problemStudents.length ? state.problemStudents.slice(0, 1).map((problem) => problem.studentId) : [pick(state.students).id]
      );
    }

    if (event.category === "时间节点") {
      state.counselor.leadership = clamp(state.counselor.leadership + (choice.tone === "hard" ? 3 : choice.tone === "safe" ? 2 : -2), 0, 100);
      state.counselor.risk = clamp(state.counselor.risk + (choice.tone === "bold" ? -8 : choice.tone === "safe" ? -4 : 5), 0, 100);
    }

    if (event.targetStudentIds?.length) {
      event.targetStudentIds.forEach((studentId) => {
        recordStudentMemory(state, studentId, {
          eventId: event.id,
          title: event.title,
          choice: choice.label,
          outcome: choice.outcome,
          attitudeTags: choice.attitudeTags || []
        });
      });
    }

    state.lastChoice = {
      eventId: event.id,
      eventTitle: event.title,
      choiceLabel: choice.label,
      outcome: choice.outcome
    };
    addTimeline(state, "事件", event.title, `选择「${choice.label}」：${choice.outcome}`);

    rememberEvent(state, event.id);
    state.currentEvent = state.eventQueue.shift() || null;
    if (state.currentEvent) {
      state.week = Math.min(4, state.week + 1);
    } else {
      settleMonth(state);
    }

    checkSuddenDeath(state);
    return choice;
  }

  /**
   * P1-4b：把长期积累的学生态度画像接回玩法。
   * 原先 student.memory / attitudeProfile 只被写入、从不被读取，
   * 导致「每个选择都留下后果」只停留在时间线文案上。
   * 现在：被持续忽视或边界模糊的学生，问题更难一次解决；
   * 感受到支持与共情的学生，处理成功率更高。
   */
  function getResolveChance(student, matched) {
    const profile = student.attitudeProfile || {};
    let attitudeBonus = 0;
    if ((profile.support || 0) <= -4 || (profile.empathy || 0) <= -4) attitudeBonus -= 0.1;
    else if ((profile.support || 0) >= 6 && (profile.empathy || 0) >= 4) attitudeBonus += 0.08;
    // 反复未解决会累积挫败感：历史失败次数越多，下一次越难。
    const failedAttempts = (student.issueState?.history || []).filter((item) => !item.resolved).length;
    const failurePenalty = Math.min(0.12, failedAttempts * 0.03);
    const base = matched ? 0.8 : 0.52;
    return clamp(base + attitudeBonus - failurePenalty, 0.15, 0.95);
  }

  function resolveProblemStudents(state) {
    state.monthStudentResults = [];
    const selectedActionTags = new Set(
      [...state.selectedActions, ...state.selectedDevelopment]
        .map((id) => actions.find((action) => action.id === id))
        .filter(Boolean)
        .flatMap((action) => action.tags || [])
    );

    state.problemStudents.forEach((problem) => {
      const student = state.students.find((item) => item.id === problem.studentId);
      const methodIndex = state.studentHandling[problem.studentId];
      const method = problem.methods[methodIndex];
      if (!student || !method) return;

      const matched = Boolean(method.tag && selectedActionTags.has(method.tag));
      const resolveChance = getResolveChance(student, matched);
      const resolved = Math.random() < resolveChance;
      student.issueState.history.push({
        month: state.month,
        title: problem.title,
        method: method.label,
        resolved,
        outcome: method.outcome
      });

      if (resolved) {
        student.issueState.resolvedCount += 1;
        student.issueState.activeIssueId = null;
        student.risk = clamp(student.risk - 8, 0, 100);
        refreshStudentSignal(student);
        recordStudentMemory(state, student.id, {
          eventId: `PROBLEM-${problem.issueId}`,
          title: problem.title,
          choice: method.label,
          outcome: method.outcome,
          attitudeTags: method.tag === "家长" ? ["支持", "家长介入"] : ["支持", "持续跟进"]
        });
        addTimeline(state, "学生反馈", `${student.name}：${problem.title} 已改善`, `${method.label} 发挥了作用。`);
        state.monthStudentResults.push({ studentId: student.id, name: student.name, title: problem.title, method: method.label, resolved: true, outcome: method.outcome });
      } else {
        student.issueState.activeIssueId = problem.issueId;
        student.risk = clamp(student.risk + 4, 0, 100);
        refreshStudentSignal(student);
        recordStudentMemory(state, student.id, {
          eventId: `PROBLEM-${problem.issueId}`,
          title: problem.title,
          choice: method.label,
          outcome: "问题尚未解决，下月继续关注。",
          attitudeTags: method.tag === "家长" ? ["支持", "家长介入"] : ["支持", "持续跟进"]
        });
        addTimeline(state, "学生反馈", `${student.name}：${problem.title} 仍未解决`, "下个周期会继续出现在问题学生中。");
        state.monthStudentResults.push({ studentId: student.id, name: student.name, title: problem.title, method: method.label, resolved: false, outcome: "问题尚未解决，下月继续关注。" });
      }
    });
  }

  // 精力过低会拖低身体（design.md §5 的联动，原实现完全缺失）。
  function energyHealthPenalty(energy) {
    if (energy < 20) return 2;
    if (energy < 40) return 1;
    return 0;
  }

  // 身体长期低于警戒线会拖低精力与心理，形成「过劳 → 生病 → 更过劳」的负反馈，
  // 但也给玩家一个明确的请假/就医信号（design.md §11：高压不等于无解）。
  function healthSecondaryPenalty(health) {
    return health < HEALTH_WARNING_THRESHOLD ? 2 : 0;
  }

  function settleMonth(state) {
    const c = state.counselor;
    const monthlySalary = getSalaryByRank(state.rankLevel) + c.development * 20;
    const livingCost = LIVING_COST_BASE + Math.max(0, LOW_ENERGY_THRESHOLD - c.energy) * LIVING_COST_PER_LOW_ENERGY;
    c.savings += monthlySalary - livingCost;
    c.health = clamp(c.health - MONTHLY_HEALTH_DRAIN - energyHealthPenalty(c.energy), 0, 100);
    c.mental = clamp(c.mental - MONTHLY_MENTAL_DRAIN - healthSecondaryPenalty(c.health), 0, 100);
    c.energy = clamp(c.energy + MONTHLY_ENERGY_RECOVERY - healthSecondaryPenalty(c.health), 0, 100);
    c.risk = clamp(c.risk + MONTHLY_RISK_DRIFT, 0, 100);

    const selectedActionTags = new Set(
      state.selectedActions
        .map((id) => actions.find((action) => action.id === id))
        .filter(Boolean)
        .flatMap((action) => action.tags || [])
    );
    state.monthChallengeResults = state.monthChallenges.map((challenge) => {
      const matchScore = selectedActionTags.has(challenge.primaryTag)
        ? 3
        : (challenge.partialTags || []).filter((tag) => selectedActionTags.has(tag)).length;
      let status;
      let effects;
      if (matchScore >= 3) {
        const fullyHandled = Math.random() < 0.8;
        status = fullyHandled ? "完全处理" : "部分处理";
        effects = fullyHandled
          ? { leadership: 2, risk: -3, mental: 2 }
          : scaleEffects(challenge.penalty, 0.5);
        applyCounselorEffects(state, effects);
        addTimeline(state, "局势", `${status}：${challenge.title}`, fullyHandled ? "你找到了关键工作，这个麻烦被有效解决。" : "你的安排接近问题核心，但仍留下一些隐患。");
      } else if (matchScore >= 1) {
        const partiallyHandled = Math.random() < 0.65;
        status = partiallyHandled ? "部分处理" : "未处理";
        effects = partiallyHandled ? scaleEffects(challenge.penalty, 0.5) : challenge.penalty;
        applyCounselorEffects(state, effects);
        addTimeline(state, "局势", `${status}：${challenge.title}`, partiallyHandled ? "你做了相关安排，但没有完全解决问题，只减轻了部分后果。" : "你的安排没有真正命中问题，月底仍然付出了代价。");
      } else {
        status = "未处理";
        effects = challenge.penalty;
        applyCounselorEffects(state, challenge.penalty);
        addTimeline(state, "局势", `未处理：${challenge.title}`, "这件事没有被真正解决，代价在月底显现。");
      }
      return { id: challenge.id, title: challenge.title, status, effects };
    });

    resolveProblemStudents(state);

    if (state.month === 5) {
      settleDevelopmentProject(state);
    }

    const report = {
      month: state.month,
      salary: monthlySalary,
      livingCost,
      health: c.health,
      mental: c.mental,
      energy: c.energy,
      savings: c.savings,
      risk: c.risk,
      unresolvedStudents: state.students.filter((student) => student.issueState?.activeIssueId).length,
      challengeResults: state.monthChallengeResults,
      projectResult: state.lastProjectResult,
      careerPoints: state.careerPoints,
      rankTitle: state.rankTitle,
      studentResults: state.monthStudentResults,
      developmentResult: state.monthDevelopmentResult,
      developmentProject: state.developmentProject
    };
    state.monthlySummary = report;
    addTimeline(
      state,
      "月报",
      `第 ${state.month} 月月报`,
      `工资 ${monthlySalary} 元，生活支出 ${livingCost} 元；身体 ${c.health}，心理 ${c.mental}，精力 ${c.energy}。`
    );

    state.summaryEvent = { ...pick(monthEndEvents) };
    state.phase = "monthEvent";
    state.currentEvent = null;
  }

  function resolveSummaryChoice(state, choiceIndex) {
    if (state.phase !== "monthEvent" || state.gameOver) return null;
    const event = state.summaryEvent;
    if (!event) return null;
    const choice = event.choices[choiceIndex];
    if (!choice) return null;

    applyCounselorEffects(state, resolveChoiceEffects(event, choice));
    state.lastChoice = {
      eventId: event.id,
      eventTitle: event.title,
      choiceLabel: choice.label,
      outcome: choice.outcome
    };
    addTimeline(state, "月终事件", event.title, `选择「${choice.label}」：${choice.outcome}`);
    state.summaryEvent = null;

    checkSuddenDeath(state);
    if (state.gameOver) return choice;

    state.phase = "monthSummary";
    return choice;
  }

  function closeMonthSummary(state) {
    if (state.phase !== "monthSummary" || state.gameOver) return false;
    if (state.month >= 5) {
      finishSemester(state);
    } else {
      advanceMonth(state);
    }
    return true;
  }

  function advanceMonth(state) {
    state.month += 1;
    state.week = 1;
    state.phase = "planning";
    state.selectedActions = [];
    state.selectedDevelopment = [];
    state.developmentEvent = null;
    state.developmentEventResolved = false;
    if (state.month > 1 && state.developmentProject) {
      generateDevelopmentEvent(state);
      // P0-2：第 5 月（假期月）的项目事件是本学期最后一次掷骰子，
      // 之后项目立即结算，必须让玩家知道这一次选择的权重。
      if (state.month === 5) {
        addTimeline(
          state,
          "发展项目",
          "本学期最后一次项目节点",
          "第 5 月是假期月，本次项目事件结束后将直接结算本学期项目等级，不再有调整机会。"
        );
      }
    } else {
      state.developmentEventResolved = true;
    }
    state.problemStudents = generateProblemStudents(state);
    state.studentHandling = {};
    state.currentEvent = null;
    state.eventQueue = [];
    state.monthlySummary = null;
    state.summaryEvent = null;
    state.monthStudentResults = [];
    state.monthDevelopmentResult = null;
    state.monthChallenges = generateMonthChallenges();
    state.handledChallengeIds = [];
    state.monthChallengeResults = [];
    state.slackRemaining = state.slackMax || DEFAULT_SLACK_MAX;
    addTimeline(state, "推进", `进入第 ${state.month} 月`, "新的月份开始，你还有机会重新安排生活。");
  }

  function advanceSemester(state) {
    const c = state.counselor;
    c.health = clamp(c.health + SEMESTER_HEALTH_RECOVERY, 0, 100);
    c.energy = clamp(c.energy + SEMESTER_ENERGY_RECOVERY, 0, 100);
    c.mental = clamp(c.mental + SEMESTER_MENTAL_RECOVERY, 0, 100);
    c.leadership = clamp(c.leadership + SEMESTER_LEADERSHIP_RECOVERY, 0, 100);
    state.semester += 1;
    state.month = 1;
    state.week = 1;
    state.phase = "semesterStart";
    state.selectedActions = [];
    state.selectedDevelopment = [];
    state.developmentProjectId = null;
    state.developmentProject = null;
    state.developmentProjectConfirmed = false;
    state.developmentScenario = null;
    state.developmentEvent = null;
    state.developmentEventResolved = false;
    state.problemStudents = generateProblemStudents(state);
    state.studentHandling = {};
    state.currentEvent = null;
    state.eventQueue = [];
    state.monthlySummary = null;
    state.summaryEvent = null;
    state.monthStudentResults = [];
    state.monthDevelopmentResult = null;
    state.monthChallenges = generateMonthChallenges();
    state.handledChallengeIds = [];
    state.monthChallengeResults = [];
    state.slackRemaining = state.slackMax || DEFAULT_SLACK_MAX;
    addTimeline(state, "新学期", `进入第 ${state.semester} 学期`, "新的学期开始，你可以选择新的发展项目。");
  }

  function getStudentAttitudeType(student) {
    const p = student.attitudeProfile || {};
    if (p.support <= -4 || p.empathy <= -4) return "疏远";
    if (p.empathy >= 6 && p.support >= 6) return "温暖支持";
    if (p.boundary >= 6 && p.empathy < 0) return "规则守护";
    if (p.respect >= 6) return "尊重自主";
    if (p.support >= 6) return "可靠但克制";
    return "关注有限";
  }

  function getStudentFinalAverage(student) {
    const attrs = student.attributes;
    return Math.round((attrs.study + attrs.mental + attrs.employment + attrs.social + attrs.health) / 5);
  }

  // 每名学生一句台词（P2）。原来的 6 态度 × 3 结局 = 18 条模板要覆盖 24 名学生，
  // 必然出现重复；这里每个组合扩到 4 个变体（共 72 条），并按学号确定性选取，
  // 既不重复也不会因为重绘而抖动。
  const STUDENT_QUOTES = {
    "温暖支持": {
      good: [
        "老师，谢谢你一直没放弃我。",
        "老师，是你先相信我能行，我才敢信自己。",
        "老师，我以后也想成为像你这样的人。",
        "老师，我把你当年说的话记了四年。"
      ],
      medium: [
        "老师，我知道你尽力了，我也会继续往前走。",
        "老师，虽然不算完美，但谢谢你陪我把这段路走完。",
        "老师，我不是最能干的那个，但你从没让我觉得被落下。",
        "老师，谢谢你在我慌乱的时候先接住我。"
      ],
      poor: [
        "老师，谢谢你愿意听我说，虽然我还是没做好。",
        "老师，对不起，我让你操心了这么久。",
        "老师，我走得慢，但记得你每一次停下来等我。",
        "老师，有些坎我没过去，可我记住了有人拉过我。"
      ]
    },
    "尊重自主": {
      good: [
        "老师，你给了我选择，也让我学会为自己负责。",
        "老师，你从没替我做决定，这对我来说比什么都重要。",
        "老师，谢谢你愿意把方向盘还给我。",
        "老师，我走的每一步都是我自己选的，而你在旁边看着。"
      ],
      medium: [
        "老师，你没替我做决定，这对我来说很重要。",
        "老师，我犹豫了很久，但你一直没催我。",
        "老师，你尊重了我的节奏，虽然我走得不算好。",
        "老师，谢谢你相信我能自己处理。"
      ],
      poor: [
        "老师，我可能让你失望了，但你至少尊重过我的选择。",
        "老师，我选错了，可那是我自己的错，我不怨你。",
        "老师，你没拦我，这点我到现在都很感谢。",
        "老师，我绕了远路，好在你没把我拽回来。"
      ]
    },
    "规则守护": {
      good: [
        "老师，你总是一板一眼，但后来我明白那是保护。",
        "老师，当年嫌你严，现在轮到我劝别人守规矩了。",
        "老师，你定的那些规矩，真的救过我一次。",
        "老师，你从没为我破例，这反而让我服气。"
      ],
      medium: [
        "老师，我们不算亲近，但我记得你每次都在。",
        "老师，你说话不多，可每次都在关键处。",
        "老师，你讲原则的时候很硬，现在想想是对的。",
        "老师，你不算好说话，但你公平。"
      ],
      poor: [
        "老师，你好像永远那么冷静，我有时候也想被你多问一句。",
        "老师，你按规矩办事没错，只是我那时候需要的不是规矩。",
        "老师，我知道你没针对我，可我还是有点难过。",
        "老师，你守住了原则，我没守住自己。"
      ]
    },
    "可靠但克制": {
      good: [
        "老师，你不常说什么，但我知道你靠得住。",
        "老师，你总是把事情办妥，然后什么都不说。",
        "老师，你帮我的时候像顺手，我知道那不是顺手。",
        "老师，你不煽情，但我在你那儿从没落空过。"
      ],
      medium: [
        "老师，谢谢你在我最乱的时候没有不管我。",
        "老师，你帮到一半就退开了，我倒也学会了自己走。",
        "老师，你话少，但事情我都记得。",
        "老师，你给我的帮助不多不少，刚好够我站住。"
      ],
      poor: [
        "老师，你帮过我，只是我还没准备好接受帮助。",
        "老师，你伸手的时候我在往后退，这不怪你。",
        "老师，我大概让你白跑了好几趟。",
        "老师，你的好意我收到了，只是没用上。"
      ]
    },
    "关注有限": {
      good: [
        "老师，我们说话不多，但谢谢你没让事情更糟。",
        "老师，你大概不记得这些小事，但它们对我挺重要。",
        "老师，我们不算熟，可你没把我当名单上的一个号。",
        "老师，你出现得不多，但每次都在要点上。"
      ],
      medium: [
        "老师，很多次我其实希望你能多问一句。",
        "老师，你忙，我也就没好意思开口。",
        "老师，我们之间隔着一整个办公室的距离。",
        "老师，我知道你手上有两百多个人，我只是其中一个。"
      ],
      poor: [
        "老师，也许你已经不记得我，但我记得那些没有被接住的时刻。",
        "老师，我最需要人的那阵子，办公室的灯是暗的。",
        "老师，我没怪你，你只是真的没空。",
        "老师，我想过敲门的，最后还是没有。"
      ]
    },
    "疏远": {
      good: [
        "老师，我们之间没有太多故事，但毕业快乐。",
        "老师，四年下来我们还是不太熟，不过谢谢你。",
        "老师，你有你的难处，我有我的路，各自保重。",
        "老师，没什么好说的，祝你以后少加点班。"
      ],
      medium: [
        "老师，你大概很忙，我也慢慢学会了自己处理。",
        "老师，我们没怎么打过交道，这样也挺好。",
        "老师，我不知道该跟你说什么，就说到这儿吧。",
        "老师，这几年我们像两条平行线。"
      ],
      poor: [
        "老师，有些话我一直没机会说，现在也不重要了。",
        "老师，我不太想回忆这几年，包括和你的部分。",
        "老师，我走过来了，虽然路上基本是我一个人。",
        "老师，就这样吧。"
      ]
    }
  };

  /**
   * 学生专属尾句（P2）：把「四年里最在意的那件事」作为切口。
   * 24 名学生大量集中在少数态度分桶里（实测「疏远」常占 40%+），
   * 单靠扩充模板无法避免重复，所以这里把学生自身的处境编进台词。
   */
  const ATTRIBUTE_LABELS = {
    study: "学业",
    mental: "情绪",
    employment: "去向",
    social: "人际",
    health: "身体",
    family: "家里",
    discipline: "规矩",
    economy: "生活费"
  };

  // 每个属性对应的「真实处境」尾句：学生最弱的那一项会被引用。
  const SITUATION_DETAILS = {
    study: "我到现在也没把学习这件事理顺，但至少没退学。",
    mental: "有些晚上还是很难熬，不过我学会开口了。",
    employment: "我还是没想清楚以后要干嘛，先走一步看一步。",
    social: "我在班里始终不太合群，这件事一直没解决。",
    health: "身体是这几年欠下的账，我打算慢慢还。",
    family: "家里那边的事，我到现在也没能跟他们说清楚。",
    discipline: "我犯过几次错，也为自己付过代价。",
    economy: "为了钱发愁的日子，我大概会记很久。"
  };

  /**
   * 合成收尾台词。两个索引按 `rotation + pattern * variants.length` 排序后依次选取，
   * 因此同一态度分桶内不会撞句——上限从「变体数」提高到「变体数 × 措辞数」。
   */
  function composeStudentQuote(student, attitude, outcome) {
    const variants = STUDENT_QUOTES[attitude]?.[outcome];
    if (!variants || !variants.length) return null;

    const digits = String(student.id || "").replace(/\D/g, "");
    const numericId = Number(digits) || student.name.length;
    const rank = numericId % (variants.length * 4);
    const rotation = rank % variants.length;
    const pattern = Math.floor(rank / variants.length) % 4;
    const base = variants[rotation];

    // 按「最弱属性」排序，让同一分桶内的不同学生引用不同的处境。
    const sortedKeys = Object.entries(student.attributes || {})
      .sort((a, b) => a[1] - b[1])
      .map(([key]) => key);
    const aspectKey = sortedKeys[rotation % Math.max(1, Math.min(3, sortedKeys.length))] || sortedKeys[0];
    const label = ATTRIBUTE_LABELS[aspectKey] || "这段日子";
    const detail = SITUATION_DETAILS[aspectKey] || "有些事我到现在也没想明白。";

    switch (pattern) {
      case 1:
        return `${base}${label}那件事，我一直没跟你提。`;
      case 2:
        return `${base}其实我最想说的是${label}——${detail}`;
      case 3:
        return `${base}${label}上我一直是个麻烦，谢谢你还愿意管我。`;
      default:
        return base;
    }
  }

  function getStudentEnding(student) {
    const average = getStudentFinalAverage(student);
    const unresolved = Boolean(student.issueState?.activeIssueId);
    const attitude = getStudentAttitudeType(student);
    const trust = student.relation?.trust || 0;
    const outcome = average >= 68 && !unresolved ? "good" : average >= 52 ? "medium" : "poor";
    const fallback = student.memory?.length
      ? "老师，谢谢你出现在我的大学里。"
      : "老师，我们之间没有太多故事，但毕业快乐。";
    return {
      studentId: student.id,
      name: student.name,
      attitude,
      trust,
      average,
      unresolved,
      outcome,
      quote: composeStudentQuote(student, attitude, outcome) || fallback
    };
  }

  function getPlayerEndingSummary(state) {
    const endings = state.students.map(getStudentEnding);
    const good = endings.filter((ending) => ending.outcome === "good").length;
    const medium = endings.filter((ending) => ending.outcome === "medium").length;
    const poor = endings.filter((ending) => ending.outcome === "poor").length;
    const unresolved = endings.filter((ending) => ending.unresolved).length;
    return `班级中 ${good} 人发展较好，${medium} 人基本稳定，${poor} 人仍需要继续关注；其中 ${unresolved} 人仍有未解决问题。`;
  }

  function finishSemester(state) {
    const c = state.counselor;
    const average = state.students.reduce((sum, student) => {
      const attrs = student.attributes;
      return sum + (attrs.study + attrs.mental + attrs.employment + attrs.social) / 4;
    }, 0) / state.students.length;
    const unresolvedCount = state.students.filter((student) => student.issueState?.activeIssueId).length;
    const resolvedCount = state.students.reduce((sum, student) => sum + (student.issueState?.resolvedCount || 0), 0);

    if (state.semester < 8) {
      checkPromotion(state);
      state.semesterSummary = {
        semester: state.semester,
        projectResult: state.lastProjectResult,
        careerPoints: state.careerPoints,
        rankTitle: state.rankTitle,
        projectHistoryCount: state.projectHistory.length,
        unresolvedCount: state.students.filter((student) => student.issueState?.activeIssueId).length,
        resolvedCount: state.students.reduce((sum, student) => sum + (student.issueState?.resolvedCount || 0), 0)
      };
      addTimeline(state, "学期总结", `第 ${state.semester} 学期结束`, `项目 ${state.lastProjectResult?.grade || "C"}，职业积分 ${state.careerPoints}。下一学期即将开始。`);
      state.phase = "semesterSummary";
      return;
    }

    checkPromotion(state);

    let ending;
    if (c.health < 15) {
      ending = { type: "猝死", title: "身体先于工作倒下了", text: "你没有走到学期结束。" };
    } else if (c.mental < 15 || c.leadership < 20) {
      ending = { type: "崩溃离场", title: "你没能撑过这一学期", text: "系统性的压力没有给你足够支持。你不得不暂时离开岗位。" };
    } else if (state.rankLevel >= 5 && state.rankTrack === "职称线") {
      ending = { type: "教授级辅导员", title: "你成为了学生工作领域的研究者与引领者", text: `你以教授级辅导员的身份走完这一届。职业积分 ${state.careerPoints}，你留下的不只是带班经验，也有一套可以延续的方法。` };
    } else if (state.rankLevel >= 5 && state.rankTrack === "实务线") {
      ending = { type: "学生工作专家", title: `你成为了${state.rankTitle}`, text: `你从牛马辅导员一路走到了${state.rankTitle}。你证明了长期扎根学生工作，也可以获得真正的专业身份和影响力。` };
    } else if (state.rankLevel >= 4) {
      ending = { type: "学院骨干", title: `你成为了${state.rankTitle}`, text: `你已经从一线执行者成长为学院学生工作的核心骨干。职业积分 ${state.careerPoints}，但你也清楚，越往上责任越大。` };
    } else if (state.rankLevel >= 3) {
      ending = { type: "青年骨干", title: `你成为了${state.rankTitle}`, text: `你开始拥有更多话语权和资源，也在管理、专业和一线之间寻找平衡。` };
    } else if (average >= 76 && c.health >= 50 && c.mental >= 50 && unresolvedCount <= 2 && resolvedCount >= 6) {
      ending = { type: "优秀开局", title: "这一学期，你站稳了", text: `班级状态不错，你解决了 ${resolvedCount} 个学生问题。发展项目 ${state.lastProjectResult?.grade || "C"}，职业积分 ${state.careerPoints}。` };
    } else if (average >= 62 && unresolvedCount <= 4) {
      ending = { type: "普通完成", title: "这一学期磕磕绊绊地结束了", text: `没有大事故，也没有多少掌声。仍有 ${unresolvedCount} 名学生需要继续关注。当前仍是${state.rankTitle}。` };
    } else {
      ending = { type: "勉强完成", title: "这一学期终于熬完了", text: `问题不少，还有 ${unresolvedCount} 名学生的困扰没有真正解决。职业积分 ${state.careerPoints}，下学期只会更难。` };
    }

    state.studentEndings = state.students.map(getStudentEnding);
    state.playerEndingSummary = getPlayerEndingSummary(state);
    if (!ending.text.includes("班级中")) ending.text += ` ${state.playerEndingSummary}`;

    state.gameOver = ending;
    state.phase = "gameOver";
    addTimeline(state, "最终结局", ending.title, ending.text);
  }

  function closeSemesterSummary(state) {
    if (state.phase !== "semesterSummary" || state.gameOver) return false;
    advanceSemester(state);
    return true;
  }

  function startNewSemester(state) {
    if (state.phase !== "semesterStart" || state.gameOver) return false;
    state.phase = "planning";
    state.semesterSummary = null;
    return true;
  }

  function getCurrentEvent(state) {
    return state.currentEvent || null;
  }

  function resetState() {
    const fresh = createInitialState();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("清除存档失败。", error);
    }
    return fresh;
  }

  // 允许保存的相位（P0-3）：月总结/学期总结/结局阶段属于「已结算等待翻页」，
  // 存档会让玩家重载后停在一个无法操作的主体界面上。
  const SAVEABLE_PHASES = ["planning", "events", "semesterStart"];

  function canSaveState(state) {
    return Boolean(state) && !state.gameOver && SAVEABLE_PHASES.includes(state.phase);
  }

  window.GameEngine = {
    STATE_VERSION,
    SAVEABLE_PHASES,
    canSaveState,
    createInitialState,
    loadState,
    saveState,
    resetState,
    beginGame,
    toggleAction,
    toggleDevelopment,
    selectStudentHandling,
    selectDevelopmentProject,
    selectDevelopmentScenario,
    resolveDevelopmentEvent,
    chooseSlack,
    startMonth,
    resolveChoice,
    resolveSummaryChoice,
    closeMonthSummary,
    closeSemesterSummary,
    startNewSemester,
    getCurrentEvent,
    getActions: () => actions,
    getSlackItems: () => slackItems,
    getDevelopmentProjects: () => developmentProjects,
    getRankTitle,
    getSalaryByRank,
    // 仅供回归测试使用：不改变玩法，只暴露纯函数以便断言事件冷却与效果映射。
    __test: {
      buildMonthEventQueue,
      toneEffects,
      resolveChoiceEffects,
      getResolveChance,
      energyHealthPenalty,
      healthSecondaryPenalty
    }
  };
})();
