export interface BrokerCapabilities {
  name: string;
  supportsIntraday: boolean;
  supportsOptions: boolean;
  latencyMs: number;
}
