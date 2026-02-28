import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error
from xgboost import XGBRegressor
import joblib, os, json

np.random.seed(67)

n_samples = 9000

# -------------------------
# 1. Base Synthetic Features
# -------------------------
data = pd.DataFrame({
    "difficulty": np.random.randint(1, 6, n_samples),
    "past_score": np.random.uniform(30, 95, n_samples),
    "hours_spent": np.random.uniform(0, 20, n_samples),
    "revision_count": np.random.randint(0, 10, n_samples),
    "days_to_exam": np.random.randint(1, 30, n_samples),
    "confidence": np.random.randint(1, 6, n_samples)
})

# -------------------------
# 2. Remaining Gap
# -------------------------
data["remaining_gap"] = 100 - data["past_score"]

# -------------------------
# 3. Synthetic Predicted Minutes
# -------------------------
# More gap + more urgency + harder topic → more minutes
data["predicted_minutes"] = (
    10
    + 2 * data["remaining_gap"]
    + 5 / (data["days_to_exam"])
    + np.random.normal(0, 5, n_samples)
)

data["predicted_minutes"] = np.clip(data["predicted_minutes"], 10, 300)

# -------------------------
# 4. Diminishing Return Improvement
# -------------------------
k = 0.01  # curvature strength

max_possible_improvement = data["remaining_gap"]

improvement = (
    max_possible_improvement *
    (1 - np.exp(-k * data["predicted_minutes"])) /
    data["difficulty"]
)

# Add noise
improvement += np.random.normal(0, 1.5, n_samples)

# Prevent exceeding remaining gap
improvement = np.clip(improvement, 0, data["remaining_gap"])

data["improvement"] = improvement

# -------------------------
# 5. Features for Model
# -------------------------
FEATURES = [
    "difficulty",
    "past_score",
    "remaining_gap",
    "hours_spent",
    "revision_count",
    "days_to_exam",
    "confidence",
    "predicted_minutes"
]

X = data[FEATURES]
y = data["improvement"]

# -------------------------
# 6. Train/Test Split
# -------------------------
X_train, X_test, Y_train, Y_test = train_test_split(
    X, y, test_size=0.2, random_state=89
)

model = XGBRegressor(
    n_estimators=300,
    max_depth=4,
    learning_rate=0.05
)

model.fit(X_train, Y_train)

preds = model.predict(X_test)

print("R2:", r2_score(Y_test, preds))
print("RMSE:", np.sqrt(mean_squared_error(Y_test, preds)))

# -------------------------
# 7. Save Feature Importance
# -------------------------
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

importances = model.feature_importances_

importances_dict = {
    feature: float(importance)
    for feature, importance in zip(FEATURES, importances)
}

with open(os.path.join(DATA_DIR, "feature_importance.json"), "w") as f:
    json.dump(importances_dict, f, indent=4)

# -------------------------
# 8. Save Model
# -------------------------
os.makedirs(r"backend\app\model", exist_ok=True)
joblib.dump(model, r"backend\app\model\mastery_model.pkl")