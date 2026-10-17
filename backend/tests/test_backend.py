import io
import sys
from pathlib import Path
import pymupdf
from fastapi.testclient import TestClient

# Ensure backend root is in python path
backend_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_path))

from app.main import app
from app.services.amortization import AmortizationEngine
from app.services.document_extractor import DocumentExtractor

client = TestClient(app)

def test_health_endpoints():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

    v1_response = client.get("/api/v1/health")
    assert v1_response.status_code == 200
    assert v1_response.json()["status"] == "healthy"

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["framework"] == "FastAPI"

def test_amortization_standard():
    # Test Loan: $500,000 at 14.5% APR for 60 months
    total_payback, monthly, total_interest, schedule = AmortizationEngine.calculate(
        principal=500000,
        apr=14.5,
        term_months=60
    )
    assert total_payback > 500000
    assert monthly > 0
    assert total_interest == round(total_payback - 500000, 2)
    assert len(schedule) > 0
    # Last milestone balance must be 0
    assert schedule[-1].Remaining == 0.0

def test_amortization_zero_apr():
    total_payback, monthly, total_interest, schedule = AmortizationEngine.calculate(
        principal=12000,
        apr=0.0,
        term_months=12
    )
    assert total_payback == 12000.0
    assert monthly == 1000.0
    assert total_interest == 0.0
    assert schedule[-1].Remaining == 0.0

def test_document_extractor_in_memory():
    # Create an in-memory test PDF using PyMuPDF
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 72), "LOAN AGREEMENT: Principal Amount: 250,000 INR at 10.5% APR for 36 months.")
    pdf_bytes = doc.tobytes()
    doc.close()

    text, is_digital = DocumentExtractor.extract_text(pdf_bytes)
    assert is_digital is True
    assert "250,000 INR" in text

def test_analyze_endpoint_validation_non_pdf():
    # Non-PDF file rejection
    file_payload = {"file": ("test.txt", io.BytesIO(b"Hello world"), "text/plain")}
    response = client.post("/api/analyze", files=file_payload)
    assert response.status_code == 400
    assert "error" in response.json()
    assert "detail" in response.json()

def test_analyze_endpoint_validation_empty_pdf():
    # Empty PDF file rejection
    file_payload = {"file": ("empty.pdf", io.BytesIO(b""), "application/pdf")}
    response = client.post("/api/analyze", files=file_payload)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()

def test_analyze_endpoint_encrypted_pdf():
    # Create password-protected PDF
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 72), "CONFIDENTIAL LOAN")
    # Save with encryption
    pdf_bytes = doc.tobytes(encryption=pymupdf.PDF_ENCRYPT_AES_256, owner_pw="secret", user_pw="secret")
    doc.close()

    file_payload = {"file": ("encrypted.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    response = client.post("/api/analyze", files=file_payload)
    assert response.status_code == 400
    assert "password" in response.json()["detail"].lower()
