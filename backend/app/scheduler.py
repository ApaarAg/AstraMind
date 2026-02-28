import numpy as np
from scipy.optimize import minimize


def generate_plan(topics, available_hours, hard_cap_hours=None):

    # -------------------------
    # 1. Filter mastered topics
    # -------------------------
    filtered = []
    for topic in topics:
        remaining_gap = 100 - topic["past_score"]
        if remaining_gap > 5:
            filtered.append(topic)

    if len(filtered) == 0:
        return {"study_plan": [], "unused_minutes": available_hours * 60}

    topics = filtered
    total_hours = available_hours
    n = len(topics)

    # -------------------------
    # 2. Constraints
    # -------------------------
    min_hours = 0.5
    max_fraction = 0.5
    max_hours = max_fraction * total_hours

    if hard_cap_hours is not None:
        max_hours = min(max_hours, hard_cap_hours)

    # -------------------------
    # 3. Risk-adjusted gains
    # -------------------------
    gains = []
    for topic in topics:
        mean = topic["predicted_gain"]
        std = topic.get("prediction_std", 0)

        risk_gain = mean / (1 + std)

        urgency = 1 / (topic["days_to_exam"] + 1)
        risk_gain *= (1 + 0.5 * urgency)

        gains.append(risk_gain)

    gains = np.array(gains)

    # -------------------------
    # 4. Objective (diminishing return)
    # -------------------------
    def objective(h):
        return -np.sum(gains * (1 - np.exp(-0.8 * h)))

    constraints = [{
        "type": "eq",
        "fun": lambda h: np.sum(h) - total_hours
    }]

    bounds = [(min_hours, max_hours) for _ in range(n)]
    x0 = np.array([total_hours / n] * n)

    # -------------------------
    # 5. Optimization
    # -------------------------
    result = minimize(
        objective,
        x0,
        bounds=bounds,
        constraints=constraints,
        options={"maxiter": 500}
    )

    if not result.success:
        raise RuntimeError(f"Optimization failed: {result.message}")

    optimal_hours = result.x

    # -------------------------
    # 6. Assign allocations
    # -------------------------
    for topic, hours in zip(topics, optimal_hours):
        minutes = int(round(hours * 60))
        topic["allocated_minutes"] = minutes
        topic["allocated_time"] = f"{minutes//60}h {minutes%60}m"

    return {
        "study_plan": topics,
        "unused_minutes": 0
    }