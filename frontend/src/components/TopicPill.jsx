import { motion } from "framer-motion";

export default function TopicPill({ topic, selected, onClick, onRemove }) {
    return (
        <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={onClick}
            className="relative flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
            style={{
                borderColor: selected ? topic.color : "rgba(255,255,255,0.1)",
                background: selected ? `${topic.color}18` : "rgba(255,255,255,0.04)",
                color: selected ? topic.color : "rgba(255,255,255,0.55)",
                boxShadow: selected ? `0 0 16px ${topic.color}30` : "none",
            }}
        >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: topic.color }} />
            {topic.name}
            <span
                onClick={e => { e.stopPropagation(); onRemove(); }}
                className="ml-1 text-white/30 hover:text-red-400 transition-colors cursor-pointer"
            >×</span>
        </motion.button>
    );
}
