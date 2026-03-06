import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

const NAV_LINKS = [
    { to: "/plan", label: "Plan", icon: "⚡" },
    { to: "/predict", label: "Predict", icon: "🔮" },
    { to: "/finalize", label: "Finalize", icon: "✅" },
    { to: "/analytics", label: "Analytics", icon: "📊" },
];

export default function NavBar() {
    return (
        <nav
            className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-xl"
            style={{
                background: "linear-gradient(180deg, rgba(10,8,30,0.92) 0%, rgba(5,5,16,0.85) 100%)",
                boxShadow: "0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4)",
            }}
        >
            <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                {/* Brand */}
                <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-2.5"
                >
                    <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2.5 }}
                        className="w-2 h-2 rounded-full bg-violet-400"
                        style={{ boxShadow: "0 0 8px #8b5cf6" }}
                    />
                    <span
                        className="font-display text-sm font-semibold tracking-wide"
                        style={{
                            background: "linear-gradient(90deg, #c4b5fd, #67e8f9)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        AI Study Planner
                    </span>
                </motion.div>

                {/* Links */}
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex items-center gap-1"
                >
                    {NAV_LINKS.map(({ to, label, icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 font-mono tracking-wide ${isActive
                                    ? "text-violet-200"
                                    : "text-white/40 hover:text-white/70"
                                }`
                            }
                            style={({ isActive }) =>
                                isActive
                                    ? {
                                        background: "rgba(139,92,246,0.15)",
                                        border: "1px solid rgba(139,92,246,0.35)",
                                        boxShadow: "0 0 16px rgba(139,92,246,0.2)",
                                    }
                                    : {
                                        background: "transparent",
                                        border: "1px solid transparent",
                                    }
                            }
                        >
                            <span>{icon}</span>
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </motion.div>
            </div>
        </nav>
    );
}
