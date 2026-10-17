import pymupdf
from typing import Tuple

class DocumentExtractor:
    """
    100% In-Memory PDF Parser using PyMuPDF.
    Enforces true Zero-Knowledge privacy by processing file bytes in volatile RAM
    without writing any temporary files or image slices to disk.
    """

    @staticmethod
    def extract_text(pdf_bytes: bytes, min_digital_chars: int = 30) -> Tuple[str, bool]:
        """
        Extracts embedded text from PDF bytes.
        
        Returns:
            Tuple[str, bool]: (extracted_text, is_digital)
            - is_digital is True if selectable text >= min_digital_chars.
            - is_digital is False if the PDF is scanned and requires multimodal vision.
        """
        if not pdf_bytes:
            return "", False

        try:
            with pymupdf.open(stream=pdf_bytes, filetype="pdf") as doc:
                if doc.is_encrypted:
                    if not doc.authenticate(""):
                        raise ValueError("The uploaded PDF is password-protected. Please upload an unlocked PDF.")

                text_parts = []
                for page in doc:
                    page_text = page.get_text() or ""
                    if page_text.strip():
                        text_parts.append(page_text.strip())

                extracted_text = "\n\n".join(text_parts).strip()

                if len(extracted_text) >= min_digital_chars:
                    return extracted_text, True

                return extracted_text, False
        except ValueError:
            raise
        except Exception:
            # If PyMuPDF encounters malformed or non-text PDF structures, return empty string for vision fallback
            return "", False
