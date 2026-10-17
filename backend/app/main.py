import logging
from fastapi import FastAPI, Request, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.v1.router import api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("truecost-backend")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Asynchronous Forensic AI Loan Document Parser & Deterministic Amortization Engine",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS configuration: support local Next.js, Vercel deployments, and direct API access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin for origin in settings.ALLOWED_ORIGINS if origin != "*"],
    allow_origin_regex=r"^https?://(.*\.vercel\.app|localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "error": exc.detail}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global unhandled exception on {request.url.path}: {exc}", exc_info=True)
    msg = "An internal server error occurred while processing the contract."
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": msg, "error": msg}
    )

# Mount versioned API (/api/v1) and proxy routes (/api)
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(api_router, prefix="/api")

@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "True Cost Portal Backend",
        "framework": "FastAPI",
        "documentation": "/docs",
        "status": "online"
    }
