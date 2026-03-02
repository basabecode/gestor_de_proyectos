import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import LicenseGuard from '../LicenseGuard';

// ── Mock del hook useLicense ──────────────────────────────────────────────────
vi.mock('@/hooks/useLicense', () => ({ useLicense: vi.fn() }));

import { useLicense } from '@/hooks/useLicense';

// Licencia activa por defecto
function mockValid(overrides = {}) {
  useLicense.mockReturnValue({
    isValid:        true,
    isExpired:      false,
    isDisabled:     false,
    daysLeft:       45,
    planLabel:      'Free Trial',
    canUseFeature:  () => true,
    ...overrides,
  });
}

function mockExpired(overrides = {}) {
  useLicense.mockReturnValue({
    isValid:        false,
    isExpired:      true,
    isDisabled:     false,
    daysLeft:       0,
    planLabel:      'Free Trial',
    canUseFeature:  () => false,
    ...overrides,
  });
}

function mockDisabled() {
  useLicense.mockReturnValue({
    isValid:        false,
    isExpired:      false,
    isDisabled:     true,
    daysLeft:       0,
    planLabel:      'Free Trial',
    canUseFeature:  () => false,
  });
}

// ═════════════════════════════════════════════════════════════════════════════
describe('LicenseGuard', () => {

  beforeEach(() => { vi.clearAllMocks(); });

  const Child = () => <div>Contenido protegido</div>;

  // ── Licencia válida ───────────────────────────────────────────────────────────
  describe('con licencia válida', () => {
    it('renderiza los hijos cuando la licencia está activa', () => {
      mockValid();
      render(<LicenseGuard><Child /></LicenseGuard>);
      expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
    });

    it('renderiza los hijos cuando la feature está disponible', () => {
      mockValid({ canUseFeature: () => true });
      render(<LicenseGuard feature="boards"><Child /></LicenseGuard>);
      expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
    });

    it('NO renderiza los hijos cuando la feature está bloqueada', () => {
      mockValid({ canUseFeature: () => false });
      render(<LicenseGuard feature="api_access"><Child /></LicenseGuard>);
      expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument();
    });
  });

  // ── Licencia expirada ─────────────────────────────────────────────────────────
  describe('con licencia expirada', () => {
    it('muestra pantalla de licencia expirada', () => {
      mockExpired();
      render(<LicenseGuard><Child /></LicenseGuard>);
      expect(screen.getByText(/Licencia expirada/)).toBeInTheDocument();
    });

    it('NO renderiza los hijos cuando la licencia expiró', () => {
      mockExpired();
      render(<LicenseGuard><Child /></LicenseGuard>);
      expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument();
    });

    it('muestra enlace para contactar soporte en pantalla expirada', () => {
      mockExpired();
      render(<LicenseGuard><Child /></LicenseGuard>);
      expect(screen.getByText('Contactar soporte')).toBeInTheDocument();
    });

    it('muestra mensaje sobre conservación de datos', () => {
      mockExpired();
      render(<LicenseGuard><Child /></LicenseGuard>);
      expect(screen.getByText(/datos están seguros/)).toBeInTheDocument();
    });
  });

  // ── Cuenta suspendida ─────────────────────────────────────────────────────────
  describe('con cuenta suspendida', () => {
    it('muestra pantalla de cuenta suspendida', () => {
      mockDisabled();
      render(<LicenseGuard><Child /></LicenseGuard>);
      expect(screen.getByRole('heading', { name: /suspendida/ })).toBeInTheDocument();
    });

    it('no dice "expirada" si la cuenta fue deshabilitada', () => {
      mockDisabled();
      render(<LicenseGuard><Child /></LicenseGuard>);
      expect(screen.queryByText(/Licencia expirada/)).not.toBeInTheDocument();
    });
  });

  // ── Feature locking por plan ──────────────────────────────────────────────────
  describe('feature locking', () => {
    it('muestra el nombre de la feature bloqueada — api_access', () => {
      mockValid({ canUseFeature: () => false });
      render(<LicenseGuard feature="api_access"><Child /></LicenseGuard>);
      expect(screen.getByText('Acceso a la API')).toBeInTheDocument();
    });

    it('muestra el nombre de la feature bloqueada — sso', () => {
      mockValid({ canUseFeature: () => false });
      render(<LicenseGuard feature="sso"><Child /></LicenseGuard>);
      expect(screen.getByText('Single Sign-On (SSO)')).toBeInTheDocument();
    });

    it('muestra el nombre de la feature bloqueada — advanced_analytics', () => {
      mockValid({ canUseFeature: () => false });
      render(<LicenseGuard feature="advanced_analytics"><Child /></LicenseGuard>);
      expect(screen.getByText('Analíticas avanzadas')).toBeInTheDocument();
    });

    it('muestra el plan actual en la pantalla de feature bloqueada', () => {
      mockValid({ canUseFeature: () => false, planLabel: 'Free Trial' });
      render(<LicenseGuard feature="sso"><Child /></LicenseGuard>);
      expect(screen.getByText(/Free Trial/)).toBeInTheDocument();
    });

    it('sin feature prop: renderiza hijos si la licencia es válida', () => {
      mockValid();
      render(<LicenseGuard><Child /></LicenseGuard>);
      expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
    });
  });
});
