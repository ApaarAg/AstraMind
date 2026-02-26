import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score,mean_squared_error
from xgboost import XGBRegressor
import joblib ,os

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

data["mastery"]=(
    0.4*(data["past_score"]/100)+
    0.25*(data["hours_spent"]/20)+
    0.2*(data["revision_count"]/10)+
    0.1*(data["confidence"]/5)-
    0.2*(data["difficulty"]/5)-
    0.15*(1/(data["days_to_exam"]+1))
)

data["mastery"]+=np.random.normal(0,0.005,n_samples)

data["mastery"]=np.clip(data["mastery"],0,1)

X=data.drop("mastery",axis=1)
y=data["mastery"]

X_train,X_test,Y_train,Y_test=train_test_split(X,y,test_size=0.2,random_state=89)

model=XGBRegressor(
    n_estimators=200,
    max_depth=4,
    learning_rate=0.05
)

model.fit(X_train,Y_train)

preds=model.predict(X_test)

print("R2:",r2_score(Y_test,preds))
print("RMSE:",np.sqrt(mean_squared_error(Y_test,preds)))

os.makedirs(r"backend\app\model",exist_ok=True)
joblib.dump(model,r"backend\app\model\mastery_model.pkl")

