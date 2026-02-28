import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy.stats import spearmanr
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error
from xgboost import XGBRegressor
import joblib, os, json,datetime

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
k = 0.04 # curvature strength

max_possible_improvement = data["remaining_gap"]/(1 + 0.6 * data["difficulty"])

improvement = (
    max_possible_improvement *
    (1 - np.exp(-k * data["predicted_minutes"]))
)
motivation = np.random.normal(1.0, 0.25, n_samples)
improvement *= motivation
bad_day = np.random.binomial(1, 0.1, n_samples)  # 10% chance
improvement *= (1 - 0.5 * bad_day)
burnout = np.where(data["predicted_minutes"] > 200,
                   np.random.uniform(0.7, 0.9, n_samples),
                   1.0)

improvement *= burnout
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
models=[]
for seed in [10,20,30,40,50]:
    model = XGBRegressor(
        n_estimators=300,
        max_depth=4,
        learning_rate=0.05,
        random_state=seed,
        subsample=0.8,
        colsample_bytree=0.8
    )

    model.fit(X_train, Y_train)
    models.append(model)

all_preds=[]
for model in models:
    preds=model.predict(X_test)
    all_preds.append(preds)
all_preds=np.array(all_preds)
mean_preds=all_preds.mean(axis=0)
std_preds = all_preds.std(axis=0)

experiment={
    "timestamp":str(datetime.datetime.now()),
    "r2":float(r2_score(Y_test,mean_preds)),
    "rmse":float(np.sqrt(mean_squared_error(Y_test,mean_preds))),
    "avg_prediction_std":float(np.mean(std_preds))

}

with open(r"backend\experiments\log.json","a") as f:
    f.write(json.dumps(experiment)+"\n")


plt.figure()
plt.scatter(Y_test,mean_preds,alpha=0.4)
plt.xlabel("Actual Improvement")
plt.ylabel("Predicted Improvement")
plt.title("Prediction vs Actual")
plt.plot([Y_test.min(),Y_test.max()],
         [Y_test.min(),Y_test.max()],
         "r--")
plt.show()

residuals=Y_test-mean_preds
plt.figure()
plt.hist(residuals,bins=40)
plt.title("Residual Distribution")
plt.xlabel("Residual")
plt.ylabel("Frequency")
plt.show()

X_perturbed=X_test.copy()
noise=np.random.normal(0,0.02,X_perturbed.shape)
X_perturbed=X_perturbed + noise
perturbed_all_preds=[]

for model in models:
    preds=model.predict(X_perturbed)
    perturbed_all_preds.append(preds)
perturbed_all_preds=np.array(perturbed_all_preds)
perturbed_mean_preds=perturbed_all_preds.mean(axis=0)

rank_corr,_=spearmanr(mean_preds,perturbed_mean_preds)
slope=np.polyfit(Y_test,mean_preds,1)[0]
intercept=np.polyfit(Y_test,mean_preds,1)[1]
print("Calibrated Intercept:",intercept)
print("Calibration Slope:",slope)
print("Ranking Stability(Spearman):",rank_corr)
print("R2:", r2_score(Y_test, mean_preds))
print("RMSE:", np.sqrt(mean_squared_error(Y_test, mean_preds)))
print("Average Prediction Std:", std_preds.mean())
# -------------------------
# 7. Save Feature Importance
# -------------------------
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

all_importances=[]
for model in models:
    all_importances.append(model.feature_importances_)
all_importances=np.array(all_importances)
mean_importance=all_importances.mean(axis=0)


importances_dict = {
    feature: float(importance)
    for feature, importance in zip(FEATURES, mean_importance)
}

with open(os.path.join(DATA_DIR, "feature_importance.json"), "w") as f:
    json.dump(importances_dict, f, indent=4)

# -------------------------
# 8. Save Model
# -------------------------
os.makedirs(r"backend\app\model", exist_ok=True)
joblib.dump(models, r"backend\app\model\mastery_model.pkl")