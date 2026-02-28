from fastapi import FastAPI
from app.schemas import StudyRequest,FinalizeRequest
from app.model_loader import predict_with_classification
from app.scheduler import generate_plan
from app.logger import log_session
from app.analytics import compute_metrics
app=FastAPI(title="Ai Study Planner ")

last_generated_plan=None
@app.get("/")
def health_check():
    return {"statue":"running"}

@app.post("/plan")
def create_plan(request:StudyRequest):
    topic_dicts=[t.dict() for t in request.topics]

    predictions=predict_with_classification(topic_dicts)

    plan=generate_plan(predictions,request.available_hours)
    global last_generated_plan
    last_generated_plan=plan

    print("Predictions:", predictions)
    print("Number of topics:", len(predictions))

    return {"study_plan":plan}



@app.post("/predict")
def predict_mastery_endpoint(request:StudyRequest):

    topic_dicts=[t.dict() for t in request.topics]

    predictions = predict_with_classification(topic_dicts)

    return {"predictions":predictions}

@app.post("/finalize_plan")
def finalize_plan(request:FinalizeRequest):
    global last_generated_plan
    log_session(
        predicted_plan=last_generated_plan,
        final_plan=request.final_plan
    )
    return {"status":"plan saved"}

@app.post("/analytics")
def analytics():
    return compute_metrics()
