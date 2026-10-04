// 月终事件与学期事件的选择效果覆写表
// key = 事件 id，数组下标对应 choices 下标；null = 沿用 tone 推导值
//
// 用法（合并脚本）：把数组元素写入对应 choice.effects；值为 null 时不动 choice。
// 引擎 resolveChoiceEffects() 会先取 toneEffects() 兜底，再用这里显式声明的键逐一覆盖，
// 因此“覆写对象只写与基线不同的字段”在数值上是等价的；本表为可复核性仍写全字段。
//
// 重要（给合并脚本）：学期事件条目一律只写“真的有覆写”的事件 id。
// 这里出现的每个事件数组长度都等于该事件的 choice 数（3），null 只是占位下标，
// 不需要为“完全不用改”的事件补条目——没写的事件 id 即完全沿用 tone 值。
//
// 数值口径（与引擎一致，负向缩放：精力 x0.6、心理 x0.75，其余不缩放）：
//   energy   -16 ~ +8    （实际生效约 -9.6 ~ +8，故负值写得比直觉更大才有手感）
//   mental   -14 ~ +8    （实际生效约 -10.5 ~ +8）
//   health    -5 ~ +3
//   risk     -22 ~ +15
//   trust / leadership / parent / colleague  -8 ~ +8
//   savings -1500 ~ +500
// 规则：每个 choice 至少再付出一个“别的代价”（savings / risk / health / trust / leadership），
//       不允许出现“主要收益 + 其余全零”的无脑最优解。
// 说明：choice.tone 仍是 UI 与叙事标签；一旦本表给出覆写，tone/category 推导值对该项即完全失效
//       （含月终事件专属的 mental+4 / health+1，以及学期事件专属的 risk-1 / trust+1 / mental-1，
//        本表数值已把这些修饰计入，无需再叠加）。
window.GameDataSemesterEffects = {
  // ============================================================
  // --- 月终事件 M01-M08：全部显式覆写（原基线 = tone + { mental+4, health+1 }）---
  // 设计原则：月终事件是“辅导员自己的时间”。
  //   恢复类 = energy/mental 为正，代价是 savings 或 risk；
  //   硬撑类 = mental/health 为负，换 leadership 或 savings 改善；
  //   逃避类 = energy 为正，但 risk 明显上升、leadership/trust 下降。
  //   risk 幅度控制在 -6 ~ +8；trust/parent 基本为 0，仅 M03（家长群）/ M08（学生留言）例外。
  // ============================================================
  M01: [
    // 点外卖：最小成本的恢复。精力回暖但心理只是“缓过来”，钱花掉了，且独自吃=没离开工作。
    { energy: 6, mental: 8, health: 0, savings: -60, leadership: 0, trust: 0, parent: 0, colleague: 0, risk: 0, development: 0 },
    // 继续做材料：唯一实质推进工作的选项，心理负得最深；代价是精力与心理，不是钱。
    { energy: -8, mental: -6, health: -1, savings: 0, leadership: 3, trust: 0, parent: 0, colleague: 0, risk: -2, development: 2 },
    // 约朋友出去走走：恢复最好的一项，但真的离开了岗位，工作堆积=risk 上升。
    { energy: 5, mental: 12, health: 1, savings: -120, leadership: 0, trust: 0, parent: 0, colleague: 3, risk: 4, development: 0 }
  ],
  M02: [
    // 预约检查：健康收益最大，但花时间花钱，且体检结果本身带来心理负担。
    { energy: -4, mental: -2, health: 3, savings: -220, leadership: 0, trust: 0, parent: 0, colleague: 0, risk: -2, development: 0 },
    // 吃两片维生素：纯自我安慰。正精力（省下了时间），但健康与风险都没解决——逃避类。
    { energy: 2, mental: 1, health: -2, savings: -10, leadership: -1, trust: 0, parent: 0, colleague: 0, risk: 6, development: 0 },
    // 约同事一起体检：健康同样解决 + 同事关系，但消耗社交精力，健康收益略低于认真预约。
    { energy: -2, mental: 4, health: 2, savings: -150, leadership: 1, trust: 0, parent: 0, colleague: 3, risk: -2, development: 0 }
  ],
  M03: [
    // 认真回应：家长满意度上升（例外项），但组织语言真的耗精力、耗心理。
    { energy: -4, mental: -3, health: 0, savings: 0, leadership: 1, trust: 0, parent: 6, colleague: 0, risk: -4, development: 0 },
    // 让班委先解释：省了辅导员的精力，代价是家长口碑与信任；学生替你说话=越说越乱，risk 上升。
    { energy: 3, mental: 4, health: 0, savings: 0, leadership: -3, trust: -5, parent: -5, colleague: 0, risk: 6, development: 0 },
    // 约家长单独沟通：处理最深、风险降得最多、家长最满意，但精力与心理双重支出最重。
    { energy: -7, mental: -2, health: -1, savings: -30, leadership: 2, trust: 1, parent: 8, colleague: 0, risk: -6, development: 1 }
  ],
  M04: [
    // 先存一部分：财务安全感（savings 改善）换生活质量，仍然惦记账单。
    { energy: -1, mental: -2, health: 0, savings: 150, leadership: 1, trust: 0, parent: 0, colleague: 0, risk: 0, development: 0 },
    // 奖励自己一顿好的：本月最强的即时恢复，但钱没了，账单还在=risk 小升。
    { energy: 3, mental: 9, health: 1, savings: -180, leadership: 0, trust: 0, parent: 0, colleague: 0, risk: 3, development: 0 },
    // 先还信用卡：心理压力下降（长期利息减少）但手头更紧，精力也搭进去。
    { energy: -3, mental: 5, health: 0, savings: -500, leadership: 0, trust: 0, parent: 0, colleague: 0, risk: -2, development: 0 }
  ],
  M05: [
    // 写下来复盘：把情绪整理清楚，心理收益中等偏上，但复盘本身就是二次消耗。
    { energy: -4, mental: 5, health: 0, savings: 0, leadership: 2, trust: 0, parent: 0, colleague: 0, risk: -2, development: 2 },
    // 找人聊聊：纯恢复，本月最好的心理选项之一，但没有任何工作推进。
    { energy: 0, mental: 12, health: 0, savings: 0, leadership: 0, trust: 0, parent: 0, colleague: 4, risk: 2, development: 0 },
    // 刷手机到睡着：精力正、心理假装正，实际是健康与风险的净损失——标准的逃避解。
    { energy: 3, mental: 5, health: -3, savings: 0, leadership: -2, trust: 0, parent: 0, colleague: 0, risk: 8, development: 0 }
  ],
  M06: [
    // 一起吃点：同事关系 + 放松，但热量与夜晚状态有代价。
    { energy: 1, mental: 6, health: -1, savings: 0, leadership: 0, trust: 0, parent: 0, colleague: 3, risk: 0, development: 0 },
    // 谢绝并继续工作：专注换产出，代价是心理与错过社交。
    { energy: -3, mental: -3, health: 0, savings: 0, leadership: 2, trust: 0, parent: 0, colleague: -1, risk: 0, development: 3 },
    // 收下留到晚上：成本最低的中庸解，收益也最小——把零食收起来这件事本身
    // 在同事眼里略显计较，晚上多半也真的没空吃。
    { energy: 1, mental: 2, health: 0, savings: 0, leadership: 0, trust: 0, parent: 0, colleague: -1, risk: 1, development: 0 }
  ],
  M07: [
    // 提前回去休息：本月最强的精力恢复，但手头工作真的堆着——risk 明显上升。
    { energy: 9, mental: 6, health: 3, savings: 0, leadership: -2, trust: 0, parent: 0, colleague: 0, risk: 5, development: 0 },
    // 留在办公室处理杂事：工作推进（development / leadership），身心继续透支。
    { energy: -5, mental: -7, health: -2, savings: 0, leadership: 3, trust: 0, parent: 0, colleague: 0, risk: -2, development: 3 },
    // 在窗边听雨：最便宜的心理恢复，零成本，但既不休息也不干活。
    { energy: 2, mental: 9, health: 1, savings: 0, leadership: 0, trust: 0, parent: 0, colleague: 0, risk: 2, development: 0 }
  ],
  M08: [
    // 认真回复大家：学生的认可换来真实心理回报（例外项），但要组织语言=精力支出。
    { energy: -4, mental: 8, health: 0, savings: 0, leadership: 1, trust: 7, parent: 0, colleague: 0, risk: -3, development: 1 },
    // 发个轻松表情：省事、气氛不坏，但学生感到被敷衍，信任与威信小幅下降。
    { energy: 2, mental: 4, health: 0, savings: 0, leadership: -1, trust: -3, parent: 0, colleague: 0, risk: 2, development: 0 },
    // 明天再回复：保住了休息（本月最高精力回复），代价是学生的期待落空——逃避解。
    { energy: 8, mental: 3, health: 2, savings: 0, leadership: -2, trust: -7, parent: 0, colleague: 0, risk: 5, development: 0 }
  ],

  // ============================================================
  // --- 学期事件 E71-E166：只覆写“语义与 tone 基线明显不符”的 choice ---
  // null = 沿用 tone 推导值（tone + 学期事件修饰 { risk-1, trust+1, mental-1 }）。
  // 覆写标准：
  //   A. tone=bold 但文案是“立即送医 / 立即核实 / 立即启动 / 报警止损”的高强度现场处置
  //      → 更大精力消耗 + 更大 risk 降幅
  //   B. tone=neglect 但文案是“让学生自己处理 / 继续等待 / 先不管他”的真实风险累积
  //      → 更大 risk 升幅（含“把问题推给朋辈/学生自治”的伪放手）
  //   C. 第 8 学期告别类（E102 / E159 / E164 / E165 / E166）→ 高情感回报、低风险的特殊解
  //   D. 毕业季语境下“轻松带过 / 玩笑式回应”的 fun/safe → 带一点遗憾（trust 或 mental 略负）
  //   E. 少量硬伤修补：tone 与实际代价方向相反（如 tone=hard 实为省钱、tone=fun 实为通宵）
  // ============================================================
  E71: [
    // A：军训中暑的现场处置，最大 risk 降幅，代价是当场的时间与体力。
    { energy: -10, mental: -3, health: -1, savings: -50, leadership: 3, trust: 6, parent: 0, colleague: 0, risk: -16, development: 1 },
    null,
    // B：让学生“坚持一下”，健康风险真实累积。
    { energy: -4, mental: -2, health: -4, savings: 0, leadership: 0, trust: -3, parent: 0, colleague: 0, risk: 9, development: 0 }
  ],
  E73: [
    null,
    null,
    // B：让学生报警，宿舍关系与班级氛围失控风险上升，辅导员反而缺席。
    { energy: 1, mental: -3, health: 0, savings: 0, leadership: -3, trust: -4, parent: 0, colleague: -1, risk: 10, development: 0 }
  ],
  E74: [
    null,
    null,
    // B：让学生在家长与学校之间自己扛，问题原地发酵。
    { energy: 1, mental: -2, health: 0, savings: 0, leadership: -3, trust: -4, parent: -2, colleague: 0, risk: 8, development: 0 }
  ],
  E75: [
    null,
    null,
    // B：“明年再试”把问题整体延后，情绪与学业风险都在积累。
    { energy: 1, mental: -2, health: 0, savings: 0, leadership: -2, trust: -3, parent: 0, colleague: 0, risk: 8, development: 0 }
  ],
  E76: [
    null,
    null,
    // B：让学生完全独自调整，压力堆积。
    { energy: -3, mental: -3, health: 0, savings: 0, leadership: 1, trust: -3, parent: 0, colleague: 0, risk: 7, development: 0 }
  ],
  E77: [
    null,
    null,
    // B：分手 + 连续缺课却“先观察几天”，错过干预信号窗口。
    { energy: 2, mental: 0, health: 0, savings: 0, leadership: -3, trust: -4, parent: 0, colleague: 0, risk: 10, development: 0 }
  ],
  E78: [
    null,
    null,
    // B：两边都没真正解决的折中，家庭矛盾与学生压力继续挂着。
    { energy: -3, mental: -2, health: 0, savings: 0, leadership: 1, trust: -2, parent: 1, colleague: 0, risk: 6, development: 0 }
  ],
  E79: [
    // A：带团队重做项目，时间与精力的高强度投入。
    { energy: -9, mental: -3, health: -1, savings: 0, leadership: 4, trust: 5, parent: 0, colleague: 1, risk: -12, development: 4 },
    null,
    // B：直接放弃比赛，“止损”的同时把学生的信心与团队风险留下了。
    { energy: 2, mental: -3, health: 0, savings: 0, leadership: -3, trust: -5, parent: 0, colleague: -2, risk: 8, development: -3 }
  ],
  E80: [
    null,
    null,
    // B：经费与分工冲突交给学生自治，公开争吵可能失控。
    { energy: 2, mental: -2, health: 0, savings: 0, leadership: -2, trust: -3, parent: 0, colleague: 0, risk: 9, development: 0 }
  ],
  E81: [
    null,
    // tone=hard 但语义是“把家长拉进来”：代价是学生更抵触 + 学业情绪风险上升，而不是省事。
    { energy: -4, mental: -3, health: 0, savings: 0, leadership: 1, trust: -4, parent: 0, colleague: 0, risk: 7, development: 0 },
    null
  ],
  E82: [
    null,
    // 调换宿舍只是隔离问题：被孤立学生的关系与情绪风险并未消失。
    { energy: -5, mental: -3, health: 0, savings: 0, leadership: 2, trust: -2, parent: 0, colleague: 0, risk: 5, development: 0 },
    null
  ],
  E83: [
    // A：阻止转账 + 报警，直接涉及资金损失，风险降幅要够大。
    { energy: -9, mental: -3, health: -1, savings: -100, leadership: 2, trust: 6, parent: 0, colleague: 1, risk: -18, development: 1 },
    null,
    // B：学生自己处理，钱会继续转出去。
    { energy: 2, mental: -3, health: 0, savings: 0, leadership: -3, trust: -5, parent: -1, colleague: 0, risk: 14, development: 0 }
  ],
  E84: [
    // A：学生失联，第一时间核实位置 = 最高强度处置。
    { energy: -9, mental: -4, health: -1, savings: -120, leadership: 3, trust: 5, parent: 3, colleague: 1, risk: -20, development: 1 },
    null,
    // B：“避免惊动”的继续等待，是失联事件里最危险的选项。
    { energy: 2, mental: 0, health: 0, savings: 0, leadership: -4, trust: -5, parent: -4, colleague: -2, risk: 15, development: 0 }
  ],
  E85: [
    null,
    // 帮他找带薪实习：兼顾实践与收入，但要耗掉大量精力与人情。
    { energy: -8, mental: -2, health: 0, savings: 0, leadership: 2, trust: 6, parent: 1, colleague: 3, risk: -10, development: 2 },
    null
  ],
  E86: [
    null,
    // 公开解释会在班级群扩大讨论面：risk 应上升，而 tone=hard 的 risk-6 方向相反。
    { energy: -5, mental: -3, health: 0, savings: 0, leadership: 2, trust: -2, parent: 0, colleague: 0, risk: 7, development: 0 },
    null
  ],
  E90: [
    null,
    null,
    // B：“先别想太多”只是把迷茫延后，失眠与情绪风险不动。
    { energy: 2, mental: 2, health: -1, savings: 0, leadership: -2, trust: -3, parent: 0, colleague: 0, risk: 9, development: 0 }
  ],
  E93: [
    // A：签约诈骗的资金处置，要真的把精力搭进去。
    { energy: -8, mental: -3, health: -1, savings: -80, leadership: 2, trust: 5, parent: 0, colleague: 1, risk: -17, development: 1 },
    null,
    // B：学生可能继续交钱。
    { energy: 2, mental: -3, health: 0, savings: 0, leadership: -3, trust: -5, parent: -1, colleague: 0, risk: 14, development: 0 }
  ],
  E98: [
    // A：心理危机复发，重启专业支持是全场最高强度选项。
    { energy: -11, mental: -6, health: -1, savings: -150, leadership: 3, trust: 6, parent: 2, colleague: 1, risk: -20, development: 2 },
    null,
    // B：让室友多关注——朋辈看护替代不了专业支持，risk 要显著高于 tone 基线。
    { energy: -1, mental: -2, health: 0, savings: 0, leadership: -3, trust: -3, parent: -2, colleague: 0, risk: 13, development: 0 }
  ],
  E102: [
    // C：认真回应告别：毕业季最高的情感回报，几乎不产生班级风险。
    { energy: -3, mental: 8, health: 0, savings: 0, leadership: 1, trust: 8, parent: 0, colleague: 0, risk: -3, development: 1 },
    // D：轻松带过：气氛安全，但这段关系的结尾被错过了——真实遗憾。
    { energy: 1, mental: -2, health: 0, savings: 0, leadership: 0, trust: -4, parent: 0, colleague: 0, risk: 0, development: 0 },
    // 提醒注意安全：仍在履行职责，情感回报几乎为零，属于告别场景的安全但平淡解。
    { energy: -2, mental: 0, health: 0, savings: 0, leadership: 1, trust: 1, parent: 0, colleague: 0, risk: -1, development: 0 }
  ],
  E103: [
    // A：先送医检查，压住伤情与评优焦虑的复合风险。
    { energy: -9, mental: -3, health: -1, savings: -60, leadership: 2, trust: 6, parent: 0, colleague: 0, risk: -15, development: 1 },
    null,
    null
  ],
  E105: [
    // A：定金已被骗，帮助核实止损的强度与风险降幅都要更大。
    { energy: -8, mental: -3, health: 0, savings: -60, leadership: 2, trust: 6, parent: 0, colleague: 1, risk: -16, development: 1 },
    null,
    // B：让学生自己联系，等于继续被骗。
    { energy: 2, mental: -3, health: 0, savings: 0, leadership: -3, trust: -4, parent: -1, colleague: 0, risk: 12, development: 0 }
  ],
  E107: [
    null,
    null,
    // B：家长过度照顾却“先不介入”，家庭边界与学生情绪问题继续。
    { energy: 2, mental: -2, health: 0, savings: 0, leadership: -2, trust: -3, parent: -2, colleague: 0, risk: 7, development: 0 }
  ],
  E108: [
    null,
    null,
    // tone=hard 但实际是“转发资料”这种省力行为：代价是针对性不足 → 焦虑与挂科风险上升。
    { energy: -2, mental: -1, health: 0, savings: 0, leadership: 1, trust: -2, parent: 0, colleague: 0, risk: 6, development: 0 }
  ],
  E109: [
    null,
    null,
    // B：宿舍违规养宠物交给室友协商，矛盾与宿舍关系风险上升。
    { energy: 2, mental: -2, health: 0, savings: 0, leadership: -3, trust: -3, parent: 0, colleague: 0, risk: 8, development: 0 }
  ],
  E110: [
    // A：校外人员进宿舍推销，先确认是否已受骗，资金与人身安全风险优先。
    { energy: -7, mental: -2, health: 0, savings: 0, leadership: 2, trust: 4, parent: 0, colleague: 0, risk: -14, development: 1 },
    null,
    null
  ],
  E113: [
    // tone=bold 但“了解背后压力”偏中强度辅导，真正的高强度在行为干预上。
    { energy: -5, mental: -2, health: 0, savings: 0, leadership: 2, trust: 4, parent: 0, colleague: 0, risk: -8, development: 1 },
    // 制定作息计划：有约束力，需要持续跟进，health 应被计入。
    { energy: -4, mental: -1, health: 1, savings: 0, leadership: 1, trust: 3, parent: 0, colleague: 0, risk: -6, development: 1 },
    // 让室友监督：把干预责任转移给朋辈，熬夜行为与宿舍关系风险上升。
    { energy: 1, mental: -1, health: 0, savings: 0, leadership: -1, trust: -2, parent: 0, colleague: -1, risk: 7, development: 0 }
  ],
  E116: [
    null,
    null,
    // 请家长改约时间：边界清楚，但家长不满 + 关系温度下降，risk 应上升而非下降。
    { energy: -2, mental: -1, health: 0, savings: 0, leadership: 2, trust: 1, parent: -5, colleague: 0, risk: 4, development: 0 }
  ],
  E120: [
    // tone=safe 但“帮他分担任务”其实要投入真金白银的精力。
    { energy: -8, mental: -3, health: -1, savings: 0, leadership: 2, trust: 6, parent: 0, colleague: 1, risk: -8, development: 1 },
    null,
    null
  ],
  E123: [
    null,
    // 严格考勤：约束见效但不解决原因，且把学生推远、缺勤背后的真实问题继续累积。
    { energy: -4, mental: -2, health: 0, savings: 0, leadership: 3, trust: -5, parent: 0, colleague: 0, risk: 6, development: 0 },
    null
  ],
  E126: [
    null,
    null,
    // B：学生拿奖后“先不管他”，忽视学业的代价要写实。
    { energy: 2, mental: 2, health: 0, savings: 0, leadership: -3, trust: -3, parent: 0, colleague: 0, risk: 11, development: -2 }
  ],
  E127: [
    null,
    null,
    // 建议他坚持：健康风险是真实的，risk 不该由 hard 基线倒扣。
    { energy: -3, mental: -3, health: -4, savings: 0, leadership: 1, trust: -3, parent: 0, colleague: 0, risk: 8, development: 0 }
  ],
  E128: [
    // A：涉及继续转钱，核实真实性的强度要拉高。
    { energy: -7, mental: -2, health: 0, savings: -50, leadership: 2, trust: 5, parent: 0, colleague: 0, risk: -15, development: 1 },
    null,
    // B：学生可能继续转钱。
    { energy: 2, mental: -3, health: 0, savings: 0, leadership: -3, trust: -4, parent: -1, colleague: 0, risk: 12, development: 0 }
  ],
  E129: [
    null,
    null,
    // B：评奖材料造假睁一只眼，属于制度性风险埋雷。
    { energy: 1, mental: -2, health: 0, savings: 0, leadership: -4, trust: -2, parent: 0, colleague: -1, risk: 13, development: -2 }
  ],
  E132: [
    // A：去向不明且联系不上，立即核实安全。
    { energy: -9, mental: -4, health: -1, savings: -100, leadership: 3, trust: 5, parent: 3, colleague: 1, risk: -20, development: 1 },
    null,
    // B：继续等待，风险最高。
    { energy: 2, mental: 0, health: 0, savings: 0, leadership: -4, trust: -5, parent: -4, colleague: -2, risk: 15, development: 0 }
  ],
  E134: [
    null,
    null,
    // 扣分处理：程序走完但关系受损，学生抵触情绪与抄袭动因都还在，risk 应上升。
    { energy: -3, mental: -2, health: 0, savings: 0, leadership: 2, trust: -4, parent: 0, colleague: 0, risk: 5, development: 0 }
  ],
  E139: [
    null,
    null,
    // “鼓励他再坚持”：考研冲刺期的坚持是有健康与心理代价的，risk 不该下降。
    { energy: -4, mental: -3, health: -2, savings: 0, leadership: 1, trust: -3, parent: 0, colleague: 0, risk: 8, development: 0 }
  ],
  E141: [
    null,
    null,
    // B：未来规划完全空白却“建议先做好眼前”，问题被无限延后。
    { energy: 2, mental: 1, health: 0, savings: 0, leadership: -2, trust: -3, parent: 0, colleague: 0, risk: 8, development: 0 }
  ],
  E142: [
    null,
    null,
    // B：实习被鸽后“让他自己处理”，焦虑与错过机会的风险上升。
    { energy: 2, mental: -2, health: 0, savings: 0, leadership: -2, trust: -4, parent: 0, colleague: 0, risk: 9, development: -2 }
  ],
  E143: [
    null,
    null,
    // tone=hard 但“让他多投”实际增加精力分散与错过重点的风险，方向应为 risk 上升。
    { energy: -2, mental: -1, health: 0, savings: 0, leadership: 1, trust: -2, parent: 0, colleague: 0, risk: 6, development: 0 }
  ],
  E144: [
    null,
    null,
    // 让他自己总结：反思有价值，但情绪低落期的独自消化有信任与士气代价。
    { energy: -3, mental: -2, health: 0, savings: 0, leadership: 1, trust: -3, parent: 0, colleague: 0, risk: 2, development: 1 }
  ],
  E146: [
    null,
    null,
    // 建议继续忍：学生在实习里被持续消耗，health 与 risk 都该被写进来。
    { energy: -2, mental: -2, health: -2, savings: 0, leadership: 0, trust: -3, parent: 0, colleague: 0, risk: 6, development: 0 }
  ],
  E147: [
    // tone=safe 但“分析毁约成本”需要真的把三方协议、违约金、诚信记录翻一遍。
    { energy: -5, mental: -3, health: 0, savings: 0, leadership: 2, trust: 4, parent: 0, colleague: 0, risk: -7, development: 1 },
    null,
    // tone=bold 但“尊重他的选择”其实是放手：学生独自承担毁约后果，risk 上升。
    { energy: 1, mental: -3, health: 0, savings: -200, leadership: -3, trust: -4, parent: 0, colleague: 0, risk: 10, development: 0 }
  ],
  E148: [
    null,
    null,
    // 让学生自己处理：毕业材料有时间窗，误事后果实打实。
    { energy: 1, mental: -2, health: 0, savings: 0, leadership: -2, trust: -3, parent: 0, colleague: 0, risk: 10, development: 0 }
  ],
  E149: [
    // A：就业押金诈骗的资金处置。
    { energy: -8, mental: -3, health: 0, savings: -80, leadership: 2, trust: 5, parent: 0, colleague: 1, risk: -17, development: 1 },
    null,
    // B：学生可能继续交钱。
    { energy: 2, mental: -3, health: 0, savings: 0, leadership: -3, trust: -5, parent: -1, colleague: 0, risk: 13, development: 0 }
  ],
  E152: [
    null,
    null,
    // B：考研与就业都悬着却“让他自己决定”，焦虑与错过春招的风险累积。
    { energy: 2, mental: -2, health: 0, savings: 0, leadership: -2, trust: -3, parent: 0, colleague: 0, risk: 9, development: 0 }
  ],
  E159: [
    // 帮他协调时间：毕业照与面试的两头奔波，高强度但把遗憾压到最小。
    { energy: -8, mental: -2, health: -1, savings: 0, leadership: 3, trust: 6, parent: 0, colleague: 0, risk: -6, development: 2 },
    // D：建议优先面试——理性选择，但毕业季的遗憾要落在信任与心理上。
    { energy: 1, mental: -2, health: 0, savings: 0, leadership: 0, trust: 1, parent: 0, colleague: 0, risk: 2, development: 0 },
    null
  ],
  E162: [
    null,
    null,
    // B：毕业聚餐争吵交给学生自行解决，最后一次集体记忆可能被毁掉。
    { energy: 2, mental: -2, health: 0, savings: 0, leadership: -3, trust: -4, parent: 0, colleague: -1, risk: 8, development: 0 }
  ],
  E163: [
    // A：毕业前突然失联，立即启动寻找。
    { energy: -9, mental: -4, health: -1, savings: -120, leadership: 3, trust: 5, parent: 3, colleague: 1, risk: -20, development: 1 },
    null,
    // B：继续等待，风险最高。
    { energy: 2, mental: 0, health: 0, savings: 0, leadership: -4, trust: -5, parent: -4, colleague: -2, risk: 15, development: 0 }
  ],
  E164: [
    // C：认真收下并回应，离别时刻的最高情感回报（低风险、少量精力）。
    { energy: -2, mental: 8, health: 0, savings: 0, leadership: 1, trust: 8, parent: 0, colleague: 0, risk: -2, development: 1 },
    // 提醒不必破费：为对方考虑，但情感回应缺席，学生略失落。
    { energy: -1, mental: 1, health: 0, savings: 0, leadership: 1, trust: -1, parent: 0, colleague: 0, risk: 0, development: 0 },
    // D：礼貌但克制的道谢——分寸正确，情绪价值最低。
    { energy: 0, mental: -2, health: 0, savings: 0, leadership: 0, trust: -3, parent: 0, colleague: 0, risk: 0, development: 0 }
  ],
  E165: [
    // C：做最后一次支持，收尾型高强度投入。
    { energy: -6, mental: 4, health: 0, savings: -50, leadership: 2, trust: 6, parent: 0, colleague: 1, risk: -5, development: 2 },
    null,
    // 尊重他慢慢来：压力下降，但去向未定的风险仍然留着。
    { energy: 1, mental: 1, health: 0, savings: 0, leadership: 0, trust: 1, parent: 0, colleague: 0, risk: 6, development: 0 }
  ],
  E166: [
    // C：陪他聊到说完，毕业季最强的情感收尾。
    { energy: -4, mental: 8, health: 0, savings: 0, leadership: 1, trust: 8, parent: 0, colleague: 0, risk: -3, development: 1 },
    // D：简单叮嘱几句——仍然是辅导员口吻，但告别被略过，遗憾留在信任与心理上。
    { energy: -1, mental: -2, health: 0, savings: 0, leadership: 0, trust: -2, parent: 0, colleague: 0, risk: 0, development: 0 },
    null
  ]
};
