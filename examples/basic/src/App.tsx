import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import type { MotionTargetDef } from "vibeset-core";
import { VibesetProvider, useVibeset } from "vibeset-react";
import { EditorRuntime } from "vibeset-ui";

// ══════════════════════════════════════════════════════════════════
// Vibeset · Basic Example · 单屏 demo
// 两个酷炫的可调动效，体现 vibeset 的真实价值：
//   ① 翻牌大字（hero-flap）—— 多维耦合的 stagger 翻牌系统
//   ② ASCII 球体（ascii-sphere）—— 多轴旋转 + 字符密度 + 深度映射
// 这些动效"嘴说不清"，必须靠面板调，才显出 vibeset 的 raison d'être。
// ══════════════════════════════════════════════════════════════════

// ── Design tokens ────────────────────────────────────────────────
const TOKEN = {
  bg: "oklch(0.08 0 0)",
  fg: "oklch(0.95 0 0)",
  muted: "oklch(0.55 0 0)",
  accent: "oklch(0.7 0.2 45)",            // 暖橙
  accentBorder: "oklch(0.7 0.2 45 / 0.6)",
  borderRest: "oklch(0.25 0 0 / 0.4)",
};

const FONT_DISPLAY = "'IBM Plex Sans', sans-serif";
const FONT_FLAP = "'Bebas Neue', 'IBM Plex Sans', sans-serif";
const FONT_MONO = "'IBM Plex Mono', monospace";

// 翻牌专用色（对齐源码 Tailwind orange-500）
const FLAP_ORANGE = "#f97316";
const FLAP_ORANGE_BG = "rgba(249, 115, 22, 0.2)";

// ══════════════════════════════════════════════════════════════════
// Target 1 · 翻牌大字 hero-flap
// ══════════════════════════════════════════════════════════════════

const HERO_FLAP_MOTION: MotionTargetDef = {
  id: "hero-flap",
  label: "翻牌大字",
  schema: [
    { key: "flipInterval", label: "翻牌速度", min: 30, max: 200, step: 5, group: "参数" },
    { key: "flipsPerChar", label: "翻牌次数", min: 1, max: 30, step: 1, group: "参数" },
    { key: "staggerStep", label: "字符错开", min: 10, max: 500, step: 10, group: "参数" },
    { key: "preSettleSlowdown", label: "末段减速", min: 0, max: 6, step: 1, group: "参数" },
  ],
  defaultConfig: {
    flipInterval: 90,
    preSettleSlowdown: 2,
    flipsPerChar: 4,
    staggerStep: 30,
  },
  states: [
    { value: "default", label: "默认" },
    { value: "running", label: "运行中" },
  ],
  defaultState: "default",
};

