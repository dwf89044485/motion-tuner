---
name: motion-connect
description: >
  将组件接入 vibemotion 动效调参面板。当用户说「加动效面板」「接入调参」
  「给 XX 组件加参数调节」「接动效」「vibemotion」「调参面板」时触发。
  也适用于用户要求让某个组件的动画参数可以实时调节的场景。
---

# Motion Connect — 接入 vibemotion 调参面板

将一个已有动效的组件接入 vibemotion，使其参数可通过面板实时调节预览。

## 执行流程

按以下阶段顺序执行。

---

### 阶段 0：环境检测

#### 0A. vibemotion 是否已安装

```bash
# 检查 package.json 是否包含 vibemotion
grep "vibemotion" package.json
```

- 已有 → 跳过
- 没有 → `pnpm add vibemotion`（或 npm/yarn，看项目用什么）

#### 0B. 编辑器面板是否已挂载

搜索项目代码里是否已有 `vibeset-editor` 或 `VibesetProvider`：

- **已有** → 跳过，直接进入阶段 1
- **没有** → 根据技术栈挂载：

**React 项目**：在 App 入口包裹 Provider

```tsx
import { VibesetProvider } from "vibemotion/react";

function App() {
  return (
    <VibesetProvider enabled theme="dark">
      {/* 原有内容 */}
    </VibesetProvider>
  );
}
```

**非 React 项目**：在入口文件创建 store 并挂载 editor

```js
import { createVibeset } from "vibemotion";

const store = createVibeset();

const editor = document.createElement("vibeset-editor");
editor.theme = "dark";
editor.store = store;
document.body.appendChild(editor);
```

挂载完成后，右下角应该出现「动效编辑」按钮。如果没出现，检查 import 是否生效。

---

### 阶段 1：扫描与确认

**入口**：用户指定了要接入的组件。如果用户没指定，问：「你想把哪个组件或动效接入调参面板？」

#### 1A. 读源码，提炼感觉旋钮

读组件源码，找出所有动画相关的可调数值。**这是你的内部工作，分析过程不要输出给用户。**

提炼规则：
- 过滤掉用户感知不到差别的底层量
- 可聚合的参数合成一根旋钮（如 translateY + scale → "悬浮强度"）
- 每个旋钮给中文 label
- min/max 只给有效感知区间，极值不崩

#### 1B. 发现可切换状态

组件往往有多种视觉状态，用户需要切换状态来预览不同动效。扫描：
- props 传入的模式（mode/variant/type）
- 内部 state（collapsed/isOpen）
- 交互态（hover/active/focus）

推荐暴露：状态间视觉差异大且有动画过渡的。
建议跳过：纯静态内容替换、差异太小的。

#### 1C. 呈现给用户

**不要展示代码、文件路径、技术细节。** 直接给旋钮列表：

```
建议暴露以下 N 个感觉旋钮：

1. 入场速度 — 整体动画快慢
2. 错峰节奏 — 元素一个接一个出现的间隔
3. 上浮距离 — 元素从下方升起的幅度
...

可切换状态：
- 默认 — 正常显示
- 悬停 — 鼠标悬浮时的效果
- 自由 — 不干预，按正常交互响应

N+1. 全部（含以上 + 底层参数）

去掉哪个？或直接确认。
```

每个旋钮：名字 + 一句话说明。不要加代码、变量名、文件路径。

**阻断条件**：如果没有可调参数也没有有意义的状态，告知用户该组件目前是纯静态的，建议先完成动效开发再接入。终止流程。

**等用户确认后才进入阶段 2。**

---

### 阶段 2：写代码

用户确认后，一口气完成接入。

#### React 项目

```tsx
import { useVibeset } from "vibemotion/react";
import type { MotionTargetDef } from "vibemotion";

const COMPONENT_MOTION: MotionTargetDef = {
  id: "组件id",
  label: "中文名称",
  schema: [
    { key: "speed", label: "动画速度", min: 0.1, max: 2, step: 0.05, group: "基础" },
    // ... 用户确认的旋钮
  ],
  defaultConfig: { speed: 0.5 },
  states: [
    { value: "free", label: "自由" },
    { value: "default", label: "默认" },
    { value: "hover", label: "悬停" },
  ],
  defaultState: "free",
};

function Component() {
  const { ref, config, previewState, lastCommit } = useVibeset("组件id", COMPONENT_MOTION);

  // ① 用 config 驱动动效渲染（替换硬编码值）
  // ② 用 previewState 强制切换视觉状态（"free" 时不干预）
  // ③ 监听 lastCommit 触发 preview 动画（必须接！）

  return <div ref={ref} data-motion-target-id="组件id">...</div>;
}
```

#### 非 React 项目

```js
import { createVibeset } from "vibemotion";

const store = createVibeset(); // 如果阶段 0 已创建，复用同一个

store.register({
  id: "组件id",
  label: "中文名称",
  schema: [/* 用户确认的旋钮 */],
  defaultConfig: { speed: 0.5 },
  states: [/* 状态列表 */],
  defaultState: "free",
}, document.getElementById("目标元素"));

// ① 参数变更 → 更新渲染
store.bus.on("change", (d) => {
  if (d.targetId === "组件id") {
    const config = store.store.getConfig("组件id");
    // 用 config 驱动动效
  }
});

// ② 松手 → preview（必须接！）
store.bus.on("param-commit", (d) => {
  if (d.targetId === "组件id") {
    // 走一遍动效 preview
  }
});
```

#### 关键：param-commit 必须接

这是最容易遗漏的一步。用户松手后必须走一遍 preview 动画，否则调了参数看不到效果。

写完后立即验证：调参 → 松手 → preview 动了没。没动就是漏了。

#### 验证

```bash
npx tsc --noEmit   # 零报错
npm run build       # 成功
```

---

### 阶段 3：报告

```
✅ [组件名] 已接入 vibemotion 调参面板

修改的文件：
- [文件路径] — N 个感觉旋钮，K 个可切换状态

验证：tsc ✅  build ✅

现在点右下角「动效编辑」→ 选中 [组件名] → 拖滑杆调参。
调完点「复制代码」→ 把参数发给 AI 更新代码 → 删掉 vibemotion 相关代码。
```

---

## 注意事项

- `defaultConfig` 的值必须和组件当前硬编码值一致，确保接入前后行为不变
- 没有状态切换需求时省略 `states` 和 `defaultState`
- 组件还没有动效（纯静态）→ 先做动效再接面板，这是两个独立阶段
- 始终保留 `"free"`（自由）状态，让用户回到正常交互模式
- vibemotion 面板支持热插拔——上线前删掉相关代码即可，产品不留痕迹
