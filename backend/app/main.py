from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import StudyRequest, FinalizeRequest
from app.model_loader import predict_with_classification
from app.scheduler import generate_plan
from app.logger import log_session
from app.analytics import compute_metrics

app = FastAPI(title="AI Study Planner")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

last_generated_plan = None


@app.get("/")
def health_check():
    return {"status": "running"}


@app.post("/plan")
def create_plan(request: StudyRequest):
    global last_generated_plan

    topic_dicts = [t.dict() for t in request.topics]

    predictions = predict_with_classification(topic_dicts)

    plan = generate_plan(predictions, request.available_hours)

    last_generated_plan = plan

    return plan  # ✅ RETURN DIRECTLY (not nested)


@app.post("/finalize_plan")
def finalize_plan(request: FinalizeRequest):
    global last_generated_plan

    log_session(
        predicted_plan=last_generated_plan,
        final_plan=request.final_plan
    )

    return {"status": "plan saved"}


@app.post("/analytics")
def analytics():
    return compute_metrics()