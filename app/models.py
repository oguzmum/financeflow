from datetime import datetime

from sqlalchemy import (
    Column,
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
    income_template_id = Column(Integer, ForeignKey("income_templates.id"), nullable=True)
    expense_template_id = Column(Integer, ForeignKey("expense_templates.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    plan = relationship("LongtermPlan", back_populates="periods")
    income_template = relationship("IncomeTemplate")
    expense_template = relationship("ExpenseTemplate")
