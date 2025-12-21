from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, ForeignKey, Numeric, DateTime, UniqueConstraint
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
