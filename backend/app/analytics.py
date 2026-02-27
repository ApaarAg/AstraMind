import pandas as pd
import os

BASE_DIR=os.path.dirname(os.path.dirname(__file__))
LOG_PATH= os.path.join(BASE_DIR,"data","session_logs.csv")

def compute_metrics():

    if not os.path.exists(LOG_PATH):
        return {"message":"No logs yet"}
    
    df = pd.read_csv(LOG_PATH)

    if df.empty:
        return{"message":"log file empty"}
    
    metrics={
        "total_sessions":len(df),
        "avg_predicted_gain":df["predicted_gain"].mean(),
        "avg_delta_minutes":df["delta_minutes"].mean(),
        "allocation_variance":df["predicted_gain"].var(),
        "final_allocation_variance":df["final_minutes"].var(),
        "avg_normalized_gain": df["normalized_gain"].mean(),
        "gain_variance": df["normalized_gain"].var()
    }

    return metrics
