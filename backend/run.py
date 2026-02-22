#!/usr/bin/env python3
"""
Run script for Trading AI SHER Backend
"""

import uvicorn
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings


def main():
    """Run the FastAPI server"""
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        workers=1 if settings.debug else settings.workers,
        log_level="debug" if settings.debug else "info",
    )


if __name__ == "__main__":
    main()
