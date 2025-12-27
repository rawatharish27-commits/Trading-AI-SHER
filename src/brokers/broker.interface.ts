export interface Broker {
  placeOrder(order: any): Promise<any>;
}
