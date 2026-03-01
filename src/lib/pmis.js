/**
 * PMIS — Earned Value Management (EVM) calculation engine.
 * All functions are pure (no side effects, no React hooks).
 */

/**
 * Core EVM metrics.
 * @param {object} p
 * @param {number} p.bac          Budget at Completion (total budget)
 * @param {number} p.pctComplete  % of work done (0-100)
 * @param {number} p.pctPlanned   % of time elapsed (0-100), null if no dates
 * @param {number} p.actualCost   Actual Cost spent so far
 */
export function calculateEVM({ bac, pctComplete, pctPlanned, actualCost }) {
  if (!bac || bac <= 0) return null;

  const ev = (pctComplete / 100) * bac;         // Earned Value
  const pv = pctPlanned != null
    ? (pctPlanned / 100) * bac                   // Planned Value
    : null;
  const ac = actualCost || 0;                    // Actual Cost

  const cpi = ac > 0 ? ev / ac : null;           // Cost Performance Index
  const spi = pv != null && pv > 0 ? ev / pv : null; // Schedule Performance Index
  const eac = cpi && cpi > 0 ? bac / cpi : bac; // Estimate at Completion
  const vac = bac - eac;                          // Variance at Completion
  const sv  = pv != null ? ev - pv : null;        // Schedule Variance ($)
  const cv  = ac > 0 ? ev - ac : null;            // Cost Variance ($)
  const tcpi = (eac - ac) > 0
    ? (bac - ev) / (eac - ac)
    : null;                                       // To-Complete Performance Index

  return { ev, pv, ac, bac, cpi, spi, eac, vac, sv, cv, tcpi };
}

/**
 * Returns 'healthy' | 'at-risk' | 'critical' | 'unknown'
 */
export function getHealthStatus(cpi, spi) {
  if (cpi === null && spi === null) return 'unknown';
  const c = cpi ?? 1;
  const s = spi ?? 1;
  if (c >= 0.9 && s >= 0.9) return 'healthy';
  if (c >= 0.7 || s >= 0.7) return 'at-risk';
  return 'critical';
}

/**
 * Returns the % of time elapsed between start and end dates (0-100).
 * Returns null if dates are missing.
 */
export function getPctPlanned(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end   = new Date(endDate);
  const now   = new Date();
  if (now <= start) return 0;
  if (now >= end)   return 100;
  return ((now - start) / (end - start)) * 100;
}

/**
 * Formats a number as USD currency.
 * @param {number}  value
 * @param {boolean} compact  — use $1.2k notation for large values
 */
export function formatCurrency(value, compact = false) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  if (compact && Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export const HEALTH_CONFIG = {
  healthy: { label: 'Proyecto saludable', color: '#00c875', bg: '#e6f9f0' },
  'at-risk': { label: 'En riesgo',         color: '#fdab3d', bg: '#fff5e6' },
  critical:  { label: 'Estado crítico',    color: '#e2445c', bg: '#fdeef1' },
  unknown:   { label: 'Sin datos PMIS',    color: '#9ca3af', bg: '#f3f4f6' },
};
