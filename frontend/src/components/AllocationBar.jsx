import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AllocationBar({ topic, maxHours, index }) {
    const [hovered, setHovered] = useState(false);
    const pct = Math.min((topic.hours / maxHours) * 100, 100);

    return (
        <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.07, type: "spring", stiffness: 120 }}
            className={`relative group ${hovered ? "z-50" : "z-0"}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm font-medium text-white/80 tracking-wide">{topic.name}</span>
                <div className="flex items-center gap-3 text-xs">
                    <span className="text-white/50">{topic.hours.toFixed(1)}h</span>
                    <span style={{ color: topic.color }} className="font-semibold">+{Math.round(topic.gain * 100)}%</span>
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
                    {pct > 15 && <span className="text-[11px] text-white/60 font-mono">±{Math.round(topic.uncertainty * 100)}%</span>}
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
