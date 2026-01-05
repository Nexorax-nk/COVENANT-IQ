import os
import json
import re
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def clean_json_output(raw_text):
    """
    Removes markdown formatting (```json ... ```) that LLMs often add.
    """
    cleaned = re.sub(r"```json\s*", "", raw_text)  # Remove start tag
    cleaned = re.sub(r"```\s*", "", cleaned) # Remove end tag     
    return cleaned.strip()

def analyze_covenants_with_groq(text_content: str):
    """
    Analyzes loan agreement text using Llama-3.3-70b on Groq.
    EXTRACTS: Financial Covenants AND Reporting Obligations.
    """
    
    # 1. INCREASE CONTEXT WINDOW
    # 12,000 chars is too small (only ~4 pages). 
    # 100,000 chars covers ~40-50 pages of dense legal text.
    truncated_text = text_content[:100000]

    # 2. ENGINEERED PROMPT
    # We explicitly tell the AI to treat "Reporting Deadlines" as "Covenants"
    # so they fit into your existing Frontend Table.
    prompt = f"""
    You are a Senior Credit Risk Officer. Analyze the Loan Agreement text below.
    
    YOUR GOAL: Extract structured data for the Covenant Monitoring Dashboard.

    ### EXTRACTION RULES:
    1. **Financial Covenants:** Look for Debt-to-EBITDA, Interest Coverage, Leverage Ratios, etc.
    2. **Reporting Obligations:** You MUST extract financial reporting deadlines (Annual, Quarterly, Monthly).
       - Treat the "Deadline" (e.g., 45 days) as the "Threshold".
       - Treat the "Operator" as "<=" (Must be delivered within).
    3. **Missing Data:** If a value is not found, strictly use "N/A".
    4. **Output Format:** Return ONLY raw JSON. No markdown. No explanations.

    ### JSON SCHEMA:
    {{
      "borrower_name": "Exact Legal Entity Name",
      "loan_amount": "Facility Amount (e.g. INR 450,000,000)",
      "effective_date": "Agreement Date (YYYY-MM-DD) or N/A",
      "covenants": [
        {{
          "name": "Covenant Name (e.g. Debt-to-EBITDA Ratio, Quarterly Reporting)",
          "operator": "Operator (<, >, <=, >=)",
          "threshold": "Limit value (e.g. 3.50x, 45 days, 120 days)",
          "confidence": "High"
        }}
      ]
    }}

    ### LOAN AGREEMENT TEXT:
    {truncated_text}
    """

    try:
        response = client.chat.completions.create(
            # 3. USE THE SMARTER MODEL (70B)
            # 70B Versatile is available on Groq and is much better at logic than 8B.
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a JSON-only API. Respond only with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1, # Low temperature = More deterministic/factual
            max_tokens=2048
        )

        raw_output = response.choices[0].message.content.strip()
        
        # 4. CLEAN & PARSE
        final_json_string = clean_json_output(raw_output)
        data = json.loads(final_json_string)
        
        return data

    except json.JSONDecodeError:
        print("❌ JSON Parsing Failed. AI Output:")
        print(raw_output)
        return None
    except Exception as e:
        print(f"❌ Groq API Error: {e}")
        return None