import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { mapFormToTopic } from "./helpers";

const EMPTY_FORM = {
    name: "", difficulty: 0.65, pastScore: 70, hoursSpent: 5,
    revisionCount: 2, daysToExam: 14, confidence: 0.50,
};

function FormSlider({ label, hint, value, min = 0, max = 1, step = 0.01, onChange, display }) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between items-baseline">
                <label className="text-[11px] text-white/55 font-medium">{label}</label>
                <span className="text-[11px] font-mono text-violet-300">{display ?? value.toFixed(2)}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value}
                onChange={e => onChange(Number(e.target.value))}
                className="w-full cursor-pointer" />
            {hint && <p className="text-[10px] text-white/25 leading-tight">{hint}</p>}
        </div>
    );
}

function FormNumber({ label, hint, value, min = 0, max, step = 1, onChange }) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between items-baseline">
                <label className="text-[11px] text-white/55 font-medium">{label}</label>
                <span className="text-[11px] font-mono text-cyan-300">{value}</span>
            </div>
            <input
                type="number" min={min} max={max} step={step} value={value}
                onChange={e => onChange(Math.max(min, max !== undefined ? Math.min(max, Number(e.target.value)) : Number(e.target.value)))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white font-mono outline-none focus:border-violet-500/40 transition-colors"
                style={{ appearance: "none", MozAppearance: "textfield" }}
            />
            {hint && <p className="text-[10px] text-white/25 leading-tight">{hint}</p>}
        </div>
    );
}

export { FormSlider, FormNumber };

export default function AddTopicForm({ onAdd, onCancel, initialForm }) {
    const [form, setForm] = useState(initialForm ?? EMPTY_FORM);
    const [errors, setErrors] = useState({});

    const set = (key, val) => {
        setForm(f => ({ ...f, [key]: val }));
        setErrors(e => ({ ...e, [key]: undefined }));
    };

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = "Topic name is required.";
        if (form.daysToExam < 1) errs.daysToExam = "Must be at least 1 day.";
        if (form.pastScore < 0 || form.pastScore > 100) errs.pastScore = "Enter a value 0–100.";
        return errs;
    };

    const handleAdd = () => {
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        onAdd(form);
        setForm(EMPTY_FORM);
        setErrors({});
    };

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
        >
            <div className="rounded-xl border border-violet-500/20 bg-white/3 p-4 space-y-4"
                style={{ boxShadow: "0 0 24px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,0.05)" }}>

                {/* Header */}
                <div className="flex items-center gap-2 pb-1 border-b border-white/6">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                    <span className="text-[11px] font-mono text-violet-400 tracking-widest">NEW TOPIC · MODEL INPUTS</span>
                </div>

                {/* Topic Name */}
                <div className="space-y-1">
                    <label className="text-[11px] text-white/55 font-medium">Topic Name</label>
                    <input
                        className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 outline-none transition-colors ${errors.name ? "border-red-500/50" : "border-white/10 focus:border-violet-500/50"}`}
                        placeholder="e.g. Probability Theory"
                        value={form.name}
                        onChange={e => set("name", e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleAdd()}
                    />
                    {errors.name && <p className="text-[10px] text-red-400">{errors.name}</p>}
                </div>

                {/* Sliders row */}
                <div className="grid grid-cols-1 gap-3 pt-1">
                    <FormSlider
                        label="Difficulty" hint="How conceptually hard is this topic? (0 = easy, 1 = very hard)"
                        value={form.difficulty} onChange={v => set("difficulty", v)}
                        display={form.difficulty.toFixed(2)}
                    />
                    <FormSlider
                        label="Confidence Level" hint="How confident are you in this topic right now?"
                        value={form.confidence} onChange={v => set("confidence", v)}
                        display={form.confidence.toFixed(2)}
                    />
                </div>

                {/* Numeric inputs grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <FormNumber
                            label="Past Score (%)" hint="Last test/assignment score"
                            value={form.pastScore} min={0} max={100}
                            onChange={v => set("pastScore", v)}
                        />
                        {errors.pastScore && <p className="text-[10px] text-red-400 mt-0.5">{errors.pastScore}</p>}
                    </div>
                    <FormNumber
                        label="Hours Already Studied" hint="Total hours invested so far"
                        value={form.hoursSpent} min={0} max={200}
                        onChange={v => set("hoursSpent", v)}
                    />
                    <FormNumber
                        label="Revision Count" hint="Number of times reviewed"
                        value={form.revisionCount} min={0} max={20}
                        onChange={v => set("revisionCount", v)}
                    />
                    <div>
                        <FormNumber
                            label="Days to Exam" hint="Calendar days remaining"
                            value={form.daysToExam} min={1} max={180}
                            onChange={v => set("daysToExam", v)}
                        />
                        {errors.daysToExam && <p className="text-[10px] text-red-400 mt-0.5">{errors.daysToExam}</p>}
                    </div>
                </div>

                {/* Derived preview */}
                {form.name.trim() && (
                    <div className="rounded-lg bg-white/3 border border-white/6 px-3 py-2 flex gap-4 text-[10px] font-mono">
                        {(() => {
                            const preview = mapFormToTopic(form, 0, "#fff");
                            return (
                                <>
                                    <span className="text-white/35">urgency <span className="text-pink-300">{preview.urgency.toFixed(2)}</span></span>
                                    <span className="text-white/35">base gain <span className="text-green-300">{preview.baseGain.toFixed(2)}</span></span>
                                    <span className="text-white/35">difficulty <span className="text-orange-300">{preview.difficulty.toFixed(2)}</span></span>
                                </>
                            );
                        })()}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={handleAdd}
                        className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-all"
                        style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.7), rgba(6,182,212,0.5))", border: "1px solid rgba(139,92,246,0.4)" }}
                    >
                        Add Topic
                    </motion.button>
                    <button onClick={onCancel}
                        className="px-4 py-2 rounded-lg text-sm text-white/40 border border-white/8 hover:text-white/70 hover:border-white/20 transition-all">
                        Cancel
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
