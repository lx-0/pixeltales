import { Injectable, Logger } from '@nestjs/common';

/** Represents the states of a circuit breaker. */
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/** Stores the current state and failure metrics for a specific circuit. */
interface CircuitInfo {
  state: CircuitState;
  failures: number;
  lastFailureTime: number;
  openUntil: number;
}

/**
 * Provides a Circuit Breaker pattern implementation to prevent repeated calls
 * to operations that are likely to fail.
 *
 * - CLOSED: Allows operations to execute. Counts failures.
 * - OPEN: Immediately rejects operations (or uses fallback) for a configured timeout
 *         after the failure threshold is reached. Gives the downstream service time to recover.
 * - HALF_OPEN: After the OPEN timeout, allows a single test operation. If it succeeds,
 *              moves to CLOSED. If it fails, moves back to OPEN.
 */
@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  /** Map storing the state of individual circuits, keyed by operation key. */
  private circuits = new Map<string, CircuitInfo>();

  // --- Configuration ---
  /** Number of consecutive failures allowed before tripping the circuit to OPEN. */
  private readonly failureThreshold = 3;
  /** Duration (ms) the circuit stays OPEN before transitioning to HALF_OPEN. */
  private readonly resetTimeoutMs = 30000; // 30 seconds
  /** Duration (ms) the circuit stays in HALF_OPEN, waiting for a successful test call. */
  private readonly halfOpenTimeoutMs = 5000; // 5 seconds

  /**
   * Executes an asynchronous operation protected by a circuit breaker, identified by a unique key.
   *
   * Checks the current state of the circuit associated with the key:
   * - If OPEN and timeout hasn't expired, rejects immediately or runs fallback.
   * - If OPEN and timeout has expired, moves to HALF_OPEN and allows one attempt.
   * - If HALF_OPEN, allows the operation. Success closes the circuit, failure re-opens it.
   * - If CLOSED, executes the operation. Records success/failure.
   *
   * @template T The return type of the operation.
   * @param {string} key A unique key identifying the specific operation being protected (e.g., 'llm_generateAction:agent123', 'database_getUser:user456').
   * @param {() => Promise<T>} operation The asynchronous function/operation to execute.
   * @param {() => Promise<T>} [fallback] Optional asynchronous function to execute if the circuit is OPEN or the main operation fails.
   * @returns {Promise<T>} A promise resolving with the result of the operation or the fallback.
   * @throws {Error} Throws an error if the circuit is OPEN and no fallback is provided, or if the operation itself throws and no fallback is provided.
   */
  async execute<T>(
    key: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>,
  ): Promise<T> {
    const circuit = this.getCircuit(key);
    const now = Date.now();

    // --- State Check ---
    if (circuit.state === 'OPEN') {
      if (now >= circuit.openUntil) {
        // Timeout expired, move to half-open to test the connection
        this.logger.warn(`[${key}] Circuit OPEN timeout expired, moving to HALF_OPEN.`);
        circuit.state = 'HALF_OPEN';
        // Set a short timeout for the test call in HALF_OPEN state
        circuit.openUntil = now + this.halfOpenTimeoutMs;
      } else {
        // Circuit is OPEN and timeout has not expired
        this.logger.warn(`[${key}] Circuit is OPEN. Failing fast or executing fallback.`);
        if (fallback) {
          return await fallback();
        }
        throw new Error(`CircuitBreaker[${key}]: Circuit is OPEN`);
      }
    }

    // --- Execute Operation (If CLOSED or HALF_OPEN) ---
    try {
      const result = await operation();
      // Operation succeeded
      this.onSuccess(key, circuit);
      return result;
    } catch (error) {
      // Operation failed
      this.logger.error(`[${key}] Operation failed:`, error);
      this.onFailure(key, circuit);
      // Execute fallback if provided
      if (fallback) {
        this.logger.warn(`[${key}] Operation failed, executing fallback.`);
        return await fallback();
      }
      // Re-throw the original error if no fallback
      throw error;
    }
  }

  /** Retrieves or creates the circuit state for a given key. */
  private getCircuit(key: string): CircuitInfo {
    if (!this.circuits.has(key)) {
      this.circuits.set(key, this.createDefaultCircuit());
      this.logger.log(`[${key}] Created new circuit breaker.`);
    }
    return this.circuits.get(key)!;
  }

  /** Creates a default circuit state (CLOSED). */
  private createDefaultCircuit(): CircuitInfo {
    return {
      state: 'CLOSED',
      failures: 0,
      lastFailureTime: 0,
      openUntil: 0,
    };
  }

  /** Handles a successful operation execution. */
  private onSuccess(key: string, circuit: CircuitInfo): void {
    if (circuit.state === 'HALF_OPEN') {
      // Success in HALF_OPEN state means the underlying service is likely recovered
      this.logger.log(`[${key}] Success in HALF_OPEN state. Closing circuit.`);
      this.resetCircuit(key, circuit);
    }
    // Optional: Reset failure count on success in CLOSED state if desired
    // circuit.failures = 0;
  }

  /** Handles a failed operation execution. */
  private onFailure(key: string, circuit: CircuitInfo): void {
    circuit.failures++;
    circuit.lastFailureTime = Date.now();

    if (circuit.state === 'HALF_OPEN') {
      // If the test call in HALF_OPEN fails, trip back to OPEN immediately
      this.logger.warn(`[${key}] Failure in HALF_OPEN state. Re-opening circuit.`);
      this.tripCircuit(key, circuit);
    } else if (circuit.failures >= this.failureThreshold) {
      // If failure threshold is met in CLOSED state, trip to OPEN
      this.logger.warn(
        `[${key}] Failure threshold reached (${circuit.failures}). Tripping circuit.`,
      );
      this.tripCircuit(key, circuit);
    }
    this.logger.debug(`[${key}] Failure count: ${circuit.failures}`);
  }

  /** Trips the circuit to the OPEN state. */
  private tripCircuit(key: string, circuit: CircuitInfo): void {
    circuit.state = 'OPEN';
    circuit.openUntil = Date.now() + this.resetTimeoutMs; // Set timeout for OPEN state
    circuit.failures = 0; // Reset failure count when tripping
  }

  /** Resets the circuit to the CLOSED state. */
  private resetCircuit(key: string, circuit: CircuitInfo): void {
    circuit.state = 'CLOSED';
    circuit.failures = 0;
    circuit.openUntil = 0;
  }
}
