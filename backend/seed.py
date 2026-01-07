import json
import random
from datetime import datetime, timedelta
from sqlmodel import Session, select
from database import engine, create_db_and_tables
from models import Loan

# --- 1. CONFIGURATION ---
TARGET_LOAN_COUNT = 150  # We will generate exactly this many unique loans

# --- 2. EXPANDED DATA POOLS (For Maximum Variety) ---
PREFIXES = [
    "Alpha", "Omega", "Global", "Oceanic", "Pacific", "Vanguard", "Summit", 
    "Apex", "GreenLeaf", "Quantum", "Nexus", "Stratosphere", "BlueSky", 
    "IronClad", "Titan", "Helios", "Polaris", "Meridian", "Equinox", "Zenith",
    "Vertex", "Horizon", "Pinnacle", "Aether", "Terra", "Nova", "Starlight",
    "Dynamic", "Future", "Bright", "Coastal", "Northern", "Southern", "Eastern",
    "Western", "Frontier", "Pioneer", "Liberty", "Eagle", "Falcon", "Orion",
    "Matrix", "Core", "Prime", "Elite", "Sovereign", "Regal", "Imperial"
]

INDUSTRIES = [
    "Logistics", "Shipping", "Energy", "Solutions", "Systems", "Holdings", 
    "Capital", "Partners", "Ventures", "Technologies", "Construction", 
    "Pharmaceuticals", "Retail", "Automotive", "Aerospace", "Maritime",
    "Biosciences", "Dynamics", "Engineering", "Networks", "Robotics",
    "Consulting", "Financial", "Investments", "Properties", "Estates",
    "Development", "Mining", "Resources", "Chemicals", "Health", "Care",
    "Labs", "Diagnostics", "Foods", "Beverages", "Textiles", "Apparel",
    "Media", "Entertainment", "Communications", "Data", "Cloud", "Cyber"
]

ENTITIES = ["Ltd.", "Inc.", "Corp.", "LLC", "Group", "PLC", "GmbH", "S.A.", "Pvt Ltd", "B.V.", "NV", "Co."]

# Weighted Risk Status (Most loans are healthy, some have issues)
RISK_STATUSES = ["Healthy"] * 70 + ["Watchlist"] * 20 + ["Critical"] * 10

CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "AUD", "SGD", "CAD", "CHF"]

# --- 3. SMART COVENANT TEMPLATES ---

# Financial Ratios (The "Math" Covenants)
FINANCIAL_TEMPLATES = [
    {"name": "Debt-to-EBITDA", "operators": ["<=", "<"], "base": 4.0, "variance": 1.5, "step": 0.25, "suffix": "x"},
    {"name": "Interest Coverage Ratio", "operators": [">=", ">"], "base": 2.5, "variance": 1.0, "step": 0.25, "suffix": "x"},
    {"name": "Debt Service Coverage (DSCR)", "operators": [">=", ">"], "base": 1.25, "variance": 0.5, "step": 0.05, "suffix": "x"},
    {"name": "Current Ratio", "operators": [">=", ">"], "base": 1.5, "variance": 0.5, "step": 0.1, "suffix": "x"},
    {"name": "Leverage Ratio", "operators": ["<=", "<"], "base": 3.5, "variance": 2.0, "step": 0.5, "suffix": "x"},
    {"name": "Fixed Charge Coverage", "operators": [">="], "base": 1.1, "variance": 0.4, "step": 0.1, "suffix": "x"},
    {"name": "Maximum Capex Spend", "operators": ["<="], "base": 20, "variance": 50, "step": 5, "suffix": "M"},
    {"name": "Minimum Liquidity", "operators": [">="], "base": 5, "variance": 15, "step": 1, "suffix": "M"},
    {"name": "Tangible Net Worth", "operators": [">="], "base": 100, "variance": 500, "step": 50, "suffix": "M"},
]

# Reporting Obligations (The "Deadline" Covenants)
REPORTING_TEMPLATES = [
    {"name": "Quarterly Financials", "operators": ["<="], "choices": [30, 45, 60], "suffix": " days"},
    {"name": "Annual Audited Financials", "operators": ["<="], "choices": [90, 120, 180], "suffix": " days"},
    {"name": "Compliance Certificate", "operators": ["<="], "choices": [15, 30, 45], "suffix": " days"},
    {"name": "ESG Impact Report", "operators": ["<="], "choices": [60, 90], "suffix": " days"},
    {"name": "Insurance Renewal Proof", "operators": ["<="], "choices": [10, 15, 30], "suffix": " days"},
    {"name": "Annual Budget Submission", "operators": ["<="], "choices": [30, 45, 60], "suffix": " days"},
    {"name": "Monthly Management Accounts", "operators": ["<="], "choices": [15, 21, 30], "suffix": " days"},
]

