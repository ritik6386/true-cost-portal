import io
import pymupdf
import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.analysis import AuditResponse, ScheduleItem

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "True Cost Portal Backend"
    assert data["framework"] == "FastAPI"
    assert data["status"] == "online"

def test_health_endpoints():
    r1 = client.get("/api/health")
    assert r1.status_code == 200
    assert r1.json()["status"] == "healthy"

    r2 = client.get("/api/v1/health")
    assert r2.status_code == 200
    assert r2.json()["status"] == "healthy"

def test_analyze_rejects_non_pdf():
    payload = {"file": ("document.docx", io.BytesIO(b"dummy text"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    response = client.post("/api/analyze", files=payload)
    assert response.status_code == 400
    assert "Invalid file format" in response.json()["detail"]

def test_analyze_rejects_empty_pdf():
    payload = {"file": ("blank.pdf", io.BytesIO(b""), "application/pdf")}
    response = client.post("/api/analyze", files=payload)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()

def test_analyze_rejects_password_protected_pdf():
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 72), "PROTECTED LOAN")
    pdf_bytes = doc.tobytes(
        encryption=pymupdf.PDF_ENCRYPT_AES_256,
        owner_pw="admin",
        user_pw="pass123"
    )
    doc.close()

    payload = {"file": ("locked.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    response = client.post("/api/analyze", files=payload)
    assert response.status_code == 400
    assert "password" in response.json()["detail"].lower()

def test_analyze_success_with_mocked_service():
    mock_audit = AuditResponse(
        principal=100000.0,
        currency="INR",
        currencySymbol="₹",
        apr=10.0,
        termMonths=12,
        gotchas=["Late payment fee"],
        plainEnglishSummary="Simple loan summary.",
        totalPayback=105500.0,
        monthlyPayment=8791.67,
        totalInterest=5500.0,
        schedule=[ScheduleItem(name="Month 12", Interest=5500.0, Principal=100000.0, Remaining=0.0)]
    )

    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 72), "VALID CONTRACT TEXT")
    pdf_bytes = doc.tobytes()
    doc.close()

    with patch("app.api.v1.endpoints.analyze.audit_service.process_pdf", new_callable=AsyncMock) as mock_process:
        mock_process.return_value = mock_audit

        payload = {"file": ("contract.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
        response = client.post("/api/v1/analyze", files=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["principal"] == 100000.0
        assert data["apr"] == 10.0
        assert data["currency"] == "INR"
        assert len(data["schedule"]) == 1

def test_analyze_internal_error_handling():
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 72), "SOME LOAN AGREEMENT")
    pdf_bytes = doc.tobytes()
    doc.close()

    with patch("app.api.v1.endpoints.analyze.audit_service.process_pdf", new_callable=AsyncMock) as mock_process:
        mock_process.side_effect = Exception("Google API timeout or rate limit exceeded")

        payload = {"file": ("contract.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
        response = client.post("/api/analyze", files=payload)

        assert response.status_code == 500
        assert "Forensic document analysis failed" in response.json()["detail"]

def test_cors_headers_and_preflight():
    response = client.options(
        "/api/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
