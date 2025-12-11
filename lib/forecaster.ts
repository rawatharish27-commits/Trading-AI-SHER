
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
        // Use python3 by default for Linux/Container environments
        this.pythonPath = process.env.PYTHON_PATH || 'python3'; 
        this.scriptPath = path.join((process as any).cwd(), 'ml', 'predict.py');
    }

    /**
     * Predicts market direction using ML models (via Python bridge)
     * Falls back to heuristic logic if the model is unavailable or fails.
     */
    async predict(features: ForecastFeatures): Promise<ForecastResult> {
        try {
            // Attempt to execute Python ML inference
            const { stdout } = await execFileAsync(this.pythonPath, [
                this.scriptPath, 
                JSON.stringify(features)
            ], { timeout: 2000 }); 

            const result = JSON.parse(stdout);
            
            // Handle error output from python script gracefully
            if (result.error) {
                console.warn("ML Script returned error:", result.error);
                return this.heuristicFallback(features);
            }

            return {
                direction: result.direction,
                probability: result.confidence,
                predictedReturn: result.predicted_return,
                source: 'ML_MODEL'
            };
        } catch (error) {
            console.warn("ML Inference failed (using heuristic):", error);
            return this.heuristicFallback(features);
        }
    }

    /**
     * Robust heuristic model acting as a fallback for the ML Classifier.
     */
    private heuristicFallback(f: ForecastFeatures): ForecastResult {
        let score = 0;

        // 1. Trend Filter
        if (f.currentPrice > f.sma20 && f.sma20 > f.sma50) score += 3;
        else if (f.currentPrice < f.sma20 && f.sma20 < f.sma50) score -= 3;

        // 2. RSI Filter
        if (f.rsi < 30) score += 2;
        else if (f.rsi > 70) score -= 2;

        // 3. Momentum
        if (f.momentum > 0) score += 1.5;
        else score -= 1.5;

        // 4. Volatility Penalty
        if (f.volatility > 0.04) score *= 0.8;

        const normalizedScore = Math.max(-1, Math.min(1, score / 6.5));
        
        let direction: 'UP' | 'DOWN' | 'FLAT' = 'FLAT';
        if (normalizedScore > 0.25) direction = 'UP';
        else if (normalizedScore < -0.25) direction = 'DOWN';

        const probability = 0.5 + (Math.abs(normalizedScore) * 0.45);

        return {
            direction,
            probability: parseFloat(probability.toFixed(2)),
            predictedReturn: parseFloat((normalizedScore * 2.0).toFixed(2)),
            source: 'HEURISTIC'
        };
    }
}
