import json
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import StreamingResponse
from app.schemas.analysis import AuditResponse
from app.services.audit_service import AuditService

logger = logging.getLogger(__name__)
router = APIRouter()
audit_service = AuditService()

@router.post("/analyze", response_model=AuditResponse, status_code=status.HTTP_200_OK, tags=["Forensic Audit"])
async def analyze_loan_document(file: UploadFile = File(...)):
    """
    Receives an uploaded loan agreement (PDF), performs in-memory text extraction,
    runs forensic clause auditing via Google Gemini 3.8 Flash, and computes
    exact deterministic amortization schedules.
    """
    filename = file.filename or ""
    if not (filename.lower().endswith(".pdf") or file.content_type == "application/pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a valid PDF document."
        )

    try:
        pdf_bytes = await file.read()
        if len(pdf_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded PDF file is empty."
            )

        return await audit_service.process_pdf(pdf_bytes)

    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        logger.exception(f"Unhandled analysis error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forensic document analysis failed: {str(e)}"
        )

@router.post("/analyze/stream", tags=["Forensic Audit"])
async def analyze_loan_document_stream(file: UploadFile = File(...)):
    """
    Server-Sent Events (SSE) streaming endpoint:
    Streams live extraction tokens chunk-by-chunk for a typewriter effect,
    finishing with the complete deterministic audit result.
    """
    filename = file.filename or ""
    if not (filename.lower().endswith(".pdf") or file.content_type == "application/pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a valid PDF document."
        )

    pdf_bytes = await file.read()
    if len(pdf_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded PDF file is empty."
        )

    async def event_generator():
        try:
            async for event in audit_service.process_pdf_stream(pdf_bytes):
                # Standard Server-Sent Events (SSE) line protocol: data: <json>\n\n
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            logger.exception(f"Streaming error: {e}")
            err_payload = {"type": "error", "message": str(e)}
            yield f"data: {json.dumps(err_payload)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
