import json
import random
from datetime import datetime, timedelta
from sqlmodel import Session, select
from database import engine, create_db_and_tables
from models import Loan

# --- 1. CONFIGURATION ---
TARGET_LOAN_COUNT = 139

# --- 2. DATA POOLS (For Random Generation) ---
PREFIXES = [
    "Alpha", "Omega", "Global", "Oceanic", "Pacific", "Vanguard", "Summit", 
    "Apex", "GreenLeaf", "Quantum", "Nexus", "Stratosphere", "BlueSky", 
    "IronClad", "Titan", "Helios", "Polaris", "Meridian", "Equinox", "Zenith"
]

INDUSTRIES = [
    "Logistics", "Shipping", "Energy", "Solutions", "Systems", "Holdings", 
    "Capital", "Partners", "Ventures", "Technologies", "Construction", 
    "Pharmaceuticals", "Retail", "Automotive", "Aerospace"
]

ENTITIES = ["Ltd.", "Inc.", "Corp.", "LLC", "Group", "PLC", "GmbH", "S.A."]

# Weighted Risk Status (70% Healthy, 20% Watchlist, 10% Critical)
RISK_STATUSES = ["Healthy"] * 70 + ["Watchlist"] * 20 + ["Critical"] * 10

COVENANT_TEMPLATES = [
    {"name": "Debt-to-EBITDA", "operators": ["<=", "<"], "range": (3.0, 5.0), "suffix": "x"},
    {"name": "Interest Coverage", "operators": [">=", ">"], "range": (1.5, 3.0), "suffix": "x"},
    {"name": "Current Ratio", "operators": [">=", ">"], "range": (1.0, 1.5), "suffix": "x"},
    {"name": "Leverage Ratio", "operators": ["<=", "<"], "range": (2.5, 4.5), "suffix": "x"},
    {"name": "Capex Spend Limit", "operators": ["<="], "range": (5, 50), "suffix": "M"},
    {"name": "Minimum Liquidity", "operators": [">="], "range": (1, 10), "suffix": "M"},
    {"name": "Quarterly Reporting", "operators": ["<="], "range": (30, 60), "suffix": " days"},
    {"name": "Annual Audited Financials", "operators": ["<="], "range": (90, 120), "suffix": " days"},
]

CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY"]

# --- 3. GENERATOR FUNCTIONS ---

def generate_company_name():
    """Generates a realistic corporate name."""
    return f"{random.choice(PREFIXES)} {random.choice(INDUSTRIES)} {random.choice(ENTITIES)}"

def generate_amount():
    """Generates a realistic loan amount (e.g., USD 45,000,000)."""
    currency = random.choice(CURRENCIES)
    # Generate amount between 5M and 500M, rounded to nearest million
    amount_mil = random.randint(5, 500) * 1000000
    return f"{currency} {amount_mil:,.0f}"

def generate_date():
    """Generates a date within the last 3 years."""
    start_date = datetime.now() - timedelta(days=365 * 3)
    random_days = random.randint(0, 365 * 3)
    date = start_date + timedelta(days=random_days)
    return date.strftime("%Y-%m-%d")

def generate_covenants():
    """Selects 2-4 random covenants for a loan."""
    num_covenants = random.randint(2, 4)
    selected_templates = random.sample(COVENANT_TEMPLATES, num_covenants)
    
    covenants = []
    for template in selected_templates:
        # Randomize the threshold slightly (e.g., 3.5x vs 4.0x)
        if template["suffix"] == "x":
            val = round(random.uniform(*template["range"]), 2)
            threshold = f"{val}x"
        elif template["suffix"] == "M":
            val = random.randint(int(template["range"][0]), int(template["range"][1]))
            threshold = f"${val}M"
        else: # Days
            val = random.choice([30, 45, 60, 90, 120])
            threshold = f"{val} days"
            
        covenants.append({
            "name": template["name"],
            "operator": random.choice(template["operators"]),
            "threshold": threshold,
            "confidence": "High" # Synthetic data is always confident
        })
    return covenants

# --- 4. MAIN SEED LOGIC ---

def seed_db():
    print(f"🌱 Generating {TARGET_LOAN_COUNT} realistic loans...")
    
    create_db_and_tables()
    
    with Session(engine) as session:
        # Clear existing data
        session.exec(select(Loan)).all()
        # Uncomment below if you want to wipe DB every time
        # for loan in existing: session.delete(loan)
        
        loans_created = 0
        while loans_created < TARGET_LOAN_COUNT:
            risk = random.choice(RISK_STATUSES)
            
            # Create Loan Object
            loan = Loan(
                borrower_name=generate_company_name(),
                loan_amount=generate_amount(),
                effective_date=generate_date(),
                risk_status=risk,
                covenants_json=json.dumps(generate_covenants())
            )
            session.add(loan)
            loans_created += 1
            
        session.commit()
    
    print(f"✅ Successfully seeded database with {loans_created} loans.")

if __name__ == "__main__":
    seed_db()