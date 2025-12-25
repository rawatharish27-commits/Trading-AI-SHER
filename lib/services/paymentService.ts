import { Plan } from '../../types';
import { PLANS_CONFIG } from '../plans';

/**
 * 💳 INSTITUTIONAL PAYMENT NODE
 * Goal: Bridge neural terminal to global settlement gateways.
 */
export class PaymentService {
  /**
   * Initializes real-money sharding via Razorpay.
   */
  static async createOrder(plan: Plan, userId: string) {
    const config = PLANS_CONFIG[plan];
    if (config.amount === 0) return null;

    // Simulate API call to backend /api/payment/razorpay/create-order
    console.info(`🦁 [Billing] Generating Order Shard for Plan: ${plan}`);
    
    // In Production: return await axios.post('/api/payment/create-order', { plan, userId });
    return {
      id: `order_${Math.random().toString(36).substr(2, 9)}`,
      amount: config.amount * 100, // paise
      currency: "INR"
    };
  }

  static async initiateRazorpay(plan: Plan, userId: string, onEvent: (e: any) => void) {
    const order = await this.createOrder(plan, userId);
    if (!order) return;

    const options = {
      key: process.env.RAZORPAY_KEY_ID || "rzp_live_placeholder",
      amount: order.amount,
      currency: "INR",
      name: "SHER.AI",
      description: `Provisioning ${plan} Shard`,
      order_id: order.id,
      handler: (response: any) => {
        onEvent({ type: 'SUCCESS', response });
      },
      prefill: {
        name: "Trader Node",
        email: "trader@sher.ai"
      },
      notes: {
        userId,
        plan
      },
      theme: { color: "#2B6CB0" }
    };

    if ((window as any).Razorpay) {
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    }
  }

  static async simulateHandshake() {
     // Legacy simulation for demo environments
     return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1500));
  }
}
