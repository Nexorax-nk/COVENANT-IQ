from typing import Optional, List
from sqlmodel import SQLModel, Field
from datetime import datetime

# This represents the "Loan" table in your database
class Loan(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    borrower_name: str
    loan_amount: str
    effective_date: str
    risk_status: str = "Healthy"  # Default status
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # We store covenants as a big string (JSON) for simplicity in SQLite
    # In a real Postgres app, you'd use a separate table or JSONB
    covenants_json: str

# NEW: Alert Table
class Alert(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    loan_id: int
    message: str
    type: str = "warning" # critical, warning, info
    timestamp: datetime = Field(default_factory=datetime.now)
    is_resolved: bool = False