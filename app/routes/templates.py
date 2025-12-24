from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import (
    Expense,
    ExpenseTemplate,
    Income,
    IncomeTemplate,
    TemplateExpenseLink,
    TemplateIncomeLink,
    TemplateSavingLink,
    Saving,
    SavingTemplate,
)
from app.routes.expenses import ExpenseRead
from app.routes.incomes import IncomeRead
from app.routes.savings import SavingRead


class TemplateBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None


class IncomeTemplateCreate(TemplateBase):
    income_ids: List[int] = Field(..., min_length=1)


class ExpenseTemplateCreate(TemplateBase):
    expense_ids: List[int] = Field(..., min_length=1)


class SavingTemplateCreate(TemplateBase):
    saving_ids: List[int] = Field(..., min_length=1)


class IncomeTemplateRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str]
    created_at: datetime
    incomes: List[IncomeRead]


class ExpenseTemplateRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str]
    created_at: datetime
    expenses: List[ExpenseRead]


class SavingTemplateRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str]
    created_at: datetime
    savings: List["SavingRead"]


router = APIRouter(prefix="/api/templates", tags=["templates"])


@router.get("/income", response_model=List[IncomeTemplateRead])
def list_income_templates(db: Session = Depends(get_db)) -> List[dict]:
    templates = (
        db.query(IncomeTemplate)
        .options(joinedload(IncomeTemplate.incomes).joinedload(TemplateIncomeLink.income))
        .order_by(IncomeTemplate.created_at.desc())
        .all()
    )
    return [serialize_income_template(t) for t in templates]



@router.post("/income", response_model=IncomeTemplateRead, status_code=status.HTTP_201_CREATED)
def create_income_template(payload: IncomeTemplateCreate, db: Session = Depends(get_db)) -> dict:
    incomes = db.query(Income).filter(Income.id.in_(payload.income_ids)).all()
    if len(incomes) != len(set(payload.income_ids)):
        raise HTTPException(status_code=404, detail="One or more income IDs were not found")

    template = IncomeTemplate(name=payload.name, description=payload.description)
    template.incomes = [TemplateIncomeLink(income=income) for income in incomes]

    db.add(template)
    db.commit()

    # reload with relationships populated (incl. link.income)
    template = (
        db.query(IncomeTemplate)
        .options(joinedload(IncomeTemplate.incomes).joinedload(TemplateIncomeLink.income))
        .filter(IncomeTemplate.id == template.id)
        .one()
    )

    return serialize_income_template(template)



@router.delete("/income/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_income_template(template_id: int, db: Session = Depends(get_db)) -> None:
    template = db.get(IncomeTemplate, template_id)
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    db.delete(template)
    db.commit()


@router.get("/expense", response_model=List[ExpenseTemplateRead])
def list_expense_templates(db: Session = Depends(get_db)) -> List[dict]:
    templates = (
        db.query(ExpenseTemplate)
        .options(joinedload(ExpenseTemplate.expenses).joinedload(TemplateExpenseLink.expense))
        .order_by(ExpenseTemplate.created_at.desc())
        .all()
    )

    result = []
    for t in templates:
        result.append({
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "created_at": t.created_at,
            "expenses": [link.expense for link in t.expenses],
        })
    return result


@router.post("/expense", response_model=ExpenseTemplateRead, status_code=status.HTTP_201_CREATED)
def create_expense_template(payload: ExpenseTemplateCreate, db: Session = Depends(get_db)) -> dict:
    expenses = db.query(Expense).filter(Expense.id.in_(payload.expense_ids)).all()
    if len(expenses) != len(set(payload.expense_ids)):
        raise HTTPException(status_code=404, detail="One or more expense IDs were not found")

    template = ExpenseTemplate(name=payload.name, description=payload.description)
    template.expenses = [TemplateExpenseLink(expense=expense) for expense in expenses]

    db.add(template)
    db.commit()

    template = (
        db.query(ExpenseTemplate)
        .options(joinedload(ExpenseTemplate.expenses).joinedload(TemplateExpenseLink.expense))
        .filter(ExpenseTemplate.id == template.id)
        .one()
    )

    return serialize_expense_template(template)



@router.delete("/expense/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense_template(template_id: int, db: Session = Depends(get_db)) -> None:
    template = db.get(ExpenseTemplate, template_id)
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    db.delete(template)
    db.commit()


@router.get("/saving", response_model=List[SavingTemplateRead])
def list_saving_templates(db: Session = Depends(get_db)) -> List[dict]:
    templates = (
        db.query(SavingTemplate)
        .options(joinedload(SavingTemplate.savings).joinedload(TemplateSavingLink.saving))
        .order_by(SavingTemplate.created_at.desc())
        .all()
    )

    return [
        {
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "created_at": t.created_at,
            "savings": [link.saving for link in t.savings],
        }
        for t in templates
    ]


@router.post("/saving", response_model=SavingTemplateRead, status_code=status.HTTP_201_CREATED)
def create_saving_template(payload: SavingTemplateCreate, db: Session = Depends(get_db)) -> dict:
    savings = db.query(Saving).filter(Saving.id.in_(payload.saving_ids)).all()
    if len(savings) != len(set(payload.saving_ids)):
        raise HTTPException(status_code=404, detail="One or more saving IDs were not found")

    template = SavingTemplate(name=payload.name, description=payload.description)
    template.savings = [TemplateSavingLink(saving=saving) for saving in savings]

    db.add(template)
    db.commit()

    template = (
        db.query(SavingTemplate)
        .options(joinedload(SavingTemplate.savings).joinedload(TemplateSavingLink.saving))
        .filter(SavingTemplate.id == template.id)
        .one()
    )

    return {
        "id": template.id,
        "name": template.name,
        "description": template.description,
        "created_at": template.created_at,
        "savings": [link.saving for link in (template.savings or [])],
    }


@router.delete("/saving/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_saving_template(template_id: int, db: Session = Depends(get_db)) -> None:
    template = db.get(SavingTemplate, template_id)
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    db.delete(template)
    db.commit()


def serialize_income_template(t: IncomeTemplate) -> dict:
    return {
        "id": t.id,
        "name": t.name,
        "description": t.description,
        "created_at": t.created_at,
        "incomes": [link.income for link in (t.incomes or [])],
    }

def serialize_expense_template(t: ExpenseTemplate) -> dict:
    return {
        "id": t.id,
        "name": t.name,
        "description": t.description,
        "created_at": t.created_at,
        "expenses": [link.expense for link in (t.expenses or [])],
    }
