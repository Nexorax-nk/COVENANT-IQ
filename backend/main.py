from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from services.ocr import extract_text_from_pdf
from services.analyzer import analyze_covenants_with_groq


app = FastAPI()

# Allow your Next.js app to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/analyze")
async def analyze_agreement(file: UploadFile = File(...)):
    # 1. OCR Step
    content = await file.read()
    text = extract_text_from_pdf(content)
    
    if not text:
        raise HTTPException(status_code=400, detail="Could not read PDF text")

    # 2. AI Step (The Real Logic)
    ai_result = ai_result = analyze_covenants_with_groq(text)

    
    if not ai_result:
        raise HTTPException(status_code=500, detail="AI Analysis Failed")

    return ai_result