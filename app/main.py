from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401 - ensure models are imported for metadata
from app.database import Base, engine
from app.routes import expenses, incomes, longterm, templates

if engine is None:
    raise RuntimeError("DATABASE_URL is not configured; cannot start API without a database")

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
app.include_router(incomes.router)
app.include_router(expenses.router)
app.include_router(templates.router)
app.include_router(longterm.router)
