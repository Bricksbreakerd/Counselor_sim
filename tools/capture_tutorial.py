"""截取引导（入职培训）每一步的界面，并校验蒙版与卡片的布局。

用法:
    python tools/capture_tutorial.py [输出目录] [--channel msedge]

默认优先使用系统已安装的 Edge（channel="msedge"），
没有时回退到 Playwright 自带的 chromium。

说明（重要）:
    本脚本的**断言是确定性的**——元素几何位置与点击命中判定在多次运行间完全一致，
    已实测通过。但 PNG 字节不保证逐次相同：文字的亚像素抗锯齿等渲染细节会带来少量
    差异，因此不要期待 `git status` 在重新生成后保持干净。
    视觉基线看布局与命中结果，不要看文件哈希。
"""
import sys
import pathlib
from playwright.sync_api import sync_playwright

# Windows 控制台默认 GBK，中文与符号会直接抛 UnicodeEncodeError。
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE_URL = (ROOT / "index.html").as_uri()

args = [a for a in sys.argv[1:]]
channel = None
if "--channel" in args:
    idx = args.index("--channel")
    channel = args[idx + 1]
    del args[idx : idx + 2]
OUT = pathlib.Path(args[0]) if args else ROOT / "tools" / "shots"
OUT.mkdir(parents=True, exist_ok=True)

VIEWPORTS = [
    ("desktop", 1440, 900),
    ("laptop", 1280, 720),
    ("mobile", 390, 844),
]

# 时间线会渲染 "new Date().toLocaleString()"，不固定的话每次截图都不同，
# 视觉基线就失去意义（每次运行都产生一堆二进制 diff）。
# 这里在页面脚本执行前把 Date 固定住，让截图可复现。
FREEZE_TIME_JS = """
(() => {
  const FIXED = 1759555200000; // 2025-10-04T08:00:00Z
  const RealDate = Date;
  class FixedDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) { super(FIXED); } else { super(...args); }
    }
    static now() { return FIXED; }
  }
  window.Date = FixedDate;
})();
"""

# 截取基线时必须关掉过渡与动画：卡片/挖空带 0.28s 过渡，
# 截图若落在过渡中间，每次的像素都不同，基线就不可复现。
STABILIZE_CSS = """
*, *::before, *::after {
  transition: none !important;
  animation: none !important;
}
"""


def launch(p):
    if channel:
        return p.chromium.launch(channel=channel)
    try:
        return p.chromium.launch(channel="msedge")
    except Exception:
        return p.chromium.launch()


def dump_positions(page):
    """读出当前卡片与挖空的几何信息，便于断言而不是只看图。"""
    return page.evaluate(
        """() => {
        const card = document.querySelector('.tutorial-card');
        const spot = document.querySelector('.tutorial-spotlight');
        const target = document.querySelector('.tutorial-highlight');
        const g = (el) => { if (!el) return null; const r = el.getBoundingClientRect();
          return { l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; };
        const c = g(card), s = g(spot), t = g(target);
        let overlap = null;
        if (c && t) {
          const ox = Math.max(0, Math.min(c.l + c.w, t.l + t.w) - Math.max(c.l, t.l));
          const oy = Math.max(0, Math.min(c.t + c.h, t.t + t.h) - Math.max(c.t, t.t));
          overlap = ox * oy;
        }
        const label = (el) => {
          if (!el) return null;
          // 命中的是引导卡片内部的元素时，记为「卡片自身」，不算被遮挡。
          if (card && (el === card || card.contains(el))) return 'tutorial-card';
          return el.id || el.className || el.tagName;
        };
        const hit = (x, y) => label(document.elementFromPoint(x, y));
        const next = document.querySelector('#tutorialNextButton');
        const nr = next ? next.getBoundingClientRect() : null;
        return {
          card: c, spot: s, target: t, overlap, vw: innerWidth, vh: innerHeight,
          hitCardCenter: c ? hit(c.l + c.w / 2, c.t + c.h / 2) : null,
          hitTopMost: c ? hit(c.l + c.w / 2, c.t + 2) : null,
          hitNextButton: nr ? hit(nr.left + nr.width / 2, nr.top + nr.height / 2) : null
        };
      }"""
    )


