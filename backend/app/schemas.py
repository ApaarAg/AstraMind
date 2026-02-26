from pydantic import BaseModel
from typing import List

class Topic(BaseModel):
    topic_name:str
    difficulty:int
    past_score:float
    hour_spent:float
    revision_count:int
    days_to_exam:int
    confidence:int

class StudyRequest(BaseModel):
    topics:List[Topic]
    available_hours:float
    tie_breaker:str ="difficulty"