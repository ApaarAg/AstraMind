from fastapi import FastAPI
from app.schemas import StudyRequest
from app.model_loader import predict_with_classification

app=FastAPI(title="Ai Study Planner ")


@app.get("/")
def health_check():
    return {"statue":"running"}

@app.post("/plan")
def create_plan(request:StudyRequest):
    return{
        "message":"Received request",
        "num_topics":len(request.topics),
        "available_hours":request.available_hours
    }

@app.post("/predict")
def predict_mastery_endpoint(request:StudyRequest):

    topic_dicts=[t.dict() for t in request.topics]

    predictions = predict_with_classification(topic_dicts)

    return {"predictions":predictions}

