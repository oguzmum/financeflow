from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator, ValidationInfo
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import ExpenseTemplate, IncomeTemplate, LongtermPeriod, LongtermPlan


def _month_to_date(month_value: str) -> date:
    try:
        year, month = map(int, month_value.split("-"))
        return date(year, month, 1)
    except (ValueError, TypeError) as exc:
        raise ValueError("Invalid month format. Expected YYYY-MM.") from exc


class LongtermPeriodPayload(BaseModel):
    start_month: str = Field(..., pattern=r"^\d{4}-\d{2}$")
    end_month: str = Field(..., pattern=r"^\d{4}-\d{2}$")
    income_template_id: Optional[int] = None
    expense_template_id: Optional[int] = None

    @field_validator("end_month")
    @classmethod
    def validate_range(cls, end_month: str, info: ValidationInfo) -> str:
        start_month = info.data.get("start_month")  # <-- so geht's in v2
        if start_month:
            start = _month_to_date(start_month)
            end = _month_to_date(end_month)
            if start > end:
                raise ValueError("End month must be the same or after start month.")
        return end_month


class LongtermPlanCreate(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None


class LongtermPlanRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str]
    created_at: datetime


class LongtermPeriodRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    start_month: date
    end_month: date
    income_template_id: Optional[int]
    expense_template_id: Optional[int]


class LongtermPlanDetail(LongtermPlanRead):
    periods: List[LongtermPeriodRead]


router = APIRouter(prefix="/api/longterm", tags=["longterm"])


@router.get("/plans", response_model=List[LongtermPlanRead])
def list_plans(db: Session = Depends(get_db)) -> List[LongtermPlan]:
    return db.query(LongtermPlan).order_by(LongtermPlan.created_at.desc()).all()


@router.post("/plans", response_model=LongtermPlanRead, status_code=status.HTTP_201_CREATED)
def create_plan(payload: LongtermPlanCreate, db: Session = Depends(get_db)) -> LongtermPlan:
    plan = LongtermPlan(name=payload.name, description=payload.description)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/plans/{plan_id}", response_model=LongtermPlanDetail)
def get_plan(plan_id: int, db: Session = Depends(get_db)) -> LongtermPlan:
    plan = (
        db.query(LongtermPlan)
        .options(
            joinedload(LongtermPlan.periods)
        )
        .filter(LongtermPlan.id == plan_id)
        .first()
    )
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    plan.periods.sort(key=lambda p: (p.start_month, p.id))
    return plan


@router.delete("/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plan(plan_id: int, db: Session = Depends(get_db)) -> None:
    plan = db.get(LongtermPlan, plan_id)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    db.delete(plan)
    db.commit()


@router.put("/plans/{plan_id}/periods", response_model=LongtermPlanDetail)
def replace_periods(
    plan_id: int,
    payload: List[LongtermPeriodPayload],
    db: Session = Depends(get_db),
) -> LongtermPlan:
    plan = (
        db.query(LongtermPlan)
        .options(joinedload(LongtermPlan.periods))
        .filter(LongtermPlan.id == plan_id)
        .first()
    )
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")

    income_template_ids = {item.income_template_id for item in payload if item.income_template_id}
    expense_template_ids = {item.expense_template_id for item in payload if item.expense_template_id}

    if income_template_ids:
        found_income_templates = {t.id for t in db.query(IncomeTemplate).filter(IncomeTemplate.id.in_(income_template_ids))}
        missing_incomes = income_template_ids - found_income_templates
        if missing_incomes:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Income templates not found: {sorted(missing_incomes)}",
            )

    if expense_template_ids:
        found_expense_templates = {t.id for t in db.query(ExpenseTemplate).filter(ExpenseTemplate.id.in_(expense_template_ids))}
        missing_expenses = expense_template_ids - found_expense_templates
        if missing_expenses:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Expense templates not found: {sorted(missing_expenses)}",
            )

    plan.periods.clear()
    for period_payload in payload:
        try:
            start_month = _month_to_date(period_payload.start_month)
            end_month = _month_to_date(period_payload.end_month)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

        period = LongtermPeriod(
            start_month=start_month,
            end_month=end_month,
            income_template_id=period_payload.income_template_id,
            expense_template_id=period_payload.expense_template_id,
        )
        plan.periods.append(period)

    db.add(plan)
    db.commit()
    db.refresh(plan)
    plan.periods.sort(key=lambda p: (p.start_month, p.id))
    return plan
