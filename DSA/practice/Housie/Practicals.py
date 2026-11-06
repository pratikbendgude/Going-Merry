#!/usr/bin/env python3

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    classification_report
)

data = {
    'hours':[1,2,3,4,5,6,7,8],
    'marks':[0,0,0,1,1,1,1,1]
}

df = pd.DataFrame(data)

X = df[['hours']]
y = df['marks']

X_train , Xtest, y_train, y_test = train_test_split(
    X, y, test_size=0.2,random_state=42, stratify=y
)

model = LogisticRegression()

model.fit(X_train,y_train)

y_pred = model.predict(X_test)

print(y_pred)

y_prob = model.predict_proba(X_test)
print(y_prob)

print("Accuracy:", accuracy_score(y_test, y_pred))

cm = confusion_matrix(y_test, y_pred)

print("Confusion Matrix:")
print(cm)

print("Classification Report:")
print(classification_report(y_test, y_pred))

sns.heatmap(
    cm,
    annot=True,
    fmt='d',
    cmap='Blues',
    xticklabels=['Fail', 'Pass'],
    yticklabels=['Fail', 'Pass']
)

plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.title("Confusion Matrix")

plt.show()