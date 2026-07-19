import sys
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.config import settings
from app.core.logging_config import setup_logging
from app.core.exceptions import (
    http_exception_handler,
    validation_exception_handler,
    generic_exception_handler
)
from app.api.routes import router as api_router
import os
import logging

# 1. Initialize Logging Configuration
setup_logging()
logger = logging.getLogger("app.main")

# 2. Instantiate FastAPI
app = FastAPI(
    title="ResumePilot AI Backend",
    description="Agentic AI Resume Intelligence Platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 3. Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Bind Custom Exception Handlers
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# 5. Include API Routes
app.include_router(api_router)

# 6. Startup Hook
@app.on_event("startup")
async def startup_event():
    """Validates files directories exist on startup."""
    upload_dir = settings.UPLOAD_DIR
    if not os.path.exists(upload_dir):
        logger.info(f"Creating local uploads landing directory: {upload_dir}")
        os.makedirs(upload_dir, exist_ok=True)
    logger.info("ResumePilot AI backend started successfully.")
