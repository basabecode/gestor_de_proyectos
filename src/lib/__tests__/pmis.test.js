import { describe, it, expect } from 'vitest';
import {
  calculateEVM,
  getHealthStatus,
  getPctPlanned,
  formatCurrency,
} from '../pmis';

// ─── calculateEVM ──────────────────────────────────────────────────────────────

describe('calculateEVM', () => {
  it('returns null when bac is 0', () => {
    expect(calculateEVM({ bac: 0, pctComplete: 50, pctPlanned: 50, actualCost: 100 })).toBeNull();
  });

  it('returns null when bac is undefined', () => {
    expect(calculateEVM({ bac: undefined, pctComplete: 50, pctPlanned: 50, actualCost: 100 })).toBeNull();
  });

  it('calculates EV correctly', () => {
    const m = calculateEVM({ bac: 10000, pctComplete: 60, pctPlanned: 60, actualCost: 5000 });
    expect(m.ev).toBe(6000); // 60% of 10000
  });

  it('calculates PV correctly', () => {
    const m = calculateEVM({ bac: 10000, pctComplete: 60, pctPlanned: 50, actualCost: 5000 });
    expect(m.pv).toBe(5000); // 50% of 10000
  });

  it('calculates CPI > 1 when under budget', () => {
    // spent 4000 for 6000 EV => CPI = 1.5 (under budget, good)
    const m = calculateEVM({ bac: 10000, pctComplete: 60, pctPlanned: 60, actualCost: 4000 });
    expect(m.cpi).toBeCloseTo(1.5);
  });

  it('calculates CPI < 1 when over budget', () => {
    // spent 8000 for 6000 EV => CPI = 0.75 (over budget, bad)
    const m = calculateEVM({ bac: 10000, pctComplete: 60, pctPlanned: 60, actualCost: 8000 });
    expect(m.cpi).toBeCloseTo(0.75);
  });

  it('calculates SPI correctly', () => {
    // EV = 6000, PV = 8000 => SPI = 0.75 (behind schedule)
    const m = calculateEVM({ bac: 10000, pctComplete: 60, pctPlanned: 80, actualCost: 6000 });
    expect(m.spi).toBeCloseTo(0.75);
  });

  it('returns null CPI when actualCost is 0', () => {
    const m = calculateEVM({ bac: 10000, pctComplete: 60, pctPlanned: 60, actualCost: 0 });
    expect(m.cpi).toBeNull();
  });

  it('returns null SPI and PV when pctPlanned is null', () => {
    const m = calculateEVM({ bac: 10000, pctComplete: 60, pctPlanned: null, actualCost: 5000 });
    expect(m.pv).toBeNull();
    expect(m.spi).toBeNull();
  });

  it('calculates EAC correctly', () => {
    // CPI = 0.75 => EAC = BAC / CPI = 10000 / 0.75 ≈ 13333
    const m = calculateEVM({ bac: 10000, pctComplete: 60, pctPlanned: 60, actualCost: 8000 });
    expect(m.eac).toBeCloseTo(13333, 0);
  });

  it('calculates VAC as negative when over budget', () => {
    const m = calculateEVM({ bac: 10000, pctComplete: 60, pctPlanned: 60, actualCost: 8000 });
    expect(m.vac).toBeLessThan(0);
  });

  it('calculates positive CV when under budget', () => {
    const m = calculateEVM({ bac: 10000, pctComplete: 60, pctPlanned: 60, actualCost: 4000 });
    expect(m.cv).toBe(2000); // EV(6000) - AC(4000)
  });
});

// ─── getHealthStatus ──────────────────────────────────────────────────────────

describe('getHealthStatus', () => {
  it('returns healthy when CPI >= 0.9 and SPI >= 0.9', () => {
    expect(getHealthStatus(1.0, 1.0)).toBe('healthy');
    expect(getHealthStatus(0.9, 0.95)).toBe('healthy');
  });

  it('returns at-risk when either CPI or SPI is between 0.7 and 0.9', () => {
    expect(getHealthStatus(0.75, 0.95)).toBe('at-risk');
    expect(getHealthStatus(0.95, 0.75)).toBe('at-risk');
  });

  it('returns critical when both CPI and SPI are below 0.7', () => {
    expect(getHealthStatus(0.5, 0.5)).toBe('critical');
  });

  it('returns unknown when both are null', () => {
    expect(getHealthStatus(null, null)).toBe('unknown');
  });

  it('uses 1.0 as substitute when spi is null', () => {
    // spi=null → substituted with 1.0 (neutral/unknown schedule)
    // c=0.6 (<0.9), s=1.0 (>=0.7) → "at-risk" because the or-branch fires on s
    expect(getHealthStatus(0.6, null)).toBe('at-risk');
  });

  it('returns at-risk even with very low cpi when spi is null (spi defaults to 1.0)', () => {
    // With spi null→1.0, the worst reachable status is "at-risk" (s>=0.7 always true)
    expect(getHealthStatus(0.3, null)).toBe('at-risk');
  });
});

// ─── getPctPlanned ────────────────────────────────────────────────────────────

describe('getPctPlanned', () => {
  it('returns null when dates are missing', () => {
    expect(getPctPlanned(null, null)).toBeNull();
    expect(getPctPlanned('2025-01-01', null)).toBeNull();
  });

  it('returns 0 when project has not started yet', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const end = new Date(future);
    end.setFullYear(end.getFullYear() + 2);
    expect(getPctPlanned(future.toISOString(), end.toISOString())).toBe(0);
  });

  it('returns 100 when project end date has passed', () => {
    expect(getPctPlanned('2020-01-01', '2021-01-01')).toBe(100);
  });

  it('returns a value between 0 and 100 for ongoing projects', () => {
    const start = new Date();
    start.setFullYear(start.getFullYear() - 1);
    const end = new Date();
    end.setFullYear(end.getFullYear() + 1);
    const pct = getPctPlanned(start.toISOString(), end.toISOString());
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThan(100);
  });
});

// ─── formatCurrency ───────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('returns — for null/undefined', () => {
    expect(formatCurrency(null)).toBe('—');
    expect(formatCurrency(undefined)).toBe('—');
  });

  it('formats numbers as currency', () => {
    expect(formatCurrency(1000)).toContain('1');
    expect(formatCurrency(1000)).toContain('000');
  });

  it('uses compact notation for large values when compact=true', () => {
    expect(formatCurrency(15000, true)).toBe('$15.0k');
  });
});
