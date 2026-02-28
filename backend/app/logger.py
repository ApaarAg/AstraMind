import csv
import os
import datetime
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

LOG_PATH = os.path.join(DATA_DIR, "session_logs.csv")


def compute_normalized_gain(pre_score, post_score):
    if pre_score >= 100:
        return 0.0
    return (post_score - pre_score) / (100 - pre_score)


def log_session(predicted_plan, final_plan):

    file_exists = os.path.isfile(LOG_PATH)

    # Map topic_name -> full final object
    final_lookup = {
        item.topic_name: item
        for item in final_plan
    }

    timestamp = datetime.datetime.now()

    with open(LOG_PATH, mode="a", newline="") as file:
        writer = csv.writer(file)

        # Write header only once
        if not file_exists:
            writer.writerow([
                "timestamp",
                "topic_name",
                "difficulty",
                "past_score",
                "hours_spent",
                "revision_count",
                "days_to_exam",
                "confidence",
                "predicted_gain",
                "predicted_minutes",
                "final_minutes",
                "delta_minutes",
                "pre_score",
                "post_score",
                "normalized_gain"
            ])

        # Always write rows
        for topic in predicted_plan:

            final_item = final_lookup.get(topic["topic_name"])

            if final_item is None:
                continue

            predicted_minutes = topic["allocated_minutes"]
            final_minutes = final_item.allocated_minutes
            delta = final_minutes - predicted_minutes

            normalized_gain = compute_normalized_gain(
                final_item.pre_score,
                final_item.post_score
            )

            writer.writerow([
                timestamp,
                topic["topic_name"],
                topic["difficulty"],
                topic["past_score"],
                topic["hours_spent"],
                topic["revision_count"],
                topic["days_to_exam"],
                topic["confidence"],
                topic["predicted_gain"],
                predicted_minutes,
                final_minutes,
                delta,
                final_item.pre_score,
                final_item.post_score,
                normalized_gain
            ])

    # Retraining trigger
    if os.path.isfile(LOG_PATH):
        df = pd.read_csv(LOG_PATH)
        if len(df) >= 300:
            print("⚠ Retraining threshold reached (300 logs)")