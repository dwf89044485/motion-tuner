# CLAUDE.md · Motion Tuner

## 产品定位

**感觉即代码。**

Motion Tuner 是一个嵌入式动效调参 SDK——一种**生产环境里的 AI 协作调参协议**。它让设计师在真实产品/预览环境中直接调动效参数，消除「感觉 → 参数 → 代码」之间的翻译损耗。

### 价值阈值

Motion Tuner 不是所有动效都需要的工具。它的价值只在**动效复杂度超过自然语言可精确描述的临界点**之后才出现：

**适合 Motion Tuner 的**：多参数耦合动效、多状态转场、复杂节奏控制、动态品牌表达、Agent 状态表达、设计师说不清但能感受到"不对"的部分。

**不需要 Motion Tuner 的**：简单 hover、简单 fade in/out、两个参数就能说清的动效——嘴说就行。

### 核心哲学：封装复杂度，不是暴露复杂度

Motion Tuner 不是把底层参数全部暴露给用户。而是：

> 把底层复杂度交给 AI 和系统，把用户能感知的"感觉维度"暴露出来。

不要让用户调 `duration=420, easing=cubic-bezier(...)，staggerDelay=0.08`。
让用户调「更轻/更重」「更快/更慢」「更弹/更稳」「节奏更紧/更松」。

**这背后是一个设计原则：专业参数重新映射成用户可感知的控制维度。**

### 它不是 Storybook

Motion Tuner 不是独立沙箱里的调参工具，而是**嵌入生产代码里的临时脚手架**。调完 → 复制 AI 友好参数 → AI 改代码 → 面板移除 → 产品不留痕迹。

它建立的是一种多角色协作方式：
- 设计师不用懂代码
- 开发不用反复猜感觉
- AI 能拿到结构化参数
- 产品/老板也能参与体验微调
- 最终代码不被调参 UI 污染

### 它解决的翻译链路

```
传统：设计师感觉 → 录屏/文字描述 → 开发猜参数 → 实现 → 验收 → "不对" → 继续猜
Motion Tuner：设计师感觉 → 感觉旋钮 → 实时 preview → 复制 TS patch → AI 改代码 → 上线
```

### Motion Tuner 在精度阶梯中的位置

```
0→70 分：自然语言生成高效，通用 AI 够用。Motion Tuner 不需要介入。
70→85 分：需要专业上下文+局部调整。Motion Tuner 开始有价值。
85→100 分：自然语言成本指数级上升（"几十轮对话还不对"）。Motion Tuner 核心价值区。
```

**不要在 0→70 阶段就上 Motion Tuner。先让 AI 生成够用的动效，到了"嘴说不清"的阶段再介入。**

### AI 是协作者，不是决策者

Motion Tuner 的面板是**让用户做决定的工具**，不是 AI 替用户定参数的工具。

- 给感觉旋钮 → 让用户调
- 多方案对比 → 让用户选
- AI 的角色：执行 copy 出来的参数改动，不是自己猜"用户可能喜欢什么值"

---

## 架构

pnpm monorepo，三层物理分离：

```
packages/
├── core/     零依赖纯逻辑（types / events / store / state-machine / export / measure）
├── react/    React bindings（Provider + useMotionTuner + useEditorController）
└── ui/       可视化控件（Slider / MotionPanel / EditorRuntime / Launcher / Overlay）
examples/
└── basic/    Vite + React 单屏 demo（翻牌大字 + ASCII 球 + 4 等大流程卡）
```

- `core` 不依赖 React，可以给 Vue/Svelte 写 binding
- `ui` 通过 `EditorRuntime` 一个组件包装全部交互（launcher + overlay + panel）
- `examples/basic` 是 SDK 的"门面"——新用户第一眼看的就是它

---

## 核心设计契约（AI 编码时必须遵守）

### 1. 调参松手必须触发 preview

每次用户调整参数（拖滑杆松手、点 +/- 按钮、输入数字回车），都必须 emit `param-commit` 事件。宿主组件消费 `lastCommit` 后走一遍动效 preview（default → hover → 恢复）。

