#!/usr/bin/env python3

from fastapi import FastAPI

app = FastAPI(title="Emergency Resource Allocation System")


@app.get("/")
def root():
    return {"message": "Emergency Resource Allocation API"}