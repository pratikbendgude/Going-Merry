import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report, ConfusionMatrixDisplay
from sklearn.model_selection import train_test_split



speed = np.random.uniform(20, 120, 200)
logits = -10 + 0.1 * speed
prob = 1 / (1 + np.exp(-logits))
accident = np.random.binomial(1, prob)

X = speed.reshape(-1, 1)
y = accident
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = LogisticRegression()
model.fit(X_train, y_train)
y_pred = model.predict(X_test)

print('Accuracy:', accuracy_score(y_test, y_pred))
print(confusion_matrix(y_test, y_pred))
print(classification_report(y_test, y_pred))

x_range = np.linspace(20, 120, 300).reshape(-1, 1)
curve = model.predict_proba(x_range)[:, 1]

plt.figure(figsize=(8, 5))
plt.scatter(speed, accident, alpha=0.4, label='Observed')
plt.plot(x_range, curve, color='red', label='Predicted probability')
plt.xlabel('Speed')
plt.ylabel('Probability of Accident')
plt.title('Speed vs Probability of Accident')
plt.legend()
plt.show()