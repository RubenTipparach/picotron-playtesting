/**
 * Performance Monitor
 *
 * Tracks render counts, render durations, and state update frequencies.
 * Toggle with Ctrl+Shift+P.
 */

interface PerfEntry {
  renders: number;
  lastRenderMs: number;
  totalRenderMs: number;
  updatesPerSec: number;
  recentTimestamps: number[];
}

const entries: Record<string, PerfEntry> = {};

function getEntry(name: string): PerfEntry {
  if (!entries[name]) {
    entries[name] = { renders: 0, lastRenderMs: 0, totalRenderMs: 0, updatesPerSec: 0, recentTimestamps: [] };
  }
  return entries[name];
}

/** Call at start of render, returns a stop function */
export function trackRender(name: string): () => void {
  const entry = getEntry(name);
  const start = performance.now();
  entry.renders++;

  const now = Date.now();
  entry.recentTimestamps.push(now);
  // Keep only last 2 seconds of timestamps
  const cutoff = now - 2000;
  entry.recentTimestamps = entry.recentTimestamps.filter(t => t > cutoff);
  entry.updatesPerSec = entry.recentTimestamps.length / 2;

  return () => {
    const duration = performance.now() - start;
    entry.lastRenderMs = duration;
    entry.totalRenderMs += duration;
  };
}

/** Track a generic event (state updates, etc.) */
export function trackEvent(name: string): void {
  const entry = getEntry(name);
  entry.renders++;
  const now = Date.now();
  entry.recentTimestamps.push(now);
  const cutoff = now - 2000;
  entry.recentTimestamps = entry.recentTimestamps.filter(t => t > cutoff);
  entry.updatesPerSec = entry.recentTimestamps.length / 2;
}

/** Get all perf data */
export function getPerfData(): Record<string, PerfEntry> {
  return { ...entries };
}

/** Reset all counters */
export function resetPerf(): void {
  for (const key of Object.keys(entries)) {
    delete entries[key];
  }
}
