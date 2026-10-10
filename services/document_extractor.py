import os
import sys
import json
import argparse
import tempfile
from typing import Dict, Any

try:
    import pymupdf  # type: ignore
except ImportError:
    try:
        import fitz as pymupdf  # type: ignore
    except ImportError:
        pymupdf = None

# Global cache for OCR instance
_ocr_instance = None
_ocr_engine_type = None

def get_ocr_instance():
    """
    Lazily initialize available OCR engine:
    1. PaddleOCR (preferred for financial tables/documents)
    2. EasyOCR (fallback)
    3. Pytesseract (fallback)
    """
    global _ocr_instance, _ocr_engine_type
    if _ocr_instance is not None:
        return _ocr_instance, _ocr_engine_type

    import importlib

    # 1. Try PaddleOCR
    try:
        paddle_mod = importlib.import_module("paddleocr")
        PaddleOCR = getattr(paddle_mod, "PaddleOCR")
        # show_log=False suppresses verbose stdout logging to preserve clean JSON output
        _ocr_instance = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
        _ocr_engine_type = "paddleocr"
        return _ocr_instance, _ocr_engine_type
    except Exception:
        pass

    # 2. Try EasyOCR
    try:
        easy_mod = importlib.import_module("easyocr")
        Reader = getattr(easy_mod, "Reader")
        _ocr_instance = Reader(["en"], gpu=False)
        _ocr_engine_type = "easyocr"
        return _ocr_instance, _ocr_engine_type
    except Exception:
        pass

    # 3. Try Pytesseract
    try:
        tess_mod = importlib.import_module("pytesseract")
        # Verify tesseract binary is actually executable on PATH
        tess_mod.get_tesseract_version()
        _ocr_instance = tess_mod
        _ocr_engine_type = "tesseract"
        return _ocr_instance, _ocr_engine_type
    except Exception:
        pass

    return None, None

def extract_text(pdf_path: str, min_digital_chars: int = 30) -> Dict[str, Any]:
    """
    Hybrid PDF Text Extraction:
    1. Digital PDF (Fast Path): Extracts embedded selectable text using PyMuPDF.
       If character count >= min_digital_chars, returns directly without OCR overhead.
    2. Scanned PDF (OCR Path): Renders pages to images natively using PyMuPDF 
       (no external Poppler binary required on Windows) and applies the active OCR engine.
    """
    if not os.path.exists(pdf_path):
        return {
            "success": False,
            "text": "",
            "source": "none",
            "error": f"PDF file not found at: {pdf_path}"
        }

    if pymupdf is None:
        return {
            "success": False,
            "text": "",
            "source": "none",
            "error": "PyMuPDF is required. Run: pip install pymupdf"
        }

    # Step 1: Digital extraction attempt with guaranteed file release
    try:
        with pymupdf.open(pdf_path) as doc:
            page_count = len(doc)
            digital_text_parts = []

            for page_num in range(page_count):
                try:
                    page = doc[page_num]
                    page_text = page.get_text() or ""
                    if page_text.strip():
                        digital_text_parts.append(page_text.strip())
                except Exception:
                    continue

            digital_text = "\n\n".join(digital_text_parts).strip()

            # If document has selectable text meeting threshold, return immediately
            if len(digital_text) >= min_digital_chars:
                return {
                    "success": True,
                    "text": digital_text,
                    "source": "digital",
                    "pages": page_count,
                    "char_count": len(digital_text)
                }

            # Step 2: Fallback to OCR for scanned/photo PDFs
            ocr_engine, engine_type = get_ocr_instance()

            if ocr_engine is None:
                if digital_text:
                    return {
                        "success": True,
                        "text": digital_text,
                        "source": "digital_partial",
                        "pages": page_count,
                        "char_count": len(digital_text),
                        "warning": "No local OCR engine installed. Returned partial digital text."
                    }
                return {
                    "success": False,
                    "text": "",
                    "source": "scanned_unprocessed",
                    "pages": page_count,
                    "error": "Scanned document detected, but no OCR engine (PaddleOCR/EasyOCR/Tesseract) is available."
                }

            ocr_text_parts = []
            page_errors = []
            temp_dir = tempfile.gettempdir()

            for page_idx in range(page_count):
                page = doc[page_idx]
                zoom_matrix = pymupdf.Matrix(2.0, 2.0)
                pix = page.get_pixmap(matrix=zoom_matrix)
                temp_img_path = os.path.join(temp_dir, f"ocr_page_{page_idx}_{os.getpid()}.png")
                pix.save(temp_img_path)

                try:
                    if engine_type == "paddleocr":
                        results = ocr_engine.ocr(temp_img_path, cls=True)
                        page_lines = []
                        if results and results[0]:
                            for line in results[0]:
                                if line and len(line) > 1 and len(line[1]) > 0:
                                    text_content = line[1][0]
                                    conf = line[1][1] if len(line[1]) > 1 else 1.0
                                    if conf > 0.35:
                                        page_lines.append(text_content)
                        if page_lines:
                            ocr_text_parts.append("\n".join(page_lines))

                    elif engine_type == "easyocr":
                        results = ocr_engine.readtext(temp_img_path)
                        page_lines = [item[1] for item in results if item and len(item) > 1]
                        if page_lines:
                            ocr_text_parts.append("\n".join(page_lines))

                    elif engine_type == "tesseract":
                        try:
                            from PIL import Image  # type: ignore
                            img = Image.open(temp_img_path)
                            ocr_text = ocr_engine.image_to_string(img)
                        except (ImportError, Exception):
                            # pytesseract can also process an image path directly without PIL
                            ocr_text = ocr_engine.image_to_string(temp_img_path)
                        if ocr_text.strip():
                            ocr_text_parts.append(ocr_text.strip())

                except Exception as ocr_err:
                    page_errors.append(f"Page {page_idx + 1}: {ocr_err}")
                finally:
                    if os.path.exists(temp_img_path):
                        try:
                            os.remove(temp_img_path)
                        except Exception:
                            pass

            final_ocr_text = "\n\n".join([p for p in ocr_text_parts if p.strip()]).strip()

            if not final_ocr_text and digital_text:
                final_ocr_text = digital_text

            return {
                "success": bool(final_ocr_text),
                "text": final_ocr_text,
                "source": f"ocr_{engine_type}" if (engine_type and final_ocr_text) else "digital_fallback",
                "pages": page_count,
                "char_count": len(final_ocr_text),
                "errors": page_errors if page_errors else None
            }

    except Exception as e:
        return {
            "success": False,
            "text": "",
            "source": "none",
            "error": f"Document extraction error: {e}"
        }

def main():
    parser = argparse.ArgumentParser(description="Hybrid PDF Document Extractor")
    parser.add_argument("pdf_path", help="Path to PDF file")
    parser.add_argument("--json", action="store_true", help="Output result as JSON")
    parser.add_argument("--min-chars", type=int, default=30, help="Minimum characters for digital bypass")

    args = parser.parse_args()

    result = extract_text(args.pdf_path, min_digital_chars=args.min_chars)

    if args.json:
        # Output clean JSON to stdout
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(0 if result["success"] else 1)
    else:
        if result["success"]:
            print(result["text"])
            sys.exit(0)
        else:
            print(f"Error: {result.get('error', 'Extraction failed')}", file=sys.stderr)
            sys.exit(1)

if __name__ == "__main__":
    main()
