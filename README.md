# Vibemotion

> 感觉即代码。

动效一旦复杂，自然语言的精度就不够了——"再快一点但不要失去弹性"，改哪个参数？快多少？弹性是哪个系数？

Vibemotion 是一个嵌入式动效调参面板。设计师在生产环境里直接拖感觉旋钮，调完复制参数，AI 改代码，面板移除，产品不留痕迹。

框架无关（Web Components），React / Vue / 原生 HTML 都能用。

---

## 接入

把下面的内容复制给你项目的 AI（Cursor / Codebuddy / Claude 等），它会引导你完成接入。

```
你要帮用户把 vibemotion 接入当前项目。vibemotion 是一个嵌入式动效调参 SDK，用户拖面板里的感觉旋钮调参数，调完复制参数改代码，面板移除不留痕迹。

## 第一步：问用户

问用户：「你想把哪个组件或动效接入 vibemotion 调参面板？」

等用户指定后，读那个组件的源码，继续。

## 安装

pnpm add vibemotion

## 参数提炼

读用户指定的组件源码，列出所有可调的动效参数（duration, easing, translateY, scale, opacity, blur, stagger 等）。然后：

1. 过滤掉用户感知不到差别的底层数学量
2. 可聚合的参数合成一根旋钮（比如 translateY + scale + blur → "悬浮强度"）
3. 每个旋钮给中文 label（"翻牌速度"不是"flipInterval"）
4. min/max 只给有效感知区间，不给数学全量程，极值不能导致视觉崩溃

然后呈现给用户确认：

  建议暴露以下 N 个感觉旋钮：
  1. 翻牌速度 — 控制每次翻页的快慢
  2. 悬浮强度 — 悬浮时的抬升感
  3. ...
  N+1. 全部（含以上 + 底层参数）
  去掉哪个？或直接确认。

用户确认后继续。

## 接入代码

根据项目技术栈选择接入方式。

### 通用方式（任何框架）

import { createVibeset } from "vibemotion";

const store = createVibeset();

store.register({
  id: "组件id",
  label: "中文名称",
  schema: [
    // 用户确认的旋钮列表
    { key: "speed", label: "动画速度", min: 0.1, max: 2, step: 0.05, group: "基础" },
  ],
  defaultConfig: { speed: 0.5 },
  states: [
    { value: "default", label: "默认" },
    { value: "hover", label: "Hover" },
  ],
  defaultState: "default",
}, document.getElementById("组件DOM元素"));

// 监听参数变更 → 更新动效
store.bus.on("change", (d) => {
  if (d.targetId === "组件id") {
    // 用 store.store.getConfig("组件id") 读最新参数，驱动渲染
  }
});

// 监听松手 → 触发一次 preview 动画（必须接！）
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

### React 方式

import { VibesetProvider, useVibeset } from "vibemotion/react";

// App 层包裹 Provider
<VibesetProvider enabled theme="dark">
  <YourComponent />
</VibesetProvider>

// 组件里用 hook
const { ref, config, previewState, lastCommit } = useVibeset("组件id", schema);
// config 是响应式的，直接用来驱动渲染
// lastCommit 变化时触发一次 preview 动画（必须接！）

## 关键规则

- param-commit 必须接：用户松手后必须走一遍 preview 动画，否则产品体验是坏的
- label 全中文：参数名、按钮、状态名全部用中文
- 可拆除：删掉 vibemotion 相关代码后，组件必须正常工作

## 自检

接完后验证：
- 每个 slider 调到极值不崩
- 松手后 preview 动画触发
- 所有 label 是中文
- 删掉面板后组件正常渲染

## 用户调完之后

告诉用户：点面板里的「复制代码」按钮，拿到参数 patch，把值更新到 defaultConfig 里，然后删掉 vibemotion 相关代码。产品不留痕迹。
```

---

## License

MIT
