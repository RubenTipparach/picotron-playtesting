/**
 * Sync Bus — Inter-Core Message Passing
 *
 * Provides send/sync primitives for communication between CPU cores.
 * - send(syncId, msg): queue a message at a named sync point
 * - sync(syncId, n, ctx): block until n messages arrive, then return them all
 * - resetSyncBus(): clear everything (called on global stop)
 */

interface Waiter {
  resolve: (messages: any[]) => void;
  reject: (error: Error) => void;
  n: number;
  cancelInterval: ReturnType<typeof setInterval> | null;
}

interface SyncPoint {
  messages: any[];
  waiters: Waiter[];
}

const syncPoints = new Map<string, SyncPoint>();

function getOrCreate(syncId: string): SyncPoint {
  let point = syncPoints.get(syncId);
  if (!point) {
    point = { messages: [], waiters: [] };
    syncPoints.set(syncId, point);
  }
  return point;
}

/**
 * Check if any waiters can be resolved after a new message arrives.
 */
function checkWaiters(point: SyncPoint): void {
  const resolved: number[] = [];
  for (let i = 0; i < point.waiters.length; i++) {
    const waiter = point.waiters[i];
    if (point.messages.length >= waiter.n) {
      const messages = point.messages.splice(0, waiter.n);
      if (waiter.cancelInterval) clearInterval(waiter.cancelInterval);
      waiter.resolve(messages);
      resolved.push(i);
    }
  }
  // Remove resolved waiters (reverse order to preserve indices)
  for (let i = resolved.length - 1; i >= 0; i--) {
    point.waiters.splice(resolved[i], 1);
  }
}

/**
 * Queue a message at a sync point.
 * If any waiters are waiting for this many messages, they get resolved.
 */
export function busSend(syncId: string, msg: any): void {
  const point = getOrCreate(syncId);
  point.messages.push(msg);
  checkWaiters(point);
}

/**
 * Block until n messages have been sent to this syncId.
 * Returns the messages and clears them from the queue.
 *
 * @param syncId - Named sync point
 * @param n - Number of messages to wait for
 * @param ctx - Execution context with throwIfCancelled for cancellation support
 */
export function busSync(
  syncId: string,
  n: number,
  ctx: { throwIfCancelled?: () => void }
): Promise<any[]> {
  const point = getOrCreate(syncId);

  // Already have enough messages — resolve immediately
  if (point.messages.length >= n) {
    const messages = point.messages.splice(0, n);
    return Promise.resolve(messages);
  }

  // Wait for messages
  return new Promise<any[]>((resolve, reject) => {
    const waiter: Waiter = {
      resolve,
      reject,
      n,
      cancelInterval: null,
    };

    // Periodically check for cancellation
    waiter.cancelInterval = setInterval(() => {
      try {
        ctx.throwIfCancelled?.();
      } catch (error) {
        if (waiter.cancelInterval) clearInterval(waiter.cancelInterval);
        // Remove this waiter from the list
        const idx = point.waiters.indexOf(waiter);
        if (idx !== -1) point.waiters.splice(idx, 1);
        reject(error);
      }
    }, 100);

    point.waiters.push(waiter);
  });
}

/**
 * Clear all sync points and reject all pending waiters.
 * Called on global stop to prevent cores from hanging.
 */
export function resetSyncBus(): void {
  for (const [, point] of syncPoints) {
    for (const waiter of point.waiters) {
      if (waiter.cancelInterval) clearInterval(waiter.cancelInterval);
      waiter.reject(new Error("Execution cancelled"));
    }
  }
  syncPoints.clear();
}
