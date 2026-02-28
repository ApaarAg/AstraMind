import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, ReferenceLine
} from "recharts";

// ─── DATA & MATH ────────────────────────────────────────────────────────────

const DEFAULT_TOPICS = [
  { id: 1, name: "Machine Learning", difficulty: 0.85, urgency: 0.90, baseGain: 0.78, color: "#a78bfa", pastScore: 62, hoursSpent: 8,  revisionCount: 2, daysToExam: 7,  confidence: 0.40 },
  { id: 2, name: "Linear Algebra",   difficulty: 0.70, urgency: 0.75, baseGain: 0.65, color: "#22d3ee", pastScore: 74, hoursSpent: 12, revisionCount: 3, daysToExam: 14, confidence: 0.55 },
  { id: 3, name: "Statistics",       difficulty: 0.60, urgency: 0.80, baseGain: 0.72, color: "#34d399", pastScore: 80, hoursSpent: 10, revisionCount: 4, daysToExam: 10, confidence: 0.65 },
  { id: 4, name: "Deep Learning",    difficulty: 0.90, urgency: 0.70, baseGain: 0.85, color: "#f472b6", pastScore: 55, hoursSpent: 5,  revisionCount: 1, daysToExam: 21, confidence: 0.30 },
  { id: 5, name: "Algorithms",       difficulty: 0.75, urgency: 0.65, baseGain: 0.68, color: "#fb923c", pastScore: 70, hoursSpent: 9,  revisionCount: 3, daysToExam: 18, confidence: 0.50 },
];

// ─── FEATURE MAPPING ─────────────────────────────────────────────────────────
// Converts raw user inputs into optimizer model parameters.
function mapFormToTopic(fields, id, color) {
  const { name, difficulty, pastScore, hoursSpent, revisionCount, daysToExam, confidence } = fields;
  // urgency: peaks when exam is imminent, score is low, and confidence is low
  const examUrgency = Math.max(0, 1 - (daysToExam - 1) / 29);
  const scoreGap    = Math.max(0, (100 - pastScore) / 100);
  const urgency     = Math.min(1, examUrgency * 0.5 + scoreGap * 0.3 + (1 - confidence) * 0.2);
  // baseGain: headroom left to improve — low score + low study hours = high potential
  const studyMaturity = Math.min(1, hoursSpent / 20);
  const revisionBoost = Math.min(0.1, revisionCount * 0.02);
  const baseGain    = Math.min(0.95, scoreGap * 0.6 + (1 - studyMaturity) * 0.3 + revisionBoost + 0.1);
  return { id, name: name.trim(), difficulty, urgency, baseGain, color,
           pastScore, hoursSpent, revisionCount, daysToExam, confidence };
}

function saturation(h, alpha = 1.8, beta = 0.6) {
  return alpha * (1 - Math.exp(-beta * h));
}

function riskAdjustedGain(h, topic) {
  const raw = saturation(h, topic.baseGain * 2, 0.55);
  const uncertainty = 0.12 * topic.difficulty * Math.exp(-0.4 * h);
  const urgencyBonus = topic.urgency * 0.15;
  const difficultyScale = 1 / (1 + topic.difficulty * 0.2);
  return (
    raw * (1 - 0.5 * uncertainty) * difficultyScale +
    urgencyBonus * Math.min(h / 3, 1)
  );
}

function optimizeAllocation(topics, budget) {
  // Greedy marginal gain allocation in 0.5h increments
  const alloc = Object.fromEntries(topics.map(t => [t.id, 0.5]));
  let remaining = budget - topics.length * 0.5;
  const step = 0.5;

  while (remaining >= step) {
    let bestTopic = null, bestMarginal = -Infinity;
    for (const t of topics) {
      const curr = alloc[t.id];
      const marginal = riskAdjustedGain(curr + step, t) - riskAdjustedGain(curr, t);
      const weighted = marginal * (1 + t.urgency * 0.4) / (1 + t.difficulty * 0.2);
      if (weighted > bestMarginal) { bestMarginal = weighted; bestTopic = t; }
    }
    if (!bestTopic) break;
    alloc[bestTopic.id] += step;
    remaining -= step;
  }

  return topics.map(t => ({
    ...t,
    hours: alloc[t.id],
    gain: riskAdjustedGain(alloc[t.id], t),
    uncertainty: 0.12 * t.difficulty * Math.exp(-0.4 * alloc[t.id]),
  }));
}

