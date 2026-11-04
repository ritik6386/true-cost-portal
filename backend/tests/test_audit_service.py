import asyncio
import pymupdf
import pytest
from unittest.mock import AsyncMock
from app.services.audit_service import AuditService
from app.schemas.analysis import ExtractedContractTerms, AuditResponse

@pytest.fixture
def sample_pdf_bytes():
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 72), "STANDARD LOAN AGREEMENT: ₹600,000 at 12% APR for 48 months.")
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes

def test_process_pdf_orchestration(sample_pdf_bytes):
    service = AuditService()

    mock_terms = ExtractedContractTerms(
        principal=600000.0,
        currency="INR",
        currencySymbol="₹",
        apr=12.0,
        termMonths=48,
        gotchas=["3% Prepayment penalty", "30-day late fee", "Arbitration in Delhi"],
        plainEnglishSummary="Borrower receives ₹6,00,000 at 12% APR for a 48-month term."
    )

    service.gemini_service.analyze_document = AsyncMock(return_value=mock_terms)

    result = asyncio.run(service.process_pdf(sample_pdf_bytes))

    assert isinstance(result, AuditResponse)
    assert result.principal == 600000.0
    assert result.currency == "INR"
    assert result.currencySymbol == "₹"
    assert result.apr == 12.0
    assert result.termMonths == 48
    assert len(result.gotchas) == 3
    assert result.totalPayback > 600000.0
    assert result.monthlyPayment > 0.0
    assert result.totalInterest > 0.0
    assert len(result.schedule) == 4  # Month 12, 24, 36, 48
    assert result.schedule[-1].Remaining == 0.0

def test_process_pdf_custom_currency(sample_pdf_bytes):
    service = AuditService()

    mock_terms = ExtractedContractTerms(
        principal=50000.0,
        currency="USD",
        currencySymbol="$",
        apr=6.5,
        termMonths=24,
        gotchas=["Early payoff fee"],
        plainEnglishSummary="Auto loan of $50,000."
    )

    service.gemini_service.analyze_document = AsyncMock(return_value=mock_terms)

    result = asyncio.run(service.process_pdf(sample_pdf_bytes))

    assert result.currency == "USD"
    assert result.currencySymbol == "$"
    assert result.principal == 50000.0