# --- 4. GENERATOR FUNCTIONS ---

def generate_unique_name(existing_names):
    """Generates a name and guarantees it is unique."""
    max_retries = 1000
    for _ in range(max_retries):
        name = f"{random.choice(PREFIXES)} {random.choice(INDUSTRIES)} {random.choice(ENTITIES)}"
        if name not in existing_names:
            existing_names.add(name)
            return name
    return f"Fallback Enterprise {random.randint(1000, 9999)}"

def generate_amount():
    currency = random.choice(CURRENCIES)
    # Generate amount between 2M and 800M, rounded nicely
    amount_mil = random.randint(2, 800) * 1000000
    return f"{currency} {amount_mil:,.0f}"

def generate_date():
    """Generates an effective date from the past 4 years."""
    start_date = datetime.now() - timedelta(days=365 * 4)
    random_days = random.randint(0, 365 * 4)
    date = start_date + timedelta(days=random_days)
    return date.strftime("%Y-%m-%d")

def smart_round(value, step):
    """Rounds a value to the nearest step (e.g. 3.12 -> 3.25)."""
    return round(value / step) * step

def generate_realistic_covenants():
    """
    Creates a unique 'fingerprint' of covenants for this loan.
    """
    covenants = []

    # 1. Pick 3-5 Financial Covenants (Randomized Limits)
    num_financial = random.randint(3, 5)
    selected_financials = random.sample(FINANCIAL_TEMPLATES, num_financial)
    
    for tmpl in selected_financials:
        # Calculate a randomized threshold based on Base +/- Variance
        raw_val = random.uniform(tmpl["base"] - (tmpl["variance"]/2), tmpl["base"] + (tmpl["variance"]/2))
        
        # Round it nicely (e.g., 3.1234 -> 3.25)
        val = smart_round(raw_val, tmpl["step"])
        
        # Ensure it's positive
        val = max(val, tmpl["step"])
        
        if tmpl["suffix"] == "M":
            threshold = f"${int(val)}M" # e.g. $15M
        else:
            threshold = f"{val:.2f}x"   # e.g. 4.25x

        covenants.append({
            "name": tmpl["name"],
            "operator": random.choice(tmpl["operators"]),
            "threshold": threshold,
            "confidence": "High"
        })

    # 2. Pick 2-4 Reporting Obligations
    num_reports = random.randint(2, 4)
    selected_reports = random.sample(REPORTING_TEMPLATES, num_reports)
    
    for tmpl in selected_reports:
        val = random.choice(tmpl["choices"])
        covenants.append({
            "name": tmpl["name"],
            "operator": random.choice(tmpl["operators"]),
            "threshold": f"{val} days",
            "confidence": "High"
        })

    return covenants

# --- 5. MAIN SEED LOGIC ---

def seed_db():
    print(f"🌱 Initializing Generator for {TARGET_LOAN_COUNT} unique loans...")
    print("   - Building Name Registry...")
    print("   - Synthesizing Financial Ratios...")
    
    create_db_and_tables()
    
    used_names = set() # Registry to ensure 100% uniqueness
    
    with Session(engine) as session:
        # OPTIONAL: Clear old data
        existing_loans = session.exec(select(Loan)).all()
        if len(existing_loans) > 0:
            print(f"   - Cleaning up {len(existing_loans)} old records...")
            for l in existing_loans:
                session.delete(l)
            session.commit()
        
        loans_created = 0
        while loans_created < TARGET_LOAN_COUNT:
            # 1. Generate Unique Identity
            company_name = generate_unique_name(used_names)
            
            # 2. Assign Risk Profile
            risk = random.choice(RISK_STATUSES)
            
            # 3. Generate Unique Legal Structure (Covenants)
            covenants_list = generate_realistic_covenants()
            
            # 4. Create Record
            loan = Loan(
                borrower_name=company_name,
                loan_amount=generate_amount(),
                effective_date=generate_date(),
                risk_status=risk,
                covenants_json=json.dumps(covenants_list)
            )
            session.add(loan)
            loans_created += 1
            
        session.commit()
    
    print(f"✅ SUCCESS: Database seeded with {loans_created} unique, enterprise-grade loans.")

if __name__ == "__main__":
    seed_db()