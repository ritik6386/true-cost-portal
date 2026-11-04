import pymupdf
import pytest
from app.services.document_extractor import DocumentExtractor

def test_extract_text_empty_bytes():
    text, is_digital = DocumentExtractor.extract_text(b"")
    assert text == ""
    assert is_digital is False

def test_extract_text_digital_pdf_above_threshold():
    doc = pymupdf.open()
    page = doc.new_page()
    sample_text = "OFFICIAL LOAN CONTRACT: Principal is 500,000 INR with an APR of 12.5% payable over 48 months."
    page.insert_text((50, 72), sample_text)
    pdf_bytes = doc.tobytes()
    doc.close()

    text, is_digital = DocumentExtractor.extract_text(pdf_bytes)
    assert is_digital is True
    assert "OFFICIAL LOAN CONTRACT" in text
    assert "500,000 INR" in text
    assert len(text) >= 30

def test_extract_text_digital_pdf_below_threshold():
    doc = pymupdf.open()
    page = doc.new_page()
    short_text = "Loan #1"
    page.insert_text((50, 72), short_text)
    pdf_bytes = doc.tobytes()
    doc.close()

    text, is_digital = DocumentExtractor.extract_text(pdf_bytes, min_digital_chars=30)
    # Less than 30 characters should flag is_digital as False to trigger vision OCR
    assert is_digital is False
    assert text == "Loan #1"

def test_extract_text_multipage_pdf():
    doc = pymupdf.open()
    p1 = doc.new_page()
    p1.insert_text((50, 72), "Page 1: Debtor Information and Principal Amount 100,000 USD.")
    p2 = doc.new_page()
    p2.insert_text((50, 72), "Page 2: Monthly interest and covenants.")
    p3 = doc.new_page()
    p3.insert_text((50, 72), "Page 3: Signatures and Closing Disclosures.")
    pdf_bytes = doc.tobytes()
    doc.close()

    text, is_digital = DocumentExtractor.extract_text(pdf_bytes)
    assert is_digital is True
    assert "Page 1" in text
    assert "Page 2" in text
    assert "Page 3" in text
    assert "\n\n" in text

def test_extract_text_malformed_corrupt_bytes():
    corrupt_bytes = b"%PDF-1.4\n%MalformedGarbageBytes99999999\x00\xff"
    text, is_digital = DocumentExtractor.extract_text(corrupt_bytes)
    assert text == ""
    assert is_digital is False

def test_extract_text_encrypted_pdf_raises_value_error():
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 72), "CONFIDENTIAL FINANCIAL INFORMATION")
    pdf_bytes = doc.tobytes(
        encryption=pymupdf.PDF_ENCRYPT_AES_256,
        owner_pw="master123",
        user_pw="securepass"
    )
    doc.close()

    with pytest.raises(ValueError) as exc_info:
        DocumentExtractor.extract_text(pdf_bytes)

    assert "password-protected" in str(exc_info.value).lower()

def test_extract_text_custom_threshold():
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 72), "This sentence is forty-six characters long!!")
    pdf_bytes = doc.tobytes()
    doc.close()

    # When min_digital_chars is 20, 46 >= 20 -> True
    _, is_digital_low = DocumentExtractor.extract_text(pdf_bytes, min_digital_chars=20)
    assert is_digital_low is True

    # When min_digital_chars is 100, 46 < 100 -> False
    _, is_digital_high = DocumentExtractor.extract_text(pdf_bytes, min_digital_chars=100)
    assert is_digital_high is False
