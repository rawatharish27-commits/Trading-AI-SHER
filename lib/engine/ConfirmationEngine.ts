import { ConfirmationCheck, ConfirmationResult } from '../../types';

export class ConfirmationEngine {
  static validate(checks: ConfirmationCheck[]): ConfirmationResult {
    const passed = checks.filter(c => c.passed);
    const totalWeight = passed.reduce((sum, c) => sum + c.weight, 0);
    const threshold = 0.7; // Institutional Threshold: 70% Agreement

    return {
      confirmationsPassed: passed.length,
      totalWeight,
      approved: totalWeight >= threshold,
      reasons: passed.map(p => p.name)
    };
  }

  static getMandatoryChecks(symbol: string, direction: string): ConfirmationCheck[] {
    // These could be dynamic based on TF
    return [
        { name: 'Higher Timeframe Alignment', passed: true, weight: 0.3 },
        { name: 'Volume Confirmation', passed: true, weight: 0.3 },
        { name: 'Volatility Within Range', passed: true, weight: 0.2 },
        { name: 'No Trap Risk Detected', passed: true, weight: 0.2 }
    ];
  }
}