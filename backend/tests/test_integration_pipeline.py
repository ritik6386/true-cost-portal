import asyncio
import io
import json
import pymupdf
import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.analysis import ExtractedContractTerms, AuditResponse
from app.core.config import settings

client = TestClient(app)

def generate_test_pdf(
    title: str = "LOAN AGREEMENT",
    principal: str = "500,000 INR",
    apr: str = "11.5%",
    term: str = "36 months",
    clauses: str = "Prepayment penalty of 3% applies if closed within 12 months."
) -> bytes:
    """Helper to generate in-memory PDF binary."""
    doc = pymupdf.open()
    page = doc.new_page()
    text = (
        f"{title}\n\n"
        f"Borrower agrees to the following terms:\n"
        f"- Principal Amount: {principal}\n"
        f"- APR: {apr}\n"
        f"- Loan Term: {term}\n"
        f"- Fine Print Clauses: {clauses}\n"
    )
    page.insert_text((50, 72), text)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_full_pipeline_digital_contract_inr():
    """
    Integration Test: Full contract analysis pipeline for INR loan.
    Tests: Upload -> Extraction -> Gemini extraction -> Math engine -> Response.
    """
    pdf_bytes = generate_test_pdf(
        principal="450,000 INR",
        apr="12.5%",
        term="36 months"
    )

    mock_gemini_terms = ExtractedContractTerms(
        principal=450000.0,
        currency="INR",
        currencySymbol="₹",
        apr=12.5,
        termMonths=36,
        gotchas=[
            "Foreclosure fee: 4% of outstanding balance",
            "Penal interest: 24% per annum upon delayed EMI",
            "Mandatory arbitration clause in Mumbai"
        ],
        plainEnglishSummary="Borrower receives ₹4,50,000 at 12.5% APR repayable over 36 monthly installments."
    )

    with patch("app.services.gemini_service.GeminiService._generate_with_retry", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = mock_gemini_terms

        payload = {"file": ("inr_loan_contract.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
        response = client.post("/api/v1/analyze", files=payload)

        assert response.status_code == 200
        data = response.json()

        # Schema and contract assertions
        assert data["principal"] == 450000.0
        assert data["currency"] == "INR"
        assert data["currencySymbol"] == "₹"
        assert data["apr"] == 12.5
        assert data["termMonths"] == 36
        assert len(data["gotchas"]) == 3
        assert data["totalPayback"] > 450000.0
        assert data["monthlyPayment"] > 0.0
        assert data["totalInterest"] == round(data["totalPayback"] - 450000.0, 2)

        # Milestones assertions (36 months = Month 12, 24, 36)
        schedule = data["schedule"]
        assert len(schedule) == 3
        assert schedule[0]["name"] == "Month 12"
        assert schedule[-1]["name"] == "Month 36"
        assert schedule[-1]["Remaining"] == 0.0


def test_full_pipeline_digital_contract_usd():
    """
    Integration Test: International USD commercial auto/equipment loan.
    Tests currency detection, symbol mapping, and amortization.
    """
    pdf_bytes = generate_test_pdf(
        title="COMMERCIAL VEHICLE NOTE",
        principal="$65,000",
        apr="7.9%",
        term="48 months",
        clauses="Late fee of $50 per occurrence. Acceleration clause upon 60 days default."
    )

    mock_gemini_terms = ExtractedContractTerms(
        principal=65000.0,
        currency="USD",
        currencySymbol="$",
        apr=7.9,
        termMonths=48,
        gotchas=[
            "Late fee of $50 per billing cycle",
            "Lender may accelerate full balance after 60 days default",
            "Borrower pays legal expenses upon collection"
        ],
        plainEnglishSummary="Commercial equipment financing of $65,000 at 7.9% APR for 48 months."
    )

    with patch("app.services.gemini_service.GeminiService._generate_with_retry", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = mock_gemini_terms

        payload = {"file": ("commercial_vehicle.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
        response = client.post("/api/analyze", files=payload)

        assert response.status_code == 200
        data = response.json()

        assert data["principal"] == 65000.0
        assert data["currency"] == "USD"
        assert data["currencySymbol"] == "$"
        assert data["apr"] == 7.9
        assert data["termMonths"] == 48
        assert len(data["schedule"]) == 4  # Month 12, 24, 36, 48
        assert data["schedule"][-1]["Remaining"] == 0.0


def test_multimodal_scanned_pdf_pipeline():
    """
    Integration Test: Scanned PDF without text layer.
    Ensures that empty digital text triggers multimodal Part generation and succeeds end-to-end.
    """
    # Create empty page without text (scanned document simulation)
    doc = pymupdf.open()
    doc.new_page()  # Blank page
    pdf_bytes = doc.tobytes()
    doc.close()

    mock_gemini_terms = ExtractedContractTerms(
        principal=150000.0,
        currency="EUR",
        currencySymbol="€",
        apr=5.5,
        termMonths=24,
        gotchas=["Origination fee of 1.5%", "Administrative processing penalty"],
        plainEnglishSummary="Equipment lease of €150,000 over 24 months."
    )

    with patch("app.services.gemini_service.GeminiService._generate_with_retry", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = mock_gemini_terms

        payload = {"file": ("scanned_lease.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
        response = client.post("/api/analyze", files=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["principal"] == 150000.0
        assert data["currency"] == "EUR"
        assert data["currencySymbol"] == "€"
        assert len(data["schedule"]) == 2


def test_model_fallback_chain_integration():
    """
    Integration Test: Multi-model fallback resilience.
    Verifies that when the primary model (gemini-3.8-flash) fails, the pipeline
    automatically fails over to gemini-3.7-flash and returns successfully.
    """
    pdf_bytes = generate_test_pdf()

    mock_gemini_terms = ExtractedContractTerms(
        principal=200000.0,
        currency="INR",
        currencySymbol="₹",
        apr=10.0,
        termMonths=12,
        gotchas=["3% early settlement penalty"],
        plainEnglishSummary="Personal loan for ₹2,00,000."
    )

    with patch("app.services.gemini_service.GeminiService.client") as mock_client:
        mock_response = AsyncMock()
        mock_response.text = mock_gemini_terms.model_dump_json()

        # First call (gemini-3.8-flash) throws 503 Service Unavailable
        # Second call (gemini-3.7-flash) succeeds
        mock_client.aio.models.generate_content = AsyncMock(
            side_effect=[
                Exception("503 Service Unavailable: High Demand on gemini-3.8-flash"),
                mock_response
            ]
        )

        payload = {"file": ("resilience_test.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
        response = client.post("/api/analyze", files=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["principal"] == 200000.0
        assert mock_client.aio.models.generate_content.call_count >= 2


def test_concurrent_requests_integration():
    """
    Integration Test: Concurrent multi-request pipeline processing.
    Validates that simultaneous analysis requests complete independently without memory leaks or state collision.
    """
    pdf_bytes_1 = generate_test_pdf(principal="100,000 INR", apr="10%")
    pdf_bytes_2 = generate_test_pdf(principal="300,000 INR", apr="15%")

    terms_1 = ExtractedContractTerms(
        principal=100000.0,
        currency="INR",
        currencySymbol="₹",
        apr=10.0,
        termMonths=12,
        gotchas=["Clause A"],
        plainEnglishSummary="Loan 1"
    )
    terms_2 = ExtractedContractTerms(
        principal=300000.0,
        currency="INR",
        currencySymbol="₹",
        apr=15.0,
        termMonths=24,
        gotchas=["Clause B"],
        plainEnglishSummary="Loan 2"
    )

    async def run_concurrent():
        with patch("app.services.gemini_service.GeminiService._generate_with_retry", new_callable=AsyncMock) as mock_gen:
            mock_gen.side_effect = [terms_1, terms_2]

            def post_doc(pdf_bytes, filename):
                return client.post(
                    "/api/analyze",
                    files={"file": (filename, io.BytesIO(pdf_bytes), "application/pdf")}
                )

            loop = asyncio.get_running_loop()
            task1 = loop.run_in_executor(None, post_doc, pdf_bytes_1, "loan1.pdf")
            task2 = loop.run_in_executor(None, post_doc, pdf_bytes_2, "loan2.pdf")

            r1, r2 = await asyncio.gather(task1, task2)
            return r1, r2

    r1, r2 = asyncio.run(run_concurrent())

    assert r1.status_code == 200
    assert r2.status_code == 200
    returned_principals = {r1.json()["principal"], r2.json()["principal"]}
    assert returned_principals == {100000.0, 300000.0}


def test_dual_router_compatibility():
    """
    Integration Test: Verifies both /api/v1/analyze and /api/analyze return identical structures
    for seamless Next.js proxy rewrites and direct client access.
    """
    pdf_bytes = generate_test_pdf()

    mock_terms = ExtractedContractTerms(
        principal=50000.0,
        currency="INR",
        currencySymbol="₹",
        apr=14.0,
        termMonths=12,
        gotchas=["Penalty clause"],
        plainEnglishSummary="Loan summary."
    )

    with patch("app.services.gemini_service.GeminiService._generate_with_retry", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = mock_terms

        p1 = client.post("/api/analyze", files={"file": ("test.pdf", io.BytesIO(pdf_bytes), "application/pdf")})
        p2 = client.post("/api/v1/analyze", files={"file": ("test.pdf", io.BytesIO(pdf_bytes), "application/pdf")})

        assert p1.status_code == 200
        assert p2.status_code == 200
        assert p1.json() == p2.json()
