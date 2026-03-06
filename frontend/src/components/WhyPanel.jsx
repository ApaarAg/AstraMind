import { motion } from "framer-motion";
import { saturation } from "./helpers";

export default function WhyPanel({ topic }) {
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
            <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3 font-mono text-xs text-center"
                style={{ letterSpacing: "0.02em", lineHeight: "1.8", overflow: "visible" }}>
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
