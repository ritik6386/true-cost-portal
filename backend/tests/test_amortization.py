import math
import pytest
from app.services.amortization import AmortizationEngine
from app.schemas.analysis import ScheduleItem

def test_standard_amortization_calculation():
    """
    Validate standard EMI and amortization calculation for $500,000 at 14.5% APR for 60 months.
    """
    principal = 500000.0
    apr = 14.5
    term = 60

    total_payback, monthly, total_interest, schedule = AmortizationEngine.calculate(
        principal=principal,
        apr=apr,
        term_months=term
    )

    # Mathematical verification of EMI formula
    r = (apr / 100.0) / 12.0
    factor = math.pow(1.0 + r, term)
    exact_monthly = (principal * (r * factor)) / (factor - 1.0)
    expected_total_payback = round(exact_monthly * term, 2)
    expected_monthly_rounded = round(exact_monthly, 2)
    expected_total_interest = round(expected_total_payback - principal, 2)

    assert monthly == expected_monthly_rounded
    assert total_payback == expected_total_payback
    assert total_interest == expected_total_interest
    assert total_payback > principal
    assert total_interest > 0

    # Schedule validation
    assert len(schedule) == 5  # Month 12, 24, 36, 48, 60
    assert schedule[0].name == "Month 12"
    assert schedule[-1].name == f"Month {term}"
    assert schedule[-1].Remaining == 0.0

    # Invariants: cumulative numbers monotonically increase
    prev_principal = 0.0
    prev_interest = 0.0
    for item in schedule:
        assert isinstance(item, ScheduleItem)
        assert item.Principal >= prev_principal
        assert item.Interest >= prev_interest
        prev_principal = item.Principal
        prev_interest = item.Interest

def test_zero_apr_calculation():
    """
    Validate interest-free financing (0% APR).
    """
    principal = 24000.0
    apr = 0.0
    term = 24

    total_payback, monthly, total_interest, schedule = AmortizationEngine.calculate(
        principal=principal,
        apr=apr,
        term_months=term
    )

    assert total_payback == 24000.0
    assert monthly == 1000.0
    assert total_interest == 0.0
    assert len(schedule) == 1
    assert schedule[0].name == "Month 24"
    assert schedule[0].Remaining == 0.0
    assert schedule[0].Interest == 0.0
    assert schedule[0].Principal == 24000.0

def test_zero_principal_calculation():
    """
    Validate zero principal edge case.
    """
    total_payback, monthly, total_interest, schedule = AmortizationEngine.calculate(
        principal=0.0,
        apr=12.5,
        term_months=12
    )

    assert total_payback == 0.0
    assert monthly == 0.0
    assert total_interest == 0.0
    assert len(schedule) == 1
    assert schedule[0].Remaining == 0.0

def test_single_month_loan():
    """
    Validate 1-month short-term financing.
    """
    principal = 10000.0
    apr = 12.0  # 1% monthly rate
    term = 1

    total_payback, monthly, total_interest, schedule = AmortizationEngine.calculate(
        principal=principal,
        apr=apr,
        term_months=term
    )

    # 10,000 * 1.01 = 10,100
    assert total_payback == 10100.0
    assert monthly == 10100.0
    assert total_interest == 100.0
    assert len(schedule) == 1
    assert schedule[0].name == "Month 1"
    assert schedule[0].Remaining == 0.0

def test_multi_year_30_year_mortgage():
    """
    Validate long-term 30-year (360 months) loan milestones.
    """
    principal = 1000000.0
    apr = 8.5
    term = 360

    total_payback, monthly, total_interest, schedule = AmortizationEngine.calculate(
        principal=principal,
        apr=apr,
        term_months=term
    )

    assert total_payback > principal
    assert monthly > 0
    # 360 / 12 = 30 annual milestones
    assert len(schedule) == 30
    assert schedule[0].name == "Month 12"
    assert schedule[-1].name == "Month 360"
    assert schedule[-1].Remaining == 0.0

def test_negative_and_boundary_inputs_sanitized():
    """
    Verify engine safely clamps negative principal, APR, and term to non-negative/minimum values.
    """
    total_payback, monthly, total_interest, schedule = AmortizationEngine.calculate(
        principal=-10000,
        apr=-5.0,
        term_months=-12
    )

    # principal clamped to 0, rate clamped to 0, term clamped to 1
    assert total_payback == 0.0
    assert monthly == 0.0
    assert total_interest == 0.0
    assert len(schedule) == 1
    assert schedule[0].Remaining == 0.0

def test_high_interest_loan():
    """
    Validate high APR micro-credit / payday loan (e.g. 75% APR for 6 months).
    """
    principal = 50000.0
    apr = 75.0
    term = 6

    total_payback, monthly, total_interest, schedule = AmortizationEngine.calculate(
        principal=principal,
        apr=apr,
        term_months=term
    )

    assert total_payback > principal
    assert total_interest > 0
    assert schedule[-1].name == "Month 6"
    assert schedule[-1].Remaining == 0.0
