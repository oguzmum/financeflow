from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Expense


class ExpenseCreate(BaseModel):
    name: str = Field(..., max_length=255)
    amount: Decimal = Field(..., gt=0)
    category: str = Field(..., max_length=255)
    description: Optional[str] = None
    is_annual_payment: bool = False
    annual_month: Optional[int] = Field(default=None, ge=1, le=12)

    @model_validator(mode="after")
    def validate_annual_payment(self):
        if self.is_annual_payment:
            if self.annual_month is None:
                raise ValueError("Annual month is required for yearly payments.")
        else:
            self.annual_month = None
        return self


class ExpenseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    amount: Decimal
    category: str
    description: Optional[str]
    is_annual_payment: bool
    annual_month: Optional[int]
    created_at: datetime


router = APIRouter(prefix="/api/expenses", tags=["expenses"])


@router.get("", response_model=List[ExpenseRead])
def list_expenses(db: Session = Depends(get_db)) -> List[Expense]:
    return db.query(Expense).order_by(Expense.created_at.desc()).all()


@router.post("", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
def create_expense(payload: ExpenseCreate, db: Session = Depends(get_db)) -> Expense:
    expense = Expense(**payload.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: int, db: Session = Depends(get_db)) -> None:
    expense = db.get(Expense, expense_id)
    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    db.delete(expense)
    db.commit()
