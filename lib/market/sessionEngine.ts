
import { holidays } from '../../data/nse-holidays';

/**
 * 🦁 MARKET SESSION ENGINE (Absolute Timing Truth)
 * Goal: Prevent system execution during non-market hours.
 */
export class SessionEngine {
  private static readonly NSE_OPEN = { hr: 9, min: 15 };
  private static readonly NSE_CLOSE = { hr: 15, min: 30 };
  
  /**
   * Verified IST Holiday check.
   */
  static isHoliday(): boolean {
    const now = new Date();
    // Normalize to Asia/Kolkata date string YYYY-MM-DD
    const istDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(now);
    
    return (holidays as string[]).includes(istDate);
  }

  /**
   * Precise Market-Hours Validation (NSE/BSE)
   */
  static isMarketHours(): boolean {
    const now = new Date();
    
    // 1. Weekend Guard
    const day = now.getDay();
    if (day === 0 || day === 6) return false;

    // 2. Holiday Guard
    if (this.isHoliday()) return false;

    // 3. Time Window Guard (IST)
    const istTimeStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata', hour: 'numeric', minute: 'numeric', hour12: false,
    }).format(now);

    const [hr, min] = istTimeStr.split(':').map(Number);
    const minutesSinceMidnight = hr * 60 + min;

    const openMinutes = this.NSE_OPEN.hr * 60 + this.NSE_OPEN.min;
    const closeMinutes = this.NSE_CLOSE.hr * 60 + this.NSE_CLOSE.min;

    return minutesSinceMidnight >= openMinutes && minutesSinceMidnight <= closeMinutes;
  }

  static getSessionStatus(): 'OPEN' | 'CLOSED' {
    return this.isMarketHours() ? 'OPEN' : 'CLOSED';
  }
}
