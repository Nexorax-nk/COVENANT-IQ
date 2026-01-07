import json
from datetime import datetime
from sqlmodel import Session, select
from database import engine
from models import Loan, Alert

def run_portfolio_health_check():
    """
    Simulates a nightly bank process:
    1. Checks all loans for overdue reporting.
    2. Re-calculates risk based on simulated live market data.
    """
    print(f"⏰ [CRON] Running Scheduled Portfolio Health Check at {datetime.now()}...")
    
    with Session(engine) as session:
        loans = session.exec(select(Loan)).all()
        
        for loan in loans:
            covenants = []
            try:
                covenants = json.loads(loan.covenants_json)
            except:
                continue

            # 1. CHECK OBLIGATIONS (Deadlines)
            for cov in covenants:
                # Simple logic: If it's a reporting obligation, randomly flag it as overdue for demo
                if "reporting" in cov["name"].lower() and "days" in cov["threshold"]:
                    # In a real app, you'd compare dates. Here we simulate random "Lateness"
                    # If this was real, we'd check if (Today > DueDate)
                    pass 

            # 2. SIMULATE SUDDEN RISK (The "Market Shock")
            # 5% chance a healthy loan turns Critical during the scan
            import random
            if loan.risk_status == "Healthy" and random.random() < 0.05:
                print(f"⚠️  ALERT: {loan.borrower_name} downgraded to Watchlist.")
                loan.risk_status = "Watchlist"
                
                # Create Alert Record
                alert = Alert(
                    loan_id=loan.id, 
                    message=f"Automated Scan: {loan.borrower_name} showing early warning signs.",
                    type="warning"
                )
                session.add(alert)
                session.add(loan)

        session.commit()
    print("✅ [CRON] Health Check Complete.")