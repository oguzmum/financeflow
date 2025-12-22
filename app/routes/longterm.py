from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, field_validator, ValidationInfo
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import (
    ExpenseTemplate,
    IncomeTemplate,
    LongtermPeriod,
    LongtermPeriodExpenseTemplateLink,
    LongtermPeriodIncomeTemplateLink,
    LongtermPlan,
)


def _month_to_date(month_value: str) -> date:
    try:
        year, month = map(int, month_value.split("-"))
        return date(year, month, 1)
    except (ValueError, TypeError) as exc:
        raise ValueError("Invalid month format. Expected YYYY-MM.") from exc


class LongtermPeriodPayload(BaseModel):
    start_month: str = Field(..., pattern=r"^\d{4}-\d{2}$")
    end_month: str = Field(..., pattern=r"^\d{4}-\d{2}$")
    income_template_ids: List[int] = Field(default_factory=list)
    expense_template_ids: List[int] = Field(default_factory=list)

    @field_validator("income_template_ids", "expense_template_ids")
    @classmethod
    def ensure_unique(cls, values: List[int]) -> List[int]:
        seen = set()
        duplicates = set()
        for value in values:
            if value in seen:
                duplicates.add(value)
            seen.add(value)
        if duplicates:
            raise ValueError(f"Duplicate template IDs found: {sorted(duplicates)}")
        return values

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


class TemplateSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class LongtermPeriodRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    start_month: date
    end_month: date
    income_template_ids: List[int] = Field(default_factory=list)
    expense_template_ids: List[int] = Field(default_factory=list)
    income_templates: List[TemplateSummary] = Field(default_factory=list)
    expense_templates: List[TemplateSummary] = Field(default_factory=list)


class LongtermPlanDetail(LongtermPlanRead):
    periods: List[LongtermPeriodRead]


router = APIRouter(prefix="/api/longterm", tags=["longterm"])


def _serialize_period(period: LongtermPeriod) -> dict:
    return {
        "id": period.id,
        "start_month": period.start_month,
        "end_month": period.end_month,
        "income_template_ids": [link.template_id for link in (period.income_templates or [])],
        "expense_template_ids": [link.template_id for link in (period.expense_templates or [])],
        "income_templates": [
            {"id": link.template.id, "name": link.template.name}
            for link in (period.income_templates or [])
            if link.template
        ],
        "expense_templates": [
            {"id": link.template.id, "name": link.template.name}
            for link in (period.expense_templates or [])
            if link.template
        ],
    }


def _serialize_plan(plan: LongtermPlan) -> dict:
    periods = sorted(plan.periods or [], key=lambda p: (p.start_month, p.id))
    return {
        "id": plan.id,
        "name": plan.name,
        "description": plan.description,
        "created_at": plan.created_at,
        "periods": [_serialize_period(p) for p in periods],
    }


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
def get_plan(plan_id: int, db: Session = Depends(get_db)) -> dict:
    plan = (
        db.query(LongtermPlan)
        .options(
            joinedload(LongtermPlan.periods)
            .joinedload(LongtermPeriod.income_templates)
            .joinedload(LongtermPeriodIncomeTemplateLink.template),
            joinedload(LongtermPlan.periods)
            .joinedload(LongtermPeriod.expense_templates)
            .joinedload(LongtermPeriodExpenseTemplateLink.template),
        )
        .filter(LongtermPlan.id == plan_id)
        .first()
    )
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return _serialize_plan(plan)


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
) -> dict:
    plan = (
        db.query(LongtermPlan)
        .options(joinedload(LongtermPlan.periods))
        .filter(LongtermPlan.id == plan_id)
        .first()
    )
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")

    income_template_ids = {template_id for item in payload for template_id in item.income_template_ids}
    expense_template_ids = {template_id for item in payload for template_id in item.expense_template_ids}

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
            income_templates=[
                LongtermPeriodIncomeTemplateLink(template_id=template_id)
                for template_id in period_payload.income_template_ids
            ],
            expense_templates=[
                LongtermPeriodExpenseTemplateLink(template_id=template_id)
                for template_id in period_payload.expense_template_ids
            ],
        )
        plan.periods.append(period)

    db.add(plan)
    db.commit()
    db.refresh(plan)
    plan.periods = (
        db.query(LongtermPeriod)
        .options(
            joinedload(LongtermPeriod.income_templates)
            .joinedload(LongtermPeriodIncomeTemplateLink.template),
            joinedload(LongtermPeriod.expense_templates)
            .joinedload(LongtermPeriodExpenseTemplateLink.template),
        )
        .filter(LongtermPeriod.plan_id == plan.id)
        .order_by(LongtermPeriod.start_month, LongtermPeriod.id)
        .all()
    )
    return _serialize_plan(plan)