// 单字符翻牌组件 · 按源码 SplitFlapChar 重做
function FlipChar({
  finalChar,
  index,
  config,
  triggerKey,
  skipEntrance,
}: {
  finalChar: string;
  index: number;
  config: Record<string, number>;
  triggerKey: number;
  skipEntrance: boolean;
}) {
  const charset = useMemo(
    () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split(""),
    [],
  );
  const displayChar = charset.includes(finalChar) ? finalChar : " ";
  const isSpace = finalChar === " ";

  const [currentChar, setCurrentChar] = useState(skipEntrance ? displayChar : " ");
  const [isSettled, setIsSettled] = useState(skipEntrance);

  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);

    if (isSpace) {
      setCurrentChar(" ");
      setIsSettled(true);
      return;
    }

    setIsSettled(false);
    setCurrentChar(charset[Math.floor(Math.random() * charset.length)]);

    const baseFlips = Math.max(1, Math.round(config.flipsPerChar));
    // 源码：skipEntrance 时 startDelay 短（*0.4），首次入场长（*0.8）
    const startDelay = skipEntrance
      ? config.staggerStep * index * 0.4
      : config.staggerStep * index * 0.8;
    let flipIndex = 0;

    timeoutRef.current = window.setTimeout(() => {
      intervalRef.current = window.setInterval(() => {
        const settleThreshold = baseFlips + index * Math.max(0, Math.round(config.preSettleSlowdown));

        if (flipIndex >= settleThreshold) {
          if (intervalRef.current) window.clearInterval(intervalRef.current);
          setCurrentChar(displayChar);
          setIsSettled(true);
          return;
        }

        setCurrentChar(charset[Math.floor(Math.random() * charset.length)]);
        flipIndex += 1;
      }, Math.max(16, config.flipInterval));
    }, startDelay);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [
    displayChar,
    isSpace,
    triggerKey,
    index,
    skipEntrance,
    config.flipsPerChar,
    config.staggerStep,
    config.flipInterval,
    config.preSettleSlowdown,
    charset,
  ]);

  if (isSpace) {
    return (
      <div
        style={{
          width: "0.3em",
          fontSize: "clamp(4rem, 14vw, 14rem)",
        }}
      />
    );
  }

  const tileDelaySec = (config.staggerStep * index) / 1000;
  const bgColor = isSettled ? "hsl(0, 0%, 0%)" : FLAP_ORANGE_BG;
  const textColor = isSettled ? "#ffffff" : FLAP_ORANGE;

  return (
    <motion.div
      initial={skipEntrance ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: tileDelaySec, duration: 0.3, ease: "easeOut" }}
      style={{
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_FLAP,
        fontSize: "clamp(4rem, 14vw, 14rem)",
        width: "0.50em",
        height: "1.05em",
        backgroundColor: bgColor,
        transformStyle: "preserve-3d",
        transition: "background-color 0.15s ease",
      }}
    >
      {/* 中线分隔（固定 1px） */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          height: 1,
          background: "rgba(0,0,0,0.2)",
          pointerEvents: "none",
          zIndex: 10,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: "50%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            display: "block",
            transform: "translateY(0.52em)",
            lineHeight: 1,
            color: textColor,
            transition: "color 150ms ease",
          }}
        >
          {currentChar}
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          bottom: 0,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            transform: "translateY(-0.52em)",
            lineHeight: 1,
            color: textColor,
            transition: "color 150ms ease",
          }}
        >
          {currentChar}
        </span>
      </div>

      <motion.div
        key={`${triggerKey}-${isSettled}-${index}`}
        initial={{ rotateX: -90 }}
        animate={{ rotateX: 0 }}
        transition={{
          delay: skipEntrance ? tileDelaySec * 0.5 : tileDelaySec + 0.15,
          duration: 0.25,
          ease: [0.22, 0.61, 0.36, 1],
        }}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: "50%",
          transformOrigin: "bottom",
          overflow: "hidden",
          backgroundColor: bgColor,
          transformStyle: "preserve-3d",
          backfaceVisibility: "hidden",
          transition: "background-color 0.15s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            height: "100%",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              transform: "translateY(0.52em)",
              lineHeight: 1,
              color: textColor,
              transition: "color 150ms ease",
            }}
          >
            {currentChar}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function FlipTitle({ text }: { text: string }) {
  const { ref, config, lastCommit, previewState } = useVibeset(
    "hero-flap",
    HERO_FLAP_MOTION,
  );

  const [triggerKey, setTriggerKey] = useState(0);
  const [hovered, setHovered] = useState(false);
  // 源码：1秒后 hasInitialized=true，之后重翻走 skipEntrance 路径
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setHasInitialized(true), 1000);
    return () => window.clearTimeout(t);
  }, []);

  // 调参 commit 触发重翻
  useEffect(() => {
    if (lastCommit) setTriggerKey((k) => k + 1);
  }, [lastCommit]);

  const cycleMs = useMemo(() => {
    const letters = text.replace(/\s/g, "").length;
    const maxIndex = Math.max(0, letters - 1);
    const settleThreshold =
      Math.max(1, Math.round(config.flipsPerChar)) +
      maxIndex * Math.max(0, Math.round(config.preSettleSlowdown));
    return Math.max(
      300,
      config.staggerStep * maxIndex + settleThreshold * Math.max(16, config.flipInterval) + 120,
    );
  }, [text, config.flipsPerChar, config.preSettleSlowdown, config.staggerStep, config.flipInterval]);

  // 运行中：持续循环翻牌，不停
  useEffect(() => {
    if (previewState !== "running") return;
    setTriggerKey((k) => k + 1);
    const id = window.setInterval(() => {
      setTriggerKey((k) => k + 1);
    }, cycleMs);
    return () => window.clearInterval(id);
  }, [previewState, cycleMs]);

  // 默认：hover 时触发一轮；运行中禁用 hover 触发
  useEffect(() => {
    if (previewState !== "running" && hovered) {
      setTriggerKey((k) => k + 1);
    }
  }, [hovered, previewState]);

  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      data-motion-target-id="hero-flap"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        fontFamily: FONT_FLAP,
        fontSize: "clamp(64px, 14vw, 200px)",
        fontWeight: 400,
        letterSpacing: "0px",
        lineHeight: 1.05,
        gap: "1px",
        cursor: "pointer",
        perspective: "1000px",
      }}
    >
      {text.split("").map((c, i) => (
        <FlipChar
          key={i}
          finalChar={c}
          index={i}
          config={config}
          triggerKey={triggerKey}
          skipEntrance={hasInitialized}
        />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// Target 2 · ASCII 球体 ascii-sphere
// ══════════════════════════════════════════════════════════════════

const SPHERE_MOTION: MotionTargetDef = {
  id: "ascii-sphere",
  label: "字符球体",
  schema: [
    // 基础
    { key: "rotationSpeed", label: "旋转速度", min: 0.1, max: 3, step: 0.05, group: "基础" },
    { key: "charDensity", label: "字符密度", min: 0.08, max: 0.3, step: 0.01, group: "基础" },

    // 进阶
    { key: "rotationXAxis", label: "X 轴转速", min: 0, max: 1, step: 0.05, group: "进阶" },
    { key: "rotationYAxis", label: "Y 轴转速", min: 0, max: 1, step: 0.05, group: "进阶" },
    { key: "depthAlphaCurve", label: "深度透明曲线", min: 0.1, max: 0.8, step: 0.05, group: "进阶" },
    { key: "fontSize", label: "字符大小 (px)", min: 8, max: 20, step: 1, group: "进阶" },
  ],
  defaultConfig: {
    rotationSpeed: 1.0,
    charDensity: 0.15,
    rotationXAxis: 0.2,
    rotationYAxis: 0.3,
    depthAlphaCurve: 0.4,
    fontSize: 12,
  },
  states: [
    { value: "running", label: "默认" },
    { value: "paused", label: "暂停" },
  ],
  defaultState: "running",
};

function AsciiSphere({ size }: { size: number }) {
  const { ref, config, previewState } = useVibeset(
    "ascii-sphere",
    SPHERE_MOTION,
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cfgRef = useRef(config);
  cfgRef.current = config;
  const stateRef = useRef(previewState);
  stateRef.current = previewState;

  // size 变化时强制 canvas 重新测量
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
  }, [size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const chars = "░▒▓█▀▄▌▐│─┤├┴┬╭╮╰╯";
    let frameId = 0;
    let time = 0;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas!.getBoundingClientRect();
      canvas!.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas!.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.scale(dpr, dpr);
    }

    function render() {
      const c = cfgRef.current;
      const isPaused = stateRef.current === "paused";
      const rect = canvas!.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      ctx!.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const fontSize = c.fontSize;
      const safePadding = fontSize * 1.3;
      const radius = Math.max(0, Math.min(width, height) / 2 - safePadding);

      ctx!.font = `${fontSize}px monospace`;
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";

      const points: { x: number; y: number; z: number; char: string }[] = [];
      const step = c.charDensity;

      for (let phi = 0; phi < Math.PI * 2; phi += step) {
        for (let theta = 0; theta < Math.PI; theta += step) {
          const x = Math.sin(theta) * Math.cos(phi + time * 0.5);
          const y = Math.sin(theta) * Math.sin(phi + time * 0.5);
          const z = Math.cos(theta);

          const rotY = time * c.rotationYAxis;
          const x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
          const z1 = x * Math.sin(rotY) + z * Math.cos(rotY);

          const rotX = time * c.rotationXAxis;
          const y1 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
          const z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX);

          const depth = (z2 + 1) / 2;
          const charIndex = Math.floor(depth * (chars.length - 1));

          points.push({
            x: centerX + x1 * radius,
            y: centerY + y1 * radius,
            z: z2,
            char: chars[charIndex],
          });
        }
      }

      points.sort((a, b) => a.z - b.z);

      for (const p of points) {
        const alpha = c.depthAlphaCurve * 0.4 + (p.z + 1) * c.depthAlphaCurve;
        ctx!.fillStyle = `rgba(255, 255, 255, ${Math.min(1, alpha)})`;
        ctx!.fillText(p.char, p.x, p.y);
      }

      if (!isPaused) time += 0.02 * c.rotationSpeed;
      frameId = requestAnimationFrame(render);
    }

    resize();
    render();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      data-motion-target-id="ascii-sphere"
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          opacity: 0.65,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 4 等大流程卡（保留）
// ══════════════════════════════════════════════════════════════════

const FLOW_CARDS_MOTION: MotionTargetDef = {
  id: "flow-cards",
  label: "底部流程卡",
  schema: [
    { key: "hoverTransition", label: "过渡速度 (ms)", min: 80, max: 800, step: 10, group: "基础" },
    { key: "titleLift", label: "标题上移 (px)", min: 0, max: 12, step: 1, group: "基础" },
    { key: "cornerDuration", label: "角标显隐 (ms)", min: 80, max: 800, step: 10, group: "基础" },
  ],
  defaultConfig: {
    hoverTransition: 300,
    titleLift: 0,
    cornerDuration: 300,
  },
  states: [
    { value: "free", label: "跟随鼠标" },
    { value: "default", label: "默认" },
    { value: "hover", label: "Hover" },
  ],
  defaultState: "free",
};

const flowSteps: Array<{ step: string; title: string; medium: string; lines: string[] }> = [
  {
    step: "01",
    title: "EMBED",
    medium: "嵌入预览",
    lines: [
      "画板嵌入产品代码，跟着部署上预览。",
      "一行接入，热插拔上线即可移除。",
    ],
  },
  {
    step: "02",
    title: "TUNE",
    medium: "调感觉旋钮",
    lines: [
      "选元素，出面板，跟着感觉拖滑杆。",
      "用自然语言增删参数，让 AI 改 schema。",
    ],
  },
  {
    step: "03",
    title: "PREVIEW",
    medium: "实时映射",
    lines: [
      "调参实时生效，画面立刻反馈。",
      "感觉即代码，零翻译损耗。",
    ],
  },
  {
    step: "04",
    title: "SHIP",
    medium: "AI 协作出码",
    lines: [
      "复制变更，发给 AI 改 default。",
      "刷新代码，调整即完成上线。",
    ],
  },
];

function FlowCard({
  step,
  config,
  forceHovered,
}: {
  step: typeof flowSteps[number];
  config: Record<string, number>;
  forceHovered?: boolean | null;
}) {
  const [mouseHovered, setMouseHovered] = useState(false);
  const hovered = forceHovered !== null && forceHovered !== undefined ? forceHovered : mouseHovered;
  return (
    <article
      onMouseEnter={() => setMouseHovered(true)}
      onMouseLeave={() => setMouseHovered(false)}
      style={{
        position: "relative",
        border: `1px solid ${hovered ? TOKEN.accentBorder : TOKEN.borderRest}`,
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: "pointer",
        overflow: "hidden",
        transition: `border-color ${config.hoverTransition}ms ease`,
        background: "transparent",
      }}
    >
      <div>
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: "0.2em",
            color: hovered ? TOKEN.accent : TOKEN.muted,
            transition: `color ${config.hoverTransition}ms ease`,
          }}
        >
          {step.step} / {step.medium}
        </span>
        <h3
          style={{
            marginTop: 8,
            fontFamily: FONT_DISPLAY,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            color: hovered ? TOKEN.accent : TOKEN.fg,
            transform: hovered ? `translateY(-${config.titleLift}px)` : "translateY(0)",
            transition: `color ${config.hoverTransition}ms ease, transform ${config.hoverTransition}ms ease`,
          }}
        >
          {step.title}
        </h3>
      </div>
      <div
        style={{
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateY(0)" : "translateY(8px)",
          transition: `opacity ${config.hoverTransition}ms ease, transform ${config.hoverTransition}ms ease`,
        }}
      >
        {step.lines.map((line, i) => (
          <p
            key={i}
            style={{
              fontFamily: FONT_MONO,
              fontSize: 11,
              lineHeight: 1.7,
              color: TOKEN.muted,
              marginTop: i === 0 ? 0 : 2,
            }}
          >
            {line}
          </p>
        ))}
      </div>
      {/* 角标 */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 20,
          height: 20,
          opacity: hovered ? 1 : 0,
          transition: `opacity ${config.cornerDuration}ms ease`,
          pointerEvents: "none",
        }}
      >
        <div style={{ position: "absolute", top: 0, right: 0, width: "100%", height: 1, background: TOKEN.accent }} />
        <div style={{ position: "absolute", top: 0, right: 0, width: 1, height: "100%", background: TOKEN.accent }} />
      </div>
    </article>
  );
}

