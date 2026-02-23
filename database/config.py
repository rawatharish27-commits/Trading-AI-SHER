"""
Database connection configuration
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Database URLs
POSTGRES_URL = os.getenv(
    'DATABASE_URL',
    'postgresql://trading_user:trading_password@localhost:5432/trading_engine'
)

TIMESCALE_URL = os.getenv(
    'TIMESCALE_URL',
    'postgresql://trading_user:trading_password@localhost:5433/trading_engine'
)

# Create engines
postgres_engine = create_engine(
    POSTGRES_URL,
    pool_size=20,
    max_overflow=0,
    pool_pre_ping=True
)

timescale_engine = create_engine(
    TIMESCALE_URL,
    pool_size=20,
    max_overflow=0,
    pool_pre_ping=True
)

# Session factories
PostgresSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=postgres_engine
)

TimescaleSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=timescale_engine
)

Base = declarative_base()

def get_postgres_db():
    db = PostgresSessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_timescale_db():
    db = TimescaleSessionLocal()
    try:
        yield db
    finally:
        db.close()
