from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
# from app.routes import users

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FinanceFlow", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
# app.include_router(filename-class.router)