function FlowFooter() {
  const { ref, config, previewState, lastCommit } = useVibeset("flow-cards", FLOW_CARDS_MOTION);

  // previewState → forceHovered
  // "hover" → 所有卡锁定 hover
  // "default" → 所有卡锁定非 hover
  // "free" / null → 跟随鼠标
  const [previewOverride, setPreviewOverride] = useState<string | null>(null);

  // ── 调参松手 → 三段 preview（default → hover → 恢复） ──
  const stageT = useRef<number | null>(null);
  const restoreT = useRef<number | null>(null);
  useEffect(() => {
    if (!lastCommit) return;
    if (stageT.current) window.clearTimeout(stageT.current);
    if (restoreT.current) window.clearTimeout(restoreT.current);
    const settle = Math.max(120, Math.round(config.hoverTransition) + 40);
    setPreviewOverride("default");
    stageT.current = window.setTimeout(() => {
      setPreviewOverride("hover");
      restoreT.current = window.setTimeout(() => {
        setPreviewOverride(null);
      }, settle);
    }, settle);
    return () => {
      if (stageT.current) window.clearTimeout(stageT.current);
      if (restoreT.current) window.clearTimeout(restoreT.current);
    };
  }, [lastCommit]);

  // 优先级：previewOverride > previewState > mouse
  const effectiveState = previewOverride ?? previewState;
  const forceHovered =
    effectiveState === "hover" ? true : effectiveState === "default" ? false : null;

  return (
    <footer
      ref={ref as React.Ref<HTMLElement>}
      data-motion-target-id="flow-cards"
      style={{
        height: 180,
        padding: "0 48px 24px 48px",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 16,
        flexShrink: 0,
        position: "relative",
        zIndex: 2,
      }}
    >
      {flowSteps.map((step) => (
        <FlowCard key={step.step} step={step} config={config} forceHovered={forceHovered} />
      ))}
    </footer>
  );
}

