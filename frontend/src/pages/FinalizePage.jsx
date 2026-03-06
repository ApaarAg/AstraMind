import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../components/GlassCard";
import { finalizeRequest } from "../api/api";

function Spinner() {
    return (
        <motion.div
            animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-5 h-5 rounded-full border-2 border-violet-400 border-t-transparent"
        />
    );
}

const EMPTY_ENTRY = { topic_name: "", pre_score: 0, post_score: 0, allocated_minutes: 60 };

export default function FinalizePage() {
    const [entries, setEntries] = useState([{ ...EMPTY_ENTRY }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const updateEntry = (idx, key, val) => {
        setEntries(prev => prev.map((e, i) => i === idx ? { ...e, [key]: val } : e));
    };

    const addEntry = () => setEntries(prev => [...prev, { ...EMPTY_ENTRY }]);

    const removeEntry = idx => setEntries(prev => prev.filter((_, i) => i !== idx));

    const handleSubmit = async () => {
        const validEntries = entries.filter(e => e.topic_name.trim());
        if (!validEntries.length) {
            setError("Please add at least one topic with a name.");
            return;
        }
        setLoading(true);
        setError(null);
        setSuccess(false);
        try {
            const payload = validEntries.map(e => ({
                topic_name: e.topic_name.trim(),
                pre_score: Number(e.pre_score),
                post_score: Number(e.post_score),
                allocated_minutes: Number(e.allocated_minutes),
            }));
            await finalizeRequest(payload);
            setSuccess(true);
            setEntries([{ ...EMPTY_ENTRY }]);
        } catch (err) {
            setError(err.message || "Failed to save plan. Make sure the backend is running.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <div className="inline-block text-[10px] font-mono tracking-[0.25em] text-green-400 border border-green-500/30 rounded-full px-4 py-1 mb-4 bg-green-500/10">
                    PLAN FINALIZATION
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
                    <span style={{ background: "linear-gradient(135deg, #34d399 0%, #67e8f9 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        Finalize Plan
                    </span>
                </h1>
                <p className="text-white/40 text-base max-w-xl leading-relaxed">
                    Record your actual study outcomes to log session data for analytics tracking.
                </p>
            </motion.div>

            {/* Success banner */}
            <AnimatePresence>
                {success && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="rounded-2xl border border-green-500/40 bg-green-500/10 p-6 text-center space-y-2"
                        style={{ boxShadow: "0 0 40px rgba(52,211,153,0.12)" }}
                    >
                        <div className="text-4xl mb-2">✅</div>
                        <div className="font-display text-xl font-semibold text-green-300">Plan Saved Successfully</div>
                        <div className="text-sm text-white/40 font-mono">Session has been logged to the analytics database.</div>
                        <motion.button
                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                            onClick={() => setSuccess(false)}
                            className="mt-3 px-5 py-2 rounded-full text-xs font-medium text-green-300 border border-green-500/40 bg-green-500/10 hover:bg-green-500/20 transition-all"
                        >
                            + Log Another Session
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {!success && (
                <GlassCard className="p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <h2 className="font-display text-base font-semibold text-white/90">Session Outcomes</h2>
                        <span className="text-[10px] font-mono text-white/30">{entries.length} topic{entries.length !== 1 ? "s" : ""}</span>
                    </div>

                    {/* Entry rows */}
                    <div className="space-y-4">
                        {entries.map((entry, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="rounded-xl border border-white/8 bg-white/3 p-4 space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-mono text-violet-400 tracking-widest">TOPIC {idx + 1}</span>
                                    {entries.length > 1 && (
                                        <button onClick={() => removeEntry(idx)} className="text-[11px] text-white/25 hover:text-red-400 transition-colors">Remove</button>
                                    )}
                                </div>

                                {/* Topic name */}
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/40 transition-colors"
                                    placeholder="Topic name (e.g. Machine Learning)"
                                    value={entry.topic_name}
                                    onChange={e => updateEntry(idx, "topic_name", e.target.value)}
                                />

                                {/* Score grid */}
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { key: "pre_score", label: "Pre Score", hint: "0–100" },
                                        { key: "post_score", label: "Post Score", hint: "0–100" },
                                        { key: "allocated_minutes", label: "Minutes", hint: "total time" },
                                    ].map(({ key, label, hint }) => (
                                        <div key={key} className="space-y-1">
                                            <div className="flex justify-between items-baseline">
                                                <label className="text-[10px] text-white/40">{label}</label>
                                                <span className="text-[10px] font-mono text-cyan-300">{entry[key]}</span>
                                            </div>
                                            <input
                                                type="number" min={0} value={entry[key]}
                                                onChange={e => updateEntry(idx, key, e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white font-mono outline-none focus:border-violet-500/40 transition-colors"
                                                style={{ appearance: "none", MozAppearance: "textfield" }}
                                            />
                                            <span className="text-[9px] text-white/20">{hint}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Add topic */}
                    <button
                        onClick={addEntry}
                        className="w-full py-2 rounded-xl border border-dashed border-white/15 text-xs text-white/30 hover:text-white/60 hover:border-white/25 transition-all"
                    >
                        + Add another topic
                    </button>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                            >
                                ⚠ {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Submit */}
                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{ background: "linear-gradient(135deg, rgba(52,211,153,0.6), rgba(6,182,212,0.5))", border: "1px solid rgba(52,211,153,0.4)", boxShadow: "0 0 24px rgba(52,211,153,0.10)" }}
                    >
                        {loading ? <><Spinner /> Saving…</> : "✅ Save Finalized Plan"}
                    </motion.button>
                </GlassCard>
            )}
        </div>
    );
}
