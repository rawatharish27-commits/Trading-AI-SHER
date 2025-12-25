
import { wsWatchdog } from "../services/wsWatchdog";
import { tokenStore } from "../services/tokenStore";

const ORDER_WS_URL = "wss://tns.angelone.in/smart-order-update";

export interface AngelOrderUpdate {
  "user-id": string;
  "status-code": string;
  "order-status": string;
  "error-message": string;
  "orderData": any;
}

/**
 * PRODUCTION-GRADE Order WebSocket for Angel One SmartAPI (v1).
 * Handles real-time order status updates (AB00 - AB11).
 */
export class AngelOneOrderWebSocket {
  private ws: WebSocket | null = null;
  private pingInterval: any = null;
  private onUpdate: (data: AngelOrderUpdate) => void;

  constructor(onUpdate: (data: AngelOrderUpdate) => void) {
    this.onUpdate = onUpdate;
  }

  /**
   * Established connection using JWT from TokenStore.
   * Note: Browser WebSockets do not support custom headers. 
   * Angel One typically expects the token in the query param or sub-protocol for browser clients.
   */
  connect() {
    if (this.ws) return;

    const tokens = tokenStore.getTokens();
    if (!tokens.jwt) {
      console.error("🦁 [OrderWS] No Authorization Shard Found");
      return;
    }

    // For browser-based clients, Angel One accepts the token in the URL or sub-protocol
    const url = `${ORDER_WS_URL}`;
    
    try {
      // Passing JWT as a sub-protocol to handle the Authorization requirement in a browser environment
      this.ws = new WebSocket(url, [tokens.jwt]);
      
      this.ws.onopen = () => {
        console.log("🦁 [OrderWS] Alpha Execution Bridge Established");
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        // 1. Heartbeat monitoring
        if (event.data === "pong") {
          wsWatchdog.onTick();
          return;
        }

        try {
          const data = JSON.parse(event.data) as AngelOrderUpdate;
          
          // Log heartbeat ticks
          wsWatchdog.onTick();

          // AB00 is the success handshake
          if (data["order-status"] === "AB00") {
             console.log("🦁 [OrderWS] Handshake Verified");
             return;
          }

          // Route functional updates to the execution engine
          this.onUpdate(data);
        } catch (e) {
          console.error("🦁 [OrderWS] Logic Parsing Error:", e);
        }
      };

      this.ws.onerror = (error) => {
        console.error("🦁 [OrderWS] Bridge Friction Detected:", error);
      };

      this.ws.onclose = (event) => {
        this.stopHeartbeat();
        this.ws = null;
        if (event.code !== 1000) {
          console.warn(`🦁 [OrderWS] Bridge Terminated (${event.code}). Re-initializing in 5s...`);
          setTimeout(() => this.connect(), 5000);
        }
      };
    } catch (err) {
      console.error("🦁 [OrderWS] Critical Connection Failure:", err);
    }
  }

  /**
   * Mandatory Heartbeat Protocol: ping every 10 seconds.
   */
  private startHeartbeat() {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send("ping");
      }
    }, 10000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) clearInterval(this.pingInterval);
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, "User Terminated");
      this.ws = null;
    }
  }
}
