import fitz  # This is PyMuPDF

def extract_text_from_pdf(file_bytes):
    """
    Reads raw bytes of a PDF and returns the full text content.
    """
    try:
        # Open the PDF from bytes
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        full_text = ""
        
        # Iterate over pages and extract text
        for page_num, page in enumerate(doc):
            text = page.get_text()
            if text:
                full_text += f"\n--- Page {page_num + 1} ---\n"
                full_text += text
                
        return full_text
    
    except Exception as e:
        print(f"Error extracting text: {e}")
        return None