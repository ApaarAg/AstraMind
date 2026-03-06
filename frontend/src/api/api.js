// ─── CENTRAL API LAYER ──────────────────────────────────────────────────────
// All requests go to the FastAPI backend.
// Frontend uses camelCase/0-1 floats; backend expects snake_case/integer scales.

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ─── Payload transformer: converts frontend topic shape → backend schema ─────
function toBackendTopic(t) {
    return {
        topic_name: t.name ?? t.topic_name,
        difficulty: Math.round((t.difficulty ?? 0.65) * 5),   // 0–1  → 1–5
        past_score: t.pastScore ?? t.past_score ?? 70,
        hours_spent: t.hoursSpent ?? t.hours_spent ?? 5,
        revision_count: t.revisionCount ?? t.revision_count ?? 2,
        days_to_exam: t.daysToExam ?? t.days_to_exam ?? 14,
        confidence: Math.round((t.confidence ?? 0.5) * 5),    // 0–1  → 1–5
    };
}

// ─── Generic POST helper ─────────────────────────────────────────────────────
async function apiFetch(path, payload) {
    console.log(`🚀 [POST ${path}] Sending payload:`, JSON.stringify(payload, null, 2));
    let response;
    try {
        response = await fetch(`${BASE_URL}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    } catch (networkErr) {
        console.error(`❌ [${path}] Network error (backend not reachable?):`, networkErr.message);
        throw new Error(`Cannot reach backend at ${BASE_URL}. Is it running? (${networkErr.message})`);
    }

    if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error(`❌ [${path}] HTTP ${response.status}:`, errorText);
        throw new Error(`Backend ${path} returned ${response.status}: ${errorText || response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ [POST ${path}] Response:`, result);
    return result;
}

// ─── planRequest ─────────────────────────────────────────────────────────────
// POST /plan
// Returns: { study_plan: [{ topic_name, predicted_gain, prediction_std,
//             allocated_minutes, difficulty, ... }] }
export async function planRequest(topics, availableHours) {
    const payload = {
        topics: topics.map(toBackendTopic),
        available_hours: Number(availableHours),
    };
    return apiFetch("/plan", payload);
}

// ─── predictRequest ──────────────────────────────────────────────────────────
// Backend has no dedicated /predict route; we call POST /plan with a neutral
// available_hours value so the planner runs and we get predicted_gain + std
// from study_plan[]. The caller reads result.study_plan[].
export async function predictRequest(topics) {
    // Use sum of hours as budget so every topic gets a meaningful allocation
    const totalHours = topics.reduce((s, t) => s + (t.hoursSpent ?? t.hours_spent ?? 5), 0);
    const availableHours = Math.max(topics.length * 1, totalHours);

    const payload = {
        topics: topics.map(toBackendTopic),
        available_hours: Number(availableHours),
    };
    return apiFetch("/plan", payload);
}

// ─── finalizeRequest ─────────────────────────────────────────────────────────
// POST /finalize_plan
// Body: { final_plan: [{ topic_name, pre_score, post_score, allocated_minutes }] }
export async function finalizeRequest(finalPlan) {
    const payload = {
        final_plan: finalPlan.map(e => ({
            topic_name: String(e.topic_name).trim(),
            pre_score: Number(e.pre_score),
            post_score: Number(e.post_score),
            allocated_minutes: Number(e.allocated_minutes),
        })),
    };
    return apiFetch("/finalize_plan", payload);
}

// ─── analyticsRequest ────────────────────────────────────────────────────────
// POST /analytics  (no body required)
export async function analyticsRequest() {
    return apiFetch("/analytics", {});
}
