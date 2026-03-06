import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../components/GlassCard";
import AddTopicForm from "../components/AddTopicForm";
import TopicPill from "../components/TopicPill";
import { TOPIC_COLORS, mapFormToTopic } from "../components/helpers";
import { predictRequest } from "../api/api";

let nextId = 200;

function Spinner() {
    return (
        <motion.div
            animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-5 h-5 rounded-full border-2 border-cyan-400 border-t-transparent"
        />
    );
}

export default function PredictPage() {
    const [topics, setTopics] = useState([]);
    const [adding, setAdding] = useState(false);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ─── topic management ────────────────────────────────────────────────────
    const addTopic = (formFields) => {
        const color = TOPIC_COLORS[topics.length % TOPIC_COLORS.length];
        const newTopic = mapFormToTopic(formFields, ++nextId, color);
        setTopics(prev => [...prev, newTopic]);
        setAdding(false);
    };

    const removeTopic = (id) => {
        setTopics(prev => prev.filter(t => t.id !== id));
        setResults(null); // clear stale results when topics change
    };

    // ─── prediction call ─────────────────────────────────────────────────────
    const handlePredict = async () => {
        if (!topics.length) {
            setError("Add at least one topic before predicting.");
            return;
        }
        setLoading(true);
        setError(null);
        setResults(null);
        try {
            // predictRequest calls POST /plan and returns { study_plan: [...] }
            const data = await predictRequest(topics);
            console.log("📊 Predict raw response:", data);
            if (!data?.study_plan?.length) throw new Error("Backend returned an empty study_plan.");
            setResults(data.study_plan);
        } catch (err) {
            console.error("❌ Prediction failed:", err);
            setError(err.message || "Prediction failed. Make sure the backend is running on port 8000.");
        } finally {
            setLoading(false);
        }
    };

    const maxGain = results ? Math.max(...results.map(r => r.predicted_gain), 0.01) : 1;

    return (
        <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

            {/* ── Header ── */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <div className="inline-block text-[10px] font-mono tracking-[0.25em] text-cyan-400 border border-cyan-500/30 rounded-full px-4 py-1 mb-4 bg-cyan-500/10">
                    MASTERY PREDICTION ENGINE
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
                    <span style={{ background: "linear-gradient(135deg, #67e8f9 0%, #a78bfa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        Predict Mastery
                    </span>
                </h1>
                <p className="text-white/40 text-base max-w-xl leading-relaxed">
                    Add topics with full details. The model predicts gain scores and uncertainty per topic.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ── Left: Topic Builder ── */}
                <GlassCard className="p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <h2 className="font-display text-base font-semibold text-white/90">Topic Setup</h2>
                        <span className="text-[10px] font-mono text-white/30">{topics.length} topic{topics.length !== 1 ? "s" : ""}</span>
                    </div>

                    {/* Topic pills */}
                    {topics.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {topics.map(t => (
                                <TopicPill
                                    key={t.id}
                                    topic={t}
                                    selected={false}
                                    onClick={() => { }}
                                    onRemove={() => removeTopic(t.id)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Topic details summary */}
                    {topics.length > 0 && (
                        <div className="space-y-1.5">
                            {topics.map(t => (
                                <motion.div
                                    key={t.id}
                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                    className="grid grid-cols-4 gap-2 px-3 py-2 rounded-lg bg-white/3 border border-white/6 text-[10px] font-mono"
                                >
                                    <span className="text-white/60 truncate col-span-1">{t.name}</span>
                                    <span className="text-white/35">diff <span className="text-orange-300">{t.difficulty.toFixed(2)}</span></span>
                                    <span className="text-white/35">score <span className="text-cyan-300">{t.pastScore}</span></span>
                                    <span className="text-white/35">conf <span className="text-violet-300">{t.confidence.toFixed(2)}</span></span>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Add topic form (full schema — all 7 required fields) */}
                    <AnimatePresence>
                        {adding && (
                            <AddTopicForm
                                key="predict-add-form"
                                onAdd={addTopic}
                                onCancel={() => setAdding(false)}
                            />
                        )}
                    </AnimatePresence>

                    {!adding && (
                        <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            onClick={() => setAdding(true)}
                            className="w-full py-2.5 rounded-xl border border-dashed border-violet-500/30 text-xs text-violet-300/70 hover:text-violet-300 hover:border-violet-500/50 transition-all"
                        >
                            + Add Topic (with Full Schema)
                        </motion.button>
                    )}

                    {/* Run Prediction */}
                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handlePredict}
                        disabled={loading || !topics.length}
                        className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{
                            background: "linear-gradient(135deg, rgba(6,182,212,0.7), rgba(124,58,237,0.6))",
                            border: "1px solid rgba(6,182,212,0.4)",
                            boxShadow: "0 0 24px rgba(6,182,212,0.15)",
                        }}
                    >
                        {loading ? <><Spinner /> Predicting…</> : "🔮 Run Prediction"}
                    </motion.button>
                </GlassCard>

                {/* ── Right: Results ── */}
                <GlassCard className="p-6 space-y-4">
                    <h2 className="font-display text-base font-semibold text-white/90">Prediction Results</h2>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 space-y-1"
                            >
                                <div className="font-medium">⚠ Request failed</div>
                                <div className="text-red-300/70 text-xs leading-relaxed">{error}</div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Loading */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-white/30">
                            <Spinner />
                            <span className="text-xs font-mono">Running model inference…</span>
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && !error && !results && (
                        <div className="flex flex-col items-center justify-center py-12 gap-2 text-white/20">
                            <span className="text-3xl">🔮</span>
                            <span className="text-xs font-mono">Add topics and run prediction</span>
                        </div>
                    )}

                    {/* Results cards */}
                    {!loading && results && (
                        <div className="space-y-3">
                            {results.map((t, i) => {
                                const srcTopic = topics.find(x => x.name === t.topic_name);
                                const color = srcTopic?.color || "#a78bfa";
                                const pct = Math.min((t.predicted_gain / maxGain) * 100, 100);
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.07 }}
                                        className="rounded-xl border border-white/8 bg-white/3 p-4 space-y-3"
                                        style={{ boxShadow: `0 0 20px ${color}12` }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                                                <span className="text-sm font-medium text-white/85">{t.topic_name}</span>
                                            </div>
                                            <span className="text-[10px] font-mono text-white/35">
                                                {((t.allocated_minutes ?? 0) / 60).toFixed(1)}h allocated
                                            </span>
                                        </div>

                                        {/* Gain bar */}
                                        <div>
                                            <div className="flex justify-between text-[11px] mb-1.5">
                                                <span className="text-white/40">Predicted Gain</span>
                                                <span className="font-mono font-semibold" style={{ color }}>
                                                    {t.predicted_gain.toFixed(3)}
                                                </span>
                                            </div>
                                            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                                <motion.div
                                                    className="h-full rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ type: "spring", stiffness: 80, delay: i * 0.07 }}
                                                    style={{ background: `linear-gradient(90deg, ${color}55, ${color})` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Uncertainty */}
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-white/35">Uncertainty (±σ)</span>
                                            <span className="font-mono text-orange-300">±{t.prediction_std.toFixed(4)}</span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </GlassCard>
            </div>
        </div>
    );
}
