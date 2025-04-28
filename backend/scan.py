import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(dotenv_path=env_path)

load_dotenv()

import cv2
import pytesseract
import numpy as np
from pdf2image import convert_from_path
from PIL import Image
import io
import re
import json
from google import genai


# =============== OCR Utilities ===============

def preprocess_image(image: Image.Image) -> np.ndarray:
    gray = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2GRAY)
    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return thresh

def extract_text(image: np.ndarray) -> str:
    return pytesseract.image_to_string(image)

# =============== AI Parsing Utilities ===============

def generate_ai_response(extracted_text: str) -> dict | None:
    """Send extracted text to Gemini and parse structured receipt data."""
    api_key = os.getenv("GEMINI_API_KEY")  # <- read from environment
    client = genai.Client(api_key=api_key)
    
    prompt = f'''
    You are an intelligent receipt parser. From the provided receipt text, precisely extract the following information.
    Correct common OCR errors and typos. Completely ignore irrelevant text.

    Extract:
    - Store name
    - Store phone number
    - Store address (single line)
    - Store website (if any)
    - Date of purchase (format: MM/DD/YYYY) 
    - Time of purchase
    - List of purchased items with their prices
    - Total price (MUST be the largest monetary amount on the receipt)
    - Payment method (e.g., credit card, cash)
    - Category (e.g., groceries, electronics)
    
    For the field `category`, choose the most appropriate option from this exact list:
        - travel
        - meals
        - office supplies
        - entertainment
        - training
        - transportation
        - others

        If none are a good fit, use "others".
        Do NOT create new categories. Only select from this list.
        If the category is "groceries", use "meals" instead.
        Also define a subcategory if possible, starting a capital letter. If not, leave it empty.
        Give a simple description about the purchase.


    Return the information as this JSON object:
    {{
        "store_name": "",
        "store_phone_number": "",
        "store_address": "",
        "store_website": "",
        "date_purchase": "",
        "time_purchase": "",
        "purchased_items": [
            {{"item_name": "", "price": ""}}
        ],
        "total_price": ,
        "payment_method": "",
        "category": "",
        "subcategory": "",
        "description": ""
    }}

    Receipt Text:
    {extracted_text}
    '''

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return json.loads(response.text)
    except json.JSONDecodeError:
        print("Warning: Gemini returned malformed JSON. Attempting auto-fix...")
        fixed_json = fix_malformed_json(response.text)
        try:
            return json.loads(fixed_json)
        except Exception as e:
            print(f"Critical: Failed to fix malformed JSON. {e}")
            return None
    except Exception as e:
        print(f"Error contacting Gemini: {e}")
        return None

def fix_malformed_json(bad_json: str) -> str:
    """Attempt basic corrections to slightly broken JSON output."""
    match = re.search(r'\{.*\}', bad_json, re.DOTALL)
    if not match:
        return ""
    fixed = match.group(0)
    fixed = fixed.replace('\n', '')
    fixed = re.sub(r',\s*}', '}', fixed)
    fixed = re.sub(r',\s*]', ']', fixed)
    return fixed

# =============== Receipt Processing ===============

def parse_receipt_text(text: str) -> dict | None:
    """Parse the OCR text using Gemini AI."""
    return generate_ai_response(text)

def process_pdf(pdf_path: str) -> list[dict]:
    """Handle receipt PDFs by converting pages to images and processing each one."""
    images = convert_from_path(pdf_path)
    receipts = []

    for i, image in enumerate(images):
        print(f"Processing PDF page {i+1}...")
        processed = preprocess_image(image)
        extracted = extract_text(processed)
        receipt_data = parse_receipt_text(extracted)
        receipts.append(receipt_data)

    return receipts

def process_image(image_path: str) -> dict | None:
    """Handle receipt images directly."""
    image = Image.open(image_path)
    processed = preprocess_image(image)
    extracted = extract_text(processed)
    return parse_receipt_text(extracted)

def scan_receipt_from_bytes(image_bytes: bytes) -> dict | None:
    """Main entry for backend: receive uploaded receipt bytes, process, and return structured data."""
    try:
        image = Image.open(io.BytesIO(image_bytes))
    except Exception as e:
        print(f"Error loading image: {e}")
        return None

    processed = preprocess_image(image)
    extracted = extract_text(processed)

    if len(extracted.strip()) < 50:
        print("Warning: OCR output too small. Skipping AI call.")
        return None

    return parse_receipt_text(extracted)
