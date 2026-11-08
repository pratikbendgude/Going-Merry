import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error,r2_score

data = {
    'hours':[1,2,3,4,5,6,7,8],
    'marks':[20,25,35,45,50,60,70,80]
}

df = pd.DataFrame(data)

X = df[['hours']]
y=df['marks']

X_train,X_test, y_train, y_test = train_test_split(
    X,y,test_size=0.2,random_state=42
    )
model = LinearRegression()

model.fit(X_train,y_train)

print("Intercept:", model.intercept_)
print("Coefficient:", model.coef_)

y_pred = model.predict(X_test)

print(f"Predicted marks: {y_pred}")

comparison = pd.DataFrame({
    'Actual': y_test,
    'Predicted': y_pred
})
print(comparison)
print()
mae = mean_absolute_error(y_test,y_pred)
mse = mean_squared_error(y_test,y_pred)
rmse = np.sqrt(mse)
r2 = r2_score(y_test,y_pred)

print("MAE:", mae)
print("MSE:", mse)
print("RMSE:", rmse)
print("R2 Score:", r2)


plt.scatter(X, y, color='blue', label='Actual Data')

plt.plot(
    X,
    model.predict(X),
    color='red',
    label='Regression Line'
)

plt.xlabel("Study Hours")
plt.ylabel("Marks")
plt.title("Simple Linear Regression")
plt.legend()

plt.show()