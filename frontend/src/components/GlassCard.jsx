import { motion } from "framer-motion";

export default function GlassCard({ children, className = "", glow = false, style = {} }) {
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
