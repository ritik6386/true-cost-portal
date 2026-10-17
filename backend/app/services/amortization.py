import math
from typing import List, Tuple
from app.schemas.analysis import ScheduleItem

class AmortizationEngine:
    """
    Deterministic mathematical engine for calculating loan amortization schedules,
    total payback liability, and periodic interest accrual.
    """

    @staticmethod
    def calculate(
        principal: float,
        apr: float,
        term_months: int
    ) -> Tuple[float, float, float, List[ScheduleItem]]:
        """
        Calculates loan figures deterministically.
        
        Returns:
            Tuple of:
            - total_payback (float)
            - monthly_payment (float)
            - total_interest (float)
            - schedule (List[ScheduleItem])
        """
        P = max(0.0, float(principal))
        rate = max(0.0, float(apr))
        n = max(1, int(term_months))

        # Handle 0% interest or zero principal
        if P == 0 or rate == 0:
            monthly = round(P / n, 2)
            return P, monthly, 0.0, [
                ScheduleItem(
                    name=f"Month {n}",
                    Interest=0.0,
                    Principal=P,
                    Remaining=0.0
                )
            ]

        # Monthly interest rate
        r = (rate / 100.0) / 12.0
        factor = math.pow(1.0 + r, n)

        # Standard Equated Monthly Installment (EMI) formula:
        # M = P * [r(1+r)^n] / [(1+r)^n - 1]
        monthly_payment = (P * (r * factor)) / (factor - 1.0)
        total_payback = round(monthly_payment * n, 2)
        total_interest = round(total_payback - P, 2)

        current_balance = P
        cumulative_interest = 0.0
        cumulative_principal = 0.0
        schedule: List[ScheduleItem] = []

        for month in range(1, n + 1):
            interest_payment = current_balance * r
            principal_payment = monthly_payment - interest_payment

            current_balance = max(0.0, current_balance - principal_payment)
            cumulative_interest += interest_payment
            cumulative_principal += principal_payment

            # Record milestone milestones every 12 months or at maturity
            if month % 12 == 0 or month == n:
                schedule.append(
                    ScheduleItem(
                        name=f"Month {month}",
                        Interest=float(round(cumulative_interest, 0)),
                        Principal=float(round(cumulative_principal, 0)),
                        Remaining=float(max(0.0, round(current_balance, 0))),
                    )
                )

        return total_payback, round(monthly_payment, 2), total_interest, schedule
