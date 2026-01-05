import fitz  # PyMuPDF
import re

def clean_text(text):
    """
    Cleans extracted text for better LLM processing.
    - Removes excessive whitespace
    - Fixes broken hyphens (e.g., "infor- mation")
    """
    if not text:
        return ""
    
    # 1. Merge hyphenated words at line breaks (e.g., "exam-\nple" -> "example")
    text = re.sub(r"(\w+)-\n(\w+)", r"\1\2", text)
    
    # 2. Replace multiple newlines with a single newline (preserves paragraphs but saves tokens)
    text = re.sub(r"\n{3,}", "\n\n", text)
    
    # 3. Strip leading/trailing whitespace
    return text.strip()

def extract_text_from_pdf(file_bytes):
    """
    Robustly extracts text from a PDF file stream.
    """
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        full_text = []

        for page_num, page in enumerate(doc):
            # "flags=fitz.TEXT_PRESERVE_LIGATURES | fitz.TEXT_PRESERVE_WHITESPACE" 
            # helps keep the text readable for the AI.
            # Using "get_text('blocks')" often yields cleaner paragraphs than simple "get_text()".
            page_text = page.get_text() 
            
            if page_text.strip():
                cleaned_page_text = clean_text(page_text)
                full_text.append(f"--- Page {page_num + 1} ---\n{cleaned_page_text}")
        
        return "\n\n".join(full_text)
    
    except Exception as e:
        print(f"❌ PDF Extraction Error: {e}")
        return None