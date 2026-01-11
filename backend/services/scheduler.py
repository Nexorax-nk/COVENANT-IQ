import json
import random
from datetime import datetime, timedelta
from sqlmodel import Session, select
from database import engine
from models import Loan, Alert

def run_portfolio_health_check():
    """
    Runs periodically (e.g., Hourly).
    1. Checks for overdue reporting obligations based on real dates.
    2. Simulates credit risk migration (Downgrades/Upgrades/Recoveries).
    """
    current_time = datetime.now().strftime('%H:%M:%S')
    print(f"⏰ [CRON] Hourly Portfolio Scan started at {current_time}...")
    
    with Session(engine) as session:
        loans = session.exec(select(Loan)).all()
        changes_count = 0
        
        for loan in loans:
            # --- 1. OBLIGATION CHECKER (Deadlines) ---
            try:
                covenants = json.loads(loan.covenants_json)
                for cov in covenants:
                    # Look for reporting items like "Quarterly Reporting <= 45 days"
                    if "reporting" in cov["name"].lower() and "days" in cov["threshold"]:
                        try:
                            # Extract number (e.g. "45")
                            days_limit = int(''.join(filter(str.isdigit, cov["threshold"])))
                            
                            # Logic: If Effective Date + Days Limit < Today, it's OVERDUE.
                            # (In a real app, you'd track the specific 'Quarter End Date' instead of Effective Date)
                            eff_date = datetime.strptime(loan.effective_date, "%Y-%m-%d")
                            # Simulating that the report was due X days after the loan started
                            due_date = eff_date + timedelta(days=days_limit)
                            
                            # If Today is past Due Date AND we haven't flagged it yet
                            if datetime.now() > due_date and loan.risk_status == "Healthy":
                                # 10% chance to flag it for the demo
                                if random.random() < 0.1: 
                                    print(f"⚠️  COMPLIANCE ALERT: {loan.borrower_name} is overdue on {cov['name']}.")
                                    
                                    alert = Alert(
                                        loan_id=loan.id, 
                                        message=f"Overdue: {cov['name']} was due on {due_date.strftime('%Y-%m-%d')}.",
                                        type="warning"
                                    )
                                    session.add(alert)
                                    changes_count += 1
                        except:
                            continue
            except:
                pass

            # --- 2. RISK SIMULATION ENGINE (Market Movements) ---
            
            # Scenario A: Healthy Loan Deteriorates (2% chance per run)
            if loan.risk_status == "Healthy":
                if random.random() < 0.02: 
                    print(f"📉 DOWNGRADE: {loan.borrower_name} moved to Watchlist.")
                    loan.risk_status = "Watchlist"
                    alert = Alert(
                        loan_id=loan.id, 
                        message=f"AI Risk Model: Early warning signals detected in sector.",
                        type="warning"
                    )
                    session.add(alert)
                    session.add(loan)
                    changes_count += 1

            # Scenario B: Watchlist Loan Worsens to Critical (5% chance)
            elif loan.risk_status == "Watchlist":
                if random.random() < 0.05:
                    print(f"🚨 CRITICAL: {loan.borrower_name} breached financial covenants.")
                    loan.risk_status = "Critical"
                    alert = Alert(
                        loan_id=loan.id, 
                        message=f"Breach Confirmed: Leverage Ratio exceeds limit.",
                        type="critical"
                    )
                    session.add(alert)
                    session.add(loan)
                    changes_count += 1
                
                # Scenario C: Watchlist Loan Recovers (10% chance - Correction)
                elif random.random() < 0.10:
                    print(f"✅ RECOVERY: {loan.borrower_name} stabilized.")
                    loan.risk_status = "Healthy"
                    # Ideally, resolve old alerts here too
                    session.add(loan)
                    changes_count += 1

        session.commit()
    
    if changes_count > 0:
        print(f"✅ [CRON] Scan Complete. {changes_count} updates applied.")
    else:
        print("✅ [CRON] Scan Complete. Portfolio Stable.")