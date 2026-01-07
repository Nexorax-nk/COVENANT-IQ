from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from typing import List
import json
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler

# --- IMPORTS ---
# Make sure you have created backend/services/scheduler.py and backend/models.py 
# as per the previous step!
from database import create_db_and_tables, get_session
from models import Loan, Alert 
from services.ocr import extract_text_from_pdf
from services.analyzer import analyze_covenants_with_groq
from services.scheduler import run_portfolio_health_check 

# --- LIFESPAN & SCHEDULER SETUP ---
scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Create DB Tables
    create_db_and_tables()
    
    # 2. Start the Background Bot (Runs every 60 seconds)
    scheduler.add_job(run_portfolio_health_check, 'interval', seconds=60)
    scheduler.start()
    print("✅ [SYSTEM] Background Risk Monitor Started.")
    
    yield
    
    # 3. Cleanup on Shutdown
    scheduler.shutdown()

app = FastAPI(lifespan=lifespan)

# --- CORS MIDDLEWARE ---
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
    return {"status": "Database & Scheduler Active"}

# 1. AI ANALYSIS ROUTE
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

# 2. SAVE LOAN ROUTE
@app.post("/api/loans", response_model=Loan)
def create_loan(loan_data: dict, session: Session = Depends(get_session)):
    covenants_str = json.dumps(loan_data.get("covenants", []))
    
    new_loan = Loan(
        borrower_name=loan_data.get("borrower_name"),
        loan_amount=loan_data.get("loan_amount"),
        effective_date=loan_data.get("effective_date"),
        covenants_json=covenants_str,
        risk_status="Healthy"
    )
    
    session.add(new_loan)
    session.commit()
    session.refresh(new_loan)
    return new_loan

# 3. FETCH ALL LOANS
@app.get("/api/loans", response_model=List[Loan])
def read_loans(session: Session = Depends(get_session)):
    loans = session.exec(select(Loan)).all()
    return loans

# 4. FETCH SINGLE LOAN
@app.get("/api/loans/{loan_id}", response_model=Loan)
def read_loan(loan_id: int, session: Session = Depends(get_session)):
    loan = session.get(Loan, loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return loan

# --- NEW FEATURES START HERE ---

# 5. FETCH ALERTS (For the Dashboard)
@app.get("/api/alerts", response_model=List[Alert])
def read_alerts(session: Session = Depends(get_session)):
    # Get the 10 most recent unresolved alerts
    alerts = session.exec(
        select(Alert)
        .where(Alert.is_resolved == False)
        .order_by(Alert.timestamp.desc())
        .limit(10)
    ).all()
    return alerts

# 6. REVIEW LOAN (Credit Officer Action)
@app.post("/api/loans/{loan_id}/review")
def review_loan(loan_id: int, session: Session = Depends(get_session)):
    loan = session.get(Loan, loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    # Approve the loan -> Set to Healthy
    loan.risk_status = "Healthy"
    session.add(loan)
    
    # Resolve any alerts related to this loan
    alerts = session.exec(select(Alert).where(Alert.loan_id == loan_id)).all()
    for alert in alerts:
        alert.is_resolved = True
        session.add(alert)
        
    session.commit()
    return {"status": "reviewed", "new_risk_status": "Healthy"}

# 7. UPLOAD COMPLIANCE CERTIFICATE
@app.post("/api/obligations/upload")
async def upload_compliance_doc(loan_id: int, file: UploadFile = File(...), session: Session = Depends(get_session)):
    """
    Simulates uploading a proof document. 
    In a real app, you would save 'file' to S3 or a local folder.
    """
    # 1. Log the receipt
    print(f"📄 [UPLOAD] Received {file.filename} for Loan ID {loan_id}")
    
    # 2. (Optional) You could verify the file type here
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    # 3. Return success to Frontend so it can update the UI to "Verified"
    return {
        "status": "uploaded", 
        "filename": file.filename, 
        "verification": "AI Verified (Simulated)"
    }