# Vibemotion

> 感觉即代码。

动效一旦复杂，自然语言的精度就不够了——"再快一点但不要失去弹性"，改哪个参数？快多少？弹性是哪个系数？

安装 Vibemotion，不用管参数叫什么，直接拖滑杆，直到感觉对味。调完复制参数发给 AI，动效编辑即刻完成。

面板支持热插拔——上线前关闭或移除即可，产品代码不留痕迹。

框架无关（Web Components），React / Vue / 原生 HTML 均可接入。

---

## 接入

```bash
pnpm add vibemotion
```

然后把下面这段发给你项目的 AI（Cursor / Codebuddy / Claude 等）：

```
读 node_modules/vibemotion/AI_GUIDE.md，按里面的流程帮我把动效接入 vibemotion 调参面板。
```

或者，如果你的 AI 支持 skill，直接把 `node_modules/vibemotion/motion-connect` 目录加到项目的 skill 列表里，然后跟 AI 说「帮我接入调参面板」。

---

## License

MIT
