import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../components/GlassCard";
import OptimizingIndicator from "../components/OptimizingIndicator";
import AllocationBar from "../components/AllocationBar";
import DiminishingCurve from "../components/DiminishingCurve";
import WhyPanel from "../components/WhyPanel";
import AddTopicForm from "../components/AddTopicForm";
import TopicPill from "../components/TopicPill";
import { DEFAULT_TOPICS, TOPIC_COLORS, mapFormToTopic, optimizeAllocation } from "../components/helpers";
import { planRequest } from "../api/api";

let nextId = 10;

export default function PlanPage() {
    const [allocation, setAllocation] = useState([]);
    const [loading, setLoading] = useState(false);
    const [budget, setBudget] = useState(8);
    const [topics, setTopics] = useState(DEFAULT_TOPICS);
    const [selected, setSelected] = useState(1);
    const [optimizing, setOptimizing] = useState(false);
    const [adding, setAdding] = useState(false);
    const optimizingTimer = useRef(null);

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

    useEffect(() => {
        if (!topics.length) return;
        let cancelled = false;

        async function runBackend() {
            try {
                setLoading(true);
                const result = await planRequest(topics, budget);

                if (cancelled) return;

                const maxGain = Math.max(...result.study_plan.map(t => t.predicted_gain), 1);
                const formatted = result.study_plan.map((t, index) => {
                    const srcTopic = topics.find(x => x.name === t.topic_name);
                    return {
                        id: srcTopic?.id ?? index + 1,
                        name: t.topic_name,
                        difficulty: t.difficulty / 5,
                        color: srcTopic?.color || "#a78bfa",
                        hours: t.allocated_minutes / 60,
                        gain: t.predicted_gain / Math.max(maxGain, 10),
                        uncertainty: Math.min(t.prediction_std / Math.max(maxGain, 10), 0.5),
                        urgency: srcTopic?.urgency || 0.5,
                        baseGain: srcTopic?.baseGain || 0.5,
                    };
                });

                setAllocation(formatted);
            } catch (err) {
                console.error("Backend fetch failed, falling back to local optimizer:", err);
                if (!cancelled) {
                    setAllocation(optimizeAllocation(topics, budget));
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        runBackend();
        return () => { cancelled = true; };
    }, [topics, budget]);

    return (
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">

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
                            ["Topics Active", topics.length, "#a78bfa"],
                            ["Avg Difficulty", topics.length > 0 ? (topics.reduce((s, t) => s + t.difficulty, 0) / topics.length).toFixed(2) : "—", "#fb923c"],
                            ["Avg Urgency", topics.length > 0 ? (topics.reduce((s, t) => s + t.urgency, 0) / topics.length).toFixed(2) : "—", "#f472b6"],
                            ["Avg Past Score", topics.length > 0 ? `${(topics.reduce((s, t) => s + (t.pastScore ?? 70), 0) / topics.length).toFixed(0)}%` : "—", "#34d399"],
                        ].map(([k, v, c]) => (
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
                        <OptimizingIndicator active={loading} />
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
                            { label: "Total Expected Gain", value: topics.length > 0 ? `${(totalGain * 100).toFixed(1)}%` : "—", color: "#34d399" },
                            { label: "Avg Hours/Topic", value: topics.length > 0 ? `${(budget / topics.length).toFixed(1)}h` : "—", color: "#67e8f9" },
                            { label: "Efficiency Score", value: topics.length > 0 ? `${Math.min(99, (totalGain / budget * 200)).toFixed(0)}` : "—", color: "#a78bfa" },
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
            <GlassCard className="p-6 space-y-5 z-20">
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
    );
}
