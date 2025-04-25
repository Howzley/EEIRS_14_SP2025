# backend/main.py
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from scan import scan_receipt_from_bytes

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/scan-receipt/")
async def scan(file: UploadFile = File(...)):
    contents = await file.read()
    result = scan_receipt_from_bytes(contents)
    return {"data": result}
