import numpy as np
from scipy.optimize import minimize


def compute_priority(topic):
    urgency = 1 / (topic["days_to_exam"] + 1)

    mean_gain = topic["predicted_gain"]
    std_gain = topic.get("prediction_std", 0)

    # Stable uncertainty adjustment
    risk_gain = mean_gain / (1 + std_gain)

    difficulty_factor = topic["difficulty"] / 5

    return risk_gain * urgency * (1 + 0.3 * difficulty_factor)


def generate_plan(topics, available_hours):

    total_hours=available_hours
    n=len(topics)

    min_hours=0.5
    max_fraction=0.5
    max_hours=max_fraction*total_hours

    gains=[]
    for topic in topics:
        mean=topic["predicted_gain"]
        std=topic.get("prediction_std",0)
        risk_gain=mean/(1+std)
        gains.append(risk_gain)

    gains=np.array(gains)

    def objective(h):
        total=0
        for i in range(n):
            total+=gains[i]*(1-np.exp(-0.8*h[i]))
        return -total
    
    constraints=[{
        "type":"eq",
        "fun":lambda h: np.sum(h)-total_hours
    }]

    bounds=[(min_hours,max_hours) for _ in range(n)]

    x0=np.array([total_hours/n]*n)

    result=minimize(
        objective,
        x0,
        bounds=bounds,
        constraints=constraints
    )

    optimal_hours=result.x

    for topic,hours in zip(topics,optimal_hours):
        minutes=int(round(hours*60))

        topic["allocated_minutes"]=minutes
        topic["allocated_time"] = f"{minutes//60}h {minutes%60}m"

        return {
            "study_plan":topics,
            "unused_minutes":0
        }
    
def total_gain(predicted_gain, hours, k=0.8):
    return predicted_gain * (1 - np.exp(-k * hours))


def marginal_gain(predicted_gain, current_hours, delta=0.25, k=0.8):
    before = total_gain(predicted_gain, current_hours, k)
    after = total_gain(predicted_gain, current_hours + delta, k)
    return after - before