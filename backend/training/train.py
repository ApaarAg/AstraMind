import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score,mean_squared_error
from xgboost import XGBRegressor
import joblib ,os,json

np.random.seed(67)

n_samples=9000

data=pd.DataFrame({
    "difficulty":np.random.randint(1,6,n_samples),
    "past_score":np.random.uniform(30,100,n_samples),
    "hours_spent":np.random.uniform(0,20,n_samples),
    "revision_count":np.random.randint(0,10,n_samples),
    "days_to_exam":np.random.randint(1,30,n_samples),
    "confidence":np.random.randint(1,6,n_samples)
})

# data["mastery"]=(
#     0.4*(data["past_score"]/100)+
#     0.25*(data["hours_spent"]/20)+
#     0.2*(data["revision_count"]/10)+
#     0.1*(data["confidence"]/5)-
#     0.2*(data["difficulty"]/5)-
#     0.15*(1/(data["days_to_exam"]+1))
# )
FEATURES = [
    "difficulty",
    "past_score",
    "hours_spent",
    "revision_count",
    "days_to_exam",
    "confidence"
]
baseline=(
    0.4*(data["past_score"]/100)+
    0.25*(data["hours_spent"]/20)+
    0.2*(data["revision_count"]/10)+
    0.1*(data["confidence"]/5)-
    0.2*(data["difficulty"]/5)-
    0.15*(1/(data["days_to_exam"]+1))
)
baseline+= np.random.normal(0,0.05,n_samples)
baseline=np.clip(baseline,0,1)
# improvement_factor=(
#     0.25*(1-baseline)*
#     (1/data["difficulty"])*
#     (1/(data["days_to_exam"]+1))
# )
# gain=improvement_factor+np.random.normal(0,0.02,n_samples)
# gain=np.clip(gain,0,0.2)
diminishing = np.exp(-data["hours_spent"]/10)
gain=(
    0.40*(1-baseline)*
    (1/data["difficulty"])*
    (1/(data["days_to_exam"]+1))*
    diminishing
)

gain+=np.random.normal(0,0.01,n_samples)
gain=np.clip(gain,0,0.3)


data["gain"]=gain

# data["mastery"]+=np.random.normal(0,0.005,n_samples)

# data["mastery"]=np.clip(data["mastery"],0,1)


X=data[FEATURES]
y=data["gain"]

X_train,X_test,Y_train,Y_test=train_test_split(X,y,test_size=0.2,random_state=89)

model=XGBRegressor(
    n_estimators=200,
    max_depth=4,
    learning_rate=0.05
)
print("Gain mean:", gain.mean())
print("Gain variance:", gain.var())
model.fit(X_train,Y_train)

Base_dir=os.path.dirname(os.path.dirname(__file__))
DATA_dir=os.path.join(Base_dir,"data")
os.makedirs(DATA_dir,exist_ok=True)
importances=model.feature_importances_
importances_dict={
    feature:float(importance)
    for feature, importance in zip(FEATURES,importances)
}

with open(os.path.join(DATA_dir,"feature_importance.json"),"w") as f:
    json.dump(importances_dict,f,indent=4)

preds=model.predict(X_test)

print("R2:",r2_score(Y_test,preds))
print("RMSE:",np.sqrt(mean_squared_error(Y_test,preds)))

os.makedirs(r"backend\app\model",exist_ok=True)
joblib.dump(model,r"backend\app\model\mastery_model.pkl")