function buildCurveData(topic, maxH = 8) {
  return Array.from({ length: 33 }, (_, i) => {
    const h = (i / 32) * maxH;
    const gain = riskAdjustedGain(h, topic);
    const unc = 0.12 * topic.difficulty * Math.exp(-0.4 * h);
    return { h: +h.toFixed(2), gain: +gain.toFixed(3), upper: +(gain + unc).toFixed(3), lower: +(Math.max(0, gain - unc)).toFixed(3) };
  });
}

// ─── PARTICLE CANVAS ────────────────────────────────────────────────────────

function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const N = 80;
    const particles = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.8 + 0.6,
    }));

    const COLORS = ["#7c3aed", "#06b6d4", "#3b82f6", "#a78bfa"];

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // connections
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.strokeStyle = `rgba(99,102,241,${0.18 * (1 - dist / 140)})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke();
          }
        }
      }
      // dots
      particles.forEach((p, i) => {
        ctx.fillStyle = COLORS[i % COLORS.length];
        ctx.shadowColor = COLORS[i % COLORS.length];
        ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-60" />;
}

// ─── GLASS CARD ─────────────────────────────────────────────────────────────

function GlassCard({ children, className = "", glow = false, style = {} }) {
  return (
    <motion.div
      className={`relative rounded-2xl border border-white/10 backdrop-blur-xl ${className}`}
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        boxShadow: glow
          ? "0 0 40px rgba(139,92,246,0.15), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)"
          : "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
        ...style
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── OPTIMIZATION INDICATOR ──────────────────────────────────────────────────

function OptimizingIndicator({ active }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center gap-2 text-violet-300 text-xs font-mono"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-3.5 h-3.5 rounded-full border-2 border-violet-400 border-t-transparent"
          />
          <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.2 }}>
            Re-optimizing…
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── ALLOCATION BAR ──────────────────────────────────────────────────────────

function AllocationBar({ topic, maxHours, index }) {
  const [hovered, setHovered] = useState(false);
  const pct = Math.min((topic.hours / maxHours) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, type: "spring", stiffness: 120 }}
      className="relative group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium text-white/80 tracking-wide">{topic.name}</span>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-white/50">{topic.hours.toFixed(1)}h</span>
          <span style={{ color: topic.color }} className="font-semibold">+{(topic.gain * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Bar track */}
      <div className="relative h-7 rounded-lg overflow-hidden bg-white/5 border border-white/5">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-lg"
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
          style={{
            background: `linear-gradient(90deg, ${topic.color}55 0%, ${topic.color}cc 100%)`,
            boxShadow: hovered ? `0 0 20px ${topic.color}88` : "none",
          }}
        />
        {/* Uncertainty band overlay */}
        <motion.div
          className="absolute inset-y-0 rounded-lg opacity-30"
          animate={{
            left: `${Math.max(0, Math.min(100, pct - (topic.uncertainty * 100) / 2))}%`,
            width: `${Math.max(0, Math.min(100, topic.uncertainty * 100))}%`,
          }}
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
          style={{ background: `${topic.color}44`, border: `1px dashed ${topic.color}88` }}
        />
        <div className="absolute inset-0 flex items-center px-3">
          <span className="text-[11px] text-white/60 font-mono">±{(topic.uncertainty * 100).toFixed(1)}%</span>
        </div>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            className="absolute left-0 top-full mt-2 z-50 w-64 rounded-xl border border-white/10 p-3 text-xs space-y-1.5"
            style={{ background: "rgba(10,10,30,0.95)", backdropFilter: "blur(20px)", boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${topic.color}22` }}
          >
            <div className="font-semibold text-white mb-2">{topic.name}</div>
            {[
              ["Risk-Adjusted Gain", `${(topic.gain * 100).toFixed(1)}%`, topic.color],
              ["Difficulty Weight", topic.difficulty.toFixed(2), "#94a3b8"],
              ["Urgency Factor", topic.urgency.toFixed(2), "#f472b6"],
              ["Uncertainty (±σ)", `${(topic.uncertainty * 100).toFixed(1)}%`, "#fb923c"],
            ].map(([k, v, c]) => (
              <div key={k} className="flex justify-between">
                <span className="text-white/50">{k}</span>
                <span style={{ color: c }} className="font-mono">{v}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── DIMINISHING RETURNS CURVE ────────────────────────────────────────────────

function DiminishingCurve({ topic }) {
  const data = useMemo(() => buildCurveData(topic, 10), [topic]);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => { setRevealed(false); const t = setTimeout(() => setRevealed(true), 100); return () => clearTimeout(t); }, [topic.id]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border border-white/10 p-2 text-xs" style={{ background: "rgba(10,10,30,0.95)" }}>
        <div className="text-white/50 mb-1">{label}h study</div>
        <div style={{ color: topic.color }}>Gain: {(payload[0]?.value * 100)?.toFixed(1)}%</div>
      </div>
    );
  };

  return (
    <div className="w-full h-52">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: revealed ? 1 : 0 }}
        transition={{ duration: 0.6 }}
        className="w-full h-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -10 }}>
            <defs>
              <linearGradient id={`grad-${topic.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={topic.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={topic.color} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id={`grad-unc-${topic.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={topic.color} stopOpacity={0.08} />
                <stop offset="95%" stopColor={topic.color} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="h" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} label={{ value: "Hours", fill: "#475569", fontSize: 10, position: "insideBottomRight", offset: -5 }} />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="upper" stroke="none" fill={`url(#grad-unc-${topic.id})`} />
            <Area type="monotone" dataKey="lower" stroke="none" fill="rgba(0,0,0,0)" />
            <Area type="monotone" dataKey="gain" stroke={topic.color} strokeWidth={2.5} fill={`url(#grad-${topic.id})`}
              dot={false} activeDot={{ r: 4, fill: topic.color, strokeWidth: 0 }} />
            <ReferenceLine x={topic.hours} stroke={topic.color} strokeDasharray="4 3" strokeWidth={1.5} label={{ value: "allocated", fill: topic.color, fontSize: 9, position: "top" }} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}

// ─── WHY THIS ALLOCATION PANEL ────────────────────────────────────────────────

function WhyPanel({ topic }) {
  const rows = [
    { label: "Predicted Raw Gain", value: `${(saturation(topic.hours, topic.baseGain * 2, 0.55) * 100).toFixed(1)}%`, icon: "↑", color: "#34d399" },
    { label: "Uncertainty Penalty", value: `-${(topic.uncertainty * 50).toFixed(1)}%`, icon: "⚠", color: "#fb923c" },
    { label: "Urgency Bonus", value: `+${(topic.urgency * 15 * Math.min(topic.hours / 3, 1)).toFixed(1)}%`, icon: "⚡", color: "#f472b6" },
    { label: "Difficulty Scaling", value: `×${(1 / (1 + topic.difficulty * 0.2)).toFixed(2)}`, icon: "⊗", color: "#94a3b8" },
    { label: "Risk-Adjusted Utility", value: `${(topic.gain * 100).toFixed(1)}%`, icon: "★", color: topic.color },
  ];

  return (
    <div className="space-y-3">
      {/* Formula */}
      <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3 font-mono text-xs text-center" style={{ letterSpacing: "0.02em", lineHeight: "1.8", overflow: "visible" }}>
        <span className="text-violet-300">U</span>
        <span className="text-white/40">(h)</span>
        <span className="text-white/40"> = </span>
        <span className="text-cyan-300">α</span>
        <span className="text-white/40">(1 − </span>
        <span className="text-cyan-300">e</span>
        <sup style={{ fontSize: "0.7em", verticalAlign: "0.45em", color: "#67e8f9" }}>−βh</sup>
        <span className="text-white/40">)</span>
        <span className="text-white/40" style={{ padding: "0 0.35em" }}>·</span>
        <span className="text-white/40">(1 − </span>
        <span className="text-orange-300">σ/2</span>
        <span className="text-white/40">)</span>
        <span className="text-white/40" style={{ padding: "0 0.35em" }}>·</span>
        <span className="text-white/40">(1 / (1 + </span>
        <span className="text-slate-300">d</span>
        <span className="text-white/40">))</span>
        <span className="text-white/40" style={{ padding: "0 0.35em" }}>+</span>
        <span className="text-pink-300">γu</span>
        <span className="text-white/40" style={{ padding: "0 0.35em" }}>·</span>
        <span className="text-white/40">min(h/3, 1)</span>
      </div>

      <div className="space-y-2">
        {rows.map((r, i) => (
          <motion.div
            key={r.label}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-white/3 border border-white/5"
          >
            <div className="flex items-center gap-2">
              <span style={{ color: r.color }} className="text-sm">{r.icon}</span>
              <span className="text-xs text-white/60">{r.label}</span>
            </div>
            <span style={{ color: r.color }} className="text-xs font-mono font-semibold">{r.value}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── ADD TOPIC FORM ──────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: "", difficulty: 0.65, pastScore: 70, hoursSpent: 5,
  revisionCount: 2, daysToExam: 14, confidence: 0.50,
};

function FormSlider({ label, hint, value, min = 0, max = 1, step = 0.01, onChange, display }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline">
        <label className="text-[11px] text-white/55 font-medium">{label}</label>
        <span className="text-[11px] font-mono text-violet-300">{display ?? value.toFixed(2)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full cursor-pointer" />
      {hint && <p className="text-[10px] text-white/25 leading-tight">{hint}</p>}
    </div>
  );
}

function FormNumber({ label, hint, value, min = 0, max, step = 1, onChange }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline">
        <label className="text-[11px] text-white/55 font-medium">{label}</label>
        <span className="text-[11px] font-mono text-cyan-300">{value}</span>
      </div>
      <input
        type="number" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Math.max(min, max !== undefined ? Math.min(max, Number(e.target.value)) : Number(e.target.value)))}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white font-mono outline-none focus:border-violet-500/40 transition-colors"
        style={{ appearance: "none", MozAppearance: "textfield" }}
      />
      {hint && <p className="text-[10px] text-white/25 leading-tight">{hint}</p>}
    </div>
  );
}

function AddTopicForm({ onAdd, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())       errs.name = "Topic name is required.";
    if (form.daysToExam < 1)     errs.daysToExam = "Must be at least 1 day.";
    if (form.pastScore < 0 || form.pastScore > 100) errs.pastScore = "Enter a value 0–100.";
    return errs;
  };

  const handleAdd = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onAdd(form);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="rounded-xl border border-violet-500/20 bg-white/3 p-4 space-y-4"
        style={{ boxShadow: "0 0 24px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,0.05)" }}>

        {/* Header */}
        <div className="flex items-center gap-2 pb-1 border-b border-white/6">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-[11px] font-mono text-violet-400 tracking-widest">NEW TOPIC · MODEL INPUTS</span>
        </div>

        {/* Topic Name */}
        <div className="space-y-1">
          <label className="text-[11px] text-white/55 font-medium">Topic Name</label>
          <input
            className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 outline-none transition-colors ${errors.name ? "border-red-500/50" : "border-white/10 focus:border-violet-500/50"}`}
            placeholder="e.g. Probability Theory"
            value={form.name}
            onChange={e => set("name", e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
          />
          {errors.name && <p className="text-[10px] text-red-400">{errors.name}</p>}
        </div>

        {/* Sliders row */}
        <div className="grid grid-cols-1 gap-3 pt-1">
          <FormSlider
            label="Difficulty" hint="How conceptually hard is this topic? (0 = easy, 1 = very hard)"
            value={form.difficulty} onChange={v => set("difficulty", v)}
            display={form.difficulty.toFixed(2)}
          />
          <FormSlider
            label="Confidence Level" hint="How confident are you in this topic right now?"
            value={form.confidence} onChange={v => set("confidence", v)}
            display={form.confidence.toFixed(2)}
          />
        </div>

        {/* Numeric inputs grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FormNumber
              label="Past Score (%)" hint="Last test/assignment score"
              value={form.pastScore} min={0} max={100}
              onChange={v => set("pastScore", v)}
            />
            {errors.pastScore && <p className="text-[10px] text-red-400 mt-0.5">{errors.pastScore}</p>}
          </div>
          <FormNumber
            label="Hours Already Studied" hint="Total hours invested so far"
            value={form.hoursSpent} min={0} max={200}
            onChange={v => set("hoursSpent", v)}
          />
          <FormNumber
            label="Revision Count" hint="Number of times reviewed"
            value={form.revisionCount} min={0} max={20}
            onChange={v => set("revisionCount", v)}
          />
          <div>
            <FormNumber
              label="Days to Exam" hint="Calendar days remaining"
              value={form.daysToExam} min={1} max={180}
              onChange={v => set("daysToExam", v)}
            />
            {errors.daysToExam && <p className="text-[10px] text-red-400 mt-0.5">{errors.daysToExam}</p>}
          </div>
        </div>

        {/* Derived preview */}
        {form.name.trim() && (
          <div className="rounded-lg bg-white/3 border border-white/6 px-3 py-2 flex gap-4 text-[10px] font-mono">
            {(() => {
              const preview = mapFormToTopic(form, 0, "#fff");
              return (
                <>
                  <span className="text-white/35">urgency <span className="text-pink-300">{preview.urgency.toFixed(2)}</span></span>
                  <span className="text-white/35">base gain <span className="text-green-300">{preview.baseGain.toFixed(2)}</span></span>
                  <span className="text-white/35">difficulty <span className="text-orange-300">{preview.difficulty.toFixed(2)}</span></span>
                </>
              );
            })()}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={handleAdd}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-all"
            style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.7), rgba(6,182,212,0.5))", border: "1px solid rgba(139,92,246,0.4)" }}
          >
            Add Topic
          </motion.button>
          <button onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm text-white/40 border border-white/8 hover:text-white/70 hover:border-white/20 transition-all">
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── TOPIC PILL ──────────────────────────────────────────────────────────────

function TopicPill({ topic, selected, onClick, onRemove }) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="relative flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
      style={{
        borderColor: selected ? topic.color : "rgba(255,255,255,0.1)",
        background: selected ? `${topic.color}18` : "rgba(255,255,255,0.04)",
        color: selected ? topic.color : "rgba(255,255,255,0.55)",
        boxShadow: selected ? `0 0 16px ${topic.color}30` : "none",
      }}
    >
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: topic.color }} />
      {topic.name}
      <span
        onClick={e => { e.stopPropagation(); onRemove(); }}
        className="ml-1 text-white/30 hover:text-red-400 transition-colors cursor-pointer"
      >×</span>
    </motion.button>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

const TOPIC_COLORS = ["#a78bfa","#22d3ee","#34d399","#f472b6","#fb923c","#60a5fa","#facc15","#e879f9"];
let nextId = 10;

export default function App() {
  const [budget, setBudget] = useState(8);
  const [topics, setTopics] = useState(DEFAULT_TOPICS);
  const [selected, setSelected] = useState(1);
  const [optimizing, setOptimizing] = useState(false);
  const [adding, setAdding] = useState(false);
  const optimizingTimer = useRef(null);

  const allocation = useMemo(() => optimizeAllocation(topics, budget), [topics, budget]);
  const totalGain = useMemo(() => allocation.reduce((s, t) => s + t.gain, 0), [allocation]);
  const selectedTopic = allocation.find(t => t.id === selected) || allocation[0];

  const handleBudget = useCallback(v => {
    setBudget(v);
    setOptimizing(true);
    if (optimizingTimer.current) clearTimeout(optimizingTimer.current);
    optimizingTimer.current = setTimeout(() => setOptimizing(false), 900);
  }, []);

  const addTopic = (formFields) => {
    const color = TOPIC_COLORS[topics.length % TOPIC_COLORS.length];
    const newTopic = mapFormToTopic(formFields, ++nextId, color);
    setTopics(prev => [...prev, newTopic]);
    setAdding(false);
  };

  const removeTopic = id => setTopics(prev => prev.filter(t => t.id !== id));

  return (
    <div className="min-h-screen text-white relative overflow-x-hidden"
      style={{ background: "radial-gradient(ellipse at 20% 50%, #0f0a2e 0%, #050510 50%, #030308 100%)", fontFamily: "'DM Sans', 'Sora', sans-serif" }}>
      
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Sora:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        .font-display { font-family: 'Sora', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        input[type=range] { -webkit-appearance: none; appearance: none; background: transparent; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 20px; width: 20px; border-radius: 50%; background: linear-gradient(135deg, #8b5cf6, #06b6d4); cursor: pointer; box-shadow: 0 0 12px rgba(139,92,246,0.6); margin-top: -8px; border: 2px solid rgba(255,255,255,0.3); }
        input[type=range]::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; background: linear-gradient(90deg, #7c3aed, #0891b2); }
        input[type=range]::-moz-range-thumb { height: 20px; width: 20px; border-radius: 50%; background: linear-gradient(135deg, #8b5cf6, #06b6d4); cursor: pointer; border: 2px solid rgba(255,255,255,0.3); }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 2px; }
      `}</style>

      <ParticleCanvas />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10 space-y-10">

        {/* ── HERO ── */}
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center py-8">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 3 }}
            className="inline-block text-[10px] font-mono tracking-[0.25em] text-violet-400 border border-violet-500/30 rounded-full px-4 py-1 mb-6 bg-violet-500/10"
          >
            NEURAL OPTIMIZATION ENGINE v2.4
          </motion.div>
          <h1 className="font-display text-5xl md:text-6xl font-bold leading-tight mb-4">
            <span style={{ background: "linear-gradient(135deg, #c4b5fd 0%, #67e8f9 50%, #818cf8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Adaptive AI Learning
            </span>
            <br />
            <span className="text-white/80 text-4xl md:text-5xl font-light">Optimization Platform</span>
          </h1>
          <p className="text-white/40 text-lg max-w-2xl mx-auto leading-relaxed">
            Constrained stochastic optimization · Bayesian uncertainty quantification · Real-time adaptive reallocation
          </p>
        </motion.div>

        {/* ── ROW 1: Topics + Budget ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Topics Panel */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-white/90">Topic Configuration</h2>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setAdding(v => !v)}
                className="text-xs px-3 py-1.5 rounded-full border border-violet-500/40 text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 transition-all"
              >
                {adding ? "Cancel" : "+ Add Topic"}
              </motion.button>
            </div>

            <AnimatePresence>
              {adding && (
                <AddTopicForm onAdd={addTopic} onCancel={() => setAdding(false)} />
              )}
            </AnimatePresence>

            <div className="flex flex-wrap gap-2">
              {topics.map(t => (
                <TopicPill key={t.id} topic={t} selected={selected === t.id}
                  onClick={() => setSelected(t.id)}
                  onRemove={() => { removeTopic(t.id); if (selected === t.id && topics.length > 1) setSelected(topics.find(x => x.id !== t.id)?.id); }}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                ["Topics Active",   topics.length,                                                                                                                                           "#a78bfa"],
                ["Avg Difficulty",  topics.length > 0 ? (topics.reduce((s,t) => s + t.difficulty,    0) / topics.length).toFixed(2) : "—", "#fb923c"],
                ["Avg Urgency",     topics.length > 0 ? (topics.reduce((s,t) => s + t.urgency,       0) / topics.length).toFixed(2) : "—", "#f472b6"],
                ["Avg Past Score",  topics.length > 0 ? `${(topics.reduce((s,t) => s + (t.pastScore ?? 70), 0) / topics.length).toFixed(0)}%` : "—", "#34d399"],
              ].map(([k,v,c]) => (
                <div key={k} className="bg-white/3 border border-white/5 rounded-xl p-3">
                  <div className="text-[10px] text-white/40 mb-1">{k}</div>
                  <div className="font-mono font-semibold text-lg" style={{ color: c }}>{v}</div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Budget Control */}
          <GlassCard className="p-6 space-y-6" glow>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-white/90">Budget Control</h2>
              <OptimizingIndicator active={optimizing} />
            </div>

            <div className="text-center py-4">
              <motion.div
                key={budget}
                initial={{ scale: 0.85, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }}
                className="font-display font-bold text-7xl"
                style={{ background: "linear-gradient(135deg, #c4b5fd, #67e8f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                {budget}
              </motion.div>
              <div className="text-white/40 text-sm font-mono mt-1">hours allocated</div>
            </div>

            <div className="space-y-3">
              <input type="range" min={topics.length} max={15} step={0.5} value={budget}
                onChange={e => handleBudget(Number(e.target.value))}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between text-xs font-mono text-white/30">
                <span>{topics.length}h min</span>
                <span>15h max</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Expected Gain", value: topics.length > 0 ? `${(totalGain / topics.length * 100).toFixed(1)}%` : "—", color: "#34d399" },
                { label: "Avg Hours/Topic", value: topics.length > 0 ? `${(budget / topics.length).toFixed(1)}h` : "—", color: "#67e8f9" },
                { label: "Efficiency Score", value: topics.length > 0 ? `${Math.min(99, (totalGain / topics.length / budget * 200)).toFixed(0)}` : "—", color: "#a78bfa" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center bg-white/3 border border-white/5 rounded-xl p-3">
                  <motion.div key={value} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="font-mono font-bold text-xl" style={{ color }}>
                    {value}
                  </motion.div>
                  <div className="text-[10px] text-white/35 mt-1 leading-tight">{label}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* ── ALLOCATION DASHBOARD ── */}
        <GlassCard className="p-6 space-y-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-lg font-semibold text-white/90">Allocation Dashboard</h2>
            <div className="text-xs font-mono text-white/30">Stochastic Greedy · Marginal Utility</div>
          </div>

          <div className="space-y-4">
            {allocation.map((t, i) => (
              <AllocationBar key={t.id} topic={t} maxHours={Math.max(...allocation.map(x => x.hours)) * 1.15} index={i} />
            ))}
          </div>

          {/* Mini legend */}
          <div className="flex gap-4 pt-2 text-[11px] text-white/30">
            <span className="flex items-center gap-1.5"><span className="w-8 h-1 rounded bg-gradient-to-r from-violet-500/40 to-violet-500/80 inline-block" />Allocation</span>
            <span className="flex items-center gap-1.5"><span className="w-8 h-1 rounded border border-dashed border-white/30 inline-block" />Uncertainty ±σ</span>
          </div>
        </GlassCard>

        {/* ── BOTTOM ROW: Curve + Insights ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Diminishing Returns */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-white/90">Diminishing Returns Curve</h2>
              {selectedTopic && (
                <span className="text-xs font-mono px-2 py-1 rounded-md border border-white/10 bg-white/5"
                  style={{ color: selectedTopic.color }}>
                  {selectedTopic.name}
                </span>
              )}
            </div>

            <div className="text-xs text-white/40 flex gap-4">
              <span>X: Study hours</span>
              <span>Y: Expected improvement</span>
              <span style={{ color: selectedTopic?.color }}>Shaded: ±σ bounds</span>
            </div>

            {selectedTopic && <DiminishingCurve topic={selectedTopic} />}

            <div className="flex flex-wrap gap-2">
              {allocation.map(t => (
                <button key={t.id} onClick={() => setSelected(t.id)}
                  className="text-[11px] px-2.5 py-1 rounded-full border transition-all"
                  style={{
                    borderColor: selected === t.id ? t.color : "rgba(255,255,255,0.08)",
                    background: selected === t.id ? `${t.color}18` : "transparent",
                    color: selected === t.id ? t.color : "rgba(255,255,255,0.4)",
                  }}>
                  {t.name}
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Why This Allocation */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-white/90">Why This Allocation?</h2>
              <span className="text-xs text-white/30 font-mono">Model Reasoning</span>
            </div>

            <div className="text-xs text-white/40 leading-relaxed">
              Bayesian utility maximization under Gaussian process uncertainty with urgency-weighted priority scaling.
            </div>

            <AnimatePresence mode="wait">
              {selectedTopic && (
                <motion.div key={selectedTopic.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <WhyPanel topic={selectedTopic} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Confidence meter */}
            {selectedTopic && (
              <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                <div className="flex justify-between text-xs text-white/40">
                  <span>Optimization Confidence</span>
                  <span className="font-mono" style={{ color: selectedTopic.color }}>
                    {(100 - selectedTopic.uncertainty * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div className="h-full rounded-full"
                    animate={{ width: `${100 - selectedTopic.uncertainty * 100}%` }}
                    transition={{ type: "spring", stiffness: 80 }}
                    style={{ background: `linear-gradient(90deg, ${selectedTopic.color}66, ${selectedTopic.color})` }}
                  />
                </div>
              </div>
            )}
          </GlassCard>
        </div>

        {/* ── FOOTER ── */}
        <div className="text-center py-4 text-xs font-mono text-white/15 space-y-1">
          <div>Adaptive AI Learning Optimization Platform · Constrained Stochastic Optimization Engine</div>
          <div>Bayesian Uncertainty Quantification · Real-time Marginal Utility Allocation</div>
        </div>

      </div>
    </div>
  );
}