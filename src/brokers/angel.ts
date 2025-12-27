import { Broker } from "./broker.interface";

export class AngelBroker implements Broker {
  async placeOrder(order: any) {
    return { status: "SIMULATED", order };
  }
}
