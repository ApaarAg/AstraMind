from fastapi import FastAPI
from app.schemas import StudyRequest


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

