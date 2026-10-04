# 推送到 GitHub —— 命令清单

本地仓库已经初始化好，首次提交也已完成，你只需要把下面的命令复制到自己的终端执行。

```
提交: ffe4a63  辅导员模拟器：数值系统重构 + 事件数据驱动 + 回归测试
分支: main
文件: 43 个 / 10,293 行
```

---

## 1. 在 GitHub 上建仓库

打开 <https://github.com/new>，填一个仓库名（例如 `Counselor_sim`）。

**不要**勾选 "Add a README file"、"Add .gitignore"、"Choose a license" ——
本地已经有提交，勾了会导致首次 push 被拒（non-fast-forward）。

---

## 2. 关联远程并推送

把下面第一行的地址换成你刚建好的仓库地址（注意结尾是 `.git`）。

```bash
cd "D:\super-stupid\deepseek\Counselor_sim-main"

git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

推送时会要求登录。两种方式任选：

- **浏览器登录**：装了 Git Credential Manager 时会自动弹窗，点一下即可。
- **Personal Access Token**：如果提示输入密码，粘贴一个 token
  （GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens，
  权限只需 `Contents: Read and write`）。
  **不要把 token 发在对话里。**

---

## 3. 验证

```bash
git remote -v                 # 应显示你刚加的 origin
git log --oneline -1          # 应为 ffe4a63
git status                    # 应为 "nothing to commit, working tree clean"
```

---

## 如果推送被拒绝

**报错 `remote contains work that you do not have locally`**
说明建仓库时勾了 README 等文件。最省事的做法是拉取合并后再推：

```bash
git pull --rebase origin main
git push -u origin main
```

如果不想保留远程那个自动生成的提交，也可以强制覆盖（**只在确认远程没有别人的提交时用**）：

```bash
git push -u origin main --force
```

**报错 `remote origin already exists`**
说明你之前加过。改地址即可：

```bash
git remote set-url origin https://github.com/<你的用户名>/<仓库名>.git
```

---

## 关于仓库内容

- 43 个文件，约 6.85 MB。其中 `tools/shots/` 的 24 张引导截图占约 6.5 MB，
  是引导布局的视觉基线，用于日后对比布局是否回归。
- `.gitignore` 已排除 `__pycache__/`、`node_modules/`、编辑器与系统文件。
- 工作区根目录 D:\super-stupid\deepseek 下的 `_analysis/` 临时测算脚本
  **不在**这个仓库里，不会被推送。如需保留请另行处理。
- 已扫描全部源码与文档，**未发现任何密钥、token 或凭据**。

---

## 之后如何继续提交

```bash
cd "D:\super-stupid\deepseek\Counselor_sim-main"
git add -A
git commit -m "描述这次改了什么"
git push
```

推送前建议先跑一遍三套测试：

```bash
node src/harness.mjs --runs 200    # 逻辑回归（68 条断言 + 数值曲线）
node src/smoke-test.mjs            # 浏览器集成（39 条断言）
python tools/capture_tutorial.py   # 引导布局（24 个步骤 × 3 种视口）
```
