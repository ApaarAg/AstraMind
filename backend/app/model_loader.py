import joblib, os
import pandas as pd

MODEL_PATH=os.path.join(
    os.path.dirname(__file__),
    "model",
    "mastery_model.pkl"
)

_model=None

def load_model():
    global _model
    if _model is None:
        _model=joblib.load(MODEL_PATH)
    return _model

def predict_mastery(topics:list):
    models=load_model()

    df=pd.DataFrame(topics)
    feature_columns=[
        "difficulty",
        "past_score",
        "remaining_gap",
        "hours_spent",
        "revision_count",
        "days_to_exam",
        "confidence",
        "predicted_minutes"
    ]
    df["remaining_gap"]=100-df["past_score"]
    df["predicted_minutes"]=0
    df=df[feature_columns].astype(float)
    
    all_preds=[]
    for model in models:
        preds=model.predict(df)
        all_preds.append(preds)

    all_preds=pd.DataFrame(all_preds)

    mean_preds=all_preds.mean(axis=0).values
    std_preds=all_preds.std(axis=0).values
    
    return mean_preds,std_preds

def classify_mastery(prob):
    if prob <0.4:
        return "low"
    elif prob<0.7:
        return "medium"
    else:
        return "high"
    
def predict_with_classification(topics:list):
    mean_preds,std_preds=predict_mastery(topics)

    results=[]
    

    for topic,mean,std in zip(topics,mean_preds,std_preds):
        result = topic.copy()

        result["predicted_gain"]=float(mean)
        result["prediction_std"]=float(std)

        results.append(result)

    return results

