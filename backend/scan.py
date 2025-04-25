import cv2
import pytesseract
import re
import numpy as np
from pdf2image import convert_from_path
from PIL import Image
import io

# Set up Tesseract path (Modify if necessary)
# pytesseract.pytesseract.tesseract_cmd = "/usr/local/bin/tesseract"  # Uncomment if needed

def preprocess_image(image):
    """ Preprocess the image to minimize OCR errors (e.g., `0` -> `@`) """
    gray = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2GRAY)  # Convert PIL image to OpenCV format
    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return thresh


def extract_text(image):
    """ Extract text from image using Tesseract OCR """
    raw_text = pytesseract.image_to_string(image)
    return raw_text

def process_pdf(pdf_path):
    """ Convert PDF to images, extract text, and parse receipt details """
    images = convert_from_path(pdf_path)  # Convert PDF to images
    all_receipt_data = []

    for i, image in enumerate(images):
        print(f"Processing page {i+1}...")
        processed_image = preprocess_image(image)
        extracted_text = extract_text(processed_image)
        receipt_data = parse_receipt_text(extracted_text)
        all_receipt_data.append(receipt_data)

    return all_receipt_data

def process_image(image_path):
    """ Process an image file, extract text, and parse receipt details """
    image = Image.open(image_path)
    processed_image = preprocess_image(image)
    extracted_text = extract_text(processed_image)
    receipt_data = parse_receipt_text(extracted_text)
    return receipt_data

def parse_receipt_text(text):
    """ Extract key information from OCR output using improved regex patterns """

    store_name = re.search(r'^[A-Z][A-Za-z\s&]+', text)
    store_name = store_name.group(0).strip() if store_name else "Unknown Store"

    phone_match = re.search(r'(\(\d{3}\)\s*\d{3}[-.\s]\d{4}|\d{3}[-.\s]\d{3}[-.\s]\d{4})', text)
    phone = phone_match.group(0) if phone_match else "Unknown Phone"

    address_match = re.search(r'(\d+\s+[A-Za-z\s]+(?:Ave|St|Blvd|Rd|Dr|Lane|Way|Court))', text)
    address = address_match.group(0) if address_match else "Unknown Address"

    # Extract Website
    website_match = re.search(r'(https?://[^\s]+|www\.[^\s]+|\w+\.(com|net|org|edu|gov))', text)
    website = website_match.group(0) if website_match else "Unknown Website"

    # Extract Date & Time
    date_match = re.search(r'(\d{2}[/-]\d{2}[/-]\d{4}|\d{4}[/-]\d{2}[/-]\d{2})', text)
    time_match = re.search(r'(\d{1,2}:\d{2}\s?(AM|PM)?)', text, re.IGNORECASE)
    date = date_match.group(0) if date_match else "Unknown Date"
    time = time_match.group(0) if time_match else "Unknown Time"

    # Extract Total Amount
    total_match = re.search(r'(?s:.*)Total\s?\$?(\d+\.\d{2})', text, re.IGNORECASE)
    total = total_match.group(1) if total_match else "Unknown Total"

    # Extract Payment Method
    payment_match = re.search(r'(Visa|MasterCard|Amex|Discover|Cash|PayPal|Debit|Credit)', text, re.IGNORECASE)
    payment_method = payment_match.group(0) if payment_match else "Unknown Payment Method"

    ignore_keywords = ["Total", "You Saved", "Grand Total", "Order Total", "Payment", "Savings", "Change", "lb", "FOR"]

    # Extract all items first
    raw_items = re.findall(r'([A-Za-z][A-Za-z\s&-]+?)\s+(\d+\.\d{2})', text)

    # Function to clean item names
    def clean_item_name(name):
        name = name.strip()  # Remove spaces and newlines
        name = re.sub(r'^\b[A-Z]{1,2}\b\s*', '', name)  # Remove short uppercase prefixes like "F"
        name = re.sub(r'[^A-Za-z\s&-]', '', name)  # Remove any leftover special characters
        return name

    # Function to exclude unwanted bulk pricing lines
    def is_valid_item(name):
        return not re.search(r'\d+\s*@\s*\d+\s*FOR', name)  # Exclude lines like "1 @ 2 FOR 7.00"

    # Filter and clean extracted items
    items = [(clean_item_name(name), price) for name, price in raw_items 
            if is_valid_item(name) and not any(keyword in name for keyword in ignore_keywords)]

    return {
        "Store": store_name,
        "Phone": phone,
        "Address": address,
        "Website": website,
        "Date": date,
        "Time": time,
        "Total": total,
        "Payment Method": payment_method,
        "Items": items
    }

""" file_path = "receipts/SampleReceipt-03.jpg"  # Change this to the path of your file

if file_path.lower().endswith(".pdf"):
    receipt_info = process_pdf(file_path)
else:
    receipt_info = [process_image(file_path)]  # Wrap in a list for consistency

# Print results
for i, receipt in enumerate(receipt_info):
    print(f"\n=== Receipt Page {i+1} ===")
    print(receipt) """
    
def scan_receipt_from_bytes(image_bytes: bytes):
    image = Image.open(io.BytesIO(image_bytes))
    processed_image = preprocess_image(image)
    extracted_text = extract_text(processed_image)
    receipt_data = parse_receipt_text(extracted_text)
    return receipt_data
