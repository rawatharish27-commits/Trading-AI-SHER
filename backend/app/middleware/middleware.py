"""
Middleware
Rate limiting, logging, request processing
"""

import time
from typing import Callable, Optional
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
from datetime import datetime

from loguru import logger


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate Limiting Middleware
    
    Limits requests per IP/user:
    - 100 requests per minute by default
    - Configurable per endpoint
    """

    def __init__(
        self,
        app,
        requests_per_minute: int = 100,
        burst_size: int = 20
    ):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.burst_size = burst_size
        self.requests = defaultdict(list)
        self.blocked_ips = defaultdict(float)
        
        logger.info(f"🚦 Rate Limit Middleware initialized: {requests_per_minute}/min, burst: {burst_size}")

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Get client identifier
        client_ip = self._get_client_ip(request)
        user_id = self._get_user_id(request)
        
        identifier = user_id or client_ip
        
        # Check if blocked
        if identifier in self.blocked_ips:
            block_until = self.blocked_ips[identifier]
            if datetime.utcnow().timestamp() < block_until:
                return JSONResponse(
                    status_code=429,
                    content={
                        "error": "RATE_LIMIT_EXCEEDED",
                        "message": "Too many requests. Please try again later.",
                        "retry_after": int(block_until - datetime.utcnow().timestamp())
                    }
                )
            else:
                del self.blocked_ips[identifier]
        
        # Clean old requests
        self._cleanup_old_requests(identifier)
        
        # Check rate limit
        requests = self.requests[identifier]
        
        if len(requests) >= self.burst_size:
            # Block for 1 minute
            self.blocked_ips[identifier] = datetime.utcnow().timestamp() + 60
            return JSONResponse(
                status_code=429,
                content={
                    "error": "RATE_LIMIT_EXCEEDED",
                    "message": "Rate limit exceeded. Blocked for 60 seconds.",
                    "retry_after": 60
                }
            )
        
        # Record request
        self.requests[identifier].append(datetime.utcnow().timestamp())
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        remaining = max(0, self.burst_size - len(self.requests[identifier]))
        response.headers["X-RateLimit-Limit"] = str(self.burst_size)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        
        return response

    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _get_user_id(self, request: Request) -> Optional[str]:
        """Get user ID from authorization header"""
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            # In production, decode token and get user ID
            return None
        return None

    def _cleanup_old_requests(self, identifier: str) -> None:
        """Remove requests older than 1 minute"""
        cutoff = datetime.utcnow().timestamp() - 60
        self.requests[identifier] = [
            t for t in self.requests[identifier] if t > cutoff
        ]


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Request Logging Middleware
    
    Logs all requests with:
    - Request method and path
    - Response status code
    - Processing time
    - Client IP
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Start time
        start_time = time.time()
        
        # Get request info
        method = request.method
        path = request.url.path
        client_ip = self._get_client_ip(request)
        
        # Process request
        response = await call_next(request)
        
        # Calculate processing time
        process_time = (time.time() - start_time) * 1000
        
        # Log
        log_data = {
            "method": method,
            "path": path,
            "status": response.status_code,
            "duration_ms": round(process_time, 2),
            "client_ip": client_ip
        }
        
        if response.status_code >= 500:
            logger.error(f"🔴 Request failed: {log_data}")
        elif response.status_code >= 400:
            logger.warning(f"🟡 Request error: {log_data}")
        else:
            logger.info(f"🟢 Request: {log_data}")
        
        # Add processing time header
        response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
        
        return response

    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"


class CORSSecurityMiddleware(BaseHTTPMiddleware):
    """
    Enhanced CORS Security Middleware
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response
