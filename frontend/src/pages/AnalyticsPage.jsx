import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import GlassCard from "../components/GlassCard";
import { analyticsRequest } from "../api/api";

function Spinner() {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-white/30">
            <motion.div
                animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-8 h-8 rounded-full border-2 border-violet-400 border-t-transparent"
            />
            <span className="text-xs font-mono">Fetching analytics…</span>
        </div>
    );
}

const METRIC_COLORS = ["#a78bfa", "#22d3ee", "#34d399", "#fb923c"];

const METRIC_CONFIG = [
    {
        key: "total_records",
        label: "Sessions Logged",
        icon: "📋",
        color: "#a78bfa",
        format: v => v,
        description: "Total finalized study sessions recorded",
    },
    {
        key: "avg_normalized_gain",
        label: "Avg Normalized Gain",
        icon: "📈",
        color: "#34d399",
        format: v => v.toFixed(3),
        description: "Average normalized improvement score",
    },
    {
        key: "avg_predicted_gain",
        label: "Avg Predicted Gain",
        icon: "🔮",
        color: "#22d3ee",
        format: v => v.toFixed(3),
        description: "Mean model-predicted gain across sessions",
    },
    {
        key: "avg_delta_minutes",
        label: "Avg Δ Minutes",
        icon: "⏱",
        color: "#fb923c",
        format: v => `${v.toFixed(1)}m`,
        description: "Average deviation from planned study time",
    },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border border-white/10 p-3 text-xs space-y-1" style={{ background: "rgba(10,10,30,0.95)", backdropFilter: "blur(20px)" }}>
            <div className="text-white/60 font-medium">{label}</div>
            <div className="font-mono" style={{ color: payload[0]?.fill }}>{payload[0]?.value?.toFixed(4)}</div>
        </div>
    );
};

export default function AnalyticsPage() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMetrics = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await analyticsRequest();
            setMetrics(data);
        } catch (err) {
            setError(err.message || "Failed to fetch analytics. Make sure the backend is running.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMetrics(); }, []);

    // Build chart data from metrics (bar chart of gain metrics)
    const chartData = metrics
        ? [
            { name: "Norm Gain", value: metrics.avg_normalized_gain, color: "#34d399" },
            { name: "Pred Gain", value: metrics.avg_predicted_gain, color: "#22d3ee" },
            { name: "Δ Min (÷100)", value: metrics.avg_delta_minutes / 100, color: "#fb923c" },
        ]
        : [];

    return (
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex items-end justify-between">
                <div>
                    <div className="inline-block text-[10px] font-mono tracking-[0.25em] text-orange-400 border border-orange-500/30 rounded-full px-4 py-1 mb-4 bg-orange-500/10">
                        PERFORMANCE ANALYTICS
                    </div>
                    <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
                        <span style={{ background: "linear-gradient(135deg, #fb923c 0%, #f472b6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            Analytics Dashboard
                        </span>
                    </h1>
                    <p className="text-white/40 text-base max-w-xl leading-relaxed">
                        Aggregated session metrics from your finalized study plans.
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={fetchMetrics}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl text-xs font-mono text-white/60 border border-white/15 bg-white/5 hover:bg-white/10 transition-all disabled:opacity-40"
                >
                    ↻ Refresh
                </motion.button>
            </motion.div>

            {/* Loading */}
            {loading && <Spinner />}

            {/* Error */}
            <AnimatePresence>
                {error && !loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-sm text-red-300 flex items-start gap-3"
                    >
                        <span className="text-xl">⚠</span>
                        <div>
                            <div className="font-medium mb-1">Could not load analytics</div>
                            <div className="text-red-300/70 text-xs">{error}</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Metrics */}
            {!loading && metrics && (
                <>
                    {/* Metric Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {METRIC_CONFIG.map((m, i) => (
                            <motion.div
                                key={m.key}
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                            >
                                <GlassCard className="p-5 space-y-3" style={{ boxShadow: `0 0 30px ${m.color}12, 0 8px 32px rgba(0,0,0,0.4)` }}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg">{m.icon}</span>
                                        <span className="text-[9px] font-mono text-white/25 tracking-wider uppercase">metric</span>
                                    </div>
                                    <div>
                                        <motion.div
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.08 + 0.2 }}
                                            className="font-display font-bold text-3xl font-mono"
                                            style={{ color: m.color }}
                                        >
                                            {m.format(metrics[m.key])}
                                        </motion.div>
                                        <div className="text-[11px] text-white/50 mt-1 font-medium">{m.label}</div>
                                    </div>
                                    <div className="text-[10px] text-white/25 leading-relaxed">{m.description}</div>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>

                    {/* Chart */}
                    <GlassCard className="p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="font-display text-base font-semibold text-white/90">Gain Metrics Overview</h2>
                            <span className="text-[10px] font-mono text-white/25">
                                {metrics.total_records} session{metrics.total_records !== 1 ? "s" : ""} logged
                            </span>
                        </div>

                        {metrics.total_records === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-2 text-white/20">
                                <span className="text-4xl">📋</span>
                                <span className="text-sm font-mono">No sessions logged yet.</span>
                                <span className="text-xs text-white/15">Use the Finalize page to record study outcomes.</span>
                            </div>
                        ) : (
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: -10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v.toFixed(2)} />
                                        <Tooltip
                                            content={<CustomTooltip />}
                                            cursor={{ fill: "rgba(255,255,255,0.05)", radius: 6 }}
                                        />
                                        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </GlassCard>

                    {/* Improvement Trends placeholder card */}
                    <GlassCard className="p-6 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="font-display text-base font-semibold text-white/90">Improvement Trends</h2>
                            <span className="text-[10px] font-mono text-white/25">Session-over-session</span>
                        </div>
                        {metrics.total_records < 2 ? (
                            <div className="py-8 text-center text-white/20 text-xs font-mono">
                                Finalize at least 2 sessions to see trends.
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: "Avg Gain vs Predicted", value: metrics.avg_normalized_gain > 0 ? `${((metrics.avg_normalized_gain / metrics.avg_predicted_gain) * 100).toFixed(0)}%` : "—", color: "#34d399" },
                                    { label: "Sessions Recorded", value: metrics.total_records, color: "#a78bfa" },
                                    { label: "Mean Time Deviation", value: `${metrics.avg_delta_minutes.toFixed(1)}m`, color: "#fb923c" },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className="text-center bg-white/3 border border-white/5 rounded-xl p-4">
                                        <div className="font-mono font-bold text-2xl" style={{ color }}>{value}</div>
                                        <div className="text-[10px] text-white/35 mt-1 leading-tight">{label}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                </>
            )}
        </div>
    );
}
