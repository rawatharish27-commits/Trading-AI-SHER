// Razorpay stub to prevent build errors
// This is a placeholder file
// Actual Razorpay integration requires additional setup

export interface RazorpayOptions {
  key_id: string;
  key_secret: string;
}

export class Razorpay {
  constructor(options: RazorpayOptions) {
    // Stub implementation
  }

  orders = {
    create: async (data: any) => {
      console.log('Razorpay create order called (STUB)');
      return { id: 'stub_order_id', ...data };
    }
  };

  payments = {
    capture: async (data: any) => {
      console.log('Razorpay capture payment called (STUB)');
      return { id: 'stub_payment_id', ...data };
    }
  };
}

export default Razorpay;
