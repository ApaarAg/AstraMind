import { motion, AnimatePresence } from "framer-motion";

export default function OptimizingIndicator({ active }) {
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
