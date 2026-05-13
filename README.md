# Vibeset

> 感觉即代码。

嵌入式动效调参 SDK——框架无关的 Web Components，让设计师在生产环境里直接调动效参数。

---

## 安装

```bash
pnpm add vibeset
```

一个包搞定。React / Vue / 原生 HTML 都能用。

---

## 快速接入

### 原生 HTML（零框架）

```html
<script type="module">
  import { createVibeset } from "vibeset";

  const store = createVibeset();

  // 注册一个可调动效
  store.register({
    id: "my-card",
    label: "卡片动效",
    schema: [
      { key: "speed", label: "动画速度", min: 0.1, max: 2, step: 0.05, group: "基础" },
      { key: "strength", label: "悬浮强度", min: 0, max: 1.5, step: 0.05, group: "基础" },
    ],
    defaultConfig: { speed: 0.5, strength: 0.8 },
    states: [{ value: "default", label: "默认" }, { value: "hover", label: "Hover" }],
    defaultState: "default",
  }, document.getElementById("my-card"));

  // 监听参数变更 → 更新动效
  store.bus.on("change", (d) => {
    if (d.targetId === "my-card") {
      document.getElementById("my-card").style.transition = `transform ${d.value}s`;
    }
  });

  // 挂载编辑器
  const editor = document.createElement("vibeset-editor");
  editor.theme = "dark";
  editor.store = store;
  document.body.appendChild(editor);
</script>
```

### React

```tsx
import { VibesetProvider, useVibeset } from "vibeset/react";

function App() {
  return (
    <VibesetProvider enabled theme="dark">
      <MyCard />
    </VibesetProvider>
  );
}

function MyCard() {
  const { ref, config } = useVibeset("my-card", MY_CARD_SCHEMA);
  return <div ref={ref} style={{ transform: `translateY(${-config.strength * 12}px)` }}>...</div>;
}
```

---

## 核心特性

- **框架无关** · Web Components，React / Vue / 原生 HTML 都能用
- **嵌入式面板** · 一行接入，一行移除（临时脚手架）
- **感觉旋钮** · 暴露可感知的维度，不是底层数学量
- **调参即 preview** · 松手自动走一遍动效
- **AI 友好 copy** · 复制出来是带 target id 的 TS patch，AI 一眼定位改写
- **多 target** · 同页多个动效各自独立调参
- **多状态预览** · 面板内切换 default / hover / 运行中

---

## 架构

```
vibeset/
├── src/
│   ├── core/          纯 JS 逻辑（types / events / store / state-machine）
│   ├── components/    Lit Web Components（panel / slider / launcher / overlay）
│   └── bindings/      框架绑定（react.ts）
├── dist/
│   ├── index.js       主入口（core + Web Components）
│   └── bindings/
│       └── react.js   React 绑定
└── examples/
    └── basic/         原生 HTML demo
```

---

## 开发

```bash
pnpm install
pnpm build          # tsup 构建
pnpm test           # 跑 core 单测（61 个）
```

---

## 设计哲学

### 感觉旋钮优先

不暴露 `yFactor` / `scaleFactor` / `staggerDelay`。
暴露 `悬浮强度` / `动画速度` / `翻牌节奏`。
一根旋钮驱动多个底层参数。

### 可拆除美德

SDK 是临时脚手架。调完移除，代码不留痕迹。

### AI 是协作者

面板让用户做决定。AI 负责执行 copy 出来的参数改动，不替用户猜值。

---

## License

MIT
