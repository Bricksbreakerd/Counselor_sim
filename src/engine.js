(function () {
  const STORAGE_KEY = "counselor-sim-save-v1";
  const { actions, events, slackItems, names, traits, monthlyChallenges, monthlySituationTemplates, monthEndEvents, problemIssues, storyFragments, developmentProjects, developmentProjectScenarios, eventMemoryMeta } = window.GameData;

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(items) {
    return items[rand(0, items.length - 1)];
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

  function generateMonthChallenges() {
    const pool = [...monthlySituationTemplates].sort(() => Math.random() - 0.5);
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

  function normalizeMonthChallenges(challenges) {
    return (challenges || []).map((challenge) => {
      const source = monthlyChallenges.find((item) => item.id === challenge.id) || {};
      return {
        ...source,
        ...challenge,
        primaryTag: challenge.primaryTag || source.primaryTag,
        partialTags: challenge.partialTags || source.partialTags || [],
        direction: challenge.direction || source.direction || "综合方向"
      };
    });
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

    while (existing.length < 3 && newPool.length) {
      const student = newPool.shift();
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
      version: 1,
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
      slackRemaining: 2,
      maxActions: 3,
      maxDevelopment: 1,
      lastChoice: null,
      gameOver: null
    };
    state.monthChallenges = generateMonthChallenges();
    state.problemStudents = generateProblemStudents(state);
    return state;
  }

  function migrateState(raw) {
    if (!raw || raw.version !== 1) return null;
    const initial = createInitialState();
    return {
      ...initial,
      ...raw,
      counselor: { ...initial.counselor, ...(raw.counselor || {}) },
      students: Array.isArray(raw.students) && raw.students.length ? raw.students.map(enrichStudent) : initial.students,
      selectedActions: Array.isArray(raw.selectedActions) ? raw.selectedActions : [],
      selectedDevelopment: Array.isArray(raw.selectedDevelopment) ? raw.selectedDevelopment : [],
      developmentProjectId: raw.developmentProjectId || null,
      developmentProject: raw.developmentProject || null,
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
      monthChallenges: Array.isArray(raw.monthChallenges) ? normalizeMonthChallenges(raw.monthChallenges) : generateMonthChallenges(),
      handledChallengeIds: Array.isArray(raw.handledChallengeIds) ? raw.handledChallengeIds : [],
      monthChallengeResults: Array.isArray(raw.monthChallengeResults) ? raw.monthChallengeResults : [],
      timeline: Array.isArray(raw.timeline) ? raw.timeline : [],
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
    c.health = clamp(c.health + (effects.health || 0), 0, 100);
    c.energy = clamp(c.energy + (effects.energy || 0), 0, 100);
    c.mental = clamp(c.mental + (effects.mental || 0), 0, 100);
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
    const targets = studentIds && studentIds.length ? studentIds : state.problemStudents.map((problem) => problem.studentId).slice(0, 3);
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
    const tagEffects = {
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
      "公开": { boundary: -1, respect: -1 }
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
    if (state.month !== 1 && state.developmentProjectId) return false;
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
    const shuffledScenarios = [...scenarioPool].sort(() => Math.random() - 0.5);
    state.developmentScenarioOptions = shuffledScenarios.slice(0, 3);
    state.developmentScenario = null;
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
    addTimeline(state, "发展项目", `确定具体方向：${scenario.name}`, "本学期发展项目方向已确认。");
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
      project.progress = clamp(project.progress + (choice.effects.progress || 0), 0, 100);
      project.quality = clamp(project.quality + (choice.effects.quality || 0), 0, 100);
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
    let grade = "C";
    if (score >= 82) grade = "S";
    else if (score >= 70) grade = "A";
    else if (score >= 56) grade = "B";

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
    const trackName = track === "实务线" ? "实务线" : "职称线";
    if (level === 1) return "牛马辅导员";
    if (level === 2) return "高级牛马辅导员";
    if (level === 3) {
      return trackName === "实务线" ? pick(["学工办副主任", "团委副书记"]) : "讲师级辅导员";
    }
    if (level === 4) {
      return trackName === "实务线" ? pick(["学工办主任", "团委书记"]) : "副教授级辅导员";
    }
    if (level === 5) {
      return trackName === "实务线" ? pick(["学生工作专家", "学院副书记"]) : "教授级辅导员";
    }
    return "牛马辅导员";
  }

  function checkPromotion(state) {
    if (state.rankLevel >= 5) return null;
    const requirements = [
      { level: 2, minSemester: 2, points: 30, projects: 1, gradeMin: "B", leadership: 50 },
      { level: 3, minSemester: 4, points: 80, projects: 2, gradeMin: "A", leadership: 60, trust: 50 },
      { level: 4, minSemester: 6, points: 150, projects: 3, gradeMin: "S", leadership: 70, trust: 60 },
      { level: 5, minSemester: 8, points: 240, projects: 4, gradeMin: "S", leadership: 75, trust: 70, sCount: 2 }
    ];
    const target = state.rankLevel + 1;
    const requirement = requirements.find((item) => item.level === target);
    if (!requirement) return null;
    if (state.semester < requirement.minSemester || state.careerPoints < requirement.points) return null;
    if (state.counselor.leadership < (requirement.leadership || 0)) return null;
    if (requirement.trust && state.counselor.trust < requirement.trust) return null;

    const gradeRank = { C: 1, B: 2, A: 3, S: 4 };
    const qualifiedProjects = state.projectHistory.filter((project) => gradeRank[project.grade] >= gradeRank[requirement.gradeMin]);
    if (state.projectHistory.length < requirement.projects) return null;
    if (qualifiedProjects.length < 1) return null;
    if (requirement.sCount) {
      const sCount = state.projectHistory.filter((project) => project.grade === "S").length;
      if (sCount < requirement.sCount) return null;
    }

    const previousLevel = state.rankLevel;
    state.rankLevel = target;
    state.rankTitle = getRankTitle(target, state.rankTrack || "职称线");
    state.promotionHistory.push({
      semester: state.semester,
      level: target,
      title: state.rankTitle
    });
    state.counselor.leadership = clamp(state.counselor.leadership + 3, 0, 100);
    state.counselor.mental = clamp(state.counselor.mental + 5, 0, 100);
    state.counselor.savings += 1000;
    addTimeline(state, "晋升", `晋升为${state.rankTitle}`, `从 Lv${previousLevel} 提升到 Lv${target}，工资提升至 ${getSalaryByRank(target)} 元。`);
    return state.rankTitle;
  }

  function beginGame(state, name) {
    if (!name || !name.trim()) return false;
    state.counselor.name = name.trim();
    state.started = true;
    addTimeline(state, "入职", "辅导员入职", `${state.counselor.name} 成为了这个班级的新辅导员。`);
    return true;
  }

  function drawFocusStudents(state) {
    return [];
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
    const eventPool = [...events]
      .filter((event) => !event.semesterRange || event.semesterRange.includes(state.semester))
      .sort(() => Math.random() - 0.5);
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
      "月终事件": { mental: 4, health: 1 }
    }[event.category] || {};

    const merged = { ...base };
    Object.keys(categoryModifier).forEach((key) => {
      merged[key] = (merged[key] || 0) + categoryModifier[key];
    });
    return merged;
  }

  function checkSuddenDeath(state) {
    if (state.counselor.health >= 15) return;
    const danger = clamp((15 - state.counselor.health) / 100, 0.08, 0.45);
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

    const effects = toneEffects(event, choice);
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

    const wasMonthEnd = Boolean(event.isMonthEnd);
    state.currentEvent = state.eventQueue.shift() || null;
    if (!state.currentEvent) {
      settleMonth(state);
    } else {
      state.week = wasMonthEnd ? 4 : Math.min(4, state.week + 1);
    }

    checkSuddenDeath(state);
    return choice;
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
      const resolveChance = matched ? 0.8 : 0.52;
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

  function settleMonth(state) {
    const c = state.counselor;
    const monthlySalary = getSalaryByRank(state.rankLevel) + c.development * 20;
    const livingCost = 2800 + Math.max(0, 80 - c.energy) * 15;
    c.savings += monthlySalary - livingCost;
    c.health = clamp(c.health - 3, 0, 100);
    c.mental = clamp(c.mental - 2, 0, 100);
    c.energy = clamp(c.energy + 8, 0, 100);
    c.risk = clamp(c.risk + 2, 0, 100);

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

    applyCounselorEffects(state, toneEffects(event, choice));
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
    if (state.month > 1) {
      generateDevelopmentEvent(state);
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
    state.slackRemaining = 2;
    addTimeline(state, "推进", `进入第 ${state.month} 月`, "新的月份开始，你还有机会重新安排生活。");
  }

  function advanceSemester(state) {
    const c = state.counselor;
    c.health = clamp(c.health + 5, 0, 100);
    c.energy = clamp(c.energy + 12, 0, 100);
    c.mental = clamp(c.mental + 18, 0, 100);
    c.leadership = clamp(c.leadership + 2, 0, 100);
    state.semester += 1;
    state.month = 1;
    state.week = 1;
    state.phase = "semesterStart";
    state.selectedActions = [];
    state.selectedDevelopment = [];
    state.developmentProjectId = null;
    state.developmentProject = null;
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
    state.slackRemaining = 2;
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

  function getStudentEnding(student) {
    const average = getStudentFinalAverage(student);
    const unresolved = Boolean(student.issueState?.activeIssueId);
    const attitude = getStudentAttitudeType(student);
    const trust = student.relation?.trust || 0;
    const outcome = average >= 68 && !unresolved ? "good" : average >= 52 ? "medium" : "poor";
    const quotes = {
      "温暖支持": {
        good: "老师，谢谢你一直没放弃我。",
        medium: "老师，我知道你尽力了，我也会继续往前走。",
        poor: "老师，谢谢你愿意听我说，虽然我还是没做好。"
      },
      "尊重自主": {
        good: "老师，你给了我选择，也让我学会为自己负责。",
        medium: "老师，你没替我做决定，这对我来说很重要。",
        poor: "老师，我可能让你失望了，但你至少尊重过我的选择。"
      },
      "规则守护": {
        good: "老师，你总是一板一眼，但后来我明白那是保护。",
        medium: "老师，我们不算亲近，但我记得你每次都在。",
        poor: "老师，你好像永远那么冷静，我有时候也想被你多问一句。"
      },
      "可靠但克制": {
        good: "老师，你不常说什么，但我知道你靠得住。",
        medium: "老师，谢谢你在我最乱的时候没有不管我。",
        poor: "老师，你帮过我，只是我还没准备好接受帮助。"
      },
      "关注有限": {
        good: "老师，我们说话不多，但谢谢你没让事情更糟。",
        medium: "老师，很多次我其实希望你能多问一句。",
        poor: "老师，也许你已经不记得我，但我记得那些没有被接住的时刻。"
      },
      "疏远": {
        good: "老师，我们之间没有太多故事，但毕业快乐。",
        medium: "老师，你大概很忙，我也慢慢学会了自己处理。",
        poor: "老师，有些话我一直没机会说，现在也不重要了。"
      }
    };
    const fallback = student.memory?.length ? "老师，谢谢你出现在我的大学里。" : "老师，我们之间没有太多故事，但毕业快乐。";
    return {
      studentId: student.id,
      name: student.name,
      attitude,
      trust,
      average,
      unresolved,
      outcome,
      quote: quotes[attitude]?.[outcome] || fallback
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

  window.GameEngine = {
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
    drawFocusStudents,
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
    getMonthChallenges: () => monthlyChallenges,
    getDevelopmentProjects: () => developmentProjects
  };
})();
