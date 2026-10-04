(function () {
  const actions = [
    { id: "W01", name: "重点学生跟进", category: "学生工作", desc: "把时间留给最需要被看见的人，集中处理高风险学生。", effects: { energy: -8, risk: -16, trust: 8, mental: -5 }, studentEffect: { mental: 12, trust: 10 } },
    { id: "W02", name: "心理危机干预", category: "学生工作", desc: "对心理危机信号进行专业、及时的处理。", effects: { energy: -11, risk: -22, trust: 8, leadership: 5, mental: -8, health: -2 }, studentEffect: { mental: 16, trust: 12 } },
    { id: "W03", name: "班团与学风建设", category: "学生工作", desc: "用班团活动和学风引导增强集体稳定。", effects: { energy: -10, leadership: 5, social: 8, risk: -4, trust: 2 }, classEffect: { study: 7, social: 8, discipline: 5 } },
    { id: "W04", name: "就业与生涯指导", category: "学生工作", desc: "帮助学生梳理职业方向、简历和就业机会。", effects: { energy: -7, trust: 6, employment: 8, mental: -2 }, studentEffect: { employment: 9, trust: 6 } },
    { id: "W05", name: "家校协同沟通", category: "学生工作", desc: "和家长同步信息，争取家庭支持。", effects: { energy: -6, parent: 10, trust: -1, mental: -2 }, studentEffect: { family: 5, trust: 3 } },
    { id: "W06", name: "宿舍与安全排查", category: "学生工作", desc: "排查宿舍矛盾、安全隐患和晚归失联风险。", effects: { energy: -9, risk: -14, trust: 4, mental: -3, leadership: 3 }, studentEffect: { social: 5, health: 5 } },
    { id: "W07", name: "材料报送攻坚", category: "行政事务", desc: "集中处理报表、证明和各类报送材料。", effects: { energy: -7, leadership: 8, risk: -6, mental: -3 } },
    { id: "W08", name: "迎检与临时任务", category: "行政事务", desc: "应对检查、突击任务和临时被安排的工作。", effects: { energy: -10, leadership: 9, risk: -8, mental: -6, health: -2 } },
    { id: "W09", name: "数据与档案整理", category: "行政事务", desc: "整理学生档案和系统数据，降低期末压力。", effects: { energy: -5, risk: -6, leadership: 4, mental: -1 } },
    { id: "W10", name: "值班安全巡查", category: "行政事务", desc: "承担夜间或重点时段值班，降低安全风险。", effects: { energy: -9, health: -4, risk: -10, leadership: 5, mental: -4 } },
    { id: "W11", name: "身心恢复与求助", category: "个人恢复", desc: "就医、心理咨询或寻求专业支持。", effects: { energy: -2, health: 7, mental: 13, savings: -450 } },
    { id: "W12", name: "休息与补觉", category: "个人恢复", desc: "回家休息或补足睡眠，让身体重新启动。", effects: { energy: 20, health: 5, mental: 9, risk: 3 } },
    { id: "W13", name: "请假休整", category: "个人恢复", desc: "暂停工作一天，换回更完整的恢复。", effects: { energy: 20, health: 6, mental: 12, leadership: -5, risk: 6 } },
    { id: "S01", name: "谈心谈话", category: "学生工作", desc: "约谈学生，了解近况，降低隐藏风险。", effects: { energy: -14, trust: 8, risk: -6, mental: -2 }, studentEffect: { mental: 7, trust: 8 } },
    { id: "S02", name: "宿舍走访", category: "学生工作", desc: "走进宿舍，看见课堂之外的学生。", effects: { energy: -14, trust: 6, risk: -8, mental: -1 }, studentEffect: { social: 5, trust: 6 } },
    { id: "S03", name: "心理排查", category: "学生工作", desc: "用问卷和谈话识别潜在心理风险。", effects: { energy: -6, risk: -14, leadership: 4, mental: -5 }, studentEffect: { mental: 9, trust: 3 } },
    { id: "S04", name: "学风建设", category: "学生工作", desc: "抓出勤、抓课堂，短期可能招来怨气。", effects: { energy: -16, leadership: 5, risk: -4, trust: -3 }, classEffect: { study: 8, discipline: 6 } },
    { id: "S05", name: "就业指导", category: "学生工作", desc: "改简历、推岗位，回答“老师我以后能干嘛”。", effects: { energy: -5, trust: 5, employment: 7, mental: -1 }, studentEffect: { employment: 8, trust: 5 } },
    { id: "S06", name: "重点学生跟进", category: "学生工作", desc: "把时间留给最需要被看见的人。", effects: { energy: -8, risk: -16, trust: 8, mental: -7 }, studentEffect: { mental: 12, trust: 10 } },
    { id: "S07", name: "班团活动", category: "学生工作", desc: "组织一次活动，把班级从名单变成集体。", effects: { energy: -8, leadership: 5, social: 8, savings: -300 }, classEffect: { social: 9, trust: 6 } },
    { id: "S08", name: "家校联系", category: "学生工作", desc: "和家长同步学生情况，不一定总是愉快。", effects: { energy: -5, parent: 9, trust: -2, mental: -2 }, studentEffect: { family: 5, trust: 3 } },
    { id: "S09", name: "转专业咨询", category: "学生工作", desc: "帮助学生选择更适合的方向。", effects: { energy: -8, trust: 7, mental: -1 }, studentEffect: { employment: 6, trust: 8 } },
    { id: "S10", name: "奖助贷评审", category: "学生工作", desc: "把资助给到真正需要的人，难免有争议。", effects: { energy: -22, leadership: 6, trust: 4, risk: -3, mental: -6 }, studentEffect: { economy: 7, trust: 5 } },
    { id: "S11", name: "违纪处理", category: "学生工作", desc: "按规矩处理，先解决事情，再解决情绪。", effects: { energy: -16, leadership: 5, trust: -6, risk: -5, mental: -4 }, classEffect: { discipline: 9 } },
    { id: "S12", name: "危机干预", category: "学生工作", desc: "高风险事项，必须优先处理。", effects: { energy: -11, risk: -25, trust: 8, leadership: 6, mental: -12, health: -4 }, studentEffect: { mental: 16, trust: 12 } },
    { id: "A01", name: "报送材料", category: "行政事务", desc: "改格式、补盖章、反复提交。", effects: { energy: -6, leadership: 7, risk: -4, mental: -4 } },
    { id: "A02", name: "迎检准备", category: "行政事务", desc: "把一切整理成领导希望看到的样子。", effects: { energy: -8, leadership: 9, risk: -8, mental: -7 } },
    { id: "A03", name: "撰写周报月报", category: "行政事务", desc: "把工作写下来，证明你确实做了。", effects: { energy: -9, leadership: 5, mental: -1 } },
    { id: "A04", name: "参加例会", category: "行政事务", desc: "听会、记录，偶尔领回临时任务。", effects: { energy: -8, colleague: 4, leadership: 3 } },
    { id: "A05", name: "数据填报", category: "行政事务", desc: "在十几个系统里填同样的数据。", effects: { energy: -16, leadership: 6, mental: -3 } },
    { id: "A06", name: "值班巡查", category: "行政事务", desc: "用夜晚的清醒，换白天的疲惫。", effects: { energy: -9, health: -5, risk: -10, leadership: 5, mental: -6 } },
    { id: "A07", name: "活动报销", category: "行政事务", desc: "贴发票、写说明，把垫付的钱要回来。", effects: { energy: -14, savings: 500, leadership: 3, mental: -3 } },
    { id: "A08", name: "培训学习", category: "行政事务", desc: "提升自己，但离岗期间班里可能有事。", effects: { energy: -16, risk: 4, leadership: 5, mental: -2, development: 8 } },
    { id: "A09", name: "新媒体宣传", category: "行政事务", desc: "拍照、写稿、做推送。", effects: { energy: -18, leadership: 8, trust: 2, mental: -2 } },
    { id: "A10", name: "档案整理", category: "行政事务", desc: "枯燥，但期末会感谢现在的自己。", effects: { energy: -10, risk: -5, leadership: 3 } },
    { id: "A11", name: "临时迎检", category: "行政事务", desc: "被临时通知，不做得扣分，做得好也未必被看见。", effects: { energy: -10, leadership: 8, risk: -10, mental: -10, health: -3 } },
    { id: "A12", name: "材料补交", category: "行政事务", desc: "补上之前漏掉的部分。", effects: { energy: -14, leadership: 5, risk: -5, mental: -3 } },
    { id: "P01", name: "摸鱼", category: "个人恢复", desc: "短暂离开工作，让大脑呼吸一下。", effects: { energy: 14, mental: 10, health: 2, risk: 2 } },
    { id: "P02", name: "规律运动", category: "个人恢复", desc: "现在累一点，长期更扛得住。", effects: { energy: -8, health: 12, mental: 6 } },
    { id: "P03", name: "就医检查", category: "个人恢复", desc: "身体不舒服，早看早安心。", effects: { energy: -2, health: 18, mental: 4, savings: -500 } },
    { id: "P04", name: "心理咨询", category: "个人恢复", desc: "你不是只能自己扛。", effects: { energy: -2, mental: 16, savings: -300 } },
    { id: "P05", name: "朋友聚会", category: "个人恢复", desc: "和真正理解你的人吃顿饭。", effects: { energy: -6, mental: 14, savings: -350, colleague: 3 } },
    { id: "P06", name: "回家休息", category: "个人恢复", desc: "暂时离开学校，把手机调成震动。", effects: { energy: 20, health: 8, mental: 14, risk: 4 } },
    { id: "P07", name: "理财整理", category: "个人恢复", desc: "看看工资都去了哪里。", effects: { savings: 700, energy: -4, mental: 3 } },
    { id: "P08", name: "认真吃饭", category: "个人恢复", desc: "好好吃一顿热饭。", effects: { energy: 8, health: 6, mental: 4, savings: -120 } },
    { id: "P09", name: "睡觉补觉", category: "个人恢复", desc: "把欠下的睡眠还一部分。", effects: { energy: 22, health: 8, mental: 8, leadership: -2 } },
    { id: "P10", name: "请假休整", category: "个人恢复", desc: "暂停一天，代价是工作积压。", effects: { energy: 20, health: 14, mental: 12, leadership: -5, risk: 6 } },
    { id: "D01", name: "职称申报", category: "职业发展", desc: "为未来多留一条路。", effects: { energy: -10, development: 14, leadership: 4, mental: -5, savings: -300 } },
    { id: "D02", name: "学历提升", category: "职业发展", desc: "长期投入，收益也长期。", effects: { energy: -12, development: 18, mental: -7, health: -3, savings: -1500 } },
    { id: "D03", name: "科研论文", category: "职业发展", desc: "在实务和科研之间抢时间。", effects: { energy: -10, development: 15, leadership: 5, mental: -6 } },
    { id: "D04", name: "比赛指导", category: "职业发展", desc: "陪学生打磨项目，也可能一起熬夜。", effects: { energy: -10, development: 8, employment: 8, leadership: 5, mental: -7 } },
    { id: "D05", name: "品牌项目申报", category: "职业发展", desc: "争取资源，也要接受结项压力。", effects: { energy: -10, development: 12, leadership: 8, mental: -6 } },
    { id: "D06", name: "职业规划培训", category: "职业发展", desc: "更新方法，也给学生更好的建议。", effects: { energy: -6, development: 9, employment: 6, mental: -2 } }
  ];

  const actionTags = {
    W01: ["学生", "风险", "心理"],
    W02: ["危机", "心理", "学生"],
    W03: ["集体", "社交", "学生"],
    W04: ["就业", "学生"],
    W05: ["家长", "家庭"],
    W06: ["安全", "风险", "学生"],
    W07: ["材料", "领导"],
    W08: ["迎检", "领导", "高压"],
    W09: ["数据", "领导"],
    W10: ["安全", "风险", "高压"],
    W11: ["身体", "心理", "恢复"],
    W12: ["恢复", "身体"],
    W13: ["恢复", "身体", "心理"],
    S03: ["心理", "风险"],
    S05: ["就业", "信任"],
    S06: ["学生", "风险"],
    S07: ["社交", "集体"],
    S08: ["家长", "家庭"],
    S12: ["危机", "学生"],
    A01: ["材料", "领导"],
    A02: ["迎检", "领导"],
    A06: ["安全", "风险"],
    A11: ["迎检", "高压"],
    P03: ["身体", "恢复"],
    P04: ["心理", "恢复"],
    P06: ["恢复", "家庭"],
    P08: ["恢复", "身体"],
    P09: ["恢复", "身体"],
    P10: ["恢复", "身体"],
    D01: ["发展", "职称"],
    D02: ["发展", "学历"],
    D03: ["发展", "科研"],
    D04: ["发展", "就业"],
    D05: ["发展", "项目"],
    D06: ["发展", "培训"]
  };

  const actionSummaries = {
    W01: "集中处理高风险学生，降低班级隐患和学生信任。",
    W02: "处理最紧急的心理危机，代价高但收益也高。",
    W03: "增强班级凝聚力、学风和集体稳定。",
    W04: "改善学生就业表现和职业方向。",
    W05: "提升家长满意度，可能影响学生短期信任。",
    W06: "排查宿舍矛盾和安全风险。",
    W07: "集中处理材料，换取领导评价和月末压力下降。",
    W08: "应对检查与临时任务，消耗较大但领导收益明显。",
    W09: "整理数据档案，降低期末和检查风险。",
    W10: "用值班巡查压住安全风险，但身体会付出代价。",
    W11: "是找推拿师傅还是找心理医生啊？",
    W12: "不干了，睡一觉再说。",
    W13: "磨刀不误砍柴工，下周我再来打工。",
    S03: "发现心理风险，降低班级隐患。",
    S05: "改善就业表现，增加学生信任。",
    S06: "集中处理高风险学生，信任和风险都变化明显。",
    S07: "提升班级凝聚力和社交表现。",
    S08: "提高家长满意度，但可能影响学生信任。",
    S12: "最高风险事项，付出极高但收益也高。",
    A01: "完成材料任务，换取领导评价。",
    A02: "降低迎检风险，消耗大量精力。",
    A06: "压低安全风险，代价是身体和睡眠。",
    A11: "硬扛临时检查，领导满意但自己很累。",
    P03: "恢复身体，减少健康风险。",
    P04: "恢复心理，学习求助。",
    P06: "全面恢复，但远离工作会让风险上升。",
    P08: "认真吃一顿热饭，小幅恢复精力。",
    P09: "补觉恢复精力，但会略微影响领导评价。",
    P10: "强制休息，恢复身体和心理。",
    D01: "长期发展，本月消耗较高。",
    D02: "长期投入，经济压力最大。",
    D03: "提高科研积累，挤压实务精力。",
    D04: "兼顾就业和学生项目。",
    D05: "争取学院资源，结项压力后置。",
    D06: "轻量发展，兼顾学生就业。"
  };

  const workActionIds = new Set(["W01", "W02", "W03", "W04", "W05", "W06", "W07", "W08", "W09", "W10", "W11", "W12", "W13"]);
  const developmentActionIds = new Set(["D01", "D02", "D03", "D04", "D05", "D06"]);

  const scopedActions = actions.map((action) => {
    const scope = developmentActionIds.has(action.id) ? "development" : workActionIds.has(action.id) ? "work" : "routine";
    return {
      ...action,
      scope,
      tags: actionTags[action.id] || [],
      summary: actionSummaries[action.id] || action.desc
    };
  });

  // 说明：原有一组 12 条 `monthlyChallenges`（C01-C12）已删除。
  // 它与 `monthlySituationTemplates` 职责重复，且因为 id 前缀不同（SIT-xx vs Cxx），
  // engine 里按 id 回查的分支永远匹配不到，属于纯粹的死数据。
  // 「本月校园动态」统一由下面的 monthlySituationTemplates（24 条）提供。

  const monthlySituationTemplates = [
    { id: "SIT01", title: "学工部发布《心理健康教育活动周通知》", desc: "本月第二周为心理健康周，要求各学院开展主题班会和重点学生谈话。", primaryTag: "心理", partialTags: ["学生", "集体"], direction: "学生工作", penalty: { mental: -4, risk: 6, trust: -3 } },
    { id: "SIT02", title: "省教育厅启动大学生职业规划大赛", desc: "本月开始报名，学院要求提交参赛学生名单和项目材料。", primaryTag: "就业", partialTags: ["学生", "材料"], direction: "学生工作", penalty: { leadership: -5, employment: -5, risk: 3 } },
    { id: "SIT03", title: "保卫处开展宿舍安全专项检查", desc: "重点排查违规电器、晚归和消防通道堵塞。", primaryTag: "安全", partialTags: ["风险", "学生"], direction: "学生工作", penalty: { risk: 10, leadership: -4, health: -2 } },
    { id: "SIT04", title: "教务处要求核对学业预警名单", desc: "各学院需在月底前完成学业困难学生谈话记录和帮扶方案。", primaryTag: "学生", partialTags: ["心理", "数据"], direction: "学生工作", penalty: { leadership: -5, risk: 7, trust: -3 } },
    { id: "SIT05", title: "校团委通知开展五四评优材料申报", desc: "优秀团员、团干部和团支部材料进入集中申报阶段。", primaryTag: "材料", partialTags: ["集体", "领导"], direction: "行政事务", penalty: { leadership: -6, mental: -4, risk: 3 } },
    { id: "SIT06", title: "后勤处通知本周临时停电检修", desc: "部分宿舍楼夜间停电，学生情绪和作息可能受到影响。", primaryTag: "安全", partialTags: ["恢复", "学生"], direction: "学生工作", penalty: { risk: 7, trust: -4, energy: -4 } },
    { id: "SIT07", title: "学院办公室发布年度考核材料清单", desc: "辅导员个人年度总结、学生工作台账和支撑材料需要集中整理。", primaryTag: "材料", partialTags: ["领导", "数据"], direction: "行政事务", penalty: { leadership: -8, mental: -5, energy: -5 } },
    { id: "SIT08", title: "校医院通知开展学生体检复查", desc: "部分学生需要复查血压、心率或心理筛查指标。", primaryTag: "身体", partialTags: ["学生", "恢复"], direction: "学生工作", penalty: { health: -4, risk: 6, trust: -2 } },
    { id: "SIT09", title: "保卫处启动防诈骗宣传月", desc: "近期兼职刷单和冒充客服诈骗增多，需要覆盖到每个班级。", primaryTag: "安全", partialTags: ["学生", "集体"], direction: "学生工作", penalty: { risk: 9, trust: -4, mental: -3 } },
    { id: "SIT10", title: "资助中心通知学生资助系统填报", desc: "家庭经济困难认定和助学金申请进入系统填报阶段。", primaryTag: "家长", partialTags: ["学生", "材料"], direction: "学生工作", penalty: { parent: -6, trust: -3, leadership: -3 } },
    { id: "SIT11", title: "校团委发布暑期社会实践项目申报通知", desc: "各班级需要提交实践主题、团队名单和安全预案。", primaryTag: "就业", partialTags: ["集体", "材料"], direction: "学生工作", penalty: { leadership: -5, trust: -4, risk: 4 } },
    { id: "SIT12", title: "学工部启动文明宿舍评比", desc: "本月将集中检查宿舍卫生、文化和违规行为。", primaryTag: "安全", partialTags: ["集体", "学生"], direction: "学生工作", penalty: { risk: 8, leadership: -3, trust: -3 } },
    { id: "SIT13", title: "教务处发布学风建设月方案", desc: "要求加强课堂考勤、晚自习和学业帮扶。", primaryTag: "集体", partialTags: ["学生", "心理"], direction: "学生工作", penalty: { leadership: -5, risk: 5, trust: -2 } },
    { id: "SIT14", title: "学工部举办辅导员素质能力大赛", desc: "本月进行校内初赛，需要准备案例分析和谈心谈话材料。", primaryTag: "领导", partialTags: ["材料", "学生"], direction: "行政事务", penalty: { leadership: -6, mental: -4, energy: -4 } },
    { id: "SIT15", title: "就业指导中心要求更新毕业生就业台账", desc: "已签约、待就业、考研和出国的学生信息需要重新核对。", primaryTag: "就业", partialTags: ["数据", "材料"], direction: "行政事务", penalty: { leadership: -6, risk: 5, mental: -3 } },
    { id: "SIT16", title: "心理中心开展春季心理普查", desc: "全体学生需要完成心理问卷，重点关注高分和未完成名单。", primaryTag: "心理", partialTags: ["学生", "风险"], direction: "学生工作", penalty: { risk: 8, trust: -4, mental: -4 } },
    { id: "SIT17", title: "保卫处开展校园交通安全整治", desc: "电动车乱停、超速和违规充电问题需要班级层面提醒。", primaryTag: "安全", partialTags: ["学生", "集体"], direction: "学生工作", penalty: { risk: 8, leadership: -3, trust: -2 } },
    { id: "SIT18", title: "校团委通知学生社团年审", desc: "社团负责人需要提交年度活动材料和下一年工作计划。", primaryTag: "材料", partialTags: ["集体", "领导"], direction: "行政事务", penalty: { leadership: -5, trust: -3, mental: -3 } },
    { id: "SIT19", title: "武装部启动大学生征兵宣传", desc: "各学院需要摸排有入伍意愿学生，并组织政策宣讲。", primaryTag: "就业", partialTags: ["学生", "集体"], direction: "学生工作", penalty: { leadership: -4, trust: -3, risk: 3 } },
    { id: "SIT20", title: "校学生会筹备学生代表大会", desc: "班级需要推选代表，并收集学生提案。", primaryTag: "集体", partialTags: ["学生", "材料"], direction: "学生工作", penalty: { trust: -5, leadership: -4, risk: 3 } },
    { id: "SIT21", title: "档案馆通知核对毕业生档案材料", desc: "毕业生登记表、成绩单和奖惩材料需要逐项核对。", primaryTag: "数据", partialTags: ["材料", "领导"], direction: "行政事务", penalty: { leadership: -6, mental: -4, risk: 4 } },
    { id: "SIT22", title: "教务处开展期中教学检查", desc: "课堂秩序、学生出勤和学业困难情况将被重点检查。", primaryTag: "集体", partialTags: ["学生", "领导"], direction: "学生工作", penalty: { leadership: -5, risk: 6, trust: -2 } },
    { id: "SIT23", title: "党委宣传部开展网络舆情专项排查", desc: "学院需要关注学生社交媒体言论和校园热帖。", primaryTag: "风险", partialTags: ["学生", "安全"], direction: "学生工作", penalty: { risk: 9, leadership: -5, mental: -4 } },
    { id: "SIT24", title: "学院办公室通知临时值班调整", desc: "因会议和活动安排，辅导员值班表需要重新协调。", primaryTag: "高压", partialTags: ["恢复", "安全"], direction: "行政事务", penalty: { energy: -7, health: -4, mental: -5 } }
  ];

  const problemIssues = [
    {
      id: "PI01",
      title: "学业滑坡",
      desc: "连续缺课，作业拖延，绩点明显下滑。",
      needs: ["心理", "学生"],
      methods: [
        { label: "安排学业帮扶", outcome: "有人带着补课，但情绪根源还没解决。", effect: { study: 8, trust: 4 }, risk: -5, tag: "学生" },
        { label: "先谈心找原因", outcome: "学生愿意说真话，信任上升。", effect: { mental: 8, trust: 9 }, risk: -8, tag: "心理" },
        { label: "联系家长共同介入", outcome: "家庭力量加入，但学生可能更抵触。", effect: { study: 6, family: 5, trust: -3 }, risk: -4, tag: "家长" }
      ]
    },
    {
      id: "PI02",
      title: "情绪低落",
      desc: "最近总是独来独往，朋友圈透出疲惫和低落。",
      needs: ["心理"],
      methods: [
        { label: "安排一次认真谈话", outcome: "你听到真实情绪，学生心理明显改善。", effect: { mental: 10, trust: 8 }, risk: -9, tag: "心理" },
        { label: "联系心理中心", outcome: "专业支持介入，但学生需要适应。", effect: { mental: 7, trust: 3 }, risk: -7, tag: "学生" },
        { label: "先让同学陪伴", outcome: "朋辈支持有温度，但专业程度有限。", effect: { social: 5, mental: 4, trust: 2 }, risk: -4, tag: "社交" }
      ]
    },
    {
      id: "PI03",
      title: "宿舍矛盾",
      desc: "作息、卫生、外放声音等问题已经让宿舍分成两派。",
      needs: ["社交", "学生"],
      methods: [
        { label: "开宿舍会议", outcome: "问题摊开，但容易再次争吵。", effect: { social: 5, discipline: 4 }, risk: -5, tag: "社交" },
        { label: "分开谈话", outcome: "各自冷静，根因需要继续观察。", effect: { mental: 6, trust: 6 }, risk: -7, tag: "心理" },
        { label: "调整宿舍", outcome: "冲突被隔离，但问题可能转移。", effect: { social: 3, trust: -3 }, risk: -6, tag: "学生" }
      ]
    },
    {
      id: "PI04",
      title: "就业迷茫",
      desc: "不知道以后能做什么，简历也一直没改。",
      needs: ["就业"],
      methods: [
        { label: "一起梳理职业方向", outcome: "方向清楚一点，学生更有动力。", effect: { employment: 9, trust: 7 }, risk: -5, tag: "就业" },
        { label: "推荐实习岗位", outcome: "先进入真实场景，但可能更焦虑。", effect: { employment: 7, mental: -3 }, risk: -3, tag: "就业" },
        { label: "请校友分享", outcome: "真实经验有帮助，但个体差异很大。", effect: { employment: 6, trust: 5 }, risk: -4, tag: "学生" }
      ]
    },
    {
      id: "PI05",
      title: "家庭压力",
      desc: "家里希望他考公考研，但学生自己很抗拒。",
      needs: ["家长", "心理"],
      methods: [
        { label: "先听学生意愿", outcome: "学生感到被支持，但家长更不满。", effect: { mental: 8, trust: 9, family: -4 }, risk: -5, tag: "心理" },
        { label: "和家长沟通", outcome: "家庭关系缓和，但学生可能觉得被安排。", effect: { family: 8, mental: 3, trust: -2 }, risk: -5, tag: "家长" },
        { label: "折中规划", outcome: "两边都退一步，结果不完全满足任何一方。", effect: { family: 5, employment: 5, trust: 4 }, risk: -6, tag: "就业" }
      ]
    },
    {
      id: "PI06",
      title: "违纪苗头",
      desc: "夜不归宿、违规电器或课堂纪律问题开始冒头。",
      needs: ["学生", "风险"],
      methods: [
        { label: "明确纪律边界", outcome: "规则清楚，但学生会有距离感。", effect: { discipline: 9, trust: -3 }, risk: -7, tag: "学生" },
        { label: "先了解背后原因", outcome: "可能发现真正问题，但暂时没解决纪律。", effect: { mental: 5, trust: 7 }, risk: -6, tag: "心理" },
        { label: "班级公约讨论", outcome: "集体形成约束，但个人问题可能被稀释。", effect: { discipline: 6, social: 5 }, risk: -5, tag: "社交" }
      ]
    },
    {
      id: "PI07",
      title: "网络沉迷",
      desc: "作息颠倒，游戏时间越来越长，白天精神很差。",
      needs: ["心理", "学生"],
      methods: [
        { label: "谈话了解逃避原因", outcome: "找到沉迷背后的压力来源。", effect: { mental: 8, trust: 7 }, risk: -8, tag: "心理" },
        { label: "制定作息计划", outcome: "行为有约束，但容易反复。", effect: { discipline: 7, health: 4 }, risk: -5, tag: "学生" },
        { label: "发动室友监督", outcome: "朋辈监督有效，但关系可能变味。", effect: { social: 5, discipline: 4, trust: -2 }, risk: -4, tag: "社交" }
      ]
    },
    {
      id: "PI08",
      title: "经济困难",
      desc: "生活费紧张，兼职占了很多学习时间。",
      needs: ["家庭", "家长"],
      methods: [
        { label: "帮助申请助学金", outcome: "经济压力缓解，但流程较长。", effect: { economy: 10, trust: 7 }, risk: -6, tag: "家长" },
        { label: "联系家长了解情况", outcome: "家庭支持可能增加，也可能触及隐私。", effect: { family: 7, economy: 4, trust: -2 }, risk: -4, tag: "家长" },
        { label: "推荐校内勤工助学", outcome: "收入稳定，但时间仍然紧张。", effect: { economy: 7, employment: 5 }, risk: -4, tag: "就业" }
      ]
    },
    {
      id: "PI09",
      title: "感情困扰",
      desc: "恋爱关系不稳定，已经影响到学习和睡眠。",
      needs: ["心理", "学生"],
      methods: [
        { label: "做一次倾听者", outcome: "情绪被接纳，学生更愿意面对问题。", effect: { mental: 9, trust: 9 }, risk: -8, tag: "心理" },
        { label: "引导关注自己", outcome: "注意力部分转移，但感情问题仍在。", effect: { mental: 5, study: 5 }, risk: -5, tag: "学生" },
        { label: "让信任的朋友陪伴", outcome: "朋辈支持及时，但边界难以把握。", effect: { social: 6, mental: 5 }, risk: -5, tag: "社交" }
      ]
    },
    {
      id: "PI10",
      title: "社交孤立",
      desc: "总是一个人吃饭、上课，小组作业也没人主动组队。",
      needs: ["社交", "心理"],
      methods: [
        { label: "安排班级互动", outcome: "社交机会增加，但可能让学生紧张。", effect: { social: 8, mental: 3 }, risk: -5, tag: "社交" },
        { label: "私下了解原因", outcome: "你更理解学生，但改变仍需时间。", effect: { mental: 7, trust: 8 }, risk: -7, tag: "心理" },
        { label: "请班委主动带动", outcome: "朋辈靠近，但学生可能感到被特殊照顾。", effect: { social: 6, trust: 4 }, risk: -5, tag: "学生" }
      ]
    },
    {
      id: "PI11",
      title: "身体透支",
      desc: "长期熬夜、饮食不规律，体育课或体检出现异常。",
      needs: ["身体", "恢复"],
      methods: [
        { label: "督促就医检查", outcome: "健康风险被及时处理，学生有些抗拒。", effect: { health: 10, trust: 2 }, risk: -8, tag: "身体" },
        { label: "调整宿舍作息", outcome: "环境改善，但个人习惯仍要改。", effect: { health: 7, discipline: 5 }, risk: -5, tag: "恢复" },
        { label: "联系家长关注", outcome: "家庭开始重视，但学生可能觉得被监视。", effect: { family: 6, health: 5, trust: -2 }, risk: -5, tag: "家长" }
      ]
    },
    {
      id: "PI12",
      title: "转专业犹豫",
      desc: "对当前专业缺乏兴趣，但又害怕转专业失败。",
      needs: ["就业", "心理"],
      methods: [
        { label: "一起分析专业匹配", outcome: "选择更清楚，但学生仍会犹豫。", effect: { employment: 8, mental: 5, trust: 7 }, risk: -6, tag: "就业" },
        { label: "介绍转专业流程", outcome: "信息补足，决定权交还学生。", effect: { study: 4, trust: 7 }, risk: -5, tag: "学生" },
        { label: "安排一次试听", outcome: "体验更真实，但可能影响当前课程。", effect: { study: -3, employment: 8, trust: 6 }, risk: -4, tag: "就业" }
      ]
    }
  ];

  const monthEndEvents = [
    { id: "M01", category: "月终事件", title: "月底的办公室", text: "这个月终于走到末尾，你独自坐在办公室整理材料。", choices: [
      { label: "点一份热乎的外卖", outcome: "你好好吃了一顿，身体和心情都回来一点。", tone: "safe" },
      { label: "继续把材料做完", outcome: "任务清零，但身体更疲惫。", tone: "hard" },
      { label: "约朋友出去走走", outcome: "你暂时离开工作，关系和生活感恢复。", tone: "fun" }
    ]},
    { id: "M02", category: "月终事件", title: "月底的体检提醒", text: "手机提醒你已经很久没有体检了。", choices: [
      { label: "预约检查", outcome: "身体问题被及时发现，但花了时间和钱。", tone: "bold" },
      { label: "先吃两片维生素", outcome: "象征性安慰，健康风险没有真正下降。", tone: "neglect" },
      { label: "约同事一起体检", outcome: "有人陪伴，同事关系也更好。", tone: "safe" }
    ]},
    { id: "M03", category: "月终事件", title: "月底的家长群", text: "家长群突然讨论起“辅导员到底忙不忙”。", choices: [
      { label: "认真回应", outcome: "家长满意，但你需要花时间组织语言。", tone: "safe" },
      { label: "让班委先解释", outcome: "学生替你说话，但可能越说越乱。", tone: "neglect" },
      { label: "约家长单独沟通", outcome: "问题处理得更深，但精力消耗很大。", tone: "bold" }
    ]},
    { id: "M04", category: "月终事件", title: "月底的工资到账", text: "工资到账了，但账单也一起到了。", choices: [
      { label: "先存一部分", outcome: "存款安全感上升，但生活仍很紧。", tone: "safe" },
      { label: "奖励自己一顿好的", outcome: "心情变好，但存款减少。", tone: "fun" },
      { label: "先还信用卡", outcome: "压力下降，但月底更紧。", tone: "hard" }
    ]},
    { id: "M05", category: "月终事件", title: "月底的自我怀疑", text: "你躺在床上，脑子里反复播放这个月没做好的事。", choices: [
      { label: "写下来复盘", outcome: "情绪被整理，但问题还在。", tone: "bold" },
      { label: "找人聊聊", outcome: "你感到被理解，心理恢复一些。", tone: "safe" },
      { label: "刷手机到睡着", outcome: "暂时逃避，但第二天更累。", tone: "neglect" }
    ]},
    { id: "M06", category: "月终事件", title: "月底的办公室零食", text: "同事分来一包零食，问你要不要。", choices: [
      { label: "一起吃点", outcome: "关系更近，但热量也来了。", tone: "fun" },
      { label: "谢绝并继续工作", outcome: "你保持专注，但错过一次放松。", tone: "hard" },
      { label: "收下留到晚上", outcome: "你有了小期待，但晚上可能没空吃。", tone: "safe" }
    ]},
    { id: "M07", category: "月终事件", title: "月底的天气", text: "窗外下起小雨，你犹豫要不要早点回宿舍。", choices: [
      { label: "提前回去休息", outcome: "身体和精力恢复，但工作堆积。", tone: "bold" },
      { label: "留在办公室处理杂事", outcome: "工作推进，但身心更累。", tone: "hard" },
      { label: "在窗边听会儿雨", outcome: "你慢下来，心理舒服一点。", tone: "safe" }
    ]},
    { id: "M08", category: "月终事件", title: "月底的学生留言", text: "有学生在班级群里发了一句“老师辛苦了”。", choices: [
      { label: "认真回复大家", outcome: "学生感到被看见，但你要组织语言。", tone: "bold" },
      { label: "发个轻松表情", outcome: "气氛很好，但深度不够。", tone: "fun" },
      { label: "明天再回复", outcome: "你保护了休息，但学生觉得被冷落。", tone: "neglect" }
    ]}
  ];

  const developmentProjects = [
    {
      id: "DP01",
      name: "职称申报",
      track: "职称线",
      desc: "整理教学、科研和思政材料，完成职称评审。",
      events: [
        {
          id: "DP01-E1",
          title: "材料被退回",
          text: "职称材料因格式问题被退回，截止日期很近。",
          choices: [
            { label: "熬夜重做", outcome: "材料按时完成，身体付出代价。", effects: { progress: 18, quality: 4, risk: 2, energy: -8, mental: -4, leadership: 3 } },
            { label: "请同事帮忙核对", outcome: "格式问题解决，但欠下人情。", effects: { progress: 12, quality: 8, risk: -2, energy: -4, colleague: -3, leadership: 2 } },
            { label: "申请延期", outcome: "压力下降，但领导评价受损。", effects: { progress: 4, quality: 3, risk: 5, energy: -1, leadership: -5 } }
          ]
        },
        {
          id: "DP01-E2",
          title: "业绩材料不足",
          text: "学院要求补充学生工作业绩证明。",
          choices: [
            { label: "梳理真实案例", outcome: "材料扎实，但很耗时。", effects: { progress: 14, quality: 10, risk: -4, energy: -6, mental: -2, leadership: 2 } },
            { label: "找班委协助整理", outcome: "速度加快，但学生信任稍有波动。", effects: { progress: 16, quality: 5, risk: 1, energy: -4, trust: -2, leadership: 1 } },
            { label: "简单填写", outcome: "很快完成，但材料质量不足。", effects: { progress: 8, quality: 1, risk: 8, energy: -2, leadership: -3 } }
          ]
        },
        {
          id: "DP01-E3",
          title: "专家意见冲突",
          text: "两位评审专家对你的一项成果评价相反。",
          choices: [
            { label: "补充数据说明", outcome: "论证更充分，但需要额外时间。", effects: { progress: 13, quality: 12, risk: -5, energy: -7, mental: -3, leadership: 3 } },
            { label: "尊重主要专家意见", outcome: "风险降低，但创新性被削弱。", effects: { progress: 12, quality: 5, risk: -4, energy: -3, leadership: 1 } },
            { label: "坚持原方案", outcome: "可能出彩，也可能再被质疑。", effects: { progress: 8, quality: 8, risk: 9, energy: -5, mental: -5, leadership: 2 } }
          ]
        },
        {
          id: "DP01-E4",
          title: "答辩前夜",
          text: "明天就要答辩，你发现自己还有材料没有吃透。",
          choices: [
            { label: "通宵准备", outcome: "准备充分，但第二天状态很差。", effects: { progress: 18, quality: 8, risk: -5, energy: -12, health: -3, mental: -5, leadership: 4 } },
            { label: "早睡保持状态", outcome: "状态稳定，但准备略不足。", effects: { progress: 9, quality: 6, risk: 3, energy: 4, health: 3, mental: 4 } },
            { label: "请同事模拟提问", outcome: "更有针对性，但欠同事人情。", effects: { progress: 15, quality: 11, risk: -4, energy: -7, colleague: -3, mental: -3, leadership: 3 } }
          ]
        }
      ]
    },
    {
      id: "DP02",
      name: "学历提升",
      track: "职称线",
      desc: "在工作和学业之间寻找平衡，完成课程与研究任务。",
      events: [
        {
          id: "DP02-E1",
          title: "上课与值班冲突",
          text: "课程时间临时调整，和学院值班撞在一起。",
          choices: [
            { label: "请假上课", outcome: "学业保住，但领导可能不满。", effects: { progress: 14, quality: 7, risk: -3, energy: -5, leadership: -5, mental: 2 } },
            { label: "请同事代班", outcome: "两边兼顾，但同事关系受影响。", effects: { progress: 12, quality: 6, risk: 0, energy: -4, colleague: -4, mental: -2 } },
            { label: "放弃这节课", outcome: "工作稳定，但学业进度受损。", effects: { progress: 4, quality: 2, risk: 7, energy: -3, leadership: 3 } }
          ]
        },
        {
          id: "DP02-E2",
          title: "导师催促论文",
          text: "导师希望你这周完成一章，但学生工作也堆着。",
          choices: [
            { label: "压缩学生工作时间", outcome: "论文推进，但学生可能找不到你。", effects: { progress: 16, quality: 8, risk: -3, energy: -9, trust: -4, mental: -4 } },
            { label: "申请导师延期", outcome: "压力降低，但导师印象变差。", effects: { progress: 4, quality: 4, risk: 6, energy: -2, mental: 2 } },
            { label: "利用深夜补进度", outcome: "两边都做，但身体代价很大。", effects: { progress: 13, quality: 6, risk: 2, energy: -12, health: -4, mental: -6, leadership: 2 } }
          ]
        },
        {
          id: "DP02-E3",
          title: "同学组成学习小组",
          text: "同学邀请你一起准备考试，但时间很紧。",
          choices: [
            { label: "参加", outcome: "学业效率提高，关系也更好。", effects: { progress: 15, quality: 8, risk: -4, energy: -6, colleague: 3, mental: 4 } },
            { label: "自己复习", outcome: "时间自由，但容易孤立。", effects: { progress: 10, quality: 6, risk: 1, energy: -5, mental: 1 } },
            { label: "先处理工作", outcome: "工作稳定，但错过集体学习。", effects: { progress: 5, quality: 3, risk: 6, energy: -4, leadership: 3 } }
          ]
        },
        {
          id: "DP02-E4",
          title: "期末考试周",
          text: "考试和工作同时到来，你需要决定优先顺序。",
          choices: [
            { label: "请假备考", outcome: "成绩更有保障，但班级风险上升。", effects: { progress: 18, quality: 9, risk: 5, energy: -7, leadership: -4, mental: 3 } },
            { label: "两边硬扛", outcome: "都完成一点，但身体透支。", effects: { progress: 12, quality: 6, risk: -2, energy: -13, health: -4, mental: -6 } },
            { label: "降低考试目标", outcome: "压力减轻，但学历项目成果一般。", effects: { progress: 8, quality: 4, risk: -3, energy: -4, mental: 2 } }
          ]
        }
      ]
    },
    {
      id: "DP03",
      name: "科研论文",
      track: "职称线",
      desc: "完成一项学生工作相关研究或论文。",
      events: [
        {
          id: "DP03-E1",
          title: "数据不显著",
          text: "问卷数据跑出来不显著，论文进度卡住。",
          choices: [
            { label: "扩大样本", outcome: "更可靠，但非常耗时。", effects: { progress: 12, quality: 10, risk: -4, energy: -9, mental: -4, leadership: 1 } },
            { label: "调整分析角度", outcome: "找到新解释，但可能被质疑。", effects: { progress: 13, quality: 7, risk: 5, energy: -6, mental: -3 } },
            { label: "先写其他部分", outcome: "保持推进，但核心问题还在。", effects: { progress: 9, quality: 5, risk: 4, energy: -4, mental: -1 } }
          ]
        },
        {
          id: "DP03-E2",
          title: "伦理审查补材料",
          text: "伦理审查要求补充知情同意材料。",
          choices: [
            { label: "认真补全", outcome: "合规性提高，但时间增加。", effects: { progress: 10, quality: 12, risk: -7, energy: -6, mental: -2, leadership: 2 } },
            { label: "简化说明", outcome: "速度快，但可能再次退回。", effects: { progress: 14, quality: 4, risk: 7, energy: -3, leadership: 1 } },
            { label: "请学生协助", outcome: "效率提高，但学生信任略有消耗。", effects: { progress: 12, quality: 6, risk: -2, energy: -4, trust: -2 } }
          ]
        },
        {
          id: "DP03-E3",
          title: "会议投稿截止",
          text: "一个学术会议马上截止，但论文还不够成熟。",
          choices: [
            { label: "冲刺投稿", outcome: "有机会曝光，但质量风险高。", effects: { progress: 16, quality: 5, risk: 8, energy: -10, mental: -5, leadership: 3 } },
            { label: "放弃这次会议", outcome: "压力降低，但错过机会。", effects: { progress: 5, quality: 4, risk: -3, energy: -2, mental: 2 } },
            { label: "改成摘要投稿", outcome: "降低风险，但成果力度一般。", effects: { progress: 11, quality: 6, risk: -2, energy: -6, mental: -2, leadership: 2 } }
          ]
        },
        {
          id: "DP03-E4",
          title: "导师提出大改",
          text: "导师认为论文框架需要重新调整。",
          choices: [
            { label: "认真重构", outcome: "质量显著提高，但工作量大。", effects: { progress: 12, quality: 13, risk: -6, energy: -11, mental: -6, leadership: 3 } },
            { label: "只做局部修改", outcome: "省力，但核心问题可能还在。", effects: { progress: 9, quality: 4, risk: 6, energy: -5, mental: -2 } },
            { label: "约导师再讨论", outcome: "方向更清楚，但需要额外沟通。", effects: { progress: 11, quality: 8, risk: -3, energy: -7, colleague: 2, mental: -3 } }
          ]
        }
      ]
    },
    {
      id: "DP04",
      name: "比赛指导",
      track: "实务线",
      desc: "带学生打磨项目，冲击校级或省级比赛。",
      events: [
        {
          id: "DP04-E1",
          title: "学生想要退赛",
          text: "核心队员因为压力太大提出退出。",
          choices: [
            { label: "认真谈话挽留", outcome: "学生愿意继续，但你投入很多情绪。", effects: { progress: 12, quality: 6, risk: -5, energy: -7, trust: 8, mental: -3 } },
            { label: "尊重退出", outcome: "学生轻松了，但项目损失人手。", effects: { progress: 3, quality: 3, risk: 8, energy: -2, trust: 4 } },
            { label: "找替补队员", outcome: "项目继续，但磨合成本高。", effects: { progress: 9, quality: 4, risk: 4, energy: -8, trust: 2, leadership: 2 } }
          ]
        },
        {
          id: "DP04-E2",
          title: "项目方向被推翻",
          text: "评委反馈说项目方向太普通，需要大改。",
          choices: [
            { label: "带着学生重构", outcome: "项目质量提升，但大家很累。", effects: { progress: 10, quality: 12, risk: -5, energy: -12, trust: 4, mental: -5 } },
            { label: "只优化展示", outcome: "表面更好，但内核问题仍在。", effects: { progress: 8, quality: 5, risk: 5, energy: -5, mental: -1 } },
            { label: "坚持原方向", outcome: "省力，但比赛风险增加。", effects: { progress: 6, quality: 3, risk: 9, energy: -3, leadership: 2 } }
          ]
        },
        {
          id: "DP04-E3",
          title: "比赛赞助出问题",
          text: "原定赞助临时减少，项目预算不够。",
          choices: [
            { label: "压缩预算", outcome: "项目继续，但有些环节被砍。", effects: { progress: 10, quality: 4, risk: 2, energy: -5, savings: -300, leadership: 2 } },
            { label: "自己先垫钱", outcome: "质量保住，但存款受损。", effects: { progress: 12, quality: 8, risk: -3, energy: -6, savings: -1200, trust: 3 } },
            { label: "找学院支持", outcome: "可能获得经费，但需要消耗人情。", effects: { progress: 9, quality: 7, risk: -2, energy: -7, leadership: 4, colleague: -3 } }
          ]
        },
        {
          id: "DP04-E4",
          title: "决赛前夜",
          text: "明天比赛，但路演还有很多细节没定。",
          choices: [
            { label: "陪学生通宵排练", outcome: "准备充分，但大家身心俱疲。", effects: { progress: 18, quality: 9, risk: -6, energy: -12, health: -3, trust: 6, mental: -6 } },
            { label: "让学生早睡", outcome: "状态稳定，但准备略不足。", effects: { progress: 9, quality: 6, risk: 2, energy: 3, trust: 5, mental: 4 } },
            { label: "只抓关键部分", outcome: "效率较高，但细节风险仍在。", effects: { progress: 14, quality: 7, risk: 1, energy: -7, trust: 3, mental: -3 } }
          ]
        }
      ]
    },
    {
      id: "DP05",
      name: "品牌项目申报",
      track: "实务线",
      desc: "策划并申报一个有影响力的学生工作品牌项目。",
      events: [
        {
          id: "DP05-E1",
          title: "项目主题被否",
          text: "学院认为你的品牌主题不够鲜明。",
          choices: [
            { label: "重新调研", outcome: "主题更扎实，但时间成本高。", effects: { progress: 9, quality: 12, risk: -6, energy: -9, mental: -4, leadership: 2 } },
            { label: "微调包装", outcome: "速度快，但可能仍不够突出。", effects: { progress: 11, quality: 5, risk: 5, energy: -5, leadership: 1 } },
            { label: "找同事头脑风暴", outcome: "思路更开，但关系成本增加。", effects: { progress: 10, quality: 8, risk: -3, energy: -7, colleague: -3, leadership: 2 } }
          ]
        },
        {
          id: "DP05-E2",
          title: "预算被压缩",
          text: "项目经费被砍掉三分之一。",
          choices: [
            { label: "压缩活动规模", outcome: "项目继续，但影响力下降。", effects: { progress: 10, quality: 4, risk: 1, energy: -4, savings: -300, leadership: 2 } },
            { label: "寻找赞助", outcome: "经费可能补上，但额外工作很多。", effects: { progress: 8, quality: 8, risk: -2, energy: -9, colleague: 2, leadership: 4 } },
            { label: "自己贴钱", outcome: "项目质量保住，但存款受损。", effects: { progress: 12, quality: 8, risk: -3, energy: -5, savings: -1000, mental: -2 } }
          ]
        },
        {
          id: "DP05-E3",
          title: "合作部门不配合",
          text: "场地和宣传支持迟迟没有落实。",
          choices: [
            { label: "多次沟通推动", outcome: "问题逐步解决，但很耗耐心。", effects: { progress: 11, quality: 7, risk: -4, energy: -9, colleague: -3, mental: -4, leadership: 3 } },
            { label: "请领导协调", outcome: "效率高，但显得自己推动力不足。", effects: { progress: 13, quality: 6, risk: -5, energy: -4, leadership: -2 } },
            { label: "自己顶上", outcome: "项目顺利，但你更累。", effects: { progress: 14, quality: 6, risk: 3, energy: -11, health: -2, mental: -4 } }
          ]
        },
        {
          id: "DP05-E4",
          title: "结项材料失控",
          text: "项目做了很多，但材料零散，结项很困难。",
          choices: [
            { label: "加班整理", outcome: "材料完整，但身体付出很大。", effects: { progress: 17, quality: 9, risk: -6, energy: -11, health: -3, mental: -5, leadership: 4 } },
            { label: "请学生团队协助", outcome: "效率提高，但学生压力增加。", effects: { progress: 14, quality: 6, risk: -2, energy: -5, trust: -2, leadership: 2 } },
            { label: "只整理关键材料", outcome: "省时，但可能被退回补充。", effects: { progress: 9, quality: 4, risk: 6, energy: -4, leadership: -2 } }
          ]
        }
      ]
    },
    {
      id: "DP06",
      name: "职业规划培训",
      track: "实务线",
      desc: "完成职业规划培训，并把方法应用到学生工作中。",
      events: [
        {
          id: "DP06-E1",
          title: "培训时间冲突",
          text: "培训时间和学生突发事件撞在一起。",
          choices: [
            { label: "优先参加培训", outcome: "个人成长稳定，但学生问题可能升级。", effects: { progress: 13, quality: 8, risk: 5, energy: -6, trust: -4, mental: 2 } },
            { label: "先处理学生", outcome: "学生信任上升，但培训进度受损。", effects: { progress: 5, quality: 4, risk: -3, energy: -7, trust: 7, mental: -3 } },
            { label: "线上补课", outcome: "两边兼顾，但效果有限。", effects: { progress: 9, quality: 5, risk: 1, energy: -8, mental: -2 } }
          ]
        },
        {
          id: "DP06-E2",
          title: "学生职业咨询排队",
          text: "培训后学生咨询需求突然增加。",
          choices: [
            { label: "开放额外咨询时间", outcome: "学生满意度高，但你会很累。", effects: { progress: 11, quality: 10, risk: -4, energy: -10, trust: 8, mental: -4 } },
            { label: "开展团体辅导", outcome: "覆盖更多学生，但个体深度不足。", effects: { progress: 13, quality: 6, risk: -2, energy: -7, trust: 4, leadership: 2 } },
            { label: "推荐线上资源", outcome: "效率高，但部分学生觉得敷衍。", effects: { progress: 9, quality: 4, risk: 4, energy: -3, trust: -2 } }
          ]
        },
        {
          id: "DP06-E3",
          title: "认证考试临近",
          text: "职业规划认证考试快到了，但你还没复习。",
          choices: [
            { label: "请假复习", outcome: "考试更有把握，但工作风险上升。", effects: { progress: 15, quality: 9, risk: 5, energy: -7, leadership: -3, mental: 3 } },
            { label: "工作间隙复习", outcome: "两边兼顾，但效率一般。", effects: { progress: 10, quality: 5, risk: 1, energy: -8, mental: -3 } },
            { label: "明年再考", outcome: "压力降低，但项目成果打折。", effects: { progress: 4, quality: 3, risk: -3, energy: -2, mental: 2 } }
          ]
        },
        {
          id: "DP06-E4",
          title: "培训效果评估",
          text: "学院要求提交培训成果和学生反馈。",
          choices: [
            { label: "认真整理案例", outcome: "成果扎实，但耗时较多。", effects: { progress: 15, quality: 11, risk: -5, energy: -9, mental: -3, leadership: 4 } },
            { label: "让学生填写问卷", outcome: "数据充分，但学生负担增加。", effects: { progress: 13, quality: 6, risk: 1, energy: -4, trust: -2, leadership: 2 } },
            { label: "做简要总结", outcome: "速度快，但成果不够突出。", effects: { progress: 8, quality: 4, risk: 5, energy: -3, leadership: -2 } }
          ]
        }
      ]
    }
  ];

  const events = [
    { id: "E01", category: "时间节点", title: "新生报到当天", text: "一名家长在宿舍和志愿者发生争执，声音越来越大。", choices: [
      { label: "先安抚家长", outcome: "家长平静下来，但现场原因还没问清楚。", tone: "safe" },
      { label: "先了解事情经过", outcome: "你搞清了责任，但家长觉得被冷落。", tone: "bold" },
      { label: "让同事顶一下", outcome: "你躲开了冲突，同事关系有点微妙。", tone: "neglect" }
    ]},
    { id: "E02", category: "时间节点", title: "第一次班会", text: "学生起哄让你表演节目，教室安静不下来。", choices: [
      { label: "大方表演", outcome: "气氛很好，但也有人觉得你不够严肃。", tone: "fun" },
      { label: "用玩笑带过", outcome: "场面轻松，规则感略弱。", tone: "safe" },
      { label: "严肃立规矩", outcome: "学生安静了，但第一次见面多了距离。", tone: "hard" }
    ]},
    { id: "E03", category: "时间节点", title: "考试周前夜", text: "学习委员反映班级整体焦虑，有人想缓考。", choices: [
      { label: "集中辅导", outcome: "学生状态改善，但花费很多精力。", tone: "bold" },
      { label: "分批谈话", outcome: "关键学生得到安抚，覆盖范围有限。", tone: "safe" },
      { label: "上报学院", outcome: "程序完整，但学生觉得被上交。", tone: "neglect" }
    ]},
    { id: "E04", category: "时间节点", title: "评奖评优周", text: "两名学生都符合条件，但只有 1 个名额。", choices: [
      { label: "按材料排序", outcome: "公平但冷硬，落选学生有些失落。", tone: "hard" },
      { label: "公开投票", outcome: "结果更服众，但可能变成人缘比拼。", tone: "safe" },
      { label: "找领导追加名额", outcome: "双方都满意，但消耗了人情。", tone: "bold" }
    ]},
    { id: "E05", category: "时间节点", title: "寒假离校前", text: "学生票没买到，在办公室情绪崩溃。", choices: [
      { label: "帮忙联系拼车", outcome: "问题解决，但存在一定安全风险。", tone: "bold" },
      { label: "留校安置", outcome: "学生安全，但你要多操心。", tone: "safe" },
      { label: "家长沟通", outcome: "家长接手，学生觉得被丢回家里。", tone: "neglect" }
    ]},
    { id: "E06", category: "时间节点", title: "就业季", text: "学生签约后毁约，企业打电话投诉。", choices: [
      { label: "先安抚企业", outcome: "企业消气，但学生觉得你替他做了决定。", tone: "safe" },
      { label: "先问学生", outcome: "知道真实原因，但企业等待时间变长。", tone: "bold" },
      { label: "按流程上报", outcome: "程序正确，但关系都被拉远。", tone: "hard" }
    ]},
    { id: "E07", category: "时间节点", title: "毕业前清考", text: "学生缺考，电话不接，室友也不知道去向。", choices: [
      { label: "发动室友寻找", outcome: "很快找到，但可能扩大影响。", tone: "bold" },
      { label: "联系家长", outcome: "获得信息，也可能引发家庭冲突。", tone: "safe" },
      { label: "上报失踪风险", outcome: "流程稳妥，但后续压力更大。", tone: "hard" }
    ]},
    { id: "E08", category: "时间节点", title: "毕业典礼当天", text: "有学生因证书问题情绪激动，现场围了一群人。", choices: [
      { label: "现场沟通", outcome: "及时控场，但很难深入解决。", tone: "bold" },
      { label: "带去办公室处理", outcome: "可以慢慢谈，但现场信息不足。", tone: "safe" },
      { label: "请求同事支援", outcome: "压力分散，但协调更复杂。", tone: "neglect" }
    ]},
    { id: "E09", category: "时间节点", title: "学期初安全大检查", text: "学院临时要求 2 小时内交齐宿舍台账。", choices: [
      { label: "加班硬做", outcome: "按时完成，但身体被消耗。", tone: "hard" },
      { label: "简化但交齐", outcome: "完成得不够漂亮，但没有逾期。", tone: "safe" },
      { label: "申请延期", outcome: "得到喘息，领导评价下降。", tone: "neglect" }
    ]},
    { id: "E10", category: "时间节点", title: "教师节", text: "学生送了一件贵重礼物。", choices: [
      { label: "婉拒并解释", outcome: "守住原则，学生有点尴尬。", tone: "safe" },
      { label: "收下后补报备", outcome: "程序合规，但过程微妙。", tone: "hard" },
      { label: "交给组织处理", outcome: "风险最低，但显得疏远。", tone: "neglect" }
    ]},
    { id: "E11", category: "学生属性", title: "学生连续旷课", text: "室友说他在宿舍打游戏，已经连续几天没去上课。", choices: [
      { label: "直接谈话", outcome: "学生承认状态差，但你还没找到根源。", tone: "bold" },
      { label: "先向室友了解", outcome: "信息更多，但可能被学生视为打小报告。", tone: "safe" },
      { label: "联系家长", outcome: "家长介入，可能让矛盾更复杂。", tone: "neglect" }
    ]},
    { id: "E12", category: "学生属性", title: "绩点骤降", text: "学生挂科后说“不想读了”。", choices: [
      { label: "分析原因", outcome: "你了解到真正压力，但谈话很长。", tone: "bold" },
      { label: "鼓励转专业", outcome: "给了新方向，也等于承认当前困境。", tone: "safe" },
      { label: "安排学业帮扶", outcome: "有人接手学习，但情绪问题还在。", tone: "neglect" }
    ]},
    { id: "E13", category: "学生属性", title: "朋友圈发“撑不下去了”", text: "学生没有点名，但这条状态在班级里传开。", choices: [
      { label: "立即联系", outcome: "你及时确认安全，学生感到被重视。", tone: "bold" },
      { label: "让心理委员关注", outcome: "有同学陪伴，但你可能错过直接信号。", tone: "safe" },
      { label: "通知心理中心", outcome: "专业力量介入，但学生可能觉得自己被标记。", tone: "hard" }
    ]},
    { id: "E14", category: "学生属性", title: "宿舍矛盾爆发", text: "两人公开互骂，其他人已经站队。", choices: [
      { label: "分开谈话", outcome: "各自冷静，但根因需要后续处理。", tone: "safe" },
      { label: "开宿舍会议", outcome: "问题摊开，但容易再次激化。", tone: "bold" },
      { label: "调换宿舍", outcome: "快速隔离，但可能把问题转移。", tone: "hard" }
    ]},
    { id: "E15", category: "学生属性", title: "学生突然失联", text: "晚归未归，电话关机，室友都很着急。", choices: [
      { label: "发动同学寻找", outcome: "扩大搜寻范围，但也扩大影响。", tone: "bold" },
      { label: "报告保卫处", outcome: "流程正规，但等待更久。", tone: "safe" },
      { label: "联系家长", outcome: "获得家庭线索，也可能引发家长恐慌。", tone: "hard" }
    ]},
    { id: "E16", category: "学生属性", title: "学生拒签工作", text: "家长希望你劝他考公，学生本人不愿意。", choices: [
      { label: "听学生意愿", outcome: "学生信任你，但家长不满意。", tone: "bold" },
      { label: "做家长工作", outcome: "家庭关系缓和，但学生觉得被安排。", tone: "safe" },
      { label: "折中建议", outcome: "两边都接受一点，也可能都不满意。", tone: "neglect" }
    ]},
    { id: "E17", category: "学生属性", title: "简历造假", text: "学生把没做过的项目写进简历，已经被你发现。", choices: [
      { label: "要求修改", outcome: "原则清楚，学生短期受挫。", tone: "hard" },
      { label: "睁一只眼", outcome: "暂时没事，但风险埋下。", tone: "neglect" },
      { label: "帮助重新包装真实经历", outcome: "既诚实又有效，但很费时间。", tone: "bold" }
    ]},
    { id: "E18", category: "学生属性", title: "班级小团体孤立", text: "一名学生被排除在小组作业外。", choices: [
      { label: "重新分组", outcome: "立刻打破格局，但班级会波动。", tone: "hard" },
      { label: "私下谈话", outcome: "了解更深，但见效慢。", tone: "safe" },
      { label: "班委介入", outcome: "交给学生处理，但可能进一步站队。", tone: "neglect" }
    ]},
    { id: "E19", category: "学生属性", title: "学生网络争议", text: "学生在网上发表不当言论，被截图转发。", choices: [
      { label: "先核实", outcome: "避免误判，但舆情继续发酵。", tone: "safe" },
      { label: "删除并教育", outcome: "快速降温，但学生可能不服。", tone: "hard" },
      { label: "上报学院", outcome: "责任上移，但你可能失去处理主动权。", tone: "neglect" }
    ]},
    { id: "E20", category: "学生属性", title: "体育课晕倒", text: "学生隐瞒低血糖和节食，被送到校医院。", choices: [
      { label: "送医并谈话", outcome: "身体和原因都照顾到，但很耗时间。", tone: "bold" },
      { label: "通知家长", outcome: "家庭知情，但学生觉得被暴露。", tone: "safe" },
      { label: "安排健康观察", outcome: "有同学照看，但专业跟进不足。", tone: "neglect" }
    ]},
    { id: "E21", category: "学生属性", title: "宿舍半夜急诊", text: "学生高烧，室友打来电话。", choices: [
      { label: "亲自送医", outcome: "最稳妥，但你的睡眠被切碎。", tone: "hard" },
      { label: "让室友陪同", outcome: "你远程协调，风险稍高。", tone: "safe" },
      { label: "联系校医院", outcome: "专业处理，但等待时间更长。", tone: "neglect" }
    ]},
    { id: "E22", category: "学生属性", title: "家长凌晨电话", text: "孩子不接电话，家长情绪激动。", choices: [
      { label: "先安抚家长", outcome: "家长平静，但学生情况仍未核实。", tone: "safe" },
      { label: "先核实学生", outcome: "信息准确，但家长等待时更焦虑。", tone: "bold" },
      { label: "请家长稍后联系", outcome: "你保护了休息，家长不满意。", tone: "neglect" }
    ]},
    { id: "E23", category: "学生属性", title: "家庭突发变故", text: "学生父亲住院，学生想休学。", choices: [
      { label: "帮助申请资助", outcome: "缓解经济压力，但休学风险仍在。", tone: "safe" },
      { label: "建议请假", outcome: "保留学籍，学生仍能调整。", tone: "bold" },
      { label: "支持休学", outcome: "尊重选择，但学业可能中断。", tone: "hard" }
    ]},
    { id: "E24", category: "学生属性", title: "家长送礼", text: "家长塞红包请你照顾孩子。", choices: [
      { label: "拒绝并解释", outcome: "守住底线，家长暂时尴尬。", tone: "safe" },
      { label: "上交登记", outcome: "合规，但关系变得正式。", tone: "hard" },
      { label: "收下但用于班级", outcome: "看似灵活，但留下风险。", tone: "neglect" }
    ]},
    { id: "E25", category: "学生属性", title: "考试作弊", text: "监考老师抓到你班学生。", choices: [
      { label: "按规处理", outcome: "规则清晰，学生面临处分。", tone: "hard" },
      { label: "求情轻罚", outcome: "学生感激，但规则被软化。", tone: "neglect" },
      { label: "心理疏导", outcome: "情绪被照顾，但处分程序仍需继续。", tone: "safe" }
    ]},
    { id: "E26", category: "学生属性", title: "宿舍违禁电器", text: "检查发现有人使用大功率电器。", choices: [
      { label: "没收并教育", outcome: "隐患消除，学生有些抵触。", tone: "hard" },
      { label: "公开通报", outcome: "震慑全班，但关系下降。", tone: "neglect" },
      { label: "私下提醒", outcome: "保留面子，但可能再犯。", tone: "safe" }
    ]},
    { id: "E27", category: "学生属性", title: "学生兼职被骗", text: "学生想借网贷还钱，越说越慌。", choices: [
      { label: "阻止网贷", outcome: "止损及时，但债务仍在。", tone: "bold" },
      { label: "帮联系家长", outcome: "家庭支持，但学生更难堪。", tone: "safe" },
      { label: "报警并申请补助", outcome: "程序完整，但周期较长。", tone: "hard" }
    ]},
    { id: "E28", category: "学生属性", title: "助学金争议", text: "同学匿名举报受助学生高消费。", choices: [
      { label: "调查核实", outcome: "事实更清楚，但过程敏感。", tone: "bold" },
      { label: "保护隐私", outcome: "避免二次伤害，但疑虑仍在。", tone: "safe" },
      { label: "组织复核", outcome: "程序公正，但关系紧张。", tone: "hard" }
    ]},
    { id: "E29", category: "辅导员状态", title: "精力透支", text: "深夜写材料时眼前发黑。", choices: [
      { label: "继续工作", outcome: "材料完成，身体更危险。", tone: "hard" },
      { label: "睡 20 分钟", outcome: "恢复一点，但工作会拖到更晚。", tone: "safe" },
      { label: "请假半天", outcome: "身体缓过来，领导可能皱眉。", tone: "bold" }
    ]},
    { id: "E30", category: "辅导员状态", title: "心理崩溃前兆", text: "开会时突然想哭，你只能强撑着。", choices: [
      { label: "硬撑", outcome: "会议过去，但心理更空。", tone: "hard" },
      { label: "去洗手间调整", outcome: "暂时平复，但问题没有解决。", tone: "safe" },
      { label: "约心理咨询", outcome: "开始求助，但需要承认自己也需要帮助。", tone: "bold" }
    ]},
    { id: "E31", category: "辅导员状态", title: "身体预警", text: "连续加班后心脏不舒服。", choices: [
      { label: "继续扛", outcome: "工作继续，风险快速上升。", tone: "hard" },
      { label: "吃止痛药", outcome: "暂时压下症状，但可能掩盖问题。", tone: "neglect" },
      { label: "去医院", outcome: "及时检查，代价是工作暂停。", tone: "bold" }
    ]},
    { id: "E32", category: "辅导员状态", title: "存款见底", text: "月底只剩 300 元，还有同事结婚份子钱。", choices: [
      { label: "借网贷", outcome: "马上有钱，但以后更被动。", tone: "hard" },
      { label: "向朋友借", outcome: "暂时周转，但关系里多了债务。", tone: "safe" },
      { label: "简单随礼", outcome: "保住现金流，但同事关系略降温。", tone: "neglect" }
    ]},
    { id: "E33", category: "辅导员状态", title: "领导深夜派活", text: "23 点发材料，要求明早交。", choices: [
      { label: "立即回复", outcome: "领导满意，你的睡眠没了。", tone: "hard" },
      { label: "明天早做", outcome: "休息保住了，但交付很赶。", tone: "safe" },
      { label: "说明困难", outcome: "边界清晰，但领导评价可能下降。", tone: "bold" }
    ]},
    { id: "E34", category: "辅导员状态", title: "同事请求代班", text: "同事家里有事，但你已经安排满。", choices: [
      { label: "帮忙", outcome: "同事关系上升，你更累。", tone: "bold" },
      { label: "拒绝", outcome: "保护了自己，但同事失望。", tone: "hard" },
      { label: "协商只代半天", outcome: "两边都照顾一点，也很勉强。", tone: "safe" }
    ]},
    { id: "E35", category: "辅导员状态", title: "家长投诉", text: "家长在家长群公开质疑你不管学生。", choices: [
      { label: "群里解释", outcome: "公开回应，但容易越描越黑。", tone: "hard" },
      { label: "私下沟通", outcome: "更可控，但群里的情绪还在。", tone: "safe" },
      { label: "请学院出面", outcome: "压力转移，但显得你处理不了。", tone: "neglect" }
    ]},
    { id: "E36", category: "辅导员状态", title: "学生说“辅导员没用”", text: "你偶然看到匿名吐槽。", choices: [
      { label: "反思调整", outcome: "可能发现问题，但会很内耗。", tone: "bold" },
      { label: "找学生了解", outcome: "信息更真实，但容易变成对质。", tone: "safe" },
      { label: "忽略但影响心情", outcome: "表面翻篇，心理下降。", tone: "neglect" }
    ]},
    { id: "E37", category: "趣味荒诞", title: "领导要求“拍照留痕”", text: "活动已经结束，但必须补拍。", choices: [
      { label: "补拍摆拍", outcome: "材料齐全，但你有点心虚。", tone: "fun" },
      { label: "用旧图", outcome: "省事，但有被识破风险。", tone: "neglect" },
      { label: "拒绝并说明", outcome: "显得较真，领导觉得你不灵活。", tone: "hard" }
    ]},
    { id: "E38", category: "趣味荒诞", title: "表格反复改名", text: "同一份材料改了 5 版，最后用第 1 版。", choices: [
      { label: "继续改", outcome: "服从流程，但消耗大量耐心。", tone: "hard" },
      { label: "礼貌确认", outcome: "可能省掉无效劳动，也可能被认为多嘴。", tone: "bold" },
      { label: "提交第 1 版", outcome: "效率最高，但格式风险仍在。", tone: "safe" }
    ]},
    { id: "E39", category: "趣味荒诞", title: "学生把你当树洞", text: "凌晨发来 200 条消息。", choices: [
      { label: "全部回复", outcome: "学生感到被认真对待，你第二天报废。", tone: "hard" },
      { label: "约第二天谈", outcome: "设置边界，但学生可能更焦虑。", tone: "safe" },
      { label: "先睡", outcome: "你恢复了，但学生觉得被忽略。", tone: "neglect" }
    ]},
    { id: "E40", category: "趣味荒诞", title: "办公室抢零食", text: "你买的东西被同事吃光。", choices: [
      { label: "开玩笑带过", outcome: "气氛轻松，但你依然没吃到。", tone: "fun" },
      { label: "重新买", outcome: "问题解决，但钱包轻了一点。", tone: "safe" },
      { label: "锁柜子", outcome: "保住了零食，但显得计较。", tone: "hard" }
    ]},
    { id: "E41", category: "趣味荒诞", title: "学生用你的表情包做班会 PPT", text: "现场起哄，气氛热烈。", choices: [
      { label: "跟着笑", outcome: "关系变近，但老师形象略松动。", tone: "fun" },
      { label: "假装严肃", outcome: "维持形象，但显得不近人情。", tone: "hard" },
      { label: "顺势互动", outcome: "既幽默又把话题带回来。", tone: "bold" }
    ]},
    { id: "E42", category: "趣味荒诞", title: "学期最后一天停电", text: "材料没保存，自动存档也没了。", choices: [
      { label: "重做", outcome: "保证交付，但身心俱疲。", tone: "hard" },
      { label: "找技术部门", outcome: "可能恢复，也可能没有结果。", tone: "safe" },
      { label: "申请延期", outcome: "获得时间，但领导评价下降。", tone: "neglect" }
    ]},
    { id: "E43", category: "趣味荒诞", title: "学院要求“接龙收到”", text: "通知群深夜发统计，领导要求所有人 10 分钟内回复。", choices: [
      { label: "秒回“收到”", outcome: "留下积极印象，但你其实没细看。", tone: "fun" },
      { label: "认真阅读后回复", outcome: "信息准确，但可能错过截止。", tone: "safe" },
      { label: "装睡到明早", outcome: "睡眠保住了，但被记了一笔。", tone: "neglect" }
    ]},
    { id: "E44", category: "趣味荒诞", title: "学生让你帮忙砍一刀", text: "学生发来电商助力链接。", choices: [
      { label: "点一下", outcome: "学生开心，但你可能被打扰。", tone: "fun" },
      { label: "拒绝并提醒注意防诈", outcome: "原则清晰，学生觉得你扫兴。", tone: "hard" },
      { label: "开玩笑让他帮你写周报", outcome: "气氛轻松，但也得真写。", tone: "safe" }
    ]},
    { id: "E45", category: "趣味荒诞", title: "办公室打印机卡纸", text: "你急着打印材料，打印机开始连续吐纸。", choices: [
      { label: "自己修", outcome: "可能修好，也可能越弄越糟。", tone: "bold" },
      { label: "叫技术部门", outcome: "专业处理，但等待很久。", tone: "safe" },
      { label: "先拍照发工作群吐槽", outcome: "情绪缓解，但问题还在。", tone: "fun" }
    ]},
    { id: "E46", category: "趣味荒诞", title: "领导说“简单说两句”", text: "结果讲了 40 分钟。", choices: [
      { label: "认真记", outcome: "显得靠谱，但内容未必有用。", tone: "hard" },
      { label: "偷偷回消息", outcome: "处理了工作，但可能被看见。", tone: "neglect" },
      { label: "假装记笔记实则画小人", outcome: "心理轻松，但会后还得补信息。", tone: "fun" }
    ]},
    { id: "E47", category: "趣味荒诞", title: "学生宿舍养电子宠物", text: "一只电子小狗半夜不停叫。", choices: [
      { label: "让学生关掉", outcome: "问题解决，但学生失落。", tone: "hard" },
      { label: "借来玩五分钟", outcome: "你笑了，但没解决纪律问题。", tone: "fun" },
      { label: "借此开展宿舍公约讨论", outcome: "有教育意义，但耗时间。", tone: "bold" }
    ]},
    { id: "E48", category: "趣味荒诞", title: "班级群改名风波", text: "学生把群名改成“辅导员带带我”。", choices: [
      { label: "改回来", outcome: "恢复秩序，学生觉得你紧张。", tone: "hard" },
      { label: "顺水推舟", outcome: "气氛很好，但群名越来越离谱。", tone: "fun" },
      { label: "发起群名投票", outcome: "民主但拖沓，可能更乱。", tone: "safe" }
    ]},
    { id: "E49", category: "趣味荒诞", title: "辅导员技能大赛抽签", text: "你抽到“现场模拟处理学生闹事”。", choices: [
      { label: "认真准备", outcome: "表现稳定，但很累。", tone: "hard" },
      { label: "临场发挥", outcome: "可能出彩，也可能翻车。", tone: "bold" },
      { label: "请学生陪练", outcome: "更真实，但学生可能起哄。", tone: "fun" }
    ]},
    { id: "E50", category: "趣味荒诞", title: "学生把你写进课程论文致谢", text: "论文还没通过，致谢先火了。", choices: [
      { label: "先笑", outcome: "你开心了，但没解决问题。", tone: "fun" },
      { label: "提醒他认真改论文", outcome: "重点回到学业，但扫兴。", tone: "hard" },
      { label: "截图发朋友圈", outcome: "很有传播性，但可能不妥。", tone: "bold" }
    ]},
    { id: "E51", category: "趣味荒诞", title: "学校要求下载四个 App 签到", text: "每个 App 的密码规则都不一样。", choices: [
      { label: "全部下载", outcome: "全部完成，但手机和脑子都塞满。", tone: "hard" },
      { label: "只装必要", outcome: "减少负担，但可能漏签。", tone: "safe" },
      { label: "用备忘录统一记", outcome: "有条理，但每天仍要花时间。", tone: "bold" }
    ]},
    { id: "E52", category: "趣味荒诞", title: "学生问“老师你为什么不回我 00:47 的消息”", text: "第二天早上看到。", choices: [
      { label: "解释作息", outcome: "边界清楚，但学生觉得被说教。", tone: "hard" },
      { label: "约谈话", outcome: "有机会认真听，但要安排时间。", tone: "safe" },
      { label: "先问发生了什么", outcome: "学生感到被关心，但你可能被拖入深夜循环。", tone: "bold" }
    ]},
    { id: "E53", category: "趣味荒诞", title: "办公室空调坏了", text: "夏天，领导让你先坚持一下。", choices: [
      { label: "找风扇", outcome: "暂时降温，但治标不治本。", tone: "safe" },
      { label: "去会议室办公", outcome: "环境好一点，但跑来跑去。", tone: "fun" },
      { label: "申请维修", outcome: "解决根本，但流程慢。", tone: "hard" }
    ]},
    { id: "E54", category: "趣味荒诞", title: "学生带猫进宿舍被宿管抓住", text: "猫很可爱，学生眼泪汪汪。", choices: [
      { label: "按规处理", outcome: "规则清楚，学生伤心。", tone: "hard" },
      { label: "帮找临时寄养", outcome: "学生感激，但责任落在你身上。", tone: "bold" },
      { label: "让宿管决定", outcome: "你抽身了，学生觉得被推走。", tone: "neglect" }
    ]},
    { id: "E55", category: "趣味荒诞", title: "同事分享“辅导员专用发疯文学”", text: "你看完觉得过于真实。", choices: [
      { label: "收藏", outcome: "情绪出口，但没改变现实。", tone: "fun" },
      { label: "转发到同事群", outcome: "大家笑了，也可能被截出去。", tone: "bold" },
      { label: "提醒注意影响", outcome: "很谨慎，但气氛变冷。", tone: "hard" }
    ]},
    { id: "E56", category: "趣味荒诞", title: "领导让你用 AI 生成活动总结", text: "生成内容把学院名字都写错了。", choices: [
      { label: "重写", outcome: "质量可靠，但很费时。", tone: "hard" },
      { label: "改错后提交", outcome: "效率高，但内容仍显生硬。", tone: "safe" },
      { label: "幽默提醒领导", outcome: "气氛轻松，但可能被认为不认真。", tone: "fun" }
    ]},
    { id: "E57", category: "趣味荒诞", title: "学生在食堂看到你吃泡面", text: "当晚班级群里出现“老师也要活下去”。", choices: [
      { label: "大方承认", outcome: "真实，学生更亲近。", tone: "bold" },
      { label: "开玩笑", outcome: "气氛好，但问题还在。", tone: "fun" },
      { label: "提醒大家好好吃饭", outcome: "关心学生，但有点转移话题。", tone: "safe" }
    ]},
    { id: "E58", category: "趣味荒诞", title: "班级团建抽奖抽到你", text: "学生起哄让你表演节目。", choices: [
      { label: "唱一句", outcome: "气氛热烈，但你很尴尬。", tone: "fun" },
      { label: "用笑话带过", outcome: "顺利下台，但不够尽兴。", tone: "safe" },
      { label: "反抽学生上台", outcome: "学生更嗨，但可能玩脱。", tone: "bold" }
    ]},
    { id: "E59", category: "趣味荒诞", title: "学校临时通知“不上课也要来拍照”", text: "学生怨气很大。", choices: [
      { label: "压缩时间", outcome: "减少怨气，但效果打折。", tone: "safe" },
      { label: "和班委商量", outcome: "学生有参与感，但意见很多。", tone: "bold" },
      { label: "向学院反馈", outcome: "试图改变，但可能被当刺头。", tone: "hard" }
    ]},
    { id: "E60", category: "趣味荒诞", title: "学生给你备注“神仙导员”", text: "截图发到了年级大群。", choices: [
      { label: "假装没看见", outcome: "你装死，群里继续讨论。", tone: "safe" },
      { label: "在群里回一句", outcome: "互动很好，但容易变成围观。", tone: "fun" },
      { label: "提醒他改备注", outcome: "维持距离，学生觉得你扫兴。", tone: "hard" }
    ]},
    { id: "E61", category: "危机事件", title: "学生遭遇电信诈骗", text: "学生轻信兼职刷单，转出了几千元，现在又急又怕，想借网贷补窟窿。", choices: [
      { label: "阻止网贷并陪同报警", outcome: "止损及时，但学生需要时间恢复信任。", tone: "bold" },
      { label: "联系家长共同处理", outcome: "家庭支持到位，但学生觉得很难堪。", tone: "safe" },
      { label: "先安抚情绪", outcome: "学生平静一点，但资金风险仍在。", tone: "neglect" }
    ]},
    { id: "E62", category: "危机事件", title: "宿舍矛盾升级", text: "两个宿舍因作息、卫生和噪音问题公开争吵，学生提出换宿舍。", choices: [
      { label: "分开谈话并评估换宿", outcome: "各方冷静，但问题需要持续跟进。", tone: "bold" },
      { label: "组织宿舍调解", outcome: "矛盾暂时缓和，但根本规则还没建立。", tone: "safe" },
      { label: "直接同意换宿舍", outcome: "冲突被隔开，但问题可能转移到新宿舍。", tone: "hard" }
    ]},
    { id: "E63", category: "危机事件", title: "学生发出危险信号", text: "学生在社交平台发了一段告别式文字，并提到自己撑不下去了。", choices: [
      { label: "立即联系并启动危机干预", outcome: "你第一时间确认安全，专业支持也及时介入。", tone: "bold" },
      { label: "通知心理中心和家长", outcome: "支持网络扩大，但学生可能感到被公开。", tone: "safe" },
      { label: "让室友先陪伴", outcome: "朋辈支持有温度，但专业风险不能只靠陪伴。", tone: "neglect" }
    ]},
    { id: "E64", category: "危机事件", title: "学生独自前往边境城市", text: "学生没有请假，定位显示他一个人到了云南某边境城市。", choices: [
      { label: "立即联系本人并确认安全", outcome: "你先确认人和动机，避免误判。", tone: "bold" },
      { label: "报告学院和保卫处", outcome: "流程启动，但学生可能更紧张。", tone: "safe" },
      { label: "发动同学寻找", outcome: "线索更多，但容易扩大影响。", tone: "neglect" }
    ]},
    { id: "E65", category: "危机事件", title: "学生疑似进入传销组织", text: "学生连续几天联系不上，最后发来一条含糊的“赚大钱”消息。", choices: [
      { label: "联系家人并报警", outcome: "多线确认，程序正规但节奏较慢。", tone: "safe" },
      { label: "尝试保持联系并套取位置", outcome: "可能获得关键信息，但风险很高。", tone: "bold" },
      { label: "先等待学生回复", outcome: "避免惊动，但可能错过最佳时机。", tone: "neglect" }
    ]},
    { id: "E66", category: "危机事件", title: "学生遭遇网络勒索", text: "学生被人以隐私照片威胁，不敢告诉家里，也不敢报警。", choices: [
      { label: "安抚并陪同报警", outcome: "止损和取证更及时，学生逐渐放下恐惧。", tone: "bold" },
      { label: "联系心理中心", outcome: "情绪被接住，但法律问题还需要处理。", tone: "safe" },
      { label: "让学生自己处理", outcome: "学生压力巨大，风险继续累积。", tone: "neglect" }
    ]},
    { id: "E67", category: "危机事件", title: "学生考试压力失控", text: "学生在考场外呕吐、手抖，哭着说自己一定考砸了。", choices: [
      { label: "先离开考场并稳定情绪", outcome: "学生慢慢平静，但考试安排需要协调。", tone: "bold" },
      { label: "联系校医院和心理中心", outcome: "专业支持到位，但学生可能觉得被特殊对待。", tone: "safe" },
      { label: "鼓励他再坚持一下", outcome: "你可能推动他完成考试，但情绪风险上升。", tone: "hard" }
    ]},
    { id: "E68", category: "危机事件", title: "学生见网友后失联", text: "学生周末去见网友，之后电话不接，消息只回了一个模糊表情。", choices: [
      { label: "立即联系并核实位置", outcome: "信息更准确，但需要谨慎沟通。", tone: "bold" },
      { label: "报告保卫处", outcome: "安全流程启动，但可能引发学生抵触。", tone: "safe" },
      { label: "请同学继续联系", outcome: "朋辈更容易接近，但缺少专业判断。", tone: "neglect" }
    ]},
    { id: "E69", category: "危机事件", title: "学生遭遇突发家庭变故", text: "学生接到家里电话后一直哭，说想立刻休学回家。", choices: [
      { label: "先确认家中情况", outcome: "你掌握真实信息，再做决定更稳妥。", tone: "safe" },
      { label: "帮助学生办理临时请假", outcome: "学生能及时回家，但学业可能中断。", tone: "bold" },
      { label: "劝学生冷静后再决定", outcome: "避免冲动，但学生可能觉得你不理解。", tone: "hard" }
    ]},
    { id: "E70", category: "危机事件", title: "学生自伤行为被室友发现", text: "室友发现学生手臂有伤痕，但学生要求不要告诉任何人。", choices: [
      { label: "先确保安全并启动专业支持", outcome: "安全优先，学生需要被认真对待。", tone: "bold" },
      { label: "单独谈话并承诺保密", outcome: "学生更信任你，但风险不能被保密替代。", tone: "safe" },
      { label: "通知家长", outcome: "家庭知情，但可能激化亲子冲突。", tone: "hard" }
    ]},
    { id: "E71", semesterRange: [1], category: "学期事件", title: "军训中暑", text: "学生在军训时脸色发白，但仍坚持说自己没事。", choices: [
      { label: "立即送医并通知教官", outcome: "身体风险被及时处理，学生对你更信任。", tone: "bold" },
      { label: "让他先到阴凉处休息", outcome: "情况暂时缓解，但可能没有彻底检查。", tone: "safe" },
      { label: "让他坚持一下", outcome: "学生继续训练，但健康风险上升。", tone: "hard" }
    ]},
    { id: "E72", semesterRange: [1], category: "学期事件", title: "新生想家", text: "学生躲在宿舍哭，说不想读了，想回家复读。", choices: [
      { label: "认真听他讲完", outcome: "学生情绪被接住，你更了解他的真实顾虑。", tone: "bold" },
      { label: "联系家长沟通", outcome: "家庭支持增加，但学生觉得被推回家里。", tone: "safe" },
      { label: "鼓励他先适应一个月", outcome: "给了他缓冲期，但情绪问题还在。", tone: "hard" }
    ]},
    { id: "E73", semesterRange: [1], category: "学期事件", title: "宿舍物品丢失", text: "学生说新买的耳机不见了，怀疑室友偷拿。", choices: [
      { label: "先了解情况再调监控", outcome: "避免误判，但需要时间。", tone: "safe" },
      { label: "组织宿舍沟通", outcome: "矛盾公开，可能影响关系。", tone: "hard" },
      { label: "让学生报警", outcome: "程序正规，但宿舍气氛更紧张。", tone: "neglect" }
    ]},
    { id: "E74", semesterRange: [1], category: "学期事件", title: "新生家长过度干预", text: "家长要求你每天汇报孩子吃饭和上课情况。", choices: [
      { label: "说明工作边界", outcome: "边界清楚，但家长不满意。", tone: "hard" },
      { label: "阶段性同步情况", outcome: "家长放心，但会占用很多精力。", tone: "safe" },
      { label: "让学生自己沟通", outcome: "学生被迫面对家庭压力。", tone: "neglect" }
    ]},
    { id: "E75", semesterRange: [2], category: "学期事件", title: "转专业失败", text: "学生转专业面试没过，情绪非常低落。", choices: [
      { label: "帮助他复盘原因", outcome: "学生慢慢接受，但需要持续支持。", tone: "bold" },
      { label: "鼓励他在当前专业找方向", outcome: "提供新思路，但情绪仍需消化。", tone: "safe" },
      { label: "建议明年再试", outcome: "保留希望，但当前问题被延后。", tone: "neglect" }
    ]},
    { id: "E76", semesterRange: [2], category: "学期事件", title: "挂科后自我怀疑", text: "学生挂科后说自己不是学习的料。", choices: [
      { label: "帮他分析学习方法", outcome: "问题更具体，但改变需要时间。", tone: "bold" },
      { label: "安排学长辅导", outcome: "有人带着，但学生可能更依赖。", tone: "safe" },
      { label: "鼓励他自己调整", outcome: "学生独立面对，但压力较大。", tone: "hard" }
    ]},
    { id: "E77", semesterRange: [2], category: "学期事件", title: "恋爱分手", text: "学生分手后连续几天没去上课。", choices: [
      { label: "约他聊聊", outcome: "情绪得到释放，你也能判断风险。", tone: "bold" },
      { label: "让室友多陪伴", outcome: "朋辈支持及时，但专业观察不足。", tone: "safe" },
      { label: "先观察几天", outcome: "避免过度干预，但可能错过信号。", tone: "neglect" }
    ]},
    { id: "E78", semesterRange: [2], category: "学期事件", title: "家庭要求考研", text: "学生不想考研，但家里已经替他报了班。", choices: [
      { label: "先听学生意愿", outcome: "学生被尊重，但家庭矛盾仍在。", tone: "bold" },
      { label: "和家长沟通", outcome: "家庭关系可能缓和，但学生觉得被安排。", tone: "safe" },
      { label: "建议先试一段时间", outcome: "两边都能接受，但目标仍不清晰。", tone: "hard" }
    ]},
    { id: "E79", semesterRange: [3], category: "学期事件", title: "竞赛项目崩溃", text: "比赛项目在中期检查前被推翻，团队情绪低落。", choices: [
      { label: "带团队重新整理", outcome: "项目方向更清晰，但大家很累。", tone: "bold" },
      { label: "降低目标保底完成", outcome: "压力减轻，但竞争力下降。", tone: "safe" },
      { label: "放弃比赛", outcome: "及时止损，但学生失去锻炼机会。", tone: "neglect" }
    ]},
    { id: "E80", semesterRange: [3], category: "学期事件", title: "社团内部冲突", text: "学生干部因为活动经费和分工问题公开争吵。", choices: [
      { label: "分开谈话", outcome: "双方冷静，但根因需要继续处理。", tone: "safe" },
      { label: "召开全体会议", outcome: "问题公开，但容易扩大矛盾。", tone: "hard" },
      { label: "让学生自行解决", outcome: "锻炼自治能力，但可能失控。", tone: "neglect" }
    ]},
    { id: "E81", semesterRange: [3], category: "学期事件", title: "学业预警", text: "学生收到学业预警，但表现得毫不在意。", choices: [
      { label: "认真谈话找原因", outcome: "学生愿意开口，但问题很复杂。", tone: "bold" },
      { label: "联系家长", outcome: "家庭重视，但学生更抵触。", tone: "hard" },
      { label: "安排学业帮扶", outcome: "学习有人带，但根本动力仍不足。", tone: "safe" }
    ]},
    { id: "E82", semesterRange: [3], category: "学期事件", title: "宿舍小团体", text: "宿舍内部形成两派，一名学生被长期孤立。", choices: [
      { label: "私下了解情况", outcome: "信息更真实，但见效较慢。", tone: "bold" },
      { label: "重新安排宿舍", outcome: "问题被隔离，但关系没有修复。", tone: "hard" },
      { label: "开展宿舍活动", outcome: "关系可能缓和，但效果不稳定。", tone: "safe" }
    ]},
    { id: "E83", semesterRange: [4], category: "学期事件", title: "实习被骗", text: "学生在实习中被要求交押金，已经转了一部分钱。", choices: [
      { label: "阻止继续转账并报警", outcome: "止损及时，但学生很懊恼。", tone: "bold" },
      { label: "联系家长", outcome: "家庭介入，但学生觉得难堪。", tone: "safe" },
      { label: "让他自己处理", outcome: "学生压力更大，风险继续增加。", tone: "neglect" }
    ]},
    { id: "E84", semesterRange: [4], category: "学期事件", title: "暑期实践安全", text: "学生暑期实践地点偏远，最近两天联系不上。", choices: [
      { label: "立即联系并确认位置", outcome: "你第一时间核实安全。", tone: "bold" },
      { label: "报告学院", outcome: "流程启动，但学生可能紧张。", tone: "safe" },
      { label: "继续等待消息", outcome: "避免惊动，但风险上升。", tone: "neglect" }
    ]},
    { id: "E85", semesterRange: [4], category: "学期事件", title: "经济压力", text: "学生因为家里困难，想放弃暑期实习去打工。", choices: [
      { label: "帮助申请补助", outcome: "经济压力缓解，但流程较长。", tone: "safe" },
      { label: "帮他找带薪实习", outcome: "兼顾实践和收入，但选择较少。", tone: "bold" },
      { label: "建议先打工", outcome: "眼前问题解决，但实践经历受影响。", tone: "hard" }
    ]},
    { id: "E86", semesterRange: [4], category: "学期事件", title: "评奖争议", text: "学生对评奖结果不满，在班级群里公开质疑。", choices: [
      { label: "私下了解原因", outcome: "情绪降温，但问题需要核实。", tone: "safe" },
      { label: "公开解释", outcome: "信息透明，但容易引发更多讨论。", tone: "hard" },
      { label: "让班委处理", outcome: "学生自治，但可能继续发酵。", tone: "neglect" }
    ]},
    { id: "E87", semesterRange: [5], category: "学期事件", title: "考研报名纠结", text: "学生反复修改志愿，报名截止前仍没有确定。", choices: [
      { label: "帮他梳理目标", outcome: "方向清楚一些，但决定仍要他自己做。", tone: "bold" },
      { label: "建议求稳", outcome: "风险降低，但可能错过更合适的选择。", tone: "safe" },
      { label: "让他自己决定", outcome: "尊重自主，但学生更焦虑。", tone: "hard" }
    ]},
    { id: "E88", semesterRange: [5], category: "学期事件", title: "出国准备", text: "学生想申请出国，但家里并不支持。", choices: [
      { label: "帮学生整理信息", outcome: "选择更清晰，但家庭问题还在。", tone: "bold" },
      { label: "和家长沟通", outcome: "家庭可能理解，但学生觉得被替代表达。", tone: "safe" },
      { label: "建议先考虑成本", outcome: "更现实，但学生觉得被泼冷水。", tone: "hard" }
    ]},
    { id: "E89", semesterRange: [5], category: "学期事件", title: "家长催就业", text: "家长要求你劝孩子放弃考研，赶紧找工作。", choices: [
      { label: "和学生确认真实想法", outcome: "你更理解学生，但家长更着急。", tone: "bold" },
      { label: "向家长说明情况", outcome: "家长情绪缓和，但学生压力仍在。", tone: "safe" },
      { label: "按家长要求劝说", outcome: "家庭满意，但学生可能更迷茫。", tone: "hard" }
    ]},
    { id: "E90", semesterRange: [5], category: "学期事件", title: "未来迷茫", text: "学生说自己不知道以后要做什么，整夜睡不着。", choices: [
      { label: "安排职业咨询", outcome: "专业支持介入，但需要时间。", tone: "safe" },
      { label: "陪他做兴趣梳理", outcome: "学生更信任你，但过程很长。", tone: "bold" },
      { label: "建议先别想太多", outcome: "暂时缓解，但问题没有解决。", tone: "neglect" }
    ]},
    { id: "E91", semesterRange: [6], category: "学期事件", title: "三方协议毁约", text: "学生签了三方后又想毁约，企业打电话来投诉。", choices: [
      { label: "先问学生原因", outcome: "你了解真实情况，但企业等待。", tone: "bold" },
      { label: "安抚企业", outcome: "企业消气，但学生觉得被替代处理。", tone: "safe" },
      { label: "按流程上报", outcome: "程序正确，但关系变冷。", tone: "hard" }
    ]},
    { id: "E92", semesterRange: [6], category: "学期事件", title: "实习转正压力", text: "学生实习表现一般，担心无法转正。", choices: [
      { label: "帮他复盘改进", outcome: "方向明确，但压力仍然很大。", tone: "bold" },
      { label: "联系企业了解反馈", outcome: "信息更准确，但可能显得过度介入。", tone: "safe" },
      { label: "建议骑驴找马", outcome: "风险降低，但可能错过转正机会。", tone: "hard" }
    ]},
    { id: "E93", semesterRange: [6], category: "学期事件", title: "签约诈骗", text: "学生收到高薪 offer，但公司要求先交培训费。", choices: [
      { label: "提醒风险并核实公司", outcome: "避免损失，但学生可能不相信。", tone: "bold" },
      { label: "联系家长", outcome: "家庭知情，但学生觉得被干预。", tone: "safe" },
      { label: "让他自己判断", outcome: "学生可能上当。", tone: "neglect" }
    ]},
    { id: "E94", semesterRange: [6], category: "学期事件", title: "毕业实习冲突", text: "实习单位和毕业论文时间严重冲突。", choices: [
      { label: "和导师沟通", outcome: "可能争取调整，但流程慢。", tone: "safe" },
      { label: "和企业沟通", outcome: "实习压力降低，但可能影响转正。", tone: "bold" },
      { label: "让学生自己扛", outcome: "两边都做，学生身心俱疲。", tone: "hard" }
    ]},
    { id: "E95", semesterRange: [7], category: "学期事件", title: "考研冲刺崩溃", text: "学生考前一个月说看不进书，想放弃。", choices: [
      { label: "先处理情绪", outcome: "情绪稳定后，才能继续复习。", tone: "bold" },
      { label: "帮他调整计划", outcome: "任务更合理，但时间仍然很紧。", tone: "safe" },
      { label: "鼓励再坚持", outcome: "短期有效，但压力继续累积。", tone: "hard" }
    ]},
    { id: "E96", semesterRange: [7], category: "学期事件", title: "秋招失利", text: "学生连续面试失败，开始怀疑自己。", choices: [
      { label: "帮他复盘面试", outcome: "问题更具体，但情绪需要时间。", tone: "bold" },
      { label: "推荐其他岗位", outcome: "选择增加，但方向更分散。", tone: "safe" },
      { label: "建议先休息", outcome: "压力下降，但可能错过招聘季。", tone: "hard" }
    ]},
    { id: "E97", semesterRange: [7], category: "学期事件", title: "论文进度停滞", text: "学生论文很久没有进展，导师已经催促。", choices: [
      { label: "帮他拆解任务", outcome: "行动更清晰，但需要持续跟进。", tone: "bold" },
      { label: "联系导师协调", outcome: "压力缓解，但学生可能更依赖。", tone: "safe" },
      { label: "让他自己安排", outcome: "学生独立，但进度风险上升。", tone: "hard" }
    ]},
    { id: "E98", semesterRange: [7], category: "学期事件", title: "心理危机复发", text: "学生之前的问题在大四压力下再次出现。", choices: [
      { label: "重新启动专业支持", outcome: "安全第一，但学生需要重新适应。", tone: "bold" },
      { label: "增加谈话频率", outcome: "你持续跟进，但负担更重。", tone: "safe" },
      { label: "让室友多关注", outcome: "朋辈支持，但专业风险不能替代。", tone: "neglect" }
    ]},
    { id: "E99", semesterRange: [8], category: "学期事件", title: "毕业答辩紧张", text: "学生答辩前夜说完全讲不出来，想申请延期。", choices: [
      { label: "陪他模拟答辩", outcome: "信心增加，但你需要花很多时间。", tone: "bold" },
      { label: "让他早点休息", outcome: "状态稳定，但准备仍不足。", tone: "safe" },
      { label: "建议申请延期", outcome: "压力降低，但毕业进度受影响。", tone: "hard" }
    ]},
    { id: "E100", semesterRange: [8], category: "学期事件", title: "离校手续问题", text: "学生离校材料缺少盖章，情绪急躁。", choices: [
      { label: "帮他梳理流程", outcome: "问题清楚，但很费时间。", tone: "safe" },
      { label: "联系相关部门", outcome: "效率提高，但学生参与度下降。", tone: "bold" },
      { label: "让他自己处理", outcome: "锻炼独立，但可能误事。", tone: "hard" }
    ]},
    { id: "E101", semesterRange: [8], category: "学期事件", title: "毕业去向未定", text: "学生临近毕业仍没有明确去向。", choices: [
      { label: "做最后一次职业梳理", outcome: "方向更清楚，但时间紧张。", tone: "bold" },
      { label: "推荐保底岗位", outcome: "有兜底，但学生可能不满意。", tone: "safe" },
      { label: "尊重他再想想", outcome: "尊重选择，但毕业压力增加。", tone: "hard" }
    ]},
    { id: "E102", semesterRange: [8], category: "学期事件", title: "毕业告别情绪", text: "学生离校前突然说，以后可能再也不会回来看你。", choices: [
      { label: "认真回应这份告别", outcome: "你让这段关系有了结尾。", tone: "bold" },
      { label: "轻松带过", outcome: "气氛轻松，但情感没有深入。", tone: "safe" },
      { label: "提醒他注意安全", outcome: "你仍像辅导员，但少了告别。", tone: "hard" }
    ]}
  ];

  const extraSemesterEvents = [
    { id: "E103", semesterRange: [1], category: "学期事件", title: "新生军训受伤", text: "学生在训练中扭伤脚踝，但怕影响评优不想报告。", choices: [
      { label: "先送医检查", outcome: "健康优先，学生也松了一口气。", tone: "bold" },
      { label: "让他先休息观察", outcome: "暂时缓解，但可能留下隐患。", tone: "safe" },
      { label: "按流程上报", outcome: "程序完整，但学生觉得被放大。", tone: "hard" }
    ]},
    { id: "E104", semesterRange: [1], category: "学期事件", title: "新生不适应集体生活", text: "学生抱怨室友太吵，自己完全睡不好。", choices: [
      { label: "组织宿舍公约", outcome: "问题有规则可依，但需要大家配合。", tone: "safe" },
      { label: "单独安抚学生", outcome: "情绪缓解，但环境没有改变。", tone: "bold" },
      { label: "建议再忍忍", outcome: "学生更委屈，风险上升。", tone: "neglect" }
    ]},
    { id: "E105", semesterRange: [1], category: "学期事件", title: "新生被高年级推销", text: "学生被拉进校外培训群，已经交了定金。", choices: [
      { label: "帮助核实并止损", outcome: "损失可能追回，但流程较慢。", tone: "bold" },
      { label: "提醒全班注意", outcome: "集体警觉，但学生个人问题仍需处理。", tone: "safe" },
      { label: "让学生自己联系", outcome: "学生压力大，可能继续被骗。", tone: "neglect" }
    ]},
    { id: "E106", semesterRange: [1], category: "学期事件", title: "新生想加入多个社团", text: "学生一口气报名五个社团，忙得没时间上课。", choices: [
      { label: "帮他做减法", outcome: "选择更聚焦，但学生舍不得。", tone: "safe" },
      { label: "尊重他的热情", outcome: "学生开心，但学业风险上升。", tone: "bold" },
      { label: "提醒他先顾学业", outcome: "目标清楚，但学生觉得扫兴。", tone: "hard" }
    ]},
    { id: "E107", semesterRange: [1], category: "学期事件", title: "新生家长寄来大量包裹", text: "家长隔几天就寄东西，学生觉得被过度照顾。", choices: [
      { label: "和学生沟通", outcome: "学生情绪被理解，但家庭边界仍需要处理。", tone: "bold" },
      { label: "联系家长说明", outcome: "家长可能减少，但学生觉得被插手。", tone: "safe" },
      { label: "先不介入", outcome: "问题继续，学生更烦躁。", tone: "neglect" }
    ]},
    { id: "E108", semesterRange: [1], category: "学期事件", title: "新生第一次考试焦虑", text: "学生担心挂科，凌晨还在发消息问怎么办。", choices: [
      { label: "教他调整复习节奏", outcome: "方法更有效，但学生仍很紧张。", tone: "bold" },
      { label: "让他先睡一觉", outcome: "精力恢复，但焦虑没有解决。", tone: "safe" },
      { label: "转发学习资料", outcome: "有帮助，但缺少针对性。", tone: "hard" }
    ]},
    { id: "E109", semesterRange: [1], category: "学期事件", title: "新生宿舍养宠物", text: "学生在宿舍偷偷养仓鼠，被室友投诉。", choices: [
      { label: "讲清宿舍规定并帮找安置", outcome: "规则和人情兼顾，但处理较麻烦。", tone: "bold" },
      { label: "直接要求送走", outcome: "规则清楚，但学生失落。", tone: "hard" },
      { label: "让室友协商", outcome: "学生自治，但可能激化矛盾。", tone: "neglect" }
    ]},
    { id: "E110", semesterRange: [1], category: "学期事件", title: "新生被要求办卡", text: "学生说校外人员进宿舍推销电话卡。", choices: [
      { label: "报告保卫处", outcome: "安全流程启动，但学生怕麻烦。", tone: "safe" },
      { label: "先了解是否受骗", outcome: "信息更准确，但可能耽误处理。", tone: "bold" },
      { label: "让学生不要理会", outcome: "暂时避开，但风险仍在。", tone: "neglect" }
    ]},
    { id: "E111", semesterRange: [2], category: "学期事件", title: "转专业后适应困难", text: "学生成功转专业，但新班级融入很慢。", choices: [
      { label: "安排同学带他熟悉", outcome: "融入加快，但可能依赖别人。", tone: "safe" },
      { label: "单独跟进适应情况", outcome: "你更了解他，但耗时较多。", tone: "bold" },
      { label: "让他自己调整", outcome: "锻炼独立，但可能更孤立。", tone: "hard" }
    ]},
    { id: "E112", semesterRange: [2], category: "学期事件", title: "学生和父母争吵", text: "学生因为专业选择问题和父母大吵一架。", choices: [
      { label: "先听学生情绪", outcome: "学生被理解，但家庭问题还在。", tone: "bold" },
      { label: "建议家庭沟通", outcome: "可能改善，但学生不愿面对。", tone: "safe" },
      { label: "联系家长", outcome: "家长了解情况，但学生更抵触。", tone: "hard" }
    ]},
    { id: "E113", semesterRange: [2], category: "学期事件", title: "学生沉迷短视频", text: "学生刷视频到凌晨，白天经常迟到。", choices: [
      { label: "了解背后压力", outcome: "可能找到原因，但行为仍要调整。", tone: "bold" },
      { label: "制定作息计划", outcome: "行为有约束，但容易反复。", tone: "safe" },
      { label: "让室友监督", outcome: "朋辈督促，但关系可能变味。", tone: "hard" }
    ]},
    { id: "E114", semesterRange: [2], category: "学期事件", title: "学生想休学创业", text: "学生说想休学去做自媒体。", choices: [
      { label: "帮他做风险评估", outcome: "决定更理性，但学生觉得被泼冷水。", tone: "safe" },
      { label: "支持他先试一学期", outcome: "学生有空间，但学业风险增加。", tone: "bold" },
      { label: "联系家长", outcome: "家庭介入，但可能激化矛盾。", tone: "hard" }
    ]},
    { id: "E115", semesterRange: [2], category: "学期事件", title: "学生和室友冷战", text: "两个学生因为一件小事已经一周不说话。", choices: [
      { label: "安排一次沟通", outcome: "问题有出口，但双方仍有情绪。", tone: "safe" },
      { label: "分别谈话", outcome: "信息更全面，但耗时。", tone: "bold" },
      { label: "暂时不管", outcome: "可能自行缓和，也可能继续恶化。", tone: "neglect" }
    ]},
    { id: "E116", semesterRange: [2], category: "学期事件", title: "学生家长突然到校", text: "家长没提前说就来到学校，要求见你。", choices: [
      { label: "优先接待家长", outcome: "家长满意，但你的安排被打乱。", tone: "safe" },
      { label: "请学生一起沟通", outcome: "信息更完整，但学生压力大。", tone: "bold" },
      { label: "请家长改约时间", outcome: "边界清楚，但家长不满。", tone: "hard" }
    ]},
    { id: "E117", semesterRange: [2], category: "学期事件", title: "学生获得奖学金", text: "学生拿到奖学金后想请全班喝奶茶。", choices: [
      { label: "鼓励他理性使用", outcome: "学生学会规划，但少了一点庆祝。", tone: "safe" },
      { label: "支持他分享", outcome: "班级关系升温，但花销增加。", tone: "bold" },
      { label: "提醒他先存起来", outcome: "财务稳妥，但学生觉得你扫兴。", tone: "hard" }
    ]},
    { id: "E118", semesterRange: [2], category: "学期事件", title: "学生晚归被登记", text: "学生因为社团活动晚归，被宿管登记。", choices: [
      { label: "了解情况后按规定处理", outcome: "规则清楚，但学生有些委屈。", tone: "hard" },
      { label: "帮他说明特殊情况", outcome: "学生感激，但流程可能被质疑。", tone: "safe" },
      { label: "让学生自己解释", outcome: "锻炼沟通，但结果不确定。", tone: "bold" }
    ]},
    { id: "E119", semesterRange: [3], category: "学期事件", title: "学生竞赛队友退出", text: "比赛项目核心成员突然退出，团队很受打击。", choices: [
      { label: "先稳定团队情绪", outcome: "大家愿意继续，但信心受损。", tone: "bold" },
      { label: "寻找替补", outcome: "项目继续，但磨合成本高。", tone: "safe" },
      { label: "建议放弃比赛", outcome: "压力降低，但学生很遗憾。", tone: "hard" }
    ]},
    { id: "E120", semesterRange: [3], category: "学期事件", title: "学生干部压力大", text: "班长说事情太多，想辞去职务。", choices: [
      { label: "帮他分担任务", outcome: "压力缓解，但你要投入更多精力。", tone: "safe" },
      { label: "鼓励他继续坚持", outcome: "他留任了，但压力仍在。", tone: "hard" },
      { label: "尊重他的决定", outcome: "学生轻松了，但班级事务需要重新安排。", tone: "bold" }
    ]},
    { id: "E121", semesterRange: [3], category: "学期事件", title: "学生开始准备考研", text: "学生从大二就焦虑考研，担心起步太晚。", choices: [
      { label: "帮他做长期规划", outcome: "节奏更清楚，但焦虑仍在。", tone: "bold" },
      { label: "建议先抓好当前学业", outcome: "基础更稳，但学生觉得不够。", tone: "safe" },
      { label: "让他别想太远", outcome: "暂时放松，但问题被延后。", tone: "neglect" }
    ]},
    { id: "E122", semesterRange: [3], category: "学期事件", title: "学生和老师发生冲突", text: "学生认为任课老师评分不公，在群里抱怨。", choices: [
      { label: "先了解情况", outcome: "避免误判，但需要时间。", tone: "safe" },
      { label: "和老师沟通", outcome: "信息更全面，但学生可能觉得被压。", tone: "bold" },
      { label: "让学生按流程申诉", outcome: "程序清楚，但过程较长。", tone: "hard" }
    ]},
    { id: "E123", semesterRange: [3], category: "学期事件", title: "学生频繁请假", text: "学生这个月已经请了很多次假，理由都不明确。", choices: [
      { label: "约他谈话", outcome: "可能发现真实问题，但学生戒备。", tone: "bold" },
      { label: "严格考勤", outcome: "行为被约束，但关系下降。", tone: "hard" },
      { label: "先和室友了解", outcome: "信息更多，但可能被学生视为打探。", tone: "safe" }
    ]},
    { id: "E124", semesterRange: [3], category: "学期事件", title: "学生创业项目缺钱", text: "学生的创业项目需要一笔启动资金。", choices: [
      { label: "帮他找学校资源", outcome: "项目有支持，但流程较长。", tone: "bold" },
      { label: "建议缩小规模", outcome: "风险降低，但学生不甘心。", tone: "safe" },
      { label: "提醒他不要借贷", outcome: "避免风险，但项目可能停滞。", tone: "hard" }
    ]},
    { id: "E125", semesterRange: [3], category: "学期事件", title: "学生沉迷游戏", text: "学生经常通宵打游戏，成绩开始下滑。", choices: [
      { label: "了解逃避原因", outcome: "可能找到情绪根源。", tone: "bold" },
      { label: "制定作息约定", outcome: "行为有约束，但容易反复。", tone: "safe" },
      { label: "联系家长", outcome: "家庭介入，但学生更抵触。", tone: "hard" }
    ]},
    { id: "E126", semesterRange: [3], category: "学期事件", title: "学生获得竞赛奖项", text: "学生拿了省级奖项，但开始有些飘。", choices: [
      { label: "肯定成绩并提醒沉淀", outcome: "学生更清醒，但可能觉得被扫兴。", tone: "safe" },
      { label: "帮他继续冲刺国赛", outcome: "目标更高，但压力也更大。", tone: "bold" },
      { label: "先不管他", outcome: "学生开心，但可能忽视学业。", tone: "neglect" }
    ]},
    { id: "E127", semesterRange: [4], category: "学期事件", title: "实习单位加班严重", text: "学生说实习每天加班到很晚，身体吃不消。", choices: [
      { label: "帮他评估实习价值", outcome: "学生更清楚选择，但压力仍在。", tone: "safe" },
      { label: "联系企业沟通", outcome: "可能改善，但学生怕影响评价。", tone: "bold" },
      { label: "建议他坚持", outcome: "实习继续，但健康风险上升。", tone: "hard" }
    ]},
    { id: "E128", semesterRange: [4], category: "学期事件", title: "学生暑期实践被骗", text: "学生暑期实践项目突然要求交额外费用。", choices: [
      { label: "核实项目真实性", outcome: "可能避免更大损失。", tone: "bold" },
      { label: "联系学校实践部门", outcome: "流程正规，但处理较慢。", tone: "safe" },
      { label: "让学生自己判断", outcome: "学生可能继续转钱。", tone: "neglect" }
    ]},
    { id: "E129", semesterRange: [4], category: "学期事件", title: "学生评奖材料造假", text: "你发现学生提交的评奖材料有夸大。", choices: [
      { label: "要求修改", outcome: "原则清楚，但学生受挫。", tone: "hard" },
      { label: "先谈话了解原因", outcome: "可能发现压力，但材料仍需处理。", tone: "bold" },
      { label: "睁一只眼", outcome: "暂时没事，但风险埋下。", tone: "neglect" }
    ]},
    { id: "E130", semesterRange: [4], category: "学期事件", title: "学生实习与家庭冲突", text: "家里想让学生回家帮忙，学生想去外地实习。", choices: [
      { label: "先听学生想法", outcome: "学生被理解，但家庭矛盾仍在。", tone: "bold" },
      { label: "和家长沟通", outcome: "家庭可能松动，但学生觉得被安排。", tone: "safe" },
      { label: "建议折中", outcome: "两边都能接受一点，但都不完全满意。", tone: "hard" }
    ]},
    { id: "E131", semesterRange: [4], category: "学期事件", title: "学生经济困难加剧", text: "学生家里突发困难，生活费出现问题。", choices: [
      { label: "帮助申请临时补助", outcome: "经济压力缓解，但流程较长。", tone: "safe" },
      { label: "推荐校内勤工助学", outcome: "收入稳定，但学习时间减少。", tone: "bold" },
      { label: "联系家长", outcome: "家庭知情，但学生难堪。", tone: "hard" }
    ]},
    { id: "E132", semesterRange: [4], category: "学期事件", title: "学生暑期去向不明", text: "暑期学生没有报备去向，电话也联系不上。", choices: [
      { label: "立即核实安全", outcome: "你优先确认安全。", tone: "bold" },
      { label: "联系家长", outcome: "家庭知情，但可能更紧张。", tone: "safe" },
      { label: "继续等待", outcome: "避免惊动，但风险上升。", tone: "neglect" }
    ]},
    { id: "E133", semesterRange: [4], category: "学期事件", title: "学生实习转正犹豫", text: "学生对实习单位不满意，但转正机会难得。", choices: [
      { label: "帮他分析职业方向", outcome: "选择更清楚，但压力仍在。", tone: "bold" },
      { label: "建议先接受转正", outcome: "稳妥，但可能错失其他机会。", tone: "safe" },
      { label: "尊重他拒绝", outcome: "学生轻松，但未来更不确定。", tone: "hard" }
    ]},
    { id: "E134", semesterRange: [4], category: "学期事件", title: "学生社会实践报告抄袭", text: "学生实践报告被查出大量抄袭。", choices: [
      { label: "要求重写", outcome: "规则清楚，但学生很抵触。", tone: "hard" },
      { label: "谈话了解原因", outcome: "可能发现问题，但结果仍需处理。", tone: "bold" },
      { label: "扣分处理", outcome: "程序完成，但关系下降。", tone: "neglect" }
    ]},
    { id: "E135", semesterRange: [5], category: "学期事件", title: "学生考研目标过高", text: "学生想考顶尖名校，但基础差距很大。", choices: [
      { label: "帮他把目标拆解", outcome: "路径更清晰，但压力仍在。", tone: "bold" },
      { label: "建议调整志愿", outcome: "风险降低，但学生不甘心。", tone: "safe" },
      { label: "尊重他的选择", outcome: "学生有动力，但失败风险高。", tone: "hard" }
    ]},
    { id: "E136", semesterRange: [5], category: "学期事件", title: "学生就业方向摇摆", text: "学生一会想考公，一会想进企业，反复修改简历。", choices: [
      { label: "做职业测评", outcome: "方向更客观，但需要时间。", tone: "bold" },
      { label: "推荐实习体验", outcome: "真实场景帮助判断，但可能更焦虑。", tone: "safe" },
      { label: "让他先专心一个", outcome: "行动聚焦，但学生仍犹豫。", tone: "hard" }
    ]},
    { id: "E137", semesterRange: [5], category: "学期事件", title: "学生想出国但语言不足", text: "学生计划出国，但语言成绩一直没考出来。", choices: [
      { label: "帮他制定备考计划", outcome: "行动更清晰，但压力增加。", tone: "bold" },
      { label: "建议延后申请", outcome: "节奏更稳，但学生失落。", tone: "safe" },
      { label: "建议先找工作", outcome: "现实稳妥，但学生不甘心。", tone: "hard" }
    ]},
    { id: "E138", semesterRange: [5], category: "学期事件", title: "学生家庭经济压力", text: "家里希望学生早点工作，但学生想继续读书。", choices: [
      { label: "帮学生算清成本", outcome: "决定更现实，但情绪复杂。", tone: "safe" },
      { label: "支持继续深造", outcome: "学生有动力，但家庭压力仍在。", tone: "bold" },
      { label: "联系家长沟通", outcome: "家庭可能理解，但学生觉得被替代表达。", tone: "hard" }
    ]},
    { id: "E139", semesterRange: [5], category: "学期事件", title: "学生考研复习崩溃", text: "学生说专业课太多，复习完全跟不上。", choices: [
      { label: "帮他把任务重新排序", outcome: "压力降低，但时间仍紧。", tone: "bold" },
      { label: "建议减少学生工作", outcome: "复习时间增加，但班级事务需要调整。", tone: "safe" },
      { label: "鼓励他再坚持", outcome: "短期有效，但风险累积。", tone: "hard" }
    ]},
    { id: "E140", semesterRange: [5], category: "学期事件", title: "学生家长要求考公", text: "家长坚持让孩子考公，学生本人不愿意。", choices: [
      { label: "先听学生想法", outcome: "学生被尊重，但家庭矛盾仍在。", tone: "bold" },
      { label: "和家长沟通", outcome: "家长可能松动，但学生压力仍在。", tone: "safe" },
      { label: "建议先考一次", outcome: "两边都能接受，但学生不情愿。", tone: "hard" }
    ]},
    { id: "E141", semesterRange: [5], category: "学期事件", title: "学生未来规划空白", text: "学生说自己从来没认真想过毕业以后做什么。", choices: [
      { label: "安排职业咨询", outcome: "专业支持介入，但需要时间。", tone: "safe" },
      { label: "陪他做兴趣梳理", outcome: "学生更信任你，但过程很长。", tone: "bold" },
      { label: "建议先做好眼前", outcome: "暂时缓解，但问题没有解决。", tone: "neglect" }
    ]},
    { id: "E142", semesterRange: [5], category: "学期事件", title: "学生暑期实习被鸽", text: "原本确定的实习岗位临时取消。", choices: [
      { label: "帮他找替代岗位", outcome: "问题解决，但选择较少。", tone: "bold" },
      { label: "建议先回学校充电", outcome: "压力降低，但实践经历受影响。", tone: "safe" },
      { label: "让他自己处理", outcome: "学生焦虑，可能错过机会。", tone: "neglect" }
    ]},
    { id: "E143", semesterRange: [6], category: "学期事件", title: "学生秋招信息混乱", text: "学生同时投了很多岗位，分不清重点。", choices: [
      { label: "帮他梳理优先级", outcome: "方向更清楚，但需要时间。", tone: "bold" },
      { label: "建议集中目标", outcome: "行动聚焦，但学生怕错过。", tone: "safe" },
      { label: "让他多投", outcome: "机会更多，但精力分散。", tone: "hard" }
    ]},
    { id: "E144", semesterRange: [6], category: "学期事件", title: "学生面试表现差", text: "学生面试后很沮丧，说一定没戏。", choices: [
      { label: "帮他复盘面试", outcome: "问题更具体，但情绪仍低。", tone: "bold" },
      { label: "安慰他还有机会", outcome: "情绪缓解，但方法没改进。", tone: "safe" },
      { label: "让他自己总结", outcome: "锻炼反思，但学生可能更失落。", tone: "hard" }
    ]},
    { id: "E145", semesterRange: [6], category: "学期事件", title: "学生拿到多个 offer", text: "学生同时收到几个 offer，反而不知道选哪个。", choices: [
      { label: "帮他比较利弊", outcome: "选择更清晰，但决定仍难。", tone: "bold" },
      { label: "建议选更稳的", outcome: "风险降低，但可能错过成长机会。", tone: "safe" },
      { label: "让他自己决定", outcome: "尊重自主，但学生更纠结。", tone: "hard" }
    ]},
    { id: "E146", semesterRange: [6], category: "学期事件", title: "学生实习被压榨", text: "学生实习中经常被安排无关杂事。", choices: [
      { label: "帮他明确实习目标", outcome: "学生知道该争取什么。", tone: "bold" },
      { label: "和企业沟通", outcome: "可能改善，但学生怕影响转正。", tone: "safe" },
      { label: "建议继续忍", outcome: "实习稳定，但学生越来越累。", tone: "hard" }
    ]},
    { id: "E147", semesterRange: [6], category: "学期事件", title: "学生签约后又犹豫", text: "学生签约后看到同学有更好机会，开始后悔。", choices: [
      { label: "帮他分析毁约成本", outcome: "决定更理性，但情绪仍在。", tone: "safe" },
      { label: "建议先稳定下来", outcome: "风险降低，但学生不甘心。", tone: "hard" },
      { label: "尊重他的选择", outcome: "学生有自主权，但可能承担后果。", tone: "bold" }
    ]},
    { id: "E148", semesterRange: [6], category: "学期事件", title: "学生毕业实习缺材料", text: "学生实习快结束，才发现缺少很多证明材料。", choices: [
      { label: "帮他梳理补办流程", outcome: "问题清楚，但很耗时。", tone: "safe" },
      { label: "联系实习单位", outcome: "效率提高，但学生参与度下降。", tone: "bold" },
      { label: "让他自己处理", outcome: "锻炼独立，但可能误事。", tone: "hard" }
    ]},
    { id: "E149", semesterRange: [6], category: "学期事件", title: "学生就业被骗押金", text: "学生找工作时被要求先交押金。", choices: [
      { label: "提醒风险并核实", outcome: "可能避免损失。", tone: "bold" },
      { label: "联系家长", outcome: "家庭知情，但学生难堪。", tone: "safe" },
      { label: "让他自己判断", outcome: "学生可能继续交钱。", tone: "neglect" }
    ]},
    { id: "E150", semesterRange: [6], category: "学期事件", title: "学生毕业实习与考研冲突", text: "学生一边实习一边考研，精力严重不足。", choices: [
      { label: "帮他重新分配时间", outcome: "计划更合理，但两边都紧张。", tone: "bold" },
      { label: "建议优先考研", outcome: "目标更集中，但实习可能受影响。", tone: "safe" },
      { label: "建议优先实习", outcome: "就业更稳，但考研风险上升。", tone: "hard" }
    ]},
    { id: "E151", semesterRange: [7], category: "学期事件", title: "学生考研冲刺失眠", text: "学生连续几天睡不着，白天完全看不进书。", choices: [
      { label: "先处理睡眠问题", outcome: "状态恢复一点，但复习时间减少。", tone: "bold" },
      { label: "建议去校医院", outcome: "专业帮助，但学生觉得耽误时间。", tone: "safe" },
      { label: "鼓励他继续刷题", outcome: "短期推进，但身体风险上升。", tone: "hard" }
    ]},
    { id: "E152", semesterRange: [7], category: "学期事件", title: "学生秋招错过投递", text: "学生因为考研错过很多秋招岗位。", choices: [
      { label: "帮他关注春招", outcome: "还有机会，但时间紧张。", tone: "safe" },
      { label: "建议先稳住考研", outcome: "目标集中，但就业风险上升。", tone: "bold" },
      { label: "让他自己决定", outcome: "学生更焦虑。", tone: "neglect" }
    ]},
    { id: "E153", semesterRange: [7], category: "学期事件", title: "学生论文导师联系不上", text: "学生说导师很久没回消息，论文无法推进。", choices: [
      { label: "帮学生联系导师", outcome: "可能推动，但学生缺乏主动性。", tone: "bold" },
      { label: "建议学生再等等", outcome: "关系稳妥，但进度停滞。", tone: "safe" },
      { label: "让学生继续催", outcome: "锻炼沟通，但学生压力大。", tone: "hard" }
    ]},
    { id: "E154", semesterRange: [7], category: "学期事件", title: "学生面试和考试撞车", text: "学生同一天有重要面试和课程考试。", choices: [
      { label: "帮他和老师协调", outcome: "可能调整，但流程慢。", tone: "bold" },
      { label: "建议优先考试", outcome: "学业稳定，但可能失去工作机会。", tone: "safe" },
      { label: "建议优先面试", outcome: "就业机会保住，但考试风险增加。", tone: "hard" }
    ]},
    { id: "E155", semesterRange: [7], category: "学期事件", title: "学生考研想弃考", text: "学生说准备太差，不想去考场了。", choices: [
      { label: "先陪他缓解情绪", outcome: "学生可能恢复，但决定仍难。", tone: "bold" },
      { label: "帮他降低目标", outcome: "压力减轻，但学生不甘心。", tone: "safe" },
      { label: "尊重放弃", outcome: "学生轻松，但长期遗憾。", tone: "hard" }
    ]},
    { id: "E156", semesterRange: [7], category: "学期事件", title: "学生论文数据丢失", text: "学生电脑损坏，论文数据没有备份。", choices: [
      { label: "帮他找技术恢复", outcome: "可能找回，但等待时间长。", tone: "safe" },
      { label: "建议重新采集", outcome: "可行，但进度大幅后退。", tone: "bold" },
      { label: "让他自己处理", outcome: "学生崩溃，风险上升。", tone: "neglect" }
    ]},
    { id: "E157", semesterRange: [7], category: "学期事件", title: "学生求职被歧视", text: "学生在面试中遇到不合理的家庭和性别提问。", choices: [
      { label: "支持学生维权", outcome: "边界清楚，但过程复杂。", tone: "bold" },
      { label: "帮他调整心态", outcome: "情绪缓解，但问题没有解决。", tone: "safe" },
      { label: "建议换一家公司", outcome: "风险降低，但可能回避问题。", tone: "hard" }
    ]},
    { id: "E158", semesterRange: [7], category: "学期事件", title: "学生毕业焦虑爆发", text: "学生同时担心论文、工作和未来，情绪接近崩溃。", choices: [
      { label: "启动心理支持", outcome: "专业帮助及时，但学生需要适应。", tone: "bold" },
      { label: "帮他拆解任务", outcome: "压力下降，但情绪仍需处理。", tone: "safe" },
      { label: "让他先休息几天", outcome: "状态恢复，但进度更紧。", tone: "hard" }
    ]},
    { id: "E159", semesterRange: [8], category: "学期事件", title: "学生毕业照缺席", text: "学生因为工作面试，可能错过毕业照。", choices: [
      { label: "帮他协调时间", outcome: "尽量兼顾，但两边都很紧。", tone: "bold" },
      { label: "建议优先面试", outcome: "就业重要，但留下遗憾。", tone: "safe" },
      { label: "建议回来拍照", outcome: "仪式感保住，但工作机会可能受影响。", tone: "hard" }
    ]},
    { id: "E160", semesterRange: [8], category: "学期事件", title: "学生毕业材料缺失", text: "学生毕业材料缺少一项关键证明。", choices: [
      { label: "帮他联系补办", outcome: "问题可能解决，但流程慢。", tone: "safe" },
      { label: "让他自己跟进", outcome: "锻炼独立，但可能误了时间。", tone: "hard" },
      { label: "请同事协助", outcome: "效率提高，但欠人情。", tone: "bold" }
    ]},
    { id: "E161", semesterRange: [8], category: "学期事件", title: "学生突然说不想毕业", text: "学生说想延期毕业，因为还没准备好进入社会。", choices: [
      { label: "认真听他的恐惧", outcome: "学生被理解，但决定仍要面对。", tone: "bold" },
      { label: "分析延期成本", outcome: "更现实，但学生更焦虑。", tone: "safe" },
      { label: "联系家长", outcome: "家庭介入，但可能激化矛盾。", tone: "hard" }
    ]},
    { id: "E162", semesterRange: [8], category: "学期事件", title: "学生毕业聚餐冲突", text: "毕业聚餐上学生因为费用分摊问题争吵。", choices: [
      { label: "先让大家冷静", outcome: "场面控制住，但关系需要修复。", tone: "safe" },
      { label: "主动协调费用", outcome: "问题解决，但你要额外操心。", tone: "bold" },
      { label: "让学生自行解决", outcome: "可能继续争吵。", tone: "neglect" }
    ]},
    { id: "E163", semesterRange: [8], category: "学期事件", title: "学生毕业前突然失联", text: "学生在离校前几天突然联系不上。", choices: [
      { label: "立即启动寻找", outcome: "安全优先，但影响较大。", tone: "bold" },
      { label: "先联系家长", outcome: "家庭知情，但可能更紧张。", tone: "safe" },
      { label: "继续等待", outcome: "避免惊动，但风险上升。", tone: "neglect" }
    ]},
    { id: "E164", semesterRange: [8], category: "学期事件", title: "学生送别礼物", text: "学生离校前送给你一份亲手做的小礼物。", choices: [
      { label: "认真收下并回应", outcome: "这段关系有了温暖的结尾。", tone: "bold" },
      { label: "提醒不必破费", outcome: "你为对方考虑，但少了情感回应。", tone: "safe" },
      { label: "收下后简单道谢", outcome: "礼貌但克制，学生可能略失落。", tone: "hard" }
    ]},
    { id: "E165", semesterRange: [8], category: "学期事件", title: "学生毕业去向不明", text: "学生离校前仍没有确定工作或升学去向。", choices: [
      { label: "做最后一次支持", outcome: "你帮到最后一刻，但结果仍不确定。", tone: "bold" },
      { label: "推荐校友资源", outcome: "多一条路，但学生需要主动。", tone: "safe" },
      { label: "尊重他慢慢来", outcome: "压力降低，但毕业风险仍在。", tone: "hard" }
    ]},
    { id: "E166", semesterRange: [8], category: "学期事件", title: "学生离校最后一晚", text: "学生在宿舍楼下遇到你，说想再聊几句。", choices: [
      { label: "陪他聊到说完", outcome: "你给这段大学关系一个完整的句号。", tone: "bold" },
      { label: "简单叮嘱几句", outcome: "你仍像辅导员，但少了告别。", tone: "safe" },
      { label: "提醒早点休息", outcome: "关心身体，但错过情感交流。", tone: "hard" }
    ]}
  ];

  const slackItems = [
    { id: "F01", name: "楼梯间刷手机", text: "躲在楼梯间刷 15 分钟手机。", risk: 0, energy: 10, mental: 8, health: 0 },
    { id: "F02", name: "食堂冰饮", text: "去食堂买一杯冰饮，慢慢喝。", risk: 0, energy: 8, mental: 7, health: 1, savings: -12 },
    { id: "F03", name: "窗边看树", text: "在办公室窗边看树。", risk: 0, energy: 7, mental: 8, health: 2 },
    { id: "F04", name: "假装打印", text: "借口去打印材料，绕操场走一圈。", risk: 1, energy: 8, mental: 8, health: 3 },
    { id: "F05", name: "和同事吐槽", text: "和关系好的同事吐槽五分钟。", risk: 2, energy: 8, mental: 10, health: 0, colleague: 3 },
    { id: "F06", name: "查资料看新闻", text: "用电脑查资料的名义看两篇无关新闻。", risk: 2, energy: 7, mental: 8, health: 0 },
    { id: "F07", name: "戴耳机听歌", text: "戴上耳机听一首歌。", risk: 1, energy: 8, mental: 9, health: 1 },
    { id: "F08", name: "补十分钟午觉", text: "偷偷补一个 10 分钟午觉。", risk: 3, energy: 14, mental: 8, health: 3 }
  ];

  const names = [
    "陈屿", "林知夏", "周以宁", "许星遥", "沈听澜", "陆清和",
    "苏念", "江望", "顾南乔", "宋时雨", "程一舟", "叶未迟",
    "谢安然", "温言", "夏予安", "方既明", "何书言", "秦朗",
    "赵青禾", "韩沐", "唐语冰", "白榆", "孟临川", "余安"
  ];

  const traits = [
    "表面开朗", "家庭负债", "考研焦虑", "恋爱困扰", "拖延成性",
    "社团骨干", "宿舍边缘人", "经济困难", "学业自卑", "完美主义",
    "经常失眠", "实习压力", "转专业犹豫", "社交回避", "竞赛狂热"
  ];

  const hometowns = [
    "南方小城", "北方工业镇", "沿海县城", "山城老街", "省城新区",
    "江边小城", "西北小城", "铁路沿线小镇", "海岛县", "盆地县城"
  ];

  const familyFragments = [
    "家里对他期待很高，也很少直接表达担心。",
    "父母工作很忙，很多事情习惯自己扛。",
    "家里还有一个弟弟妹妹，他总觉得自己要多承担一点。",
    "父亲性格严厉，母亲更愿意在电话里反复叮嘱。",
    "家庭关系不算亲密，但彼此都希望对方过得好。"
  ];

  const hobbyFragments = [
    "他喜欢在晚上跑步，说那样能暂时不想事情。",
    "他会拍一些没什么人看的照片，存在手机里。",
    "他偶尔去图书馆，不一定学习，只是喜欢那里安静。",
    "他喜欢听老歌，歌单里藏着很多没说过的话。",
    "他擅长做手工，宿舍桌上堆着一些半成品。"
  ];

  const worryFragments = [
    "最近他总担心自己让家里人失望。",
    "他不太确定现在读的专业是不是真的适合自己。",
    "他害怕自己表现得太普通，又害怕被人注意到。",
    "他习惯笑着说没事，但睡眠一直不太好。",
    "他对未来有些迷茫，但不好意思反复问别人。"
  ];

  const introSchools = ["985", "211", "双一流", "民办本科"];

  const existingEventMemoryMeta = {    E11: { studentScope: "single", choiceTags: [["学生", "了解原因"], ["学生", "信息"], ["学生", "家长介入"]] },
    E12: { studentScope: "single", choiceTags: [["共情", "支持"], ["尊重自主"], ["学业支持"]] },
    E13: { studentScope: "single", choiceTags: [["及时介入", "支持"], ["朋辈支持"], ["专业介入"]] },
    E14: { studentScope: "pair", choiceTags: [["共情", "边界"], ["规则优先"], ["隔离冲突"]] },
    E15: { studentScope: "single", choiceTags: [["及时介入", "保护"], ["专业流程"], ["家长介入"]] },
    E16: { studentScope: "single", choiceTags: [["尊重自主"], ["家长沟通"], ["折中"]] },
    E17: { studentScope: "single", choiceTags: [["规则优先"], ["忽视"], ["支持", "长期发展"]] },
    E18: { studentScope: "single", choiceTags: [["规则优先"], ["共情"], ["朋辈介入"]] },
    E19: { studentScope: "single", choiceTags: [["核实", "边界"], ["规则优先"], ["上报"]] },
    E20: { studentScope: "single", choiceTags: [["保护", "共情"], ["家长介入"], ["朋辈支持"]] },
    E21: { studentScope: "single", choiceTags: [["及时介入", "保护"], ["朋辈支持"], ["专业流程"]] },
    E22: { studentScope: "single", choiceTags: [["家长沟通"], ["及时介入"], ["边界"]] },
    E23: { studentScope: "single", choiceTags: [["经济支持"], ["尊重自主"], ["支持休学"]] },
    E24: { studentScope: "single", choiceTags: [["边界", "规则优先"], ["规则优先"], ["模糊边界"]] },
    E25: { studentScope: "single", choiceTags: [["规则优先"], ["宽松"], ["共情"]] },
    E26: { studentScope: "single", choiceTags: [["规则优先"], ["公开", "规则"], ["隐私保护"]] },
    E27: { studentScope: "single", choiceTags: [["保护", "支持"], ["家长介入"], ["专业流程"]] },
    E28: { studentScope: "single", choiceTags: [["核实", "公平"], ["隐私保护"], ["程序公平"]] },
    E61: { studentScope: "single", choiceTags: [["保护", "及时介入"], ["家长介入"], ["情绪安抚"]] },
    E62: { studentScope: "pair", choiceTags: [["共情", "边界"], ["规则优先"], ["隔离冲突"]] },
    E63: { studentScope: "single", choiceTags: [["及时介入", "保护"], ["专业支持"], ["朋辈支持"]] },
    E64: { studentScope: "single", choiceTags: [["及时介入", "保护"], ["专业流程"], ["朋辈支持"]] },
    E65: { studentScope: "single", choiceTags: [["家长介入", "保护"], ["及时介入"], ["等待"]] },
    E66: { studentScope: "single", choiceTags: [["保护", "及时介入"], ["共情"], ["忽视"]] },
    E67: { studentScope: "single", choiceTags: [["共情", "支持"], ["专业介入"], ["规则优先"]] },
    E68: { studentScope: "single", choiceTags: [["及时介入", "保护"], ["专业流程"], ["朋辈支持"]] },
    E69: { studentScope: "single", choiceTags: [["了解原因"], ["支持", "共情"], ["规则优先"]] },
    E70: { studentScope: "single", choiceTags: [["保护", "及时介入"], ["共情", "边界"], ["家长介入"]] }
  };

  const developmentProjectScenarios = {
    DP01: [
      { name: "高校辅导员专项职称评审", resultMap: { S: "顺利通过并获评优秀", A: "顺利通过", B: "通过但材料仍需完善", C: "未通过，需下一年重新申报" } },
      { name: "思政系列职称申报", resultMap: { S: "获评优秀并作为典型展示", A: "通过评审", B: "基本通过", C: "未能通过" } },
      { name: "某机构辅导员高级研修证书", quality: "低", resultMap: { S: "拿到一张看起来高级但学校不认的证书", A: "拿到一张没用的证书", B: "只拿到培训证明", C: "证书最后没发" } },
      { name: "某社会机构职称材料包过服务", quality: "未知", resultMap: { S: "材料完成但被学校质疑来源", A: "材料勉强可用", B: "部分材料无效", C: "被骗了一笔钱" } }
    ],
    DP02: [
      { name: "在职硕士课程学习", resultMap: { S: "课程与论文均获优秀", A: "顺利结课", B: "完成大部分课程", C: "进度滞后" } },
      { name: "博士申请准备", resultMap: { S: "获得导师明确支持", A: "申请材料完成度较高", B: "申请方向基本明确", C: "申请准备不足" } }
    ],
    DP03: [
      { name: "《高校辅导员》期刊投稿", resultMap: { S: "论文被核心期刊录用", A: "论文被普通期刊录用", B: "收到修改意见", C: "投稿未通过" } },
      { name: "全国思政工作论文征集", resultMap: { S: "获一等奖", A: "获二等奖", B: "获三等奖", C: "未获奖" } },
      { name: "论文中介代发服务", quality: "未知", resultMap: { S: "论文发出但学校不认可", A: "论文发表后被查重质疑", B: "只拿到一个录用通知", C: "被骗取高额费用" } },
      { name: "国际会议快速录用", quality: "低", resultMap: { S: "会议录用但被认定为水会", A: "拿到参会证明", B: "只收到电子证书", C: "会议临时取消" } }
    ],
    DP04: [
      { name: "全国大学生职业规划大赛", resultMap: { S: "省级一等奖，进入国赛", A: "省级二等奖", B: "省级三等奖", C: "未获奖" } },
      { name: "互联网+大学生创新创业大赛", resultMap: { S: "省赛金奖", A: "省赛银奖", B: "省赛铜奖", C: "未获奖" } },
      { name: "挑战杯课外学术科技作品竞赛", resultMap: { S: "省赛特等奖", A: "省赛一等奖", B: "省赛二等奖", C: "未获奖" } },
      { name: "全国大学生校园锦鲤大赛", quality: "低", resultMap: { S: "成为校园锦鲤", A: "获得人气奖", B: "拿到参与证书", C: "没进决赛" } },
      { name: "校园奶茶商业计划书大赛", quality: "低", resultMap: { S: "获得赞助商大奖", A: "获得最佳创意奖", B: "拿到参与奖", C: "没获奖" } },
      { name: "高校辅导员表情包设计大赛", quality: "未知", resultMap: { S: "表情包火遍全校", A: "获得人气奖", B: "只有纪念品", C: "没被选上" } }
    ],
    DP05: [
      { name: "一院一品学生工作品牌项目", resultMap: { S: "获评校级重点品牌", A: "获评校级一般品牌", B: "通过结项", C: "结项未通过" } },
      { name: "辅导员工作室申报", resultMap: { S: "获批省级工作室", A: "获批校级工作室", B: "立项但未完全结项", C: "未能立项" } }
    ],
    DP06: [
      { name: "GCDF全球职业规划师认证", resultMap: { S: "高分通过认证", A: "顺利通过认证", B: "部分模块通过", C: "未能通过认证" } },
      { name: "高校就业指导师培训", resultMap: { S: "获评优秀学员", A: "顺利结业", B: "完成培训但成果一般", C: "未能完成培训" } },
      { name: "某协会职业规划师速成班", quality: "低", resultMap: { S: "拿到一张速成证书", A: "拿到结业证", B: "只拿到听课证明", C: "课程质量很差" } },
      { name: "交钱就发的生涯教练证", quality: "未知", resultMap: { S: "拿到一张没用的教练证", A: "拿到电子证书", B: "证书不被承认", C: "被骗钱后联系不上" } }
    ]
  };


  // ====================================================================
  // 以下三段由 tools/merge-delegated-data.js 生成，请勿手工编辑——
  // 改数据请编辑对应内容后重新运行该脚本，或直接修改本段并保持格式一致。
  // ====================================================================

  // 事件选择效果覆写表（P1-1 数据驱动）：
  // 优先级——数据表显式 effects > 下面的覆写表 > tone/category 推导值。
  // 数组允许比 choices 短，或元素为 null，表示该选项沿用 tone 推导值。
  const eventChoiceEffects = {
    "E61": [{"energy":-6,"mental":-4,"health":-1,"risk":-14,"trust":5,"leadership":2,"savings":-200}, {"energy":-3,"mental":-3,"risk":-11,"trust":-2,"parent":4,"savings":-100}, {"energy":-1,"mental":-2,"risk":8,"trust":-3,"leadership":-2}],
    "E62": [{"energy":-8,"mental":-5,"health":-1,"risk":-15,"trust":4,"leadership":2,"colleague":1}, {"energy":-5,"mental":-3,"risk":-9,"trust":3,"colleague":2}, {"energy":-2,"mental":-1,"risk":9,"trust":-2,"leadership":-3,"colleague":-2}],
    "E63": [{"energy":-10,"mental":-9,"health":-2,"risk":-20,"trust":6,"leadership":3,"parent":2}, {"energy":-5,"mental":-4,"health":-1,"risk":-13,"trust":-2,"parent":4,"colleague":2,"leadership":1}, {"energy":-2,"mental":-3,"risk":7,"trust":-4,"colleague":-3}],
    "E64": [{"energy":-9,"mental":-7,"health":-1,"risk":-17,"trust":5,"leadership":2,"parent":2,"savings":-100}, {"energy":-4,"mental":-3,"risk":-13,"trust":-3,"leadership":2,"colleague":2}, {"energy":-2,"mental":-3,"risk":11,"trust":-5,"leadership":-2,"colleague":-1}],
    "E65": [{"energy":-8,"mental":-6,"health":-1,"risk":-16,"trust":-1,"parent":5,"leadership":2,"colleague":1}, {"energy":-9,"mental":-8,"health":-2,"risk":-11,"trust":3,"parent":1,"savings":-100}, {"energy":-1,"mental":-2,"risk":6,"trust":-3,"leadership":-2}],
    "E66": [{"energy":-7,"mental":-6,"health":-1,"risk":-16,"trust":6,"leadership":2,"savings":-150}, {"energy":-4,"mental":-4,"risk":-9,"trust":2,"parent":2,"colleague":2}, {"energy":-1,"mental":-2,"risk":12,"trust":-5,"leadership":-2}],
    "E67": [{"energy":-8,"mental":-5,"health":-1,"risk":-15,"trust":5,"leadership":-1,"colleague":-1,"savings":-100}, {"energy":-4,"mental":-2,"risk":-12,"trust":-1,"colleague":2,"leadership":2}, {"energy":-2,"mental":-1,"risk":9,"trust":-3,"leadership":-2}],
    "E68": [{"energy":-8,"mental":-6,"health":-1,"risk":-16,"trust":4,"leadership":2,"colleague":1}, {"energy":-4,"mental":-3,"risk":-13,"trust":-4,"leadership":1,"colleague":2}, {"energy":-1,"mental":-1,"risk":10,"trust":-3,"colleague":-3}],
    "E69": [{"energy":-5,"mental":-5,"risk":-12,"trust":3,"parent":3,"colleague":1}, {"energy":-6,"mental":-4,"health":-1,"risk":-13,"trust":5,"parent":2,"leadership":-2}, {"energy":-2,"mental":-2,"risk":7,"trust":-4,"parent":2,"leadership":-1}],
    "E70": [{"energy":-10,"mental":-11,"health":-2,"risk":-22,"trust":-3,"leadership":3,"parent":2}, {"energy":-6,"mental":-8,"health":-1,"risk":-8,"trust":4,"colleague":-2}, {"energy":-4,"mental":-4,"risk":-14,"trust":-5,"parent":6,"leadership":-2}],
    "M01": [{"energy":6,"mental":8,"health":0,"savings":-60,"leadership":0,"trust":0,"parent":0,"colleague":0,"risk":0,"development":0}, {"energy":-8,"mental":-6,"health":-1,"savings":0,"leadership":3,"trust":0,"parent":0,"colleague":0,"risk":-2,"development":2}, {"energy":5,"mental":12,"health":1,"savings":-120,"leadership":0,"trust":0,"parent":0,"colleague":3,"risk":4,"development":0}],
    "M02": [{"energy":-4,"mental":-2,"health":3,"savings":-220,"leadership":0,"trust":0,"parent":0,"colleague":0,"risk":-2,"development":0}, {"energy":2,"mental":1,"health":-2,"savings":-10,"leadership":-1,"trust":0,"parent":0,"colleague":0,"risk":6,"development":0}, {"energy":-2,"mental":4,"health":2,"savings":-150,"leadership":1,"trust":0,"parent":0,"colleague":3,"risk":-2,"development":0}],
    "M03": [{"energy":-4,"mental":-3,"health":0,"savings":0,"leadership":1,"trust":0,"parent":6,"colleague":0,"risk":-4,"development":0}, {"energy":3,"mental":4,"health":0,"savings":0,"leadership":-3,"trust":-5,"parent":-5,"colleague":0,"risk":6,"development":0}, {"energy":-7,"mental":-2,"health":-1,"savings":-30,"leadership":2,"trust":1,"parent":8,"colleague":0,"risk":-6,"development":1}],
    "M04": [{"energy":-1,"mental":-2,"health":0,"savings":150,"leadership":1,"trust":0,"parent":0,"colleague":0,"risk":0,"development":0}, {"energy":3,"mental":9,"health":1,"savings":-180,"leadership":0,"trust":0,"parent":0,"colleague":0,"risk":3,"development":0}, {"energy":-3,"mental":5,"health":0,"savings":-500,"leadership":0,"trust":0,"parent":0,"colleague":0,"risk":-2,"development":0}],
    "M05": [{"energy":-4,"mental":5,"health":0,"savings":0,"leadership":2,"trust":0,"parent":0,"colleague":0,"risk":-2,"development":2}, {"energy":0,"mental":12,"health":0,"savings":0,"leadership":0,"trust":0,"parent":0,"colleague":4,"risk":2,"development":0}, {"energy":3,"mental":5,"health":-3,"savings":0,"leadership":-2,"trust":0,"parent":0,"colleague":0,"risk":8,"development":0}],
    "M06": [{"energy":1,"mental":6,"health":-1,"savings":0,"leadership":0,"trust":0,"parent":0,"colleague":3,"risk":0,"development":0}, {"energy":-3,"mental":-3,"health":0,"savings":0,"leadership":2,"trust":0,"parent":0,"colleague":-1,"risk":0,"development":3}, {"energy":1,"mental":2,"health":0,"savings":0,"leadership":0,"trust":0,"parent":0,"colleague":-1,"risk":1,"development":0}],
    "M07": [{"energy":9,"mental":6,"health":3,"savings":0,"leadership":-2,"trust":0,"parent":0,"colleague":0,"risk":5,"development":0}, {"energy":-5,"mental":-7,"health":-2,"savings":0,"leadership":3,"trust":0,"parent":0,"colleague":0,"risk":-2,"development":3}, {"energy":2,"mental":9,"health":1,"savings":0,"leadership":0,"trust":0,"parent":0,"colleague":0,"risk":2,"development":0}],
    "M08": [{"energy":-4,"mental":8,"health":0,"savings":0,"leadership":1,"trust":7,"parent":0,"colleague":0,"risk":-3,"development":1}, {"energy":2,"mental":4,"health":0,"savings":0,"leadership":-1,"trust":-3,"parent":0,"colleague":0,"risk":2,"development":0}, {"energy":8,"mental":3,"health":2,"savings":0,"leadership":-2,"trust":-7,"parent":0,"colleague":0,"risk":5,"development":0}],
    "E71": [{"energy":-10,"mental":-3,"health":-1,"savings":-50,"leadership":3,"trust":6,"parent":0,"colleague":0,"risk":-16,"development":1}, null, {"energy":-4,"mental":-2,"health":-4,"savings":0,"leadership":0,"trust":-3,"parent":0,"colleague":0,"risk":9,"development":0}],
    "E73": [null, null, {"energy":1,"mental":-3,"health":0,"savings":0,"leadership":-3,"trust":-4,"parent":0,"colleague":-1,"risk":10,"development":0}],
    "E74": [null, null, {"energy":1,"mental":-2,"health":0,"savings":0,"leadership":-3,"trust":-4,"parent":-2,"colleague":0,"risk":8,"development":0}],
    "E75": [null, null, {"energy":1,"mental":-2,"health":0,"savings":0,"leadership":-2,"trust":-3,"parent":0,"colleague":0,"risk":8,"development":0}],
    "E76": [null, null, {"energy":-3,"mental":-3,"health":0,"savings":0,"leadership":1,"trust":-3,"parent":0,"colleague":0,"risk":7,"development":0}],
    "E77": [null, null, {"energy":2,"mental":0,"health":0,"savings":0,"leadership":-3,"trust":-4,"parent":0,"colleague":0,"risk":10,"development":0}],
    "E78": [null, null, {"energy":-3,"mental":-2,"health":0,"savings":0,"leadership":1,"trust":-2,"parent":1,"colleague":0,"risk":6,"development":0}],
    "E79": [{"energy":-9,"mental":-3,"health":-1,"savings":0,"leadership":4,"trust":5,"parent":0,"colleague":1,"risk":-12,"development":4}, null, {"energy":2,"mental":-3,"health":0,"savings":0,"leadership":-3,"trust":-5,"parent":0,"colleague":-2,"risk":8,"development":-3}],
    "E80": [null, null, {"energy":2,"mental":-2,"health":0,"savings":0,"leadership":-2,"trust":-3,"parent":0,"colleague":0,"risk":9,"development":0}],
    "E81": [null, {"energy":-4,"mental":-3,"health":0,"savings":0,"leadership":1,"trust":-4,"parent":0,"colleague":0,"risk":7,"development":0}, null],
    "E82": [null, {"energy":-5,"mental":-3,"health":0,"savings":0,"leadership":2,"trust":-2,"parent":0,"colleague":0,"risk":5,"development":0}, null],
    "E83": [{"energy":-9,"mental":-3,"health":-1,"savings":-100,"leadership":2,"trust":6,"parent":0,"colleague":1,"risk":-18,"development":1}, null, {"energy":2,"mental":-3,"health":0,"savings":0,"leadership":-3,"trust":-5,"parent":-1,"colleague":0,"risk":14,"development":0}],
    "E84": [{"energy":-9,"mental":-4,"health":-1,"savings":-120,"leadership":3,"trust":5,"parent":3,"colleague":1,"risk":-20,"development":1}, null, {"energy":2,"mental":0,"health":0,"savings":0,"leadership":-4,"trust":-5,"parent":-4,"colleague":-2,"risk":15,"development":0}],
    "E85": [null, {"energy":-8,"mental":-2,"health":0,"savings":0,"leadership":2,"trust":6,"parent":1,"colleague":3,"risk":-10,"development":2}, null],
    "E86": [null, {"energy":-5,"mental":-3,"health":0,"savings":0,"leadership":2,"trust":-2,"parent":0,"colleague":0,"risk":7,"development":0}, null],
    "E90": [null, null, {"energy":2,"mental":2,"health":-1,"savings":0,"leadership":-2,"trust":-3,"parent":0,"colleague":0,"risk":9,"development":0}],
    "E93": [{"energy":-8,"mental":-3,"health":-1,"savings":-80,"leadership":2,"trust":5,"parent":0,"colleague":1,"risk":-17,"development":1}, null, {"energy":2,"mental":-3,"health":0,"savings":0,"leadership":-3,"trust":-5,"parent":-1,"colleague":0,"risk":14,"development":0}],
    "E98": [{"energy":-11,"mental":-6,"health":-1,"savings":-150,"leadership":3,"trust":6,"parent":2,"colleague":1,"risk":-20,"development":2}, null, {"energy":-1,"mental":-2,"health":0,"savings":0,"leadership":-3,"trust":-3,"parent":-2,"colleague":0,"risk":13,"development":0}],
    "E102": [{"energy":-3,"mental":8,"health":0,"savings":0,"leadership":1,"trust":8,"parent":0,"colleague":0,"risk":-3,"development":1}, {"energy":1,"mental":-2,"health":0,"savings":0,"leadership":0,"trust":-4,"parent":0,"colleague":0,"risk":0,"development":0}, {"energy":-2,"mental":0,"health":0,"savings":0,"leadership":1,"trust":1,"parent":0,"colleague":0,"risk":-1,"development":0}],
    "E103": [{"energy":-9,"mental":-3,"health":-1,"savings":-60,"leadership":2,"trust":6,"parent":0,"colleague":0,"risk":-15,"development":1}, null, null],
    "E105": [{"energy":-8,"mental":-3,"health":0,"savings":-60,"leadership":2,"trust":6,"parent":0,"colleague":1,"risk":-16,"development":1}, null, {"energy":2,"mental":-3,"health":0,"savings":0,"leadership":-3,"trust":-4,"parent":-1,"colleague":0,"risk":12,"development":0}],
    "E107": [null, null, {"energy":2,"mental":-2,"health":0,"savings":0,"leadership":-2,"trust":-3,"parent":-2,"colleague":0,"risk":7,"development":0}],
    "E108": [null, null, {"energy":-2,"mental":-1,"health":0,"savings":0,"leadership":1,"trust":-2,"parent":0,"colleague":0,"risk":6,"development":0}],
    "E109": [null, null, {"energy":2,"mental":-2,"health":0,"savings":0,"leadership":-3,"trust":-3,"parent":0,"colleague":0,"risk":8,"development":0}],
    "E110": [{"energy":-7,"mental":-2,"health":0,"savings":0,"leadership":2,"trust":4,"parent":0,"colleague":0,"risk":-14,"development":1}, null, null],
    "E113": [{"energy":-5,"mental":-2,"health":0,"savings":0,"leadership":2,"trust":4,"parent":0,"colleague":0,"risk":-8,"development":1}, {"energy":-4,"mental":-1,"health":1,"savings":0,"leadership":1,"trust":3,"parent":0,"colleague":0,"risk":-6,"development":1}, {"energy":1,"mental":-1,"health":0,"savings":0,"leadership":-1,"trust":-2,"parent":0,"colleague":-1,"risk":7,"development":0}],
    "E116": [null, null, {"energy":-2,"mental":-1,"health":0,"savings":0,"leadership":2,"trust":1,"parent":-5,"colleague":0,"risk":4,"development":0}],
    "E120": [{"energy":-8,"mental":-3,"health":-1,"savings":0,"leadership":2,"trust":6,"parent":0,"colleague":1,"risk":-8,"development":1}, null, null],
    "E123": [null, {"energy":-4,"mental":-2,"health":0,"savings":0,"leadership":3,"trust":-5,"parent":0,"colleague":0,"risk":6,"development":0}, null],
    "E126": [null, null, {"energy":2,"mental":2,"health":0,"savings":0,"leadership":-3,"trust":-3,"parent":0,"colleague":0,"risk":11,"development":-2}],
    "E127": [null, null, {"energy":-3,"mental":-3,"health":-4,"savings":0,"leadership":1,"trust":-3,"parent":0,"colleague":0,"risk":8,"development":0}],
    "E128": [{"energy":-7,"mental":-2,"health":0,"savings":-50,"leadership":2,"trust":5,"parent":0,"colleague":0,"risk":-15,"development":1}, null, {"energy":2,"mental":-3,"health":0,"savings":0,"leadership":-3,"trust":-4,"parent":-1,"colleague":0,"risk":12,"development":0}],
    "E129": [null, null, {"energy":1,"mental":-2,"health":0,"savings":0,"leadership":-4,"trust":-2,"parent":0,"colleague":-1,"risk":13,"development":-2}],
    "E132": [{"energy":-9,"mental":-4,"health":-1,"savings":-100,"leadership":3,"trust":5,"parent":3,"colleague":1,"risk":-20,"development":1}, null, {"energy":2,"mental":0,"health":0,"savings":0,"leadership":-4,"trust":-5,"parent":-4,"colleague":-2,"risk":15,"development":0}],
    "E134": [null, null, {"energy":-3,"mental":-2,"health":0,"savings":0,"leadership":2,"trust":-4,"parent":0,"colleague":0,"risk":5,"development":0}],
    "E139": [null, null, {"energy":-4,"mental":-3,"health":-2,"savings":0,"leadership":1,"trust":-3,"parent":0,"colleague":0,"risk":8,"development":0}],
    "E141": [null, null, {"energy":2,"mental":1,"health":0,"savings":0,"leadership":-2,"trust":-3,"parent":0,"colleague":0,"risk":8,"development":0}],
    "E142": [null, null, {"energy":2,"mental":-2,"health":0,"savings":0,"leadership":-2,"trust":-4,"parent":0,"colleague":0,"risk":9,"development":-2}],
    "E143": [null, null, {"energy":-2,"mental":-1,"health":0,"savings":0,"leadership":1,"trust":-2,"parent":0,"colleague":0,"risk":6,"development":0}],
    "E144": [null, null, {"energy":-3,"mental":-2,"health":0,"savings":0,"leadership":1,"trust":-3,"parent":0,"colleague":0,"risk":2,"development":1}],
    "E146": [null, null, {"energy":-2,"mental":-2,"health":-2,"savings":0,"leadership":0,"trust":-3,"parent":0,"colleague":0,"risk":6,"development":0}],
    "E147": [{"energy":-5,"mental":-3,"health":0,"savings":0,"leadership":2,"trust":4,"parent":0,"colleague":0,"risk":-7,"development":1}, null, {"energy":1,"mental":-3,"health":0,"savings":-200,"leadership":-3,"trust":-4,"parent":0,"colleague":0,"risk":10,"development":0}],
    "E148": [null, null, {"energy":1,"mental":-2,"health":0,"savings":0,"leadership":-2,"trust":-3,"parent":0,"colleague":0,"risk":10,"development":0}],
    "E149": [{"energy":-8,"mental":-3,"health":0,"savings":-80,"leadership":2,"trust":5,"parent":0,"colleague":1,"risk":-17,"development":1}, null, {"energy":2,"mental":-3,"health":0,"savings":0,"leadership":-3,"trust":-5,"parent":-1,"colleague":0,"risk":13,"development":0}],
    "E152": [null, null, {"energy":2,"mental":-2,"health":0,"savings":0,"leadership":-2,"trust":-3,"parent":0,"colleague":0,"risk":9,"development":0}],
    "E159": [{"energy":-8,"mental":-2,"health":-1,"savings":0,"leadership":3,"trust":6,"parent":0,"colleague":0,"risk":-6,"development":2}, {"energy":1,"mental":-2,"health":0,"savings":0,"leadership":0,"trust":1,"parent":0,"colleague":0,"risk":2,"development":0}, null],
    "E162": [null, null, {"energy":2,"mental":-2,"health":0,"savings":0,"leadership":-3,"trust":-4,"parent":0,"colleague":-1,"risk":8,"development":0}],
    "E163": [{"energy":-9,"mental":-4,"health":-1,"savings":-120,"leadership":3,"trust":5,"parent":3,"colleague":1,"risk":-20,"development":1}, null, {"energy":2,"mental":0,"health":0,"savings":0,"leadership":-4,"trust":-5,"parent":-4,"colleague":-2,"risk":15,"development":0}],
    "E164": [{"energy":-2,"mental":8,"health":0,"savings":0,"leadership":1,"trust":8,"parent":0,"colleague":0,"risk":-2,"development":1}, {"energy":-1,"mental":1,"health":0,"savings":0,"leadership":1,"trust":-1,"parent":0,"colleague":0,"risk":0,"development":0}, {"energy":0,"mental":-2,"health":0,"savings":0,"leadership":0,"trust":-3,"parent":0,"colleague":0,"risk":0,"development":0}],
    "E165": [{"energy":-6,"mental":4,"health":0,"savings":-50,"leadership":2,"trust":6,"parent":0,"colleague":1,"risk":-5,"development":2}, null, {"energy":1,"mental":1,"health":0,"savings":0,"leadership":0,"trust":1,"parent":0,"colleague":0,"risk":6,"development":0}],
    "E166": [{"energy":-4,"mental":8,"health":0,"savings":0,"leadership":1,"trust":8,"parent":0,"colleague":0,"risk":-3,"development":1}, {"energy":-1,"mental":-2,"health":0,"savings":0,"leadership":0,"trust":-2,"parent":0,"colleague":0,"risk":0,"development":0}, null]
  };

  // 事件记忆元数据（P1-4）：决定事件绑定哪些学生、给哪些态度标签。
  const generatedEventMemoryMeta = {
    "E01": { studentScope: "single", choiceTags: [["共情", "支持"], ["专业流程", "支持"], ["忽视"]] },
    "E02": { studentScope: "class", choiceTags: [["支持", "朋辈支持"], ["支持"], ["规则优先"]] },
    "E03": { studentScope: "class", choiceTags: [["支持", "持续跟进"], ["共情", "支持"], ["专业流程"]] },
    "E04": { studentScope: "pair", choiceTags: [["规则优先"], ["公开"], ["支持", "保护"]] },
    "E05": { studentScope: "single", choiceTags: [["支持", "及时介入"], ["保护", "支持"], ["家长介入"]] },
    "E06": { studentScope: "single", choiceTags: [["专业流程"], ["尊重自主", "共情"], ["专业流程", "规则优先"]] },
    "E07": { studentScope: "single", choiceTags: [["及时介入", "朋辈支持"], ["家长介入"], ["专业流程", "及时介入"]] },
    "E08": { studentScope: "single", choiceTags: [["及时介入", "支持"], ["隐私保护", "共情"], ["专业流程"]] },
    "E09": { studentScope: "class", choiceTags: [["持续跟进", "专业流程"], ["专业流程"], ["边界清楚"]] },
    "E10": { studentScope: "single", choiceTags: [["边界清楚", "规则优先"], ["专业流程", "模糊边界"], ["规则优先", "专业流程"]] },
    "E29": { studentScope: "class", choiceTags: [["持续跟进"], ["边界清楚"], ["边界清楚", "专业流程"]] },
    "E30": { studentScope: "class", choiceTags: [["持续跟进"], ["边界清楚"], ["专业流程"]] },
    "E31": { studentScope: "class", choiceTags: [["持续跟进"], ["忽视"], ["专业流程"]] },
    "E32": { studentScope: "class", choiceTags: [["忽视"], ["支持"], ["边界清楚"]] },
    "E33": { studentScope: "class", choiceTags: [["模糊边界"], ["边界清楚"], ["边界清楚"]] },
    "E34": { studentScope: "class", choiceTags: [["朋辈支持"], ["边界清楚"], ["边界清楚", "朋辈支持"]] },
    "E35": { studentScope: "single", choiceTags: [["公开"], ["隐私保护", "共情"], ["专业流程"]] },
    "E36": { studentScope: "class", choiceTags: [["持续跟进"], ["共情"], ["忽视"]] },
    "E37": { studentScope: "class", choiceTags: [["模糊边界"], ["模糊边界"], ["边界清楚", "规则优先"]] },
    "E38": { studentScope: "class", choiceTags: [["持续跟进", "专业流程"], ["边界清楚", "专业流程"], ["专业流程"]] },
    "E39": { studentScope: "single", choiceTags: [["共情", "支持", "模糊边界"], ["边界清楚", "持续跟进"], ["边界清楚", "忽视"]] },
    "E40": { studentScope: "class", choiceTags: [["朋辈支持"], ["支持"], ["边界清楚"]] },
    "E41": { studentScope: "single", choiceTags: [["朋辈支持", "支持"], ["边界清楚"], ["共情", "朋辈支持"]] },
    "E42": { studentScope: "class", choiceTags: [["持续跟进", "专业流程"], ["专业流程"], ["边界清楚"]] },
    "E43": { studentScope: "class", choiceTags: [["模糊边界"], ["专业流程"], ["边界清楚"]] },
    "E44": { studentScope: "single", choiceTags: [["支持", "模糊边界"], ["边界清楚", "保护"], ["模糊边界", "朋辈支持"]] },
    "E45": { studentScope: "class", choiceTags: [["持续跟进"], ["专业流程"], ["朋辈支持"]] },
    "E46": { studentScope: "class", choiceTags: [["专业流程"], ["模糊边界"], ["模糊边界", "忽视"]] },
    "E47": { studentScope: "single", choiceTags: [["规则优先"], ["模糊边界", "朋辈支持"], ["规则优先", "持续跟进"]] },
    "E48": { studentScope: "class", choiceTags: [["规则优先"], ["朋辈支持"], ["朋辈支持", "尊重自主"]] },
    "E49": { studentScope: "class", choiceTags: [["专业流程", "持续跟进"], ["专业流程"], ["朋辈支持"]] },
    "E50": { studentScope: "single", choiceTags: [["共情", "支持"], ["持续跟进"], ["公开", "模糊边界"]] },
    "E51": { studentScope: "class", choiceTags: [["持续跟进", "专业流程"], ["边界清楚"], ["专业流程"]] },
    "E52": { studentScope: "single", choiceTags: [["边界清楚"], ["持续跟进", "共情"], ["共情", "支持"]] },
    "E53": { studentScope: "class", choiceTags: [["支持"], ["边界清楚"], ["专业流程"]] },
    "E54": { studentScope: "single", choiceTags: [["规则优先"], ["支持", "保护"], ["忽视"]] },
    "E55": { studentScope: "class", choiceTags: [["朋辈支持"], ["朋辈支持", "公开"], ["边界清楚"]] },
    "E56": { studentScope: "class", choiceTags: [["持续跟进", "专业流程"], ["专业流程"], ["朋辈支持"]] },
    "E57": { studentScope: "single", choiceTags: [["支持", "共情"], ["朋辈支持"], ["支持"]] },
    "E58": { studentScope: "class", choiceTags: [["朋辈支持"], ["支持"], ["朋辈支持", "支持"]] },
    "E59": { studentScope: "class", choiceTags: [["支持"], ["朋辈支持", "尊重自主"], ["边界清楚"]] },
    "E60": { studentScope: "single", choiceTags: [["边界清楚"], ["朋辈支持", "公开"], ["边界清楚"]] },
    "E71": { studentScope: "single", choiceTags: [["及时介入", "保护"], ["支持"], ["忽视"]] },
    "E72": { studentScope: "single", choiceTags: [["共情", "支持"], ["家长介入"], ["支持"]] },
    "E73": { studentScope: "pair", choiceTags: [["专业流程", "持续跟进"], ["公开", "规则优先"], ["专业流程"]] },
    "E74": { studentScope: "single", choiceTags: [["边界清楚"], ["家长介入", "持续跟进"], ["忽视"]] },
    "E75": { studentScope: "single", choiceTags: [["共情", "持续跟进"], ["支持"], ["支持"]] },
    "E76": { studentScope: "single", choiceTags: [["支持", "持续跟进"], ["朋辈支持"], ["支持"]] },
    "E77": { studentScope: "single", choiceTags: [["共情", "持续跟进"], ["朋辈支持"], ["忽视"]] },
    "E78": { studentScope: "single", choiceTags: [["尊重自主", "共情"], ["家长介入"], ["支持"]] },
    "E79": { studentScope: "single", choiceTags: [["支持", "持续跟进"], ["支持"], ["忽视"]] },
    "E80": { studentScope: "pair", choiceTags: [["共情", "边界清楚"], ["公开", "规则优先"], ["忽视"]] },
    "E81": { studentScope: "single", choiceTags: [["共情", "持续跟进"], ["家长介入"], ["支持"]] },
    "E82": { studentScope: "pair", choiceTags: [["持续跟进"], ["规则优先"], ["朋辈支持"]] },
    "E83": { studentScope: "single", choiceTags: [["及时介入", "保护"], ["家长介入"], ["忽视"]] },
    "E84": { studentScope: "single", choiceTags: [["及时介入", "保护"], ["专业流程"], ["忽视"]] },
    "E85": { studentScope: "single", choiceTags: [["支持", "持续跟进"], ["支持"], ["低共情"]] },
    "E86": { studentScope: "single", choiceTags: [["共情", "隐私保护"], ["公开"], ["朋辈支持"]] },
    "E87": { studentScope: "single", choiceTags: [["支持", "持续跟进"], ["支持"], ["尊重自主"]] },
    "E88": { studentScope: "single", choiceTags: [["支持", "持续跟进"], ["家长介入"], ["低共情"]] },
    "E89": { studentScope: "single", choiceTags: [["尊重自主", "共情"], ["家长介入"], ["家长介入", "低共情"]] },
    "E90": { studentScope: "single", choiceTags: [["专业流程", "持续跟进"], ["共情", "支持"], ["忽视"]] },
    "E91": { studentScope: "single", choiceTags: [["尊重自主", "共情"], ["专业流程"], ["专业流程", "规则优先"]] },
    "E92": { studentScope: "single", choiceTags: [["支持", "持续跟进"], ["支持", "专业流程"], ["支持"]] },
    "E93": { studentScope: "single", choiceTags: [["保护", "及时介入"], ["家长介入"], ["忽视"]] },
    "E94": { studentScope: "single", choiceTags: [["专业流程", "支持"], ["支持"], ["忽视"]] },
    "E95": { studentScope: "single", choiceTags: [["共情", "支持"], ["支持", "持续跟进"], ["低共情"]] },
    "E96": { studentScope: "single", choiceTags: [["支持", "持续跟进"], ["支持"], ["支持", "共情"]] },
    "E97": { studentScope: "single", choiceTags: [["支持", "持续跟进"], ["专业流程", "支持"], ["忽视"]] },
    "E98": { studentScope: "single", choiceTags: [["及时介入", "专业流程"], ["持续跟进", "支持"], ["朋辈支持"]] },
    "E99": { studentScope: "single", choiceTags: [["支持", "持续跟进"], ["支持"], ["尊重自主"]] },
    "E100": { studentScope: "single", choiceTags: [["支持", "专业流程"], ["专业流程"], ["忽视"]] },
    "E101": { studentScope: "single", choiceTags: [["支持", "持续跟进"], ["支持"], ["尊重自主"]] },
    "E102": { studentScope: "single", choiceTags: [["共情", "支持"], ["低共情"], ["边界清楚"]] },
    "E103": { studentScope: "single", choiceTags: [["及时介入", "保护"], ["支持"], ["专业流程"]] },
    "E104": { studentScope: "single", choiceTags: [["规则优先", "持续跟进"], ["共情", "支持"], ["忽视"]] },
    "E105": { studentScope: "single", choiceTags: [["保护", "及时介入"], ["支持"], ["忽视"]] },
    "E106": { studentScope: "single", choiceTags: [["支持", "持续跟进"], ["尊重自主"], ["支持"]] },
    "E107": { studentScope: "single", choiceTags: [["共情", "边界清楚"], ["家长介入", "边界清楚"], ["忽视"]] },
    "E108": { studentScope: "single", choiceTags: [["支持", "持续跟进"], ["支持", "共情"], ["支持"]] },
    "E109": { studentScope: "single", choiceTags: [["规则优先", "支持"], ["规则优先"], ["朋辈支持"]] },
    "E110": { studentScope: "single", choiceTags: [["专业流程", "保护"], ["保护"], ["忽视"]] },
    "E111": { studentScope: "single", choiceTags: [["朋辈支持"], ["持续跟进", "支持"], ["忽视"]] },
    "E112": { studentScope: "single", choiceTags: [["共情"], ["家长介入"], ["家长介入", "低共情"]] },
    "E113": { studentScope: "single", choiceTags: [["共情", "持续跟进"], ["规则优先", "持续跟进"], ["朋辈支持"]] },
    "E114": { studentScope: "single", choiceTags: [["专业流程", "支持"], ["尊重自主"], ["家长介入"]] },
    "E115": { studentScope: "pair", choiceTags: [["共情"], ["持续跟进", "共情"], ["忽视"]] },
    "E116": { studentScope: "single", choiceTags: [["家长介入"], ["家长介入", "支持"], ["边界清楚"]] },
    "E117": { studentScope: "single", choiceTags: [["支持", "持续跟进"], ["朋辈支持", "支持"], ["支持"]] },
    "E118": { studentScope: "single", choiceTags: [["规则优先"], ["支持", "保护"], ["尊重自主"]] },
    "E119": { studentScope: "single", choiceTags: [["共情", "支持"], ["支持"], ["忽视"]] },
    "E120": { studentScope: "single", choiceTags: [["支持", "持续跟进"], ["低共情"], ["尊重自主"]] },
    "E121": { studentScope: "single", choiceTags: [["支持", "持续跟进"], ["支持"], ["忽视"]] },
    "E122": { studentScope: "single", choiceTags: [["专业流程"], ["支持", "专业流程"], ["规则优先", "专业流程"]] },
    "E123": { studentScope: "single", choiceTags: [["共情", "持续跟进"], ["规则优先"], ["朋辈支持"]] },
    "E124": { studentScope: "single", choiceTags: [["支持", "专业流程"], ["支持"], ["保护"]] },
    "E125": { studentScope: "single", choiceTags: [["共情", "持续跟进"], ["规则优先", "持续跟进"], ["家长介入"]] },
    "E126": { studentScope: "single", choiceTags: [["支持", "持续跟进"], ["支持"], ["忽视"]] },
    "E127": { studentScope: "single", choiceTags: [["支持"], ["保护", "支持"], ["低共情"]] },
    "E128": { studentScope: "single", choiceTags: [["保护", "及时介入"], ["专业流程"], ["忽视"]] },
    "E129": { studentScope: "single", choiceTags: [["规则优先"], ["共情", "持续跟进"], ["忽视", "模糊边界"]] },
    "E130": { studentScope: "single", choiceTags: [["尊重自主", "共情"], ["家长介入"], ["支持"]] },
    "E131": { studentScope: "single", choiceTags: [["支持", "持续跟进"], ["支持"], ["家长介入"]] },
    "E132": { studentScope: "single", choiceTags: [["及时介入", "保护"], ["家长介入"], ["忽视"]] },
    "E133": { studentScope: "single", choiceTags: [["支持", "持续跟进"], ["支持"], ["尊重自主"]] },
    "E134": { studentScope: "single", choiceTags: [["规则优先"], ["共情", "持续跟进"], ["规则优先", "低共情"]] },
    "E135": { studentScope: "single", choiceTags: [["支持", "持续跟进"], ["支持"], ["尊重自主"]] },
    "E136": { studentScope: "single", choiceTags: [["专业流程", "支持"], ["支持"], ["支持"]] },
    "E137": { studentScope: "single", choiceTags: [["支持", "持续跟进"], ["支持"], ["支持"]] },
    "E138": { studentScope: "single", choiceTags: [["支持"], ["支持", "保护"], ["家长介入"]] },
    "E139": { studentScope: "single", choiceTags: [["支持", "持续跟进"], ["保护", "支持"], ["低共情"]] },
    "E140": { studentScope: "single", choiceTags: [["尊重自主", "共情"], ["家长介入"], ["家长介入", "低共情"]] },
    "E141": { studentScope: "single", choiceTags: [["专业流程", "持续跟进"], ["共情", "支持"], ["忽视"]] },
    "E142": { studentScope: "single", choiceTags: [["支持", "持续跟进"], ["支持"], ["忽视"]] },
    "E143": { studentScope: "single", choiceTags: [["支持", "持续跟进"], ["支持"], ["支持"]] },
    "E144": { studentScope: "single", choiceTags: [["支持", "持续跟进"], ["共情", "支持"], ["忽视"]] },
    "E145": { studentScope: "single", choiceTags: [["支持", "持续跟进"], ["支持"], ["尊重自主"]] },
    "E146": { studentScope: "single", choiceTags: [["支持", "持续跟进"], ["保护", "支持"], ["低共情"]] },
    "E147": { studentScope: "single", choiceTags: [["专业流程", "支持"], ["支持"], ["尊重自主"]] },
    "E148": { studentScope: "single", choiceTags: [["支持", "专业流程"], ["专业流程"], ["忽视"]] },
    "E149": { studentScope: "single", choiceTags: [["保护", "及时介入"], ["家长介入"], ["忽视"]] },
    "E150": { studentScope: "single", choiceTags: [["支持", "专业流程"], ["支持"], ["支持"]] },
    "E151": { studentScope: "single", choiceTags: [["保护", "及时介入"], ["专业流程", "保护"], ["低共情"]] },
    "E152": { studentScope: "single", choiceTags: [["支持", "持续跟进"], ["支持"], ["忽视"]] },
    "E153": { studentScope: "single", choiceTags: [["支持", "专业流程"], ["支持"], ["尊重自主"]] },
    "E154": { studentScope: "single", choiceTags: [["支持", "专业流程"], ["规则优先", "支持"], ["支持"]] },
    "E155": { studentScope: "single", choiceTags: [["共情", "支持"], ["支持"], ["尊重自主"]] },
    "E156": { studentScope: "single", choiceTags: [["支持", "专业流程"], ["支持"], ["忽视"]] },
    "E157": { studentScope: "single", choiceTags: [["支持", "边界清楚"], ["共情"], ["支持"]] },
    "E158": { studentScope: "single", choiceTags: [["及时介入", "专业流程"], ["支持", "持续跟进"], ["支持"]] },
    "E159": { studentScope: "single", choiceTags: [["支持", "专业流程"], ["支持"], ["支持"]] },
    "E160": { studentScope: "single", choiceTags: [["支持", "专业流程"], ["忽视"], ["专业流程"]] },
    "E161": { studentScope: "single", choiceTags: [["共情", "支持"], ["支持", "专业流程"], ["家长介入"]] },
    "E162": { studentScope: "class", choiceTags: [["规则优先"], ["支持"], ["忽视"]] },
    "E163": { studentScope: "single", choiceTags: [["及时介入", "保护"], ["家长介入"], ["忽视"]] },
    "E164": { studentScope: "single", choiceTags: [["共情", "支持"], ["边界清楚", "共情"], ["边界清楚"]] },
    "E165": { studentScope: "single", choiceTags: [["支持", "持续跟进"], ["支持"], ["尊重自主"]] },
    "E166": { studentScope: "single", choiceTags: [["共情", "支持"], ["支持"], ["低共情"]] }
  };

  // 把覆写表挂到 events / monthEndEvents 上，之后引擎只读 choice.effects。
  function applyChoiceEffects(list) {
    list.forEach((event) => {
      const overrides = eventChoiceEffects[event.id];
      if (!overrides) return;
      event.choices = event.choices.map((choice, index) => {
        const override = overrides[index];
        if (!override) return choice;
        return { ...choice, effects: override };
      });
    });
    return list;
  }

  applyChoiceEffects(events);
  applyChoiceEffects(monthEndEvents);

  const eventMemoryMeta = { ...generatedEventMemoryMeta, ...existingEventMemoryMeta };

  window.GameData = {
    actions: scopedActions,
    events: events.concat(extraSemesterEvents),
    slackItems,
    names,
    traits,
    monthlySituationTemplates,
    monthEndEvents,
    problemIssues,
    storyFragments: { hometowns, familyFragments, hobbyFragments, worryFragments },
    introSchools,
    developmentProjects,
    developmentProjectScenarios,
    eventMemoryMeta
  };
})();
