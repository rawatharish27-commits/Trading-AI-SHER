import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execFileAsync = promisify(execFile);

export interface ForecastFeatures {
    rsi: number;
    volatility: number;
    momentum: number;
    sma20: number;
    sma50: number;
    currentPrice: number;
}

export interface ForecastResult {
    direction: 'UP' | 'DOWN' | 'FLAT';
    probability: number;
    predictedReturn?: number;
    source: 'ML_MODEL' | 'HEURISTIC';
}

export class MarketForecaster {
    private pythonPath: string;
    private scriptPath: string;

    constructor() {
        // Defaults for the Python environment
        // In a real deployment, this points to the python environment with scikit-learn installed
        this.pythonPath = process.env.PYTHON_PATH || 'python'; 
        this.scriptPath = path.join((process as any).cwd(), 'ml', 'predict.py');
    }

    /**
     * Predicts market direction using ML models (via Python bridge)
     * Falls back to heuristic logic if the model is unavailable or fails.
     */
    async predict(features: ForecastFeatures): Promise<ForecastResult> {
        try {
            // Attempt to execute Python ML inference
            // We pass features as JSON arguments to the script
            const { stdout } = await execFileAsync(this.pythonPath, [
                this.scriptPath, 
                JSON.stringify(features)
            ], { timeout: 2000 }); // 2s timeout to ensure low latency

            // Expected output from python script: JSON object with direction, confidence, etc.
            const result = JSON.parse(stdout);
            
            return {
                direction: result.direction,
                probability: result.confidence,
                predictedReturn: result.predicted_return,
                source: 'ML_MODEL'
            };
        } catch (error) {
            // Fallback logic if ML service is down or script doesn't exist
            // console.warn("ML Inference unavailable, using heuristic fallback.");
            return this.heuristicFallback(features);
        }
    }

    /**
     * Robust heuristic model acting as a fallback for the ML Classifier.
     * Uses a weighted voting system based on classical technical indicators.
     */
    private heuristicFallback(f: ForecastFeatures): ForecastResult {
        let score = 0;

        // 1. Trend Filter (Weight: 3)
        // Checks SMA alignment
        if (f.currentPrice > f.sma20 && f.sma20 > f.sma50) {
            score += 3; // Strong Bullish Trend
        } else if (f.currentPrice < f.sma20 && f.sma20 < f.sma50) {
            score -= 3; // Strong Bearish Trend
        }

        // 2. Mean Reversion Filter (Weight: 2)
        // Checks RSI extremes
        if (f.rsi < 30) score += 2; // Oversold -> Expect UP
        else if (f.rsi > 70) score -= 2; // Overbought -> Expect DOWN

        // 3. Momentum Filter (Weight: 1.5)
        if (f.momentum > 0) score += 1.5;
        else score -= 1.5;

        // 4. Volatility Penalty (Weight: -1)
        // High volatility reduces confidence in directional bets
        if (f.volatility > 0.04) {
            score = score * 0.8; // Dampen score in high vol
        }

        // Normalize Score to Probability
        // Max theoretical score approx +/- 6.5
        const normalizedScore = Math.max(-1, Math.min(1, score / 6.5));
        
        let direction: 'UP' | 'DOWN' | 'FLAT' = 'FLAT';
        if (normalizedScore > 0.25) direction = 'UP';
        else if (normalizedScore < -0.25) direction = 'DOWN';

        // Map normalized score (0 to 1) to probability (0.5 to 0.95)
        const probability = 0.5 + (Math.abs(normalizedScore) * 0.45);

        return {
            direction,
            probability: parseFloat(probability.toFixed(2)),
            predictedReturn: parseFloat((normalizedScore * 2.0).toFixed(2)), // Estimated % return
            source: 'HEURISTIC'
        };
    }
}