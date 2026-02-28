import numpy as np

def compute_priority(topic):
    urgency = 1 / (topic["days_to_exam"] + 1)

    mean_gain = topic["predicted_gain"]
    std_gain = topic.get("prediction_std", 0)

    # Stable uncertainty adjustment
    risk_gain = mean_gain / (1 + std_gain)

    difficulty_factor = topic["difficulty"] / 5

    return risk_gain * urgency * (1 + 0.3 * difficulty_factor)


def generate_plan(topics, available_hours):

    total_minutes = int(available_hours * 60)

    min_minutes = 30
    max_fraction = 0.5
    delta_minutes = 15

    max_cap = int(max_fraction * total_minutes)
    n_topics = len(topics)

    if min_minutes * n_topics > total_minutes:
        raise ValueError("Not enough time to satisfy minimum allocation")

    # ---------------------------------
    # Step 1 — Minimum allocation
    # ---------------------------------
    for topic in topics:
        topic["allocated_minutes"] = min_minutes

    remaining_minutes = total_minutes - (min_minutes * n_topics)

    # ---------------------------------
    # Step 2 — Greedy allocation
    # ---------------------------------
    while remaining_minutes >= delta_minutes:

        best_topic = None
        best_gain = -1

        for topic in topics:

            current_minutes = topic["allocated_minutes"]

            # Enforce hard cap
            if current_minutes + delta_minutes > max_cap:
                continue

            current_hours = current_minutes / 60

            mean_gain = topic["predicted_gain"]
            std_gain = topic.get("prediction_std", 0)

            # Stable uncertainty adjustment
            risk_gain = mean_gain / (1 + std_gain)

            mg = marginal_gain(
                risk_gain,
                current_hours
            )

            if mg > best_gain:
                best_gain = mg
                best_topic = topic

        if best_topic is None:
            break

        best_topic["allocated_minutes"] += delta_minutes
        remaining_minutes -= delta_minutes

    # ---------------------------------
    # Step 3 — Handle leftover minutes
    # ---------------------------------
    leftover = remaining_minutes

    if leftover > 0:

        best_topic = None
        best_gain = -1

        for topic in topics:

            if topic["allocated_minutes"] + leftover > max_cap:
                continue

            current_hours = topic["allocated_minutes"] / 60

            mean_gain = topic["predicted_gain"]
            std_gain = topic.get("prediction_std", 0)

            risk_gain = mean_gain / (1 + std_gain)

            mg = marginal_gain(
                risk_gain,
                current_hours
            )

            if mg > best_gain:
                best_gain = mg
                best_topic = topic

        if best_topic is not None:
            best_topic["allocated_minutes"] += leftover
            remaining_minutes = 0

    # ---------------------------------
    # Step 4 — Format Output
    # ---------------------------------
    for topic in topics:
        minutes = topic["allocated_minutes"]
        topic["allocated_time"] = f"{minutes//60}h: {minutes%60}m"

    return {
        "study_plan": topics,
        "unused_minutes": remaining_minutes
    }


def total_gain(predicted_gain, hours, k=0.8):
    return predicted_gain * (1 - np.exp(-k * hours))


def marginal_gain(predicted_gain, current_hours, delta=0.25, k=0.8):
    before = total_gain(predicted_gain, current_hours, k)
    after = total_gain(predicted_gain, current_hours + delta, k)
    return after - before