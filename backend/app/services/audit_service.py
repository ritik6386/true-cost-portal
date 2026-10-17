import logging
from app.schemas.analysis import AuditResponse
from app.services.document_extractor import DocumentExtractor
from app.services.gemini_service import GeminiService
from app.services.amortization import AmortizationEngine

logger = logging.getLogger(__name__)

class AuditService:
    """
    Coordinates the end-to-end contract audit pipeline:
    1. Zero-disk in-memory text extraction (PyMuPDF)
    2. Forensic clause extraction via Gemini LLM (Structured JSON)
    3. Deterministic amortization calculation (Pure Python Math)
    4. Response aggregation into AuditResponse schema
    """

    def __init__(self):
        self.doc_extractor = DocumentExtractor()
        self.gemini_service = GeminiService()
        self.math_engine = AmortizationEngine()

    async def process_pdf(self, pdf_bytes: bytes) -> AuditResponse:
        logger.info(f"Initiating contract audit for PDF payload ({len(pdf_bytes)} bytes)")

        # Step 1: In-memory text extraction
        extracted_text, is_digital = self.doc_extractor.extract_text(pdf_bytes)
        logger.info(f"Text extraction completed. Digital mode: {is_digital}, Chars: {len(extracted_text)}")

        # Step 2: Forensic AI extraction
        terms = await self.gemini_service.analyze_document(
            extracted_text=extracted_text,
            pdf_bytes=pdf_bytes,
            has_text=is_digital
        )
        logger.info(f"AI extraction completed: Principal={terms.principal}, APR={terms.apr}%, Term={terms.termMonths}m")

        # Step 3: Pure deterministic amortization engine
        total_payback, monthly_payment, total_interest, schedule = self.math_engine.calculate(
            principal=terms.principal,
            apr=terms.apr,
            term_months=terms.termMonths
        )

        # Step 4: Construct verified, type-safe AuditResponse
        return AuditResponse(
            principal=terms.principal,
            currency=terms.currency or "INR",
            currencySymbol=terms.currencySymbol or "₹",
            apr=terms.apr,
            termMonths=terms.termMonths,
            gotchas=terms.gotchas,
            plainEnglishSummary=terms.plainEnglishSummary,
            totalPayback=total_payback,
            monthlyPayment=monthly_payment,
            totalInterest=total_interest,
            schedule=schedule
        )
