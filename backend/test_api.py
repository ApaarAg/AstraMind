import requests, json

payload = {
    "topics": [
        {"topic_name": "ML", "difficulty": 4, "past_score": 62, "hours_spent": 8, "revision_count": 2, "days_to_exam": 7, "confidence": 2},
        {"topic_name": "Algebra", "difficulty": 3, "past_score": 74, "hours_spent": 12, "revision_count": 3, "days_to_exam": 14, "confidence": 3}
    ],
    "available_hours": 8
}

r = requests.post("http://localhost:8000/plan", json=payload, timeout=5)
print("Status:", r.status_code)
data = r.json()
print(json.dumps(data, indent=2))
