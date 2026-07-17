import { NextRequest, NextResponse } from 'next/server';

/**
 * Error Budget Circuit Breaker Middleware
 * 
 * Implements Reliability Engineering standard REF-2026-001.
 * Monitors a rolling error budget (e.g. 0.1% failure rate allowed).
 * If the error budget is exhausted, non-essential endpoints are blocked
 * to preserve system stability and force remediation.
 */
export class ErrorBudgetCircuitBreaker {
  private static errorCount = 0;
  private static requestCount = 0;
  private static readonly MAX_ERROR_RATE = 0.001; // 0.1%
  private static readonly MIN_REQUESTS_BEFORE_TRIP = 100;
  
  // Simulation of persistent state checking
  public static async evaluateRequest(req: NextRequest): Promise<NextResponse | null> {
    this.requestCount++;
    
    // Check if error budget is breached
    if (this.requestCount > this.MIN_REQUESTS_BEFORE_TRIP) {
      const errorRate = this.errorCount / this.requestCount;
      if (errorRate > this.MAX_ERROR_RATE) {
        // Budget exhausted
        return NextResponse.json({
          error: 'Error_Budget_Exhausted',
          message: 'Service is currently in recovery mode due to SLO breach. Non-essential requests are temporarily suspended.'
        }, { 
          status: 503, 
          headers: {
            'Retry-After': '300'
          }
        });
      }
    }
    
    // Let request pass
    return null;
  }

  public static recordError(): void {
    this.errorCount++;
  }

  public static resetBudget(): void {
    this.errorCount = 0;
    this.requestCount = 0;
  }
}