// ── 测窗口尺寸的小 hook（球体响应式用） ──
function useWindowSize() {
  const [size, setSize] = useState(() => ({
    w: typeof window !== "undefined" ? window.innerWidth : 1440,
    h: typeof window !== "undefined" ? window.innerHeight : 900,
  }));
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
}

// ══════════════════════════════════════════════════════════════════
// App
// ══════════════════════════════════════════════════════════════════

export function App() {
  const { w: winW, h: winH } = useWindowSize();

  // 球体尺寸策略（始终右上角锚定）：
  // - 始终以右上角为锚点（top:0,right:0）
  // - 随屏幕缩放在大屏到小屏之间渐进缩小
  // - 但保留最小 700，低于阈值不再缩小，只向左侧覆盖
  const heroPadding = 48;
  const heroAvailableHeight = Math.max(300, winH - 200 - 24); // 减去底部 4 等大 200 + padding
  const naturalSphereSize = Math.min(winW * 0.52, heroAvailableHeight * 1.12);

  const SPHERE_MIN = 700;
  const SPHERE_MAX = 1100;
  const sphereSize = Math.floor(Math.max(SPHERE_MIN, Math.min(SPHERE_MAX, naturalSphereSize)));

  return (
    <VibesetProvider enabled>
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: TOKEN.bg,
          color: TOKEN.fg,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* 球体 · 始终右上角锚定，z 在底层 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: sphereSize,
            height: sphereSize,
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <AsciiSphere size={sphereSize} />
        </div>

        {/* Hero · 占满剩余高度 */}
        <main
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            padding: `${heroPadding}px ${heroPadding}px 24px ${heroPadding}px`,
            alignItems: "center",
            minHeight: 0,
            position: "relative",
            zIndex: 2,
          }}
        >
          {/* 左 · 翻牌 + slogan + 按钮 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 11,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: TOKEN.accent,
              }}
            >
              v.01 / Live Demo
            </span>

            <FlipTitle text="MOTION TUNER" />

            <p
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 28,
                fontWeight: 500,
                color: TOKEN.accent,
                lineHeight: 1.3,
                margin: 0,
              }}
            >
              感觉即代码
            </p>

            <p
              style={{
                fontFamily: FONT_MONO,
                fontSize: 13,
                lineHeight: 1.7,
                color: TOKEN.muted,
                margin: 0,
                maxWidth: 460,
              }}
            >
              下面这些动效，自然语言能描述准吗?<br/>
              点右下角「动效编辑」打开面板，亲自调一下感觉。
            </p>

            <button
              style={{
                marginTop: 8,
                alignSelf: "flex-start",
                padding: "12px 24px",
                border: `1px solid ${TOKEN.accentBorder}`,
                background: "transparent",
                color: TOKEN.fg,
                fontFamily: FONT_MONO,
                fontSize: 12,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 200ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = TOKEN.accent;
                e.currentTarget.style.color = TOKEN.bg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = TOKEN.fg;
              }}
            >
              试试编辑动效 →
            </button>
          </div>

          {/* 右列占位：球体已改为绝对定位右上锚定 */}
          <div />
        </main>

        {/* 4 等大流程卡 · 高度 200，置底，宽度跟随屏幕 · 支持动效调参 */}
        <FlowFooter />
      </div>

      <EditorRuntime theme="dark" showKeyName={false} />
    </VibesetProvider>
  );
}
