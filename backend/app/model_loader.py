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
        results.append({
            "topic_name":topic["topic_name"],
            "mastery_probability":float(prob),
            "mastery_level":classify_mastery(prob)
        })

    return results

