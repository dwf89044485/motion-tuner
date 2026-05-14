# Vibemotion

> 感觉即代码。

动效一旦复杂，自然语言的精度就不够了——"再快一点但不要失去弹性"，改哪个参数？快多少？弹性是哪个系数？

安装 Vibemotion，不用管参数叫什么，直接拖滑杆，直到感觉对味。调完复制参数发给 AI，动效编辑即刻完成。

面板支持热插拔——上线前关闭或移除即可，产品代码不留痕迹。

框架无关（Web Components），React / Vue / 原生 HTML 均可接入。

---

## 接入

把下面的内容复制给你项目的 AI（Cursor / Codebuddy / Claude 等），它会引导你完成接入。

```
vibemotion 是一个嵌入式动效调参 SDK（pnpm add vibemotion）。用户拖感觉旋钮调参，调完复制参数，面板移除不留痕迹。框架无关，Web Components 实现。

接入流程：
1. 问用户哪个组件/动效要接面板
2. 读该组件源码，提炼感觉旋钮——过滤底层数学量，可聚合的合成一根，中文 label，min/max 只给有效感知区间。列出候选 + "全部"兜底，让用户确认
3. 写接入代码：createVibeset() → register(schema, element) → bus.on("change") 驱动渲染 → bus.on("param-commit") 触发 preview → 挂载 <vibeset-editor>。React 项目用 vibemotion/react 的 VibesetProvider + useVibeset
4. param-commit 必须接——松手后走一遍 preview 动画，不接等于产品是坏的
5. 验证：极值不崩、label 全中文、preview 触发、删掉面板后组件正常
6. 告诉用户：点「复制代码」拿参数 patch → 更新 defaultConfig → 移除 vibemotion 代码
```

---

## License

MIT
