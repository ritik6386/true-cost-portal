import pytest
from pydantic import ValidationError
from app.schemas.analysis import ScheduleItem, ExtractedContractTerms, AuditResponse

def test_schedule_item_valid():
    item = ScheduleItem(
        name="Month 12",
        Interest=5400.50,
        Principal=20000.0,
        Remaining=80000.0
    )
    assert item.name == "Month 12"
    assert item.Interest == 5400.50
    assert item.Principal == 20000.0
    assert item.Remaining == 80000.0

def test_schedule_item_missing_required():
    with pytest.raises(ValidationError):
        ScheduleItem(name="Month 1")

def test_extracted_contract_terms_defaults():
    terms = ExtractedContractTerms(
        principal=250000.0,
        apr=11.5,
        termMonths=36,
        gotchas=["5% Prepayment penalty", "36% default surge interest", "Mandatory binding arbitration"],
        plainEnglishSummary="Borrower receives 250,000 INR at 11.5% APR for 36 months."
    )
    assert terms.currency == "INR"
    assert terms.currencySymbol == "₹"
    assert len(terms.gotchas) == 3
    assert terms.principal == 250000.0

def test_extracted_contract_terms_custom_currency():
    terms = ExtractedContractTerms(
        principal=15000.0,
        currency="USD",
        currencySymbol="$",
        apr=7.25,
        termMonths=24,
        gotchas=["Late payment penalty fee of $50"],
        plainEnglishSummary="Auto loan of $15,000 at 7.25% APR for 24 months."
    )
    assert terms.currency == "USD"
    assert terms.currencySymbol == "$"
    assert terms.principal == 15000.0

def test_extracted_contract_terms_empty_gotchas_rejected():
    with pytest.raises(ValidationError):
        ExtractedContractTerms(
            principal=10000.0,
            apr=5.0,
            termMonths=12,
            gotchas=[],  # min_length=1 must reject empty list
            plainEnglishSummary="Summary"
        )

def test_extracted_contract_terms_json_validation():
    json_data = """{
        "principal": 500000.0,
        "currency": "EUR",
        "currencySymbol": "€",
        "apr": 4.5,
        "termMonths": 48,
        "gotchas": ["Early termination charge", "Administrative origination fee"],
        "plainEnglishSummary": "Business equipment lease terms."
    }"""
    terms = ExtractedContractTerms.model_validate_json(json_data)
    assert terms.principal == 500000.0
    assert terms.currency == "EUR"
    assert terms.currencySymbol == "€"
    assert len(terms.gotchas) == 2

def test_audit_response_roundtrip():
    schedule = [
        ScheduleItem(name="Month 12", Interest=1200.0, Principal=10000.0, Remaining=10000.0),
        ScheduleItem(name="Month 24", Interest=1800.0, Principal=20000.0, Remaining=0.0)
    ]
    resp = AuditResponse(
        principal=20000.0,
        currency="INR",
        currencySymbol="₹",
        apr=10.0,
        termMonths=24,
        gotchas=["Mandatory arbitration"],
        plainEnglishSummary="Short summary.",
        totalPayback=21800.0,
        monthlyPayment=908.33,
        totalInterest=1800.0,
        schedule=schedule
    )
    dumped = resp.model_dump()
    assert dumped["principal"] == 20000.0
    assert len(dumped["schedule"]) == 2
    assert dumped["schedule"][1]["Remaining"] == 0.0

    # Re-validate
    validated = AuditResponse.model_validate(dumped)
    assert validated.totalPayback == 21800.0
