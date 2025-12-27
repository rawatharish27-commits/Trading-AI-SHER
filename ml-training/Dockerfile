FROM python:3.10-slim

WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy training scripts and data
COPY train_xgboost.py .
COPY train_lstm.py .
COPY export_model.py .
COPY data/ ./data/

# Set default command
CMD ["bash", "retrain.sh"]
