import asyncio
import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.gemini_service import GeminiService
from app.schemas.analysis import ExtractedContractTerms

SAMPLE_EXTRACTED_JSON = json.dumps({
    "principal": 350000.0,
    "currency": "INR",
    "currencySymbol": "₹",
    "apr": 13.5,
    "termMonths": 36,
    "gotchas": [
        "4% foreclosure charge",
        "36% penal rate for default",
        "Exclusive jurisdiction in Mumbai"
    ],
    "plainEnglishSummary": "Unsecured personal loan of ₹3,50,000 at 13.5% APR repayable over 36 monthly installments."
})

def test_client_missing_api_key_raises_value_error():
    service = GeminiService()
    with patch("app.services.gemini_service.settings.GEMINI_API_KEY", ""):
        with pytest.raises(ValueError) as exc_info:
            _ = service.client
        assert "GEMINI_API_KEY is missing" in str(exc_info.value)

def test_client_initialization_with_api_key():
    service = GeminiService()
    with patch("app.services.gemini_service.settings.GEMINI_API_KEY", "test-api-key-xyz"):
        with patch("google.genai.Client") as mock_client_cls:
            client = service.client
            assert client is not None
            mock_client_cls.assert_called_once_with(api_key="test-api-key-xyz")

def test_analyze_document_digital_text_success():
    service = GeminiService()
    mock_genai_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = SAMPLE_EXTRACTED_JSON
    mock_genai_client.aio.models.generate_content = AsyncMock(return_value=mock_response)
    service._client = mock_genai_client

    result = asyncio.run(service.analyze_document(
        extracted_text="Loan agreement contract text for 350,000 INR.",
        pdf_bytes=b"",
        has_text=True
    ))

    assert isinstance(result, ExtractedContractTerms)
    assert result.principal == 350000.0
    assert result.currency == "INR"
    assert result.apr == 13.5
    assert result.termMonths == 36
    assert len(result.gotchas) == 3

    # Verify generate_content call
    mock_genai_client.aio.models.generate_content.assert_called_once()
    call_kwargs = mock_genai_client.aio.models.generate_content.call_args.kwargs
    assert call_kwargs["model"] == service.models[0]
    contents = call_kwargs["contents"]
    assert len(contents) == 2
    assert "Contract Text:" in contents[1]

def test_analyze_document_scanned_pdf_multimodal():
    service = GeminiService()
    mock_genai_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = SAMPLE_EXTRACTED_JSON
    mock_genai_client.aio.models.generate_content = AsyncMock(return_value=mock_response)
    service._client = mock_genai_client

    fake_pdf = b"%PDF-1.4 dummy scanned content"
    result = asyncio.run(service.analyze_document(
        extracted_text="",
        pdf_bytes=fake_pdf,
        has_text=False
    ))

    assert isinstance(result, ExtractedContractTerms)
    assert result.principal == 350000.0
    call_kwargs = mock_genai_client.aio.models.generate_content.call_args.kwargs
    contents = call_kwargs["contents"]
    assert len(contents) == 2
    # Verify multimodal Part is passed
    assert hasattr(contents[1], "inline_data") or hasattr(contents[1], "data")

def test_analyze_document_text_truncation_to_30000():
    service = GeminiService()
    mock_genai_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = SAMPLE_EXTRACTED_JSON
    mock_genai_client.aio.models.generate_content = AsyncMock(return_value=mock_response)
    service._client = mock_genai_client

    long_text = "A" * 50000
    asyncio.run(service.analyze_document(
        extracted_text=long_text,
        pdf_bytes=b"",
        has_text=True
    ))

    call_kwargs = mock_genai_client.aio.models.generate_content.call_args.kwargs
    contents = call_kwargs["contents"]
    text_content = contents[1]
    # Prefix 'Contract Text:\n' is 15 chars + 30000 chars = 30015 chars
    assert len(text_content) <= 30020

def test_analyze_document_model_fallback_chain():
    service = GeminiService()
    mock_genai_client = MagicMock()

    mock_success_response = MagicMock()
    mock_success_response.text = SAMPLE_EXTRACTED_JSON

    # Fail first model call, succeed on second model call
    mock_genai_client.aio.models.generate_content = AsyncMock(
        side_effect=[Exception("Quota Exceeded on 3.8-flash"), mock_success_response]
    )
    service._client = mock_genai_client

    result = asyncio.run(service.analyze_document(
        extracted_text="Contract text",
        pdf_bytes=b"",
        has_text=True
    ))

    assert isinstance(result, ExtractedContractTerms)
    assert result.principal == 350000.0
    assert mock_genai_client.aio.models.generate_content.call_count >= 2

def test_analyze_document_all_models_fail():
    service = GeminiService()
    mock_genai_client = MagicMock()
    mock_genai_client.aio.models.generate_content = AsyncMock(
        side_effect=Exception("Service Unavailable")
    )
    service._client = mock_genai_client

    with pytest.raises(RuntimeError) as exc_info:
        asyncio.run(service.analyze_document(
            extracted_text="Contract text",
            pdf_bytes=b"",
            has_text=True
        ))

    assert "All Gemini models exhausted" in str(exc_info.value)
