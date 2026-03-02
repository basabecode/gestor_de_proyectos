import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LicenseBanner from '../LicenseBanner';

// ── Mock del hook useLicense ──────────────────────────────────────────────────
vi.mock('@/hooks/useLicense', () => ({ useLicense: vi.fn() }));

import { useLicense } from '@/hooks/useLicense';

function mockLicense(overrides = {}) {
  useLicense.mockReturnValue({
    isValid:        true,
    isExpired:      false,
    isExpiringSoon: false,
    daysLeft:       60,
    ...overrides,
  });
}

// ═════════════════════════════════════════════════════════════════════════════
describe('LicenseBanner', () => {

  beforeEach(() => { vi.clearAllMocks(); });

  // ── No renderiza cuando la licencia está bien ────────────────────────────────
  it('no renderiza nada si la licencia está activa y no vence pronto', () => {
    mockLicense();
    const { container } = render(<LicenseBanner />);
    expect(container.firstChild).toBeNull();
  });

  // ── Advertencia de expiración próxima ────────────────────────────────────────
  it('muestra advertencia con los días restantes cuando vence pronto', () => {
    mockLicense({ isExpiringSoon: true, daysLeft: 7 });
    render(<LicenseBanner />);
    expect(screen.getByText(/7 día/)).toBeInTheDocument();
  });

  it('muestra "1 día" (singular) cuando queda exactamente 1 día', () => {
    mockLicense({ isExpiringSoon: true, daysLeft: 1 });
    render(<LicenseBanner />);
    // "1 día" sin "s"
    expect(screen.getByText(/1 día[^s]/)).toBeInTheDocument();
  });

  it('muestra "días" (plural) cuando quedan varios días', () => {
    mockLicense({ isExpiringSoon: true, daysLeft: 5 });
    render(<LicenseBanner />);
    expect(screen.getByText(/5 días/)).toBeInTheDocument();
  });

  it('tiene botón de cerrar cuando vence pronto', () => {
    mockLicense({ isExpiringSoon: true, daysLeft: 10 });
    render(<LicenseBanner />);
    expect(screen.getByLabelText('Cerrar aviso')).toBeInTheDocument();
  });

  it('se puede cerrar el aviso de expiración próxima', () => {
    mockLicense({ isExpiringSoon: true, daysLeft: 10 });
    render(<LicenseBanner />);
    fireEvent.click(screen.getByLabelText('Cerrar aviso'));
    expect(screen.queryByText(/10 día/)).not.toBeInTheDocument();
  });

  // ── Licencia expirada ─────────────────────────────────────────────────────────
  it('muestra mensaje de licencia expirada', () => {
    mockLicense({ isValid: false, isExpired: true, daysLeft: 0 });
    render(<LicenseBanner />);
    expect(screen.getByText(/ha expirado/)).toBeInTheDocument();
  });

  it('NO tiene botón de cerrar cuando la licencia expiró', () => {
    mockLicense({ isValid: false, isExpired: true, daysLeft: 0 });
    render(<LicenseBanner />);
    expect(screen.queryByLabelText('Cerrar aviso')).not.toBeInTheDocument();
  });

  it('contiene un enlace de "Contactar soporte" cuando expiró', () => {
    mockLicense({ isValid: false, isExpired: true, daysLeft: 0 });
    render(<LicenseBanner />);
    expect(screen.getByText('Contactar soporte')).toBeInTheDocument();
  });

  it('contiene un enlace de "Contactar soporte" cuando vence pronto', () => {
    mockLicense({ isExpiringSoon: true, daysLeft: 3 });
    render(<LicenseBanner />);
    expect(screen.getByText('Contactar soporte')).toBeInTheDocument();
  });
});
