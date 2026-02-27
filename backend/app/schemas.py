from pydantic import BaseModel
from typing import List

class Topic(BaseModel):
    topic_name:str
    difficulty:int
    past_score:float
    hours_spent:float
    revision_count:int
    days_to_exam:int
    confidence:int

class StudyRequest(BaseModel):
    topics:List[Topic]
    available_hours:float
    tie_breaker:str ="difficulty"
  
class FinalTopicUpdate(BaseModel):
    topic_name:str
    pre_score:float
    post_score:float
    allocated_minutes:int

class FinalizeRequest(BaseModel):
    final_plan:List[FinalTopicUpdate]

