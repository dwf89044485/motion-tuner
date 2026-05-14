# Vibemotion · AI 接入指引

> 本文件随 npm 包发布，供项目 AI（Cursor / Codebuddy / Claude 等）读取并执行接入。

## 你的任务

帮用户把 vibemotion 接入当前项目。vibemotion 是一个嵌入式动效调参面板——用户拖感觉旋钮调参数，调完复制参数改代码，面板移除不留痕迹。

## 接入流程

### 1. 问用户

问：「你想把哪个组件或动效接入 vibemotion 调参面板？」

等用户指定后，读那个组件的源码，继续下一步。

### 2. 参数提炼

读组件源码，找出所有可调的动效参数。**这一步是你的内部工作，分析过程不要输出给用户。** 用户不需要看到 `cubic-bezier(.16,1,.3,1)` 或 `translateY(16px)` 这些底层细节。

提炼规则：
- **过滤**：去掉用户感知不到差别的底层数学量
- **聚合**：可合并的参数合成一根旋钮（比如 translateY + scale + blur → "悬浮强度"）
- **命名**：每个旋钮给中文 label（"入场速度"不是 "durationBase"）
- **区间**：min/max 只给有效感知区间，极值不能导致视觉崩溃

**直接把结果给用户，不要展示源码分析过程。** 格式：

```
建议暴露以下 N 个感觉旋钮：

1. 入场速度 — 整体动画快慢
2. 错峰节奏 — 元素一个接一个出现的间隔
3. 上浮距离 — 元素从下方升起的幅度
...
N+1. 全部（含以上 + 底层参数）

去掉哪个？或直接确认。
```

每个旋钮就是名字 + 一句话说明，不要加代码、不要加文件路径、不要加技术细节。

### 3. 写接入代码

根据项目技术栈选择方式。

#### 通用方式（任何框架 / 原生 HTML）

```js
import { createVibeset } from "vibemotion";

// 创建 store
const store = createVibeset();

// 注册 target
store.register({
  id: "组件id",
  label: "中文名称",
  schema: [
    { key: "speed", label: "动画速度", min: 0.1, max: 2, step: 0.05, group: "基础" },
    // ... 用户确认的旋钮
  ],
  defaultConfig: { speed: 0.5 },
  states: [
    { value: "default", label: "默认" },
    { value: "hover", label: "Hover" },
  ],
  defaultState: "default",
}, document.getElementById("目标元素"));

// 监听参数变更 → 更新动效渲染
store.bus.on("change", (d) => {
  if (d.targetId === "组件id") {
    const config = store.store.getConfig("组件id");
    // 用 config 里的值驱动动效
  }
});

// 监听松手 → 触发 preview（必须接！）
store.bus.on("param-commit", (d) => {
  if (d.targetId === "组件id") {
    // 走一遍动效 preview（比如 default → hover → 恢复）
  }
});

// 挂载编辑器面板
const editor = document.createElement("vibeset-editor");
editor.theme = "dark";
editor.store = store;
document.body.appendChild(editor);
```

#### React 方式

```tsx
import { VibesetProvider, useVibeset } from "vibemotion/react";

// App 层包裹 Provider
function App() {
  return (
    <VibesetProvider enabled theme="dark">
      <YourComponent />
    </VibesetProvider>
  );
}

// 组件里用 hook
function YourComponent() {
  const { ref, config, previewState, lastCommit } = useVibeset("组件id", schema);

  // config 是响应式的，直接用来驱动渲染
  // lastCommit 变化时触发一次 preview 动画（必须接！）

  return <div ref={ref} data-motion-target-id="组件id">...</div>;
}
```

### 4. param-commit 必须接

这是最容易遗漏的一步。用户松手后必须走一遍 preview 动画（比如 default → hover → 恢复），否则用户调了参数看不到效果，产品体验是坏的。

写完后立即验证：调参 → 松手 → preview 动了没。没动就是漏了。

### 5. 自检

接完后验证以下几条，全过才算完成：

- [ ] 每个 slider 调到极值不崩、不变形
- [ ] 松手后 preview 动画触发
- [ ] 所有 label 是中文，无 key name 泄露
- [ ] 删掉 vibemotion 相关代码后组件正常渲染（可拆除）

### 6. 告诉用户收尾方式

调完参数后：
1. 点面板里的「复制代码」按钮
2. 拿到参数 patch（带 target id 的 TS 对象）
3. 把值更新到 defaultConfig
4. 删掉 vibemotion 相关代码

产品不留痕迹。