**这是产品的核心交互循环。如果调完没反应，产品就是坏的。**

### 2. 面板全中文

所有用户可见文字必须是中文：
- 参数 label（"翻牌速度"不是"flipInterval"）
- 按钮（"复制代码""重置""动效编辑""退出"）
- 状态名（"默认""运行中""跟随鼠标"）
- 面板标题（"组件状态"不是"Component State"）

`showKeyName={false}` 是 EditorRuntime 的默认传法。

### 3. 感觉旋钮优先（先有再到好）

Schema 设计应遵循"感觉旋钮"哲学：暴露给设计师的是可感知的维度（"悬浮强度""翻牌速度"），不是底层数学量（"yFactor""flipIndex"）。

但这是 v2 的正式编码目标。v1 先确保功能跑通，再考虑 primary/advanced 分层。

### 4. 可拆除美德

SDK 的存在是临时的——调完即可移除。设计接入 API 时，确保：
- 删掉 `<EditorRuntime />` + `<MotionTunerProvider>` 后代码正常工作
- `useMotionTuner` 在没有 Provider 时返回 defaultConfig，组件不崩

### 5. Copy 格式给 AI 看

copy 按钮输出的格式是给 AI 消费的（不是给人类手动 paste 的）：
```
// motion-tuner: N change(s) for "翻牌大字" (id: "hero-flap")
// Apply to defaultConfig (find the MotionTargetDef whose id matches above):
{
  flipInterval: 90,  // 翻牌速度 · was 60
}
```

---

## 常用命令

```bash
# 开发
cd examples/basic && pnpm dev          # Vite dev server

# 构建（按依赖顺序）
pnpm --filter motion-tuner-core build
pnpm --filter motion-tuner-react build
pnpm --filter motion-tuner-ui build

# 构建 example（验证）
pnpm --filter motion-tuner-example-basic build

# 测试
pnpm --filter motion-tuner-core test
```

**注意**：改了 `packages/ui/src/*.tsx` 后必须 rebuild ui 包，example 才能看到变化（example 用的是 dist）。

---

## 接入新 target 的黄金路径

当要在 example 里加一个新的可调动效时：

1. **定义 `MotionTargetDef`**（schema + defaultConfig + states）
2. **在组件里 `useMotionTuner(id, def)`** 拿到 `{ ref, config, previewState, lastCommit }`
3. **用 config 驱动动效渲染**
4. **消费 lastCommit 触发 preview 动画**（这一步容易遗漏！）
5. **消费 previewState 响应状态切换**（free/default/hover 等）
6. **给组件根元素加 `ref` + `data-motion-target-id`**
7. **验证**：打开面板 → 选中 → 调参 → 松手看 preview → 切状态看响应

第 4 步是最常遗漏的——SDK 目前不内置 preview 循环，需要宿主自己写 timer。

---

## 已知 backlog（不要自作主张实现）

以下功能已明确规划但**尚未启动**，编码时不要提前引入：

- [ ] SDK 内置松手 preview 机制（从 opt-in 变 built-in）
- [ ] primary/advanced 旋钮分层（tier 字段 + drives 关系）
- [ ] controlled mode（外部 state 接管 SDK store）
- [ ] 音效参数化
- [ ] style / comment 平行系统
- [ ] Vue/Svelte binding

---

## Example 特定说明

`examples/basic` 当前是单屏 demo，包含 3 个 target：

| Target | id | 说明 |
|--------|-----|------|
| 翻牌大字 | `hero-flap` | SplitFlap 效果，hover 重翻，可切"运行中"持续翻 |
| 字符球体 | `ascii-sphere` | Canvas rAF 渲染，参数通过 ref 实时读 |
| 底部流程卡 | `flow-cards` | hover 动效（边框/标题/副文案/角标）|

球体始终绝对定位右上角，最小 700px，随屏幕缩放但不小于 700。
底部 4 等大卡高度 180px，副文案默认隐藏 hover 时 fade + 上浮出现。
