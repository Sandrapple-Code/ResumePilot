from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging

logger = logging.getLogger("app.exceptions")

async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Formats Starlette/FastAPI HTTPExceptions into clean JSON responses."""
    logger.warning(f"HTTP {exc.status_code} on {request.url.path}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "status": "error",
            "code": exc.status_code
        }
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Formats Pydantic model validation errors into consistent JSON detail blocks."""
    logger.warning(f"Validation error on {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Input schema validation failed",
            "errors": exc.errors(),
            "status": "error",
            "code": 422
        }
    )

async def generic_exception_handler(request: Request, exc: Exception):
    """Catches all unhandled exceptions to prevent server information leaks."""
    logger.exception(f"Unhandled server error on {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred. Career autopilot is troubleshooting.",
            "status": "error",
            "code": 500
        }
    )
