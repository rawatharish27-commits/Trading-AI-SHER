#!/usr/bin/env python3
"""
Run script for Trading AI SHER Backend
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load .env file before importing anything else
from dotenv import load_dotenv
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path, override=True)

# Now import settings
from app.core.config import settings


def main():
    """Run the FastAPI server"""
    import uvicorn
    
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
