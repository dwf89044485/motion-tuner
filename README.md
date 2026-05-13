# Motion Tuner

> 感觉即代码。

嵌入式动效调参 SDK——让设计师在生产环境里直接调动效参数，消除 Design-to-Code 之间的翻译损耗。

---

## 为什么需要它

动效一旦复杂（多参数耦合、多状态转场、复杂节奏），自然语言的精度就不够了：

```
设计师："再快一点，但不要失去弹性"
开发：改哪个参数？快多少？弹性是哪个系数？
```

Motion Tuner 把这条翻译链路砍掉：

```
设计师 → 拖感觉旋钮 → 实时 preview → 复制 TS patch → AI 改代码 → 上线
```

---

## 核心特性

- **嵌入式面板** · 一行接入生产代码，一行移除（临时脚手架）
- **感觉旋钮** · 暴露给设计师的是可感知的维度，不是底层数学量
- **多状态预览** · 面板内切换 default / hover / 运行中，不用边 hover 边够滑杆
- **调参即 preview** · 松手自动走一遍动效（slider / +/- / 数字输入都触发）
- **AI 友好 copy** · 复制出来是带 target id 的 TS object，AI 一眼定位改写
- **多 target** · 同页多个动效组件各自独立调参

---

## 安装

```bash
pnpm add motion-tuner-core motion-tuner-react motion-tuner-ui
```

---

## 快速接入（5 步）

### 1. 定义 schema

```tsx
import type { MotionTargetDef } from "motion-tuner-core";

const MY_MOTION: MotionTargetDef = {
  id: "my-card",
  label: "卡片动效",
  schema: [
    { key: "hoverStrength", label: "悬浮强度", min: 0, max: 1.5, step: 0.05, group: "基础" },
    { key: "speed", label: "动画速度", min: 0.1, max: 1.2, step: 0.05, group: "基础" },
  ],
  defaultConfig: {
    hoverStrength: 0.8,
    speed: 0.5,
  },
  states: [
    { value: "free", label: "跟随鼠标" },
    { value: "default", label: "默认" },
    { value: "hover", label: "Hover" },
  ],
  defaultState: "free",
};
```

### 2. 在组件里用 hook

```tsx
import { useMotionTuner } from "motion-tuner-react";

function MyCard() {
  const { ref, config, previewState, lastCommit } = useMotionTuner("my-card", MY_MOTION);

  // 用 config 驱动动效
  const style = {
    transform: `translateY(${-config.hoverStrength * 12}px)`,
    transition: `transform ${config.speed}s ease`,
  };

  return <div ref={ref} data-motion-target-id="my-card" style={style}>...</div>;
}
```

### 3. 包裹 Provider + 挂 EditorRuntime

```tsx
import { MotionTunerProvider } from "motion-tuner-react";
import { EditorRuntime } from "motion-tuner-ui";

function App() {
  return (
    <MotionTunerProvider enabled>
      <MyCard />
      <EditorRuntime theme="dark" showKeyName={false} />
    </MotionTunerProvider>
  );
}
```

### 4. 消费 lastCommit 触发 preview

```tsx
useEffect(() => {
  if (!lastCommit) return;
  // 走一遍 default → hover → 恢复
  setPreviewOverride("default");
  setTimeout(() => {
    setPreviewOverride("hover");
    setTimeout(() => setPreviewOverride(null), settle);
  }, settle);
}, [lastCommit]);
```

### 5. 调完 → 复制 → 移除

调到满意后点「复制代码」，拿到：
```ts
// motion-tuner: 1 change(s) for "卡片动效" (id: "my-card")
{
  hoverStrength: 1.2,  // 悬浮强度 · was 0.8
}
```

把值更新到 `defaultConfig`，删掉 `<EditorRuntime />` 和 `<MotionTunerProvider>`，产品不留痕迹。

---

## 架构

```
packages/
├── core/     零依赖纯逻辑（types / events / store / state-machine / export）
├── react/    React bindings（Provider + useMotionTuner hook）
└── ui/       可视化控件（Panel / Slider / Launcher / Overlay / EditorRuntime）
examples/
└── basic/    Vite 单屏 demo（翻牌大字 + ASCII 球 + 流程卡）
```

`core` 不依赖 React——未来可以写 Vue / Svelte binding。

---

## 开发

```bash
# 安装
pnpm install

# 构建（按依赖顺序）
pnpm --filter motion-tuner-core build
pnpm --filter motion-tuner-react build
pnpm --filter motion-tuner-ui build

# 跑 demo
cd examples/basic && pnpm dev

# 测试
pnpm --filter motion-tuner-core test
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
