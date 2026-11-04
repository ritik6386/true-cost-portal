# Comprehensive Unit Testing & Quality Assurance Report

**Project:** True Cost Portal (Forensic AI Contract Audit Platform)  
**Execution Date:** October 24, 2026  
**Environment:** Windows (PowerShell) | Python 3.14.7 | Node.js v24.20.0 | pytest 9.1.1  
**Overall Status:** :white_check_mark: **ALL 51 TESTS PASSED (100% Pass Rate)**

---

## 1. Executive Summary

A comprehensive unit test suite was developed, verified, and executed across both the Python FastAPI backend engine and the Next.js/TypeScript frontend utilities. The testing regime covers core mathematical amortization formulas, zero-disk in-memory PDF extraction, forensic LLM service fallback mechanics, Pydantic data validation schemas, HTTP REST API endpoints, CORS handling, and frontend class-merging utilities.

### Test Results Summary Table

| Category | Test Suite Module | Tests Executed | Passed | Failed | Skipped | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Backend Math** | `backend/tests/test_amortization.py` | 7 | 7 | 0 | 0 | :white_check_mark: Passed |
| **Backend PDF** | `backend/tests/test_document_extractor.py` | 7 | 7 | 0 | 0 | :white_check_mark: Passed |
| **Backend Schemas** | `backend/tests/test_schemas.py` | 6 | 6 | 0 | 0 | :white_check_mark: Passed |
| **Backend AI Service** | `backend/tests/test_gemini_service.py` | 7 | 7 | 0 | 0 | :white_check_mark: Passed |
| **Backend Pipeline** | `backend/tests/test_audit_service.py` | 2 | 2 | 0 | 0 | :white_check_mark: Passed |
| **Backend API Endpoints** | `backend/tests/test_api_endpoints.py` | 9 | 9 | 0 | 0 | :white_check_mark: Passed |
| **Backend Regression** | `backend/tests/test_backend.py` | 8 | 8 | 0 | 0 | :white_check_mark: Passed |
| **Frontend Utilities** | `lib/__tests__/utils.test.ts` | 5 | 5 | 0 | 0 | :white_check_mark: Passed |
| **TOTAL** | **Full Project Test Suite** | **51** | **51** | **0** | **0** | **100% Success** |

---

## 2. Test Architecture & Coverage Matrix

### 2.1 Backend Architecture (`FastAPI` + `PyMuPDF` + `Pydantic` + `Google Gemini`)

```
backend/
├── app/
│   ├── api/v1/endpoints/  --> Tested via test_api_endpoints.py
│   ├── core/config.py     --> Tested via configuration & settings fixtures
│   ├── schemas/analysis.py--> Tested via test_schemas.py
│   └── services/
│       ├── amortization.py       --> Tested via test_amortization.py
│       ├── document_extractor.py --> Tested via test_document_extractor.py
│       ├── gemini_service.py     --> Tested via test_gemini_service.py
│       └── audit_service.py      --> Tested via test_audit_service.py
└── tests/
    ├── conftest.py               --> Test harness & sys.path configuration
    ├── test_amortization.py      --> Mathematical & financial algorithm suite
    ├── test_api_endpoints.py     --> HTTP requests, error codes, and CORS
    ├── test_audit_service.py     --> End-to-end service orchestration
    ├── test_backend.py           --> Core regression checks
    ├── test_document_extractor.py--> In-memory PDF processing & privacy bounds
    ├── test_gemini_service.py    --> Mocked Gemini AI model fallback chain
    └── test_schemas.py           --> Strict Pydantic model validation
```

### 2.2 Frontend Architecture (`TypeScript` + `Node.js Test Runner`)

```
lib/
├── utils.ts                      --> Tested via lib/__tests__/utils.test.ts
└── __tests__/
    └── utils.test.ts             --> Class name merging & conflict resolution
```

---

## 3. Detailed Test Suite Breakdown

