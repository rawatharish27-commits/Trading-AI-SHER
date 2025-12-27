import { BrokerCapabilities } from "../brokers/capabilities";

export class WhiteLabelBroker {
  constructor(
    private apiKey: string,
    private capabilities: BrokerCapabilities
  ) {}

  async placeOrder(order: any) {
    if (!this.capabilities.supportsIntraday) {
      throw new Error("Intraday not supported");
    }
    return { status: "ROUTED", order };
  }
}
