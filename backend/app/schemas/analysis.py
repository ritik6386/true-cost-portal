from typing import List
from pydantic import BaseModel, Field

class ScheduleItem(BaseModel):
    name: str = Field(..., description="Milestone label, e.g. Month 12, Year 1")
    Interest: float = Field(..., description="Cumulative interest accrued to date")
    Principal: float = Field(..., description="Cumulative principal repaid to date")
    Remaining: float = Field(..., description="Outstanding balance remaining")

class ExtractedContractTerms(BaseModel):
    """
    Extracted financial terms produced by Gemini LLM via structured JSON generation.
    """
    principal: float = Field(..., description="Loan principal amount as a positive number")
    currency: str = Field(default="INR", description="ISO 3-letter currency code (e.g. INR, USD, EUR, GBP)")
    currencySymbol: str = Field(default="₹", description="Currency symbol (e.g. ₹, $, €)")
    apr: float = Field(..., description="Annual Percentage Rate as a percentage (e.g. 14.5)")
    termMonths: int = Field(..., description="Total loan term duration in months")
    gotchas: List[str] = Field(..., min_length=1, description="3 hidden predatory clauses, penalties, or arbitration terms")
    plainEnglishSummary: str = Field(..., description="Clear 2-sentence executive summary of payback terms")

class AuditResponse(BaseModel):
    """
    Complete forensic audit response returned by the API to the frontend.
    """
    principal: float
    currency: str = "INR"
    currencySymbol: str = "₹"
    apr: float
    termMonths: int
    gotchas: List[str]
    plainEnglishSummary: str
    totalPayback: float
    monthlyPayment: float
    totalInterest: float
    schedule: List[ScheduleItem]
