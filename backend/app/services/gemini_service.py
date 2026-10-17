import logging
from google import genai
from google.genai import types
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.schemas.analysis import ExtractedContractTerms

logger = logging.getLogger(__name__)

class GeminiService:
    """
    Asynchronous Google Gemini generative AI client for forensic contract audit.
    Features:
    - Ultra-fast <3s inference by configuring thinking_budget=0 for JSON extraction
    - Pure async/await execution via client.aio to prevent blocking the event loop
    - Guaranteed structured output JSON enforcement via Pydantic schema
    - Automatic multi-model fallback chain (gemini-3.8-flash -> gemini-3.7-flash -> gemini-3.5-flash)
    - Exponential backoff retry logic for transient API high-demand spikes
    - Zero-disk multimodal processing for scanned/photo PDFs
    """

    def __init__(self):
        self._client = None
        self.models = settings.GEMINI_MODELS

    @property
    def client(self) -> genai.Client:
        if self._client is None:
            if not settings.GEMINI_API_KEY:
                raise ValueError(
                    "GEMINI_API_KEY is missing. Please set GEMINI_API_KEY in .env.local or your environment variables."
                )
            self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
        return self._client

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=1.2, min=1, max=3),
        reraise=True,
    )
    async def _generate_with_retry(self, model_name: str, contents: list) -> ExtractedContractTerms:
        response = await self.client.aio.models.generate_content(
            model=model_name,
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ExtractedContractTerms,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
                temperature=0.1,
            ),
        )
        if not response.text:
            raise ValueError(f"Empty response received from model {model_name}")
            
        return ExtractedContractTerms.model_validate_json(response.text)

    async def analyze_document(
        self,
        extracted_text: str,
        pdf_bytes: bytes,
        has_text: bool
    ) -> ExtractedContractTerms:
        """
        Executes asynchronous forensic AI clause extraction against the loan agreement.
        """
        prompt = (
            "You are a Forensic Financial Auditor. Analyze the contract.\n"
            "1. Extract exact Principal Amount (number), APR/Interest Rate (number, e.g. 14.5), and Loan Term in months (integer).\n"
            "2. Identify Currency (ISO 3-letter code, e.g. INR, USD, EUR, GBP, JPY, CAD, AUD, CHF, BRL, SGD, AED, CNY) and currency symbol. Default to INR and ₹ if not specified.\n"
            "3. Identify 3 'Hidden Gotchas' or predatory fine-print terms (prepayment penalties, surge default rates, arbitration mandates).\n"
            "4. Write a concise 2-sentence Plain English summary of the payback terms.\n"
        )

        contents = [prompt]
        if has_text and len(extracted_text.strip()) > 0:
            # Truncate to first 30,000 characters to stay within optimal context
            contents.append(f"Contract Text:\n{extracted_text[:30000]}")
        else:
            # Scanned document without selectable text layer: pass PDF inline for multimodal vision OCR
            contents.append(
                types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf")
            )

        last_error = None
        for model_name in self.models:
            try:
                logger.info(f"Invoking Gemini model: {model_name}")
                return await self._generate_with_retry(model_name, contents)
            except Exception as err:
                logger.warning(f"Model {model_name} failed: {err}. Trying next fallback...")
                last_error = err
                continue

        error_msg = f"All Gemini models exhausted. Last error: {last_error}"
        logger.error(error_msg)
        raise RuntimeError(error_msg)
