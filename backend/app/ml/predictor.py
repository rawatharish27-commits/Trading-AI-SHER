"""
ML Models Package
XGBoost and LSTM models for trading prediction
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from pathlib import Path
import json
import pickle

from loguru import logger

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    logger.warning("XGBoost not installed, using mock predictions")

try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    logger.warning("PyTorch not installed, using mock predictions")


@dataclass
class PredictionResult:
    """ML prediction result"""
    probability: float
    direction: str  # UP, DOWN, NEUTRAL
    confidence: float
    features_used: List[str]
    model_version: str


class XGBoostPredictor:
    """
    XGBoost-based probability predictor
    
    Uses gradient boosting for:
    - Trend prediction
    - Volatility forecasting
    - Market regime classification
    """

    def __init__(self, model_path: Optional[Path] = None):
        self.model = None
        self.feature_names = [
            'rsi', 'macd', 'macd_signal', 'macd_hist',
            'bb_upper', 'bb_middle', 'bb_lower', 'bb_width',
            'atr', 'adx', 'cci', 'momentum',
            'volume_ratio', 'vwap_distance', 'obv_trend',
            'ema_9', 'ema_21', 'ema_50', 'ema_200',
            'price_change_1d', 'price_change_5d', 'price_change_20d',
            'volatility_10d', 'volatility_20d',
            'high_low_ratio', 'open_close_ratio',
        ]
        self.model_version = "1.0.0"
        
        if model_path and model_path.exists():
            self.load_model(model_path)
        else:
            self._create_mock_model()
    
    def _create_mock_model(self) -> None:
        """Create a mock model for development"""
        if XGBOOST_AVAILABLE:
            # Create a simple mock model
            params = {
                'objective': 'binary:logistic',
                'max_depth': 6,
                'learning_rate': 0.1,
                'n_estimators': 100,
            }
            self.model = xgb.XGBClassifier(**params)
            # Fit with dummy data
            X_dummy = np.random.rand(100, len(self.feature_names))
            y_dummy = np.random.randint(0, 2, 100)
            self.model.fit(X_dummy, y_dummy)
            logger.info("🤖 XGBoost mock model created")
        else:
            self.model = None
            logger.warning("🤖 XGBoost mock mode (library not available)")
    
    def load_model(self, model_path: Path) -> None:
        """Load trained model from file"""
        try:
            if XGBOOST_AVAILABLE:
                self.model = xgb.XGBClassifier()
                self.model.load_model(str(model_path))
                logger.info(f"🤖 XGBoost model loaded from {model_path}")
            else:
                logger.warning("Cannot load XGBoost model - library not installed")
        except Exception as e:
            logger.error(f"Failed to load XGBoost model: {e}")
            self._create_mock_model()
    
    def save_model(self, model_path: Path) -> None:
        """Save model to file"""
        if self.model and XGBOOST_AVAILABLE:
            self.model.save_model(str(model_path))
            logger.info(f"🤖 XGBoost model saved to {model_path}")
    
    def predict(self, features: Dict[str, float]) -> PredictionResult:
        """
        Generate probability prediction
        
        Args:
            features: Dictionary of feature values
            
        Returns:
            PredictionResult with probability and direction
        """
        # Extract features in correct order
        feature_values = []
        missing_features = []
        
        for name in self.feature_names:
            if name in features:
                feature_values.append(features[name])
            else:
                feature_values.append(0.0)
                missing_features.append(name)
        
        if missing_features:
            logger.warning(f"Missing features (set to 0): {missing_features}")
        
        X = np.array([feature_values])
        
        # Get prediction
        if self.model and XGBOOST_AVAILABLE:
            proba = self.model.predict_proba(X)[0]
            probability = float(proba[1])  # Probability of UP
            confidence = float(max(proba))
        else:
            # Mock prediction based on features
            probability = self._mock_predict(features)
            confidence = 0.6
        
        # Determine direction
        if probability > 0.55:
            direction = "UP"
        elif probability < 0.45:
            direction = "DOWN"
        else:
            direction = "NEUTRAL"
        
        return PredictionResult(
            probability=probability,
            direction=direction,
            confidence=confidence,
            features_used=[f for f in self.feature_names if f in features],
            model_version=self.model_version
        )
    
    def _mock_predict(self, features: Dict[str, float]) -> float:
        """Mock prediction for development"""
        # Weighted combination of key features
        weights = {
            'rsi': 0.15,
            'macd': 0.10,
            'momentum': 0.15,
            'volume_ratio': 0.10,
            'vwap_distance': 0.15,
            'price_change_5d': 0.15,
            'adx': 0.10,
            'volatility_10d': -0.10,
        }
        
        score = 0.5
        for feature, weight in weights.items():
            if feature in features:
                # Normalize feature contribution
                value = features[feature]
                if feature == 'rsi':
                    normalized = (value - 50) / 50  # RSI centered at 50
                elif feature in ['momentum', 'price_change_5d']:
                    normalized = value
                else:
                    normalized = value / 10  # Generic normalization
                
                score += normalized * weight
        
        return max(0.1, min(0.9, score))
    
    def train(self, X: np.ndarray, y: np.ndarray) -> Dict:
        """Train the model"""
        if not XGBOOST_AVAILABLE:
            return {"status": "error", "message": "XGBoost not installed"}
        
        try:
            self.model.fit(X, y)
            return {
                "status": "success",
                "message": "Model trained successfully",
                "n_samples": len(X),
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}


class LSTMModel(nn.Module if TORCH_AVAILABLE else object):
    """
    LSTM-based time series predictor
    
    Uses PyTorch LSTM for:
    - Sequence pattern recognition
    - Multi-step forecasting
    - Regime detection
    """

    def __init__(
        self,
        input_size: int = 26,
        hidden_size: int = 128,
        num_layers: int = 2,
        output_size: int = 3,  # UP, DOWN, NEUTRAL
        dropout: float = 0.2
    ):
        if not TORCH_AVAILABLE:
            logger.warning("PyTorch not available, LSTM model disabled")
            return
        
        super().__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )
        
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, 64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, output_size),
            nn.Softmax(dim=1)
        )
        
        self.model_version = "1.0.0"
        logger.info("🧠 LSTM model initialized")
    
    def forward(self, x):
        if not TORCH_AVAILABLE:
            return None
        
        # LSTM forward pass
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size)
        
        out, _ = self.lstm(x, (h0, c0))
        out = self.fc(out[:, -1, :])  # Take last timestep
        return out
    
    def predict(self, sequence: np.ndarray) -> PredictionResult:
        """
        Predict from sequence of features
        
        Args:
            sequence: Shape (sequence_length, num_features)
            
        Returns:
            PredictionResult
        """
        if not TORCH_AVAILABLE:
            return self._mock_predict(sequence)
        
        try:
            self.eval()
            with torch.no_grad():
                x = torch.FloatTensor(sequence).unsqueeze(0)  # Add batch dimension
                output = self.forward(x)
                
                probs = output[0].numpy()
                pred_class = np.argmax(probs)
                confidence = float(probs[pred_class])
                
                directions = ["DOWN", "NEUTRAL", "UP"]
                direction = directions[pred_class]
                
                # Probability of UP (class 2)
                probability = float(probs[2])
            
            return PredictionResult(
                probability=probability,
                direction=direction,
                confidence=confidence,
                features_used=[],
                model_version=self.model_version
            )
        except Exception as e:
            logger.error(f"LSTM prediction error: {e}")
            return self._mock_predict(sequence)
    
    def _mock_predict(self, sequence: np.ndarray) -> PredictionResult:
        """Mock LSTM prediction"""
        if len(sequence) > 0:
            last_row = sequence[-1]
            avg_change = np.mean(last_row) if len(last_row) > 0 else 0
        else:
            avg_change = 0
        
        probability = 0.5 + avg_change * 0.1
        probability = max(0.1, min(0.9, probability))
        
        if probability > 0.55:
            direction = "UP"
        elif probability < 0.45:
            direction = "DOWN"
        else:
            direction = "NEUTRAL"
        
        return PredictionResult(
            probability=probability,
            direction=direction,
            confidence=0.65,
            features_used=[],
            model_version="mock"
        )


class EnsembleMLPredictor:
    """
    Ensemble of multiple ML models for robust predictions
    """

    def __init__(self, model_path: Optional[Path] = None):
        self.xgboost = XGBoostPredictor(model_path)
        self.lstm = LSTMModel() if TORCH_AVAILABLE else None
        
        # Model weights for ensemble
        self.weights = {
            'xgboost': 0.6,
            'lstm': 0.4,
        }
        
        logger.info("🎯 Ensemble ML Predictor initialized")
    
    def predict(self, features: Dict[str, float], sequence: Optional[np.ndarray] = None) -> PredictionResult:
        """
        Ensemble prediction from multiple models
        
        Args:
            features: Feature dictionary for XGBoost
            sequence: Time series sequence for LSTM
            
        Returns:
            Combined PredictionResult
        """
        # XGBoost prediction
        xgb_result = self.xgboost.predict(features)
        
        # LSTM prediction if available
        if self.lstm and sequence is not None:
            lstm_result = self.lstm.predict(sequence)
            
            # Weighted average probability
            ensemble_prob = (
                xgb_result.probability * self.weights['xgboost'] +
                lstm_result.probability * self.weights['lstm']
            )
            ensemble_conf = (
                xgb_result.confidence * self.weights['xgboost'] +
                lstm_result.confidence * self.weights['lstm']
            )
        else:
            ensemble_prob = xgb_result.probability
            ensemble_conf = xgb_result.confidence
        
        # Determine direction
        if ensemble_prob > 0.55:
            direction = "UP"
        elif ensemble_prob < 0.45:
            direction = "DOWN"
        else:
            direction = "NEUTRAL"
        
        return PredictionResult(
            probability=ensemble_prob,
            direction=direction,
            confidence=ensemble_conf,
            features_used=xgb_result.features_used,
            model_version=f"ensemble-xgb{lstm_result.model_version if self.lstm else ''}"
        )


# Singleton instance
ml_predictor = EnsembleMLPredictor()
