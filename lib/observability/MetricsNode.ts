/**
 * 📈 METRICS NODE
 * Goal: Institutional Observability (Prometheus style).
 */
export class MetricsNode {
  private static registries: Record<string, number[]> = {};

  static record(metric: string, value: number) {
    if (!this.registries[metric]) this.registries[metric] = [];
    this.registries[metric].push(value);
    
    // Keep last 100 points for rolling averages
    if (this.registries[metric].length > 100) this.registries[metric].shift();
  }

  static getP95(metric: string): number {
    const values = [...(this.registries[metric] || [])].sort((a, b) => a - b);
    if (values.length === 0) return 0;
    const index = Math.floor(values.length * 0.95);
    return values[index];
  }

  static getAvg(metric: string): number {
    const values = this.registries[metric] || [];
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
}