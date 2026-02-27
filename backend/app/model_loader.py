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
    model=load_model()

    df=pd.DataFrame(topics)
    feature_columns=[
        "difficulty",
        "past_score",
        "hours_spent",
        "revision_count",
        "days_to_exam",
        "confidence"
    ]
    df=df[feature_columns].astype(float)
    preds=model.predict(df)

    return preds

def classify_mastery(prob):
    if prob <0.4:
        return "low"
    elif prob<0.7:
        return "medium"
    else:
        return "high"
    
def predict_with_classification(topics:list):
    probs=predict_mastery(topics)

    results=[]

    for topic,prob in zip(topics,probs):
        result = topic.copy()

        result["predicted_gain"]=float(prob)
        results.append(result)

    return results

