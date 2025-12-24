from datetime import datetime

from sqlalchemy import (
    Column,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Income(Base):
    __tablename__ = "incomes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    template_links = relationship(
        "TemplateIncomeLink",
        back_populates="income",
        cascade="all, delete-orphan",
    )


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    category = Column(String(255), nullable=False, default="other")
    description = Column(Text, nullable=True)
    is_annual_payment = Column(Boolean, nullable=False, default=False)
    annual_month = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    template_links = relationship(
        "TemplateExpenseLink",
        back_populates="expense",
        cascade="all, delete-orphan",
    )


class IncomeTemplate(Base):
    __tablename__ = "income_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    incomes = relationship(
        "TemplateIncomeLink",
        back_populates="template",
        cascade="all, delete-orphan",
    )


class TemplateIncomeLink(Base):
    __tablename__ = "template_income_links"
    __table_args__ = (
        UniqueConstraint("template_id", "income_id", name="uq_template_income"),
    )

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(
        Integer,
        ForeignKey("income_templates.id", ondelete="CASCADE"),
        nullable=False,
    )
    income_id = Column(
        Integer,
        ForeignKey("incomes.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    template = relationship("IncomeTemplate", back_populates="incomes")
    income = relationship("Income", back_populates="template_links")


class ExpenseTemplate(Base):
    __tablename__ = "expense_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    expenses = relationship(
        "TemplateExpenseLink",
        back_populates="template",
        cascade="all, delete-orphan",
    )


class TemplateExpenseLink(Base):
    __tablename__ = "template_expense_links"
    __table_args__ = (
        UniqueConstraint("template_id", "expense_id", name="uq_template_expense"),
    )

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(
        Integer,
        ForeignKey("expense_templates.id", ondelete="CASCADE"),
        nullable=False,
    )
    expense_id = Column(
        Integer,
        ForeignKey("expenses.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    template = relationship("ExpenseTemplate", back_populates="expenses")
    expense = relationship("Expense", back_populates="template_links")


class LongtermPlan(Base):
    __tablename__ = "longterm_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    starting_balance = Column(Numeric(12, 2), nullable=False, default=0)
    starting_saving_balance = Column(Numeric(12, 2), nullable=False, default=0)
    financing_start_month = Column(Date, nullable=True)
    car_purchase_price = Column(Numeric(12, 2), nullable=False, default=0)
    car_down_payment = Column(Numeric(12, 2), nullable=False, default=0)
    car_final_payment = Column(Numeric(12, 2), nullable=False, default=0)
    car_monthly_rate = Column(Numeric(12, 2), nullable=False, default=0)
    car_term_months = Column(Integer, nullable=False, default=0)
    car_insurance_monthly = Column(Numeric(12, 2), nullable=False, default=0)
    car_fuel_monthly = Column(Numeric(12, 2), nullable=False, default=0)
    car_maintenance_monthly = Column(Numeric(12, 2), nullable=False, default=0)
    car_tax_monthly = Column(Numeric(12, 2), nullable=False, default=0)
    car_interest_rate = Column(Numeric(5, 2), nullable=False, default=0)
    savings_return_rate = Column(Numeric(5, 2), nullable=False, default=7)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    periods = relationship(
        "LongtermPeriod",
        back_populates="plan",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class LongtermPeriod(Base):
    __tablename__ = "longterm_periods"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("longterm_plans.id", ondelete="CASCADE"), nullable=False)
    start_month = Column(Date, nullable=False)
    end_month = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    plan = relationship("LongtermPlan", back_populates="periods")
    income_templates = relationship(
        "LongtermPeriodIncomeTemplateLink",
        back_populates="period",
        cascade="all, delete-orphan",
    )
    expense_templates = relationship(
        "LongtermPeriodExpenseTemplateLink",
        back_populates="period",
        cascade="all, delete-orphan",
    )
    savings_templates = relationship(
        "LongtermPeriodSavingTemplateLink",
        back_populates="period",
        cascade="all, delete-orphan",
    )


class LongtermPeriodIncomeTemplateLink(Base):
    __tablename__ = "longterm_period_income_template_links"
    __table_args__ = (
        UniqueConstraint("period_id", "template_id", name="uq_longterm_period_income_template"),
    )

    id = Column(Integer, primary_key=True, index=True)
    period_id = Column(
        Integer,
        ForeignKey("longterm_periods.id", ondelete="CASCADE"),
        nullable=False,
    )
    template_id = Column(
        Integer,
        ForeignKey("income_templates.id"),
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    period = relationship("LongtermPeriod", back_populates="income_templates")
    template = relationship("IncomeTemplate")


class LongtermPeriodExpenseTemplateLink(Base):
    __tablename__ = "longterm_period_expense_template_links"
    __table_args__ = (
        UniqueConstraint("period_id", "template_id", name="uq_longterm_period_expense_template"),
    )

    id = Column(Integer, primary_key=True, index=True)
    period_id = Column(
        Integer,
        ForeignKey("longterm_periods.id", ondelete="CASCADE"),
        nullable=False,
    )
    template_id = Column(
        Integer,
        ForeignKey("expense_templates.id"),
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    period = relationship("LongtermPeriod", back_populates="expense_templates")
    template = relationship("ExpenseTemplate")


class Saving(Base):
    __tablename__ = "savings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    template_links = relationship(
        "TemplateSavingLink",
        back_populates="saving",
        cascade="all, delete-orphan",
    )


class SavingTemplate(Base):
    __tablename__ = "saving_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    savings = relationship(
        "TemplateSavingLink",
        back_populates="template",
        cascade="all, delete-orphan",
    )


class TemplateSavingLink(Base):
    __tablename__ = "template_saving_links"
    __table_args__ = (
        UniqueConstraint("template_id", "saving_id", name="uq_template_saving"),
    )

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(
        Integer,
        ForeignKey("saving_templates.id", ondelete="CASCADE"),
        nullable=False,
    )
    saving_id = Column(
        Integer,
        ForeignKey("savings.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    template = relationship("SavingTemplate", back_populates="savings")
    saving = relationship("Saving", back_populates="template_links")


class LongtermPeriodSavingTemplateLink(Base):
    __tablename__ = "longterm_period_saving_template_links"
    __table_args__ = (
        UniqueConstraint("period_id", "template_id", name="uq_longterm_period_saving_template"),
    )

    id = Column(Integer, primary_key=True, index=True)
    period_id = Column(
        Integer,
        ForeignKey("longterm_periods.id", ondelete="CASCADE"),
        nullable=False,
    )
    template_id = Column(
        Integer,
        ForeignKey("saving_templates.id"),
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    period = relationship("LongtermPeriod", back_populates="savings_templates")
    template = relationship("SavingTemplate")
