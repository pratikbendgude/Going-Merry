#!/usr/bin/env python3
"""
Emergency Resource Allocation System - FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import hospitals, resources, emergency_cases, allocations, dashboard

app = FastAPI(
    title="Emergency Resource Allocation System",
    description="Hospital emergency resource management and allocation platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(dashboard.router)
app.include_router(hospitals.router)
app.include_router(resources.router)
app.include_router(emergency_cases.router)
app.include_router(allocations.router)


@app.get("/")
def root():
    """Root endpoint - API information."""
    return {
        "message": "Emergency Resource Allocation API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "dashboard": "/dashboard",
            "hospitals": "/hospitals",
            "resources": "/resources",
            "emergency_cases": "/emergency-cases",
            "allocations": "/allocations",
        }
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}