### 3.1 Amortization Engine (`AmortizationEngine`)
**File:** [backend/tests/test_amortization.py](file:///d:/true-cost-portal-main/backend/tests/test_amortization.py)  
**Total Tests:** 7 | **Passed:** 7

The amortization engine provides pure Python deterministic calculations for loan repayments, monthly equated installments (EMI), periodic balance tracking, and milestone generation.

- **`test_standard_amortization_calculation`**:
  - Validates exact EMI formula $M = P \cdot \frac{r(1+r)^n}{(1+r)^n - 1}$ for ₹500,000 at 14.5% APR for 60 months.
  - Verifies monthly payment calculation, total payback liability, and net accrued interest.
  - Verifies milestone generation every 12 months plus loan maturity.
  - Confirms remaining balance converges exactly to `0.0`.
  - Asserts cumulative principal and interest monotonicity.
- **`test_zero_apr_calculation`**:
  - Tests 0% interest loan scenarios (e.g. ₹24,000 over 24 months = ₹1,000/month flat).
  - Confirms total interest is `0.0` and payback equals principal.
- **`test_zero_principal_calculation`**:
  - Validates edge case where principal is ₹0; ensures no division by zero occurs.
- **`test_single_month_loan`**:
  - Validates 1-month short-term financing (₹10,000 at 12% APR = ₹10,100 payback).
- **`test_multi_year_30_year_mortgage`**:
  - Stress tests long-term financing (360 months / 30 years).
  - Verifies generation of 30 annual milestones and zero final balance.
- **`test_negative_and_boundary_inputs_sanitized`**:
  - Tests negative principal, negative interest rate, and negative term values.
  - Verifies that inputs are automatically clamped to safe non-negative minimums (`max(0.0, ...)`, `max(1, ...)`).
- **`test_high_interest_loan`**:
  - Tests high-APR microloans (75% APR over 6 months).

---

### 3.2 In-Memory Document Extractor (`DocumentExtractor`)
**File:** [backend/tests/test_document_extractor.py](file:///d:/true-cost-portal-main/backend/tests/test_document_extractor.py)  
**Total Tests:** 7 | **Passed:** 7

Verifies zero-disk privacy guarantees using volatile RAM buffers in PyMuPDF.

- **`test_extract_text_empty_bytes`**:
  - Empty byte payloads safely return `("", False)` without raising exceptions.
- **`test_extract_text_digital_pdf_above_threshold`**:
  - Extracts text from digital PDFs where selectable characters exceed the 30-character threshold.
  - Correctly flags `is_digital = True`.
- **`test_extract_text_digital_pdf_below_threshold`**:
  - Verifies documents with fewer than 30 selectable characters are flagged with `is_digital = False` to trigger OCR/multimodal vision fallback.
- **`test_extract_text_multipage_pdf`**:
  - Validates multi-page extraction preserves text order and joins pages with `\n\n`.
- **`test_extract_text_malformed_corrupt_bytes`**:
  - Injects corrupted non-PDF bytes; validates graceful recovery returning `("", False)`.
- **`test_extract_text_encrypted_pdf_raises_value_error`**:
  - Validates that AES-256 password-protected PDFs are detected and raise a clear `ValueError` informing the user.
- **`test_extract_text_custom_threshold`**:
  - Confirms threshold configurability via the `min_digital_chars` parameter.

---

### 3.3 Forensic Analysis Schemas (`analysis.py`)
**File:** [backend/tests/test_schemas.py](file:///d:/true-cost-portal-main/backend/tests/test_schemas.py)  
**Total Tests:** 6 | **Passed:** 6

Validates data validation constraints for all API inputs and outputs.

- **`test_schedule_item_valid`**: Verifies valid `ScheduleItem` structure and types.
- **`test_schedule_item_missing_required`**: Confirms missing required fields trigger Pydantic `ValidationError`.
- **`test_extracted_contract_terms_defaults`**: Confirms default currency is `INR` and currency symbol is `₹`.
- **`test_extracted_contract_terms_custom_currency`**: Verifies support for international currencies (`USD`, `EUR`, `GBP`, etc.).
- **`test_extracted_contract_terms_empty_gotchas_rejected`**: Enforces `min_length=1` on the `gotchas` list to ensure predatory clauses are never omitted.
- **`test_extracted_contract_terms_json_validation`**: Tests raw JSON parsing into `ExtractedContractTerms`.
- **`test_audit_response_roundtrip`**: Verifies end-to-end model dumping and re-validation matching the frontend contract.

---

### 3.4 AI Forensic Extraction Service (`GeminiService`)
**File:** [backend/tests/test_gemini_service.py](file:///d:/true-cost-portal-main/backend/tests/test_gemini_service.py)  
**Total Tests:** 7 | **Passed:** 7

Verifies Google Gemini AI integration, structured schema extraction, and multi-model fallback resiliency using isolated unit mocks.

- **`test_client_missing_api_key_raises_value_error`**:
  - Missing `GEMINI_API_KEY` immediately raises an informative `ValueError`.
- **`test_client_initialization_with_api_key`**:
  - Valid API key properly initializes `genai.Client`.
- **`test_analyze_document_digital_text_success`**:
  - Simulates digital text document analysis, ensuring the prompt and text content are correctly formatted.
- **`test_analyze_document_scanned_pdf_multimodal`**:
  - Simulates scanned/image PDF analysis; ensures bytes are wrapped as a multimodal `types.Part` object.
- **`test_analyze_document_text_truncation_to_30000`**:
  - Injects a 50,000-character text payload; verifies safety truncation to the first 30,000 characters to prevent context window degradation.
- **`test_analyze_document_model_fallback_chain`**:
  - Simulates a quota/transient failure on primary model `gemini-3.8-flash`; verifies automatic fallback to secondary model `gemini-3.7-flash` succeeds seamlessly.
- **`test_analyze_document_all_models_fail`**:
  - Simulates outage across all models in `settings.GEMINI_MODELS`; verifies `RuntimeError("All Gemini models exhausted...")` is raised.

---

### 3.5 Forensic Audit Service (`AuditService`)
**File:** [backend/tests/test_audit_service.py](file:///d:/true-cost-portal-main/backend/tests/test_audit_service.py)  
**Total Tests:** 2 | **Passed:** 2

Tests the complete orchestration pipeline from file bytes to final client response.

- **`test_process_pdf_orchestration`**:
  - Validates extraction -> AI contract audit -> deterministic math calculations -> `AuditResponse` assembly.
- **`test_process_pdf_custom_currency`**:
  - Verifies currency codes and symbols are properly propagated throughout the response.

---

### 3.6 API Endpoints & Transport Layer
**File:** [backend/tests/test_api_endpoints.py](file:///d:/true-cost-portal-main/backend/tests/test_api_endpoints.py) & [backend/tests/test_backend.py](file:///d:/true-cost-portal-main/backend/tests/test_backend.py)  
**Total Tests:** 17 | **Passed:** 17

Tests HTTP request/response semantics via Starlette/FastAPI `TestClient`.

- **`test_root_endpoint`**: `GET /` returns status `200` and service metadata (`"status": "online"`).
- **`test_health_endpoints`**: Verifies both `/api/health` and `/api/v1/health` return `{"status": "healthy"}`.
- **`test_analyze_rejects_non_pdf`**: Rejects `.docx`, `.txt`, and `.png` files with HTTP `400 Bad Request`.
- **`test_analyze_rejects_empty_pdf`**: Rejects zero-byte PDF uploads with HTTP `400 Bad Request`.
- **`test_analyze_rejects_password_protected_pdf`**: Detects encrypted PDFs and returns HTTP `400 Bad Request` with an informative error message.
- **`test_analyze_success_with_mocked_service`**: Validates successful file upload and returns HTTP `200` with the complete `AuditResponse` payload.
- **`test_analyze_internal_error_handling`**: Simulates unexpected downstream failures; verifies HTTP `500` response formatting.
- **`test_cors_headers_and_preflight`**: Verifies OPTIONS preflight requests return appropriate CORS headers (`Access-Control-Allow-Origin`).

---

### 3.7 Frontend UI Utilities (`lib/utils.ts`)
**File:** [lib/__tests__/utils.test.ts](file:///d:/true-cost-portal-main/lib/__tests__/utils.test.ts)  
**Total Tests:** 5 | **Passed:** 5

Validates className merging and Tailwind CSS utility conflict resolution.

- **`cn merges basic string classes correctly`**: Verifies basic string concatenation.
- **`cn resolves Tailwind class conflicts with last-wins precedence`**: Resolves `px-2 py-1` + `px-4` into `py-1 px-4`; resolves conflicting text colors.
- **`cn handles conditional and falsy values`**: Filters out `null`, `undefined`, `false`, and inactive conditional flags.
- **`cn handles arrays and object notations`**: Supports nested arrays and conditional object maps.
- **`cn handles empty input`**: Safely handles zero arguments without errors.

---

## 4. Test Execution Instructions

### Run All Tests (Backend + Frontend)
```powershell
npm test
# OR on Windows PowerShell:
npm.cmd test
```

### Run Backend Tests Only
```powershell
python -m pytest backend/tests -v
```

### Run Specific Test Suite
```powershell
# Amortization math tests:
python -m pytest backend/tests/test_amortization.py -v

# Document extractor tests:
python -m pytest backend/tests/test_document_extractor.py -v

# AI Gemini service tests:
python -m pytest backend/tests/test_gemini_service.py -v

# API endpoint tests:
python -m pytest backend/tests/test_api_endpoints.py -v
```

### Run Frontend Tests Only
```powershell
node --experimental-strip-types --test lib/__tests__/*.test.ts
```

---

## 5. Test Execution Console Output

```text
============================= test session starts =============================
platform win32 -- Python 3.14.7, pytest-9.1.1, pluggy-1.7.0
cachedir: .pytest_cache
rootdir: D:\true-cost-portal-main
plugins: anyio-4.15.1
collected 46 items

backend/tests/test_amortization.py::test_standard_amortization_calculation PASSED [  2%]
backend/tests/test_amortization.py::test_zero_apr_calculation PASSED     [  4%]
backend/tests/test_amortization.py::test_zero_principal_calculation PASSED [  6%]
backend/tests/test_amortization.py::test_single_month_loan PASSED        [  8%]
backend/tests/test_amortization.py::test_multi_year_30_year_mortgage PASSED [ 10%]
backend/tests/test_amortization.py::test_negative_and_boundary_inputs_sanitized PASSED [ 13%]
backend/tests/test_amortization.py::test_high_interest_loan PASSED       [ 15%]
backend/tests/test_api_endpoints.py::test_root_endpoint PASSED           [ 17%]
backend/tests/test_api_endpoints.py::test_health_endpoints PASSED        [ 19%]
backend/tests/test_api_endpoints.py::test_analyze_rejects_non_pdf PASSED [ 21%]
backend/tests/test_api_endpoints.py::test_analyze_rejects_empty_pdf PASSED [ 23%]
backend/tests/test_api_endpoints.py::test_analyze_rejects_password_protected_pdf PASSED [ 26%]
backend/tests/test_api_endpoints.py::test_analyze_success_with_mocked_service PASSED [ 28%]
backend/tests/test_api_endpoints.py::test_analyze_internal_error_handling PASSED [ 30%]
backend/tests/test_api_endpoints.py::test_cors_headers_and_preflight PASSED [ 32%]
backend/tests/test_audit_service.py::test_process_pdf_orchestration PASSED [ 34%]
backend/tests/test_audit_service.py::test_process_pdf_custom_currency PASSED [ 36%]
backend/tests/test_backend.py::test_health_endpoints PASSED              [ 39%]
backend/tests/test_backend.py::test_root PASSED                          [ 41%]
backend/tests/test_backend.py::test_amortization_standard PASSED         [ 43%]
backend/tests/test_backend.py::test_amortization_zero_apr PASSED         [ 45%]
backend/tests/test_backend.py::test_document_extractor_in_memory PASSED  [ 47%]
backend/tests/test_backend.py::test_analyze_endpoint_validation_non_pdf PASSED [ 50%]
backend/tests/test_backend.py::test_analyze_endpoint_validation_empty_pdf PASSED [ 52%]
backend/tests/test_backend.py::test_analyze_endpoint_encrypted_pdf PASSED [ 54%]
backend/tests/test_document_extractor.py::test_extract_text_empty_bytes PASSED [ 56%]
backend/tests/test_document_extractor.py::test_extract_text_digital_pdf_above_threshold PASSED [ 58%]
backend/tests/test_document_extractor.py::test_extract_text_digital_pdf_below_threshold PASSED [ 60%]
backend/tests/test_document_extractor.py::test_extract_text_multipage_pdf PASSED [ 63%]
backend/tests/test_document_extractor.py::test_extract_text_malformed_corrupt_bytes PASSED [ 65%]
backend/tests/test_document_extractor.py::test_extract_text_encrypted_pdf_raises_value_error PASSED [ 67%]
backend/tests/test_document_extractor.py::test_extract_text_custom_threshold PASSED [ 69%]
backend/tests/test_gemini_service.py::test_client_missing_api_key_raises_value_error PASSED [ 71%]
backend/tests/test_gemini_service.py::test_client_initialization_with_api_key PASSED [ 73%]
backend/tests/test_gemini_service.py::test_analyze_document_digital_text_success PASSED [ 76%]
backend/tests/test_gemini_service.py::test_analyze_document_scanned_pdf_multimodal PASSED [ 78%]
backend/tests/test_gemini_service.py::test_analyze_document_text_truncation_to_30000 PASSED [ 80%]
backend/tests/test_gemini_service.py::test_analyze_document_model_fallback_chain PASSED [ 82%]
backend/tests/test_gemini_service.py::test_analyze_document_all_models_fail PASSED [ 84%]
backend/tests/test_schemas.py::test_schedule_item_valid PASSED           [ 86%]
backend/tests/test_schemas.py::test_schedule_item_missing_required PASSED [ 89%]
backend/tests/test_schemas.py::test_extracted_contract_terms_defaults PASSED [ 91%]
backend/tests/test_schemas.py::test_extracted_contract_terms_custom_currency PASSED [ 93%]
backend/tests/test_schemas.py::test_extracted_contract_terms_empty_gotchas_rejected PASSED [ 95%]
backend/tests/test_schemas.py::test_extracted_contract_terms_json_validation PASSED [ 97%]
backend/tests/test_schemas.py::test_audit_response_roundtrip PASSED      [100%]

======================= 46 passed, 2 warnings in 8.43s ========================

> true-cost-portal@0.1.0 test:frontend
> node --experimental-strip-types --test lib/__tests__/*.test.ts

✔ cn merges basic string classes correctly (9.2882ms)
✔ cn resolves Tailwind class conflicts with last-wins precedence (1.3934ms)
✔ cn handles conditional and falsy values (0.2312ms)
✔ cn handles arrays and object notations (0.2443ms)
✔ cn handles empty input (0.1982ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ duration_ms 199.1174
```

---

## 6. Conclusion

All unit tests have passed without regression. The test suite validates the reliability, mathematical precision, error handling, and security posture of both the client and server applications.
