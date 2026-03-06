import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { buildCurveData } from "./helpers";

export default function DiminishingCurve({ topic }) {
    const data = useMemo(() => buildCurveData(topic, 10), [topic]);
    const [revealed, setRevealed] = useState(false);

    useEffect(() => {
        setRevealed(false);
        const t = setTimeout(() => setRevealed(true), 100);
        return () => clearTimeout(t);
    }, [topic.id]);

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
                        <XAxis dataKey="h" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false}
                            label={{ value: "Hours", fill: "#475569", fontSize: 10, position: "insideBottomRight", offset: -5 }} />
                        <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false}
                            tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="upper" stroke="none" fill={`url(#grad-unc-${topic.id})`} />
                        <Area type="monotone" dataKey="lower" stroke="none" fill="rgba(0,0,0,0)" />
                        <Area type="monotone" dataKey="gain" stroke={topic.color} strokeWidth={2.5}
                            fill={`url(#grad-${topic.id})`} dot={false} activeDot={{ r: 4, fill: topic.color, strokeWidth: 0 }} />
                        <ReferenceLine x={topic.hours} stroke={topic.color} strokeDasharray="4 3" strokeWidth={1.5}
                            label={{ value: "allocated", fill: topic.color, fontSize: 9, position: "top" }} />
                    </AreaChart>
                </ResponsiveContainer>
            </motion.div>
        </div>
    );
}
