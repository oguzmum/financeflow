from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Income


class IncomeCreate(BaseModel):
    name: str = Field(..., max_length=255)
    amount: Decimal = Field(..., gt=0)
    description: Optional[str] = None


class IncomeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    amount: Decimal
    description: Optional[str]
    created_at: datetime


router = APIRouter(prefix="/api/incomes", tags=["incomes"])


@router.get("", response_model=List[IncomeRead])
def list_incomes(db: Session = Depends(get_db)) -> List[Income]:
    return db.query(Income).order_by(Income.created_at.desc()).all()


@router.post("", response_model=IncomeRead, status_code=status.HTTP_201_CREATED)
def create_income(payload: IncomeCreate, db: Session = Depends(get_db)) -> Income:
    income = Income(**payload.model_dump())
    db.add(income)
    db.commit()
    db.refresh(income)
    return income


@router.delete("/{income_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_income(income_id: int, db: Session = Depends(get_db)) -> None:
    income = db.get(Income, income_id)
    if income is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Income not found")
    db.delete(income)
    db.commit()
