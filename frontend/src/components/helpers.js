// ─── SHARED DATA & MATH HELPERS ─────────────────────────────────────────────

export const DEFAULT_TOPICS = [
    { id: 1, name: "Machine Learning", difficulty: 0.85, urgency: 0.90, baseGain: 0.78, color: "#a78bfa", pastScore: 62, hoursSpent: 8, revisionCount: 2, daysToExam: 7, confidence: 0.40 },
    { id: 2, name: "Linear Algebra", difficulty: 0.70, urgency: 0.75, baseGain: 0.65, color: "#22d3ee", pastScore: 74, hoursSpent: 12, revisionCount: 3, daysToExam: 14, confidence: 0.55 },
    { id: 3, name: "Statistics", difficulty: 0.60, urgency: 0.80, baseGain: 0.72, color: "#34d399", pastScore: 80, hoursSpent: 10, revisionCount: 4, daysToExam: 10, confidence: 0.65 },
    { id: 4, name: "Deep Learning", difficulty: 0.90, urgency: 0.70, baseGain: 0.85, color: "#f472b6", pastScore: 55, hoursSpent: 5, revisionCount: 1, daysToExam: 21, confidence: 0.30 },
    { id: 5, name: "Algorithms", difficulty: 0.75, urgency: 0.65, baseGain: 0.68, color: "#fb923c", pastScore: 70, hoursSpent: 9, revisionCount: 3, daysToExam: 18, confidence: 0.50 },
];

export const TOPIC_COLORS = ["#a78bfa", "#22d3ee", "#34d399", "#f472b6", "#fb923c", "#60a5fa", "#facc15", "#e879f9"];

export function mapFormToTopic(fields, id, color) {
    const { name, difficulty, pastScore, hoursSpent, revisionCount, daysToExam, confidence } = fields;
    const examUrgency = Math.max(0, 1 - (daysToExam - 1) / 29);
    const scoreGap = Math.max(0, (100 - pastScore) / 100);
    const urgency = Math.min(1, examUrgency * 0.5 + scoreGap * 0.3 + (1 - confidence) * 0.2);
    const studyMaturity = Math.min(1, hoursSpent / 20);
    const revisionBoost = Math.min(0.1, revisionCount * 0.02);
    const baseGain = Math.min(0.95, scoreGap * 0.6 + (1 - studyMaturity) * 0.3 + revisionBoost + 0.1);
    return {
        id, name: name.trim(), difficulty, urgency, baseGain, color,
        pastScore, hoursSpent, revisionCount, daysToExam, confidence
    };
}

export function saturation(h, alpha = 1.8, beta = 0.6) {
    return alpha * (1 - Math.exp(-beta * h));
}

export function riskAdjustedGain(h, topic) {
    const raw = saturation(h, topic.baseGain * 2, 0.55);
    const uncertainty = 0.12 * topic.difficulty * Math.exp(-0.4 * h);
    const urgencyBonus = topic.urgency * 0.15;
    const difficultyScale = 1 / (1 + topic.difficulty * 0.2);
    return (
        raw * (1 - 0.5 * uncertainty) * difficultyScale +
        urgencyBonus * Math.min(h / 3, 1)
    );
}

export function optimizeAllocation(topics, budget) {
    const alloc = Object.fromEntries(topics.map(t => [t.id, 0.5]));
    let remaining = budget - topics.length * 0.5;
    const step = 0.5;

    while (remaining >= step) {
        let bestTopic = null, bestMarginal = -Infinity;
        for (const t of topics) {
            const curr = alloc[t.id];
            const marginal = riskAdjustedGain(curr + step, t) - riskAdjustedGain(curr, t);
            const weighted = marginal * (1 + t.urgency * 0.4) / (1 + t.difficulty * 0.2);
            if (weighted > bestMarginal) { bestMarginal = weighted; bestTopic = t; }
        }
        if (!bestTopic) break;
        alloc[bestTopic.id] += step;
        remaining -= step;
    }

    return topics.map(t => ({
        ...t,
        hours: alloc[t.id],
        gain: riskAdjustedGain(alloc[t.id], t),
        uncertainty: 0.12 * t.difficulty * Math.exp(-0.4 * alloc[t.id]),
    }));
}

export function buildCurveData(topic, maxH = 8) {
    return Array.from({ length: 33 }, (_, i) => {
        const h = (i / 32) * maxH;
        const gain = riskAdjustedGain(h, topic);
        const unc = 0.12 * topic.difficulty * Math.exp(-0.4 * h);
        return { h: +h.toFixed(2), gain: +gain.toFixed(3), upper: +(gain + unc).toFixed(3), lower: +(Math.max(0, gain - unc)).toFixed(3) };
    });
}