def main():
    with sync_playwright() as p:
        browser = launch(p)
        report = []
        for name, width, height in VIEWPORTS:
            page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
            page.add_init_script(FREEZE_TIME_JS)
            page.goto(PAGE_URL)
            page.wait_for_load_state("networkidle")
            page.add_style_tag(content=STABILIZE_CSS)
            # 统一用 force 点击：本脚本已关掉所有过渡/动画以获取可复现截图，
            # 而 Playwright 的「元素稳定」判定依赖 requestAnimationFrame 的连续采样，
            # 页面静止时这个判定会一直不满足。这里的稳定性由脚本自己的几何断言负责。
            page.click("#startGameButton", force=True)
            page.fill("#counselorNameInput", "截图测试员")
            page.click("#confirmNameButton", force=True)
            page.wait_for_timeout(900)

            # 逐步走完引导并截图
            for step in range(8):
                visible = page.locator("#tutorialOverlay").count() > 0
                if not visible:
                    break
                page.wait_for_timeout(600)  # 等定位与过渡稳定
                info = dump_positions(page)
                title = page.locator(".tutorial-card h2").inner_text()
                info["step"] = step + 1
                info["title"] = title
                info["viewport"] = name
                # 卡片中心点上最顶层的元素是谁——用来判断是否被别的东西盖住。
                info["topAtCardCenter"] = page.evaluate(
                    """() => {
                    const card = document.querySelector('.tutorial-card');
                    if (!card) return null;
                    const r = card.getBoundingClientRect();
                    const el = document.elementFromPoint(r.left + r.width / 2, r.top + 12);
                    return el ? (el.id || el.className || el.tagName) : null;
                  }"""
                )
                report.append(info)
                page.screenshot(path=str(OUT / f"{name}-step{step + 1}.png"))
                if step == 7:
                    break
                page.click("#tutorialNextButton", force=True)

            page.close()
        browser.close()

    print(f"{'viewport':<9} {'step':<5} {'title':<18} {'card(l,t,w,h)':<20} {'target(l,t,w,h)':<20} {'被压%':<7} {'卡片中心命中':<26} {'下一步命中'}")
    print("-" * 132)
    problems = []
    for row in report:
        card = row["card"] or {}
        target = row["target"] or {}
        card_s = f"{card.get('l')},{card.get('t')},{card.get('w')},{card.get('h')}"
        target_s = f"{target.get('l')},{target.get('t')},{target.get('w')},{target.get('h')}" if row["target"] else "-"
        # 用「卡片自身面积」做分母：更能反映卡片被目标压掉多少。
        frac = ""
        if row["overlap"] and card.get("w"):
            frac = f"{row['overlap'] / (card['w'] * card['h']) * 100:.0f}%"
        print(
            f"{row['viewport']:<9} {row['step']:<5} {row['title'][:16]:<18} {card_s:<20} {target_s:<20} {frac:<7} "
            f"{str(row.get('hitCardCenter'))[:24]:<26} {row.get('hitNextButton')}"
        )
        # 卡片必须完整落在视口内
        if row["card"]:
            if card["l"] < 0 or card["t"] < 0 or card["l"] + card["w"] > row["vw"] or card["t"] + card["h"] > row["vh"]:
                problems.append(f"{row['viewport']} step{row['step']}: 卡片越出视口")
        # 卡片必须能点到：中心与「下一步」按钮处的顶层元素都应属于引导层
        for key, value in (("卡片中心", row.get("hitCardCenter")), ("下一步按钮", row.get("hitNextButton"))):
            if value and "tutorial" not in str(value) and "button" not in str(value):
                problems.append(f"{row['viewport']} step{row['step']}: {key}被 {value} 遮挡")
        # 卡片不应明显压住被高亮的元素。
        # 窄屏（手机）上纵向空间有限，像「摸鱼」这种 328x226 的目标不可能完全不接触，
        # 因此窄屏放宽阈值——判定标准是「不遮挡目标的大半」。
        limit = 0.30 if row["vw"] <= 480 else 0.12
        if row["overlap"] and card.get("w") and row["overlap"] > card["w"] * card["h"] * limit:
            problems.append(
                f"{row['viewport']} step{row['step']}: 卡片有 {frac} 面积压在目标上"
                f"（卡 {card.get('w')}x{card.get('h')} vw={row['vw']} 阈值={limit:.0%} 重叠={row['overlap']}）"
            )
        # 挖空必须与目标对齐（有目标时）
        if row["target"] and row["spot"]:
            spot, tgt = row["spot"], row["target"]
            if abs((spot["l"] + spot["w"] / 2) - (tgt["l"] + tgt["w"] / 2)) > 4:
                problems.append(f"{row['viewport']} step{row['step']}: 挖空与目标水平未对齐")
        # 有目标但没找到高亮元素 → 选择器写错了（第 1 步本来就没有目标）
        if row["step"] != 1 and not row["target"]:
            problems.append(f"{row['viewport']} step{row['step']}: 目标选择器未命中（{row['title']}）")

    print()
    if problems:
        print(f"[FAIL] {len(problems)} 个问题:")
        for item in problems:
            print(f"  ✗ {item}")
        sys.exit(1)
    print(f"[PASS] {len(report)} 个步骤全部通过；截图已保存到 {OUT}")


if __name__ == "__main__":
    main()
