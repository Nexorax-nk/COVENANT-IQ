from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from typing import List
import json

# Import our new modules
from database import create_db_and_tables, get_session
from models import Loan
from services.ocr import extract_text_from_pdf
from services.analyzer import analyze_covenants_with_groq

# 1. LIFESPAN (Starts DB when app starts)
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

# CORS (Allows Frontend to talk to Backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROUTES ---

@app.get("/")
def read_root():
    return {"status": "Database Active"}

# 1. AI ANALYSIS ROUTE (Existing)
@app.post("/api/analyze")
async def analyze_agreement(file: UploadFile = File(...)):
    content = await file.read()
    text = extract_text_from_pdf(content)
    if not text:
        raise HTTPException(status_code=400, detail="OCR Failed")
    
    data = analyze_covenants_with_groq(text)
    if not data:
        raise HTTPException(status_code=500, detail="AI Analysis Failed")
    
    return data

# 2. SAVE LOAN ROUTE (New)
@app.post("/api/loans", response_model=Loan)
def create_loan(loan_data: dict, session: Session = Depends(get_session)):
    """
    Receives JSON from frontend and saves it to SQLite.
    """
    # Convert the list of covenants to a JSON string for storage
    covenants_str = json.dumps(loan_data.get("covenants", []))
    
    new_loan = Loan(
        borrower_name=loan_data.get("borrower_name"),
        loan_amount=loan_data.get("loan_amount"),
        effective_date=loan_data.get("effective_date"),
        covenants_json=covenants_str,
        risk_status="Healthy" # Default new loans to Healthy
    )
    
    session.add(new_loan)
    session.commit()
    session.refresh(new_loan)
    return new_loan

# 3. FETCH ALL LOANS ROUTE (New)
@app.get("/api/loans", response_model=List[Loan])
def read_loans(session: Session = Depends(get_session)):
    loans = session.exec(select(Loan)).all()
    return loans