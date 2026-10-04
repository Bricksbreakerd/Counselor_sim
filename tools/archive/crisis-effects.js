// 危机事件（E61-E70）的显式选择效果覆写表
// key = 事件 id，数组下标对应 choices 的下标；null 表示沿用 tone 推导值
//
// 设计约定：
// 1) engine.js 的 resolveChoiceEffects 是「逐字段覆盖」而非整表替换，
//    未声明的字段仍会拿到 tone + category 的兜底值。因此这里每个 choice
//    都给出完整的一套数值（含 health 与所有关系字段），避免隐式叠加。
// 2) 每个 choice 至少有一项真实代价，不存在全项为正的选项。
// 3) 三选一的结构：高投入现场处置（伤身体/心理，risk 降最多）
//    / 走流程与专业转介（代价中等，risk 降中等，关系有波动）
//    / 回避或转嫁（精力几乎不花，risk 大幅上升，信任或领导评价受损）。
// 4) risk 为负数是降低班级风险（好事）。
window.GameDataCrisisEffects = {
  // E61 电信诈骗：陪报警止损 / 家长介入 / 仅安抚，资金与网贷风险仍在
  E61: [
    { energy: -6, mental: -4, health: -1, risk: -14, trust: 5, leadership: 2, savings: -200 },
    { energy: -3, mental: -3, risk: -11, trust: -2, parent: 4, savings: -100 },
    { energy: -1, mental: -2, risk: 8, trust: -3, leadership: -2 },
  ],
  // E62 宿舍矛盾：分开谈话+评估换宿 / 集体调解 / 直接换宿，只是把冲突挪走
  E62: [
    { energy: -8, mental: -5, health: -1, risk: -15, trust: 4, leadership: 2, colleague: 1 },
    { energy: -5, mental: -3, risk: -9, trust: 3, colleague: 2 },
    { energy: -2, mental: -1, risk: 9, trust: -2, leadership: -3, colleague: -2 },
  ],
  // E63 危险信号：立即介入护住人但身心透支 / 通知心理中心与家长 / 靠室友陪伴
  E63: [
    { energy: -10, mental: -9, health: -2, risk: -20, trust: 6, leadership: 3, parent: 2 },
    { energy: -5, mental: -4, health: -1, risk: -13, trust: -2, parent: 4, colleague: 2, leadership: 1 },
    { energy: -2, mental: -3, risk: 7, trust: -4, colleague: -3 },
  ],
  // E64 独自赴边境：直接联系本人 / 上报保卫处 / 发动同学找人
  E64: [
    { energy: -9, mental: -7, health: -1, risk: -17, trust: 5, leadership: 2, parent: 2, savings: -100 },
    { energy: -4, mental: -3, risk: -13, trust: -3, leadership: 2, colleague: 2 },
    { energy: -2, mental: -3, risk: 11, trust: -5, leadership: -2, colleague: -1 },
  ],
  // E65 疑似传销：报警寻人（快而硬）/ 保持联系套位置 / 等待回复
  E65: [
    { energy: -8, mental: -6, health: -1, risk: -16, trust: -1, parent: 5, leadership: 2, colleague: 1 },
    { energy: -9, mental: -8, health: -2, risk: -11, trust: 3, parent: 1, savings: -100 },
    { energy: -1, mental: -2, risk: 6, trust: -3, leadership: -2 },
  ],
  // E66 网络勒索：陪同报警取证 / 转心理中心（法律未解决）/ 让学生自己扛
  E66: [
    { energy: -7, mental: -6, health: -1, risk: -16, trust: 6, leadership: 2, savings: -150 },
    { energy: -4, mental: -4, risk: -9, trust: 2, parent: 2, colleague: 2 },
    { energy: -1, mental: -2, risk: 12, trust: -5, leadership: -2 },
  ],
  // E67 考试压力失控：先离场稳定再协调考试 / 校医院+心理中心 / 鼓励硬撑
  E67: [
    { energy: -8, mental: -5, health: -1, risk: -15, trust: 5, leadership: -1, colleague: -1, savings: -100 },
    { energy: -4, mental: -2, risk: -12, trust: -1, colleague: 2, leadership: 2 },
    { energy: -2, mental: -1, risk: 9, trust: -3, leadership: -2 },
  ],
  // E68 见网友失联：直接核实位置 / 报保卫处 / 请同学继续联系
  E68: [
    { energy: -8, mental: -6, health: -1, risk: -16, trust: 4, leadership: 2, colleague: 1 },
    { energy: -4, mental: -3, risk: -13, trust: -4, leadership: 1, colleague: 2 },
    { energy: -1, mental: -1, risk: 10, trust: -3, colleague: -3 },
  ],
  // E69 家庭变故：先弄清情况 / 立刻办临时请假 / 劝冷静后再定
  E69: [
    { energy: -5, mental: -5, risk: -12, trust: 3, parent: 3, colleague: 1 },
    { energy: -6, mental: -4, health: -1, risk: -13, trust: 5, parent: 2, leadership: -2 },
    { energy: -2, mental: -2, risk: 7, trust: -4, parent: 2, leadership: -1 },
  ],
  // E70 自伤被发现（保密冲突）：安全优先+专业支持 / 承诺保密 / 通知家长
  E70: [
    { energy: -10, mental: -11, health: -2, risk: -22, trust: -3, leadership: 3, parent: 2 },
    { energy: -6, mental: -8, health: -1, risk: -8, trust: 4, colleague: -2 },
    { energy: -4, mental: -4, risk: -14, trust: -5, parent: 6, leadership: -2 },
  ],
};
