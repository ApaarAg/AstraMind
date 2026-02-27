def compute_priority(topic):
    urgency=1/(topic["days_to_exam"]+1)
    gain=topic["predicted_gain"]
    difficulty_factor=topic["difficulty"]/5

    return gain*urgency*(1+0.3*difficulty_factor)

def generate_plan(topics, available_hours):

    # Compute priority
    for item in topics:
        item["priority_score"] = compute_priority(item)

    # Sort by priority descending
    sorted_topics = sorted(
        topics,
        key=lambda x: x["priority_score"],
        reverse=True
    )

    # Compute total priority
    total_priority = sum(t["priority_score"] for t in sorted_topics)

    # Proportional allocation
    for t in sorted_topics:
        if total_priority == 0:
            t["allocated_hours"] = 0
        else:
            raw_hours=(
                t["priority_score"]/total_priority
            )*available_hours

            total_minutes=raw_hours*60
            rounded_minutes=int(round(total_minutes))

            hours=rounded_minutes//60
            minutes=rounded_minutes % 60

            t["allocated_minutes"]=rounded_minutes
            t["allocated_time"]=f"{hours}h :{minutes}m"
    return sorted_topics


