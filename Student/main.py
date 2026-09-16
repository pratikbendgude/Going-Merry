#!/usr/bin/env python3

from fastapi import FastAPI, Request
from Sample import data
from fastapi.templating import Jinja2Templates

app = FastAPI()

templates = Jinja2Templates(directory="templates")


@app.get("/")
def default(request: Request):
    return templates.TemplateResponse(request, "basic.html")



@app.get("/students")
def display_all():
    return data