from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Saving


class SavingCreate(BaseModel):
    name: str = Field(..., max_length=255)
    amount: Decimal = Field(..., gt=0)
    description: Optional[str] = None


class SavingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    amount: Decimal
    description: Optional[str]
    created_at: datetime


router = APIRouter(prefix="/api/savings", tags=["savings"])


@router.get("", response_model=List[SavingRead])
def list_savings(db: Session = Depends(get_db)) -> List[Saving]:
    return db.query(Saving).order_by(Saving.created_at.desc()).all()


@router.post("", response_model=SavingRead, status_code=status.HTTP_201_CREATED)
def create_saving(payload: SavingCreate, db: Session = Depends(get_db)) -> Saving:
    saving = Saving(**payload.model_dump())
    db.add(saving)
    db.commit()
    db.refresh(saving)
    return saving


@router.delete("/{saving_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_saving(saving_id: int, db: Session = Depends(get_db)) -> None:
    saving = db.get(Saving, saving_id)
    if saving is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saving not found")
    db.delete(saving)
    db.commit()
