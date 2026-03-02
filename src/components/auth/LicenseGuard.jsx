import { AlertTriangle, Lock, RefreshCw } from 'lucide-react';
import { useLicense } from '@/hooks/useLicense';
import { cn } from '@/lib/utils';

/**
 * LicenseGuard — bloquea UI si la licencia no está activa o si la feature
 * no está disponible en el plan actual.
 *
 * Uso:
 *   // Bloquear toda una página si la licencia expiró
 *   <LicenseGuard>
 *     <DashboardPage />
 *   </LicenseGuard>
 *
 *   // Bloquear una feature específica por plan
 *   <LicenseGuard feature="api_access">
 *     <ApiSettingsPanel />
 *   </LicenseGuard>
 */
export default function LicenseGuard({ children, feature = null }) {
  const { isValid, isExpired, isDisabled, canUseFeature, planLabel, daysLeft } = useLicense();

  // Licencia expirada o deshabilitada → bloqueo total
  if (!isValid) {
    return (
      <ExpiredScreen
        isDisabled={isDisabled}
        daysLeft={daysLeft}
      />
    );
  }

  // Feature no disponible en el plan actual
  if (feature && !canUseFeature(feature)) {
    return <FeatureLockedScreen feature={feature} planLabel={planLabel} />;
  }

  return children;
}

/* ── Pantalla: licencia expirada / deshabilitada ──────────────────────────── */
function ExpiredScreen({ isDisabled }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center bg-surface-secondary">
      <div className="w-16 h-16 rounded-full bg-status-red-light flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-status-red" />
      </div>

      <div>
        <h2 className="text-[20px] font-bold text-text-primary mb-2">
          {isDisabled ? 'Cuenta suspendida' : 'Licencia expirada'}
        </h2>
        <p className="text-[14px] text-text-secondary max-w-sm">
          {isDisabled
            ? 'Tu cuenta ha sido suspendida por el administrador. Contacta soporte para más información.'
            : 'Tu período de prueba gratuito de 90 días ha terminado. Contacta a soporte para renovar tu acceso.'}
        </p>
      </div>

      <a
        href="mailto:soporte@workos.app?subject=Renovación%20de%20licencia"
        className="px-6 py-2.5 bg-primary text-white rounded-lg text-[14px] font-semibold hover:bg-primary-hover transition-colors"
      >
        Contactar soporte
      </a>

      <p className="text-[11px] text-text-disabled">
        Tus datos están seguros y se conservarán durante el proceso de renovación.
      </p>
    </div>
  );
}

/* ── Pantalla: feature no disponible en el plan ───────────────────────────── */
function FeatureLockedScreen({ feature, planLabel }) {
  const FEATURE_LABELS = {
    advanced_analytics: 'Analíticas avanzadas',
    sso:               'Single Sign-On (SSO)',
    api_access:        'Acceso a la API',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center">
        <Lock className="w-6 h-6 text-text-disabled" />
      </div>
      <p className="text-[15px] font-semibold text-text-primary">
        {FEATURE_LABELS[feature] || 'Función no disponible'}
      </p>
      <p className="text-[12px] text-text-secondary max-w-xs">
        Esta función no está disponible en el plan <strong>{planLabel}</strong>.
        Contacta soporte para más información sobre planes avanzados.
      </p>
    </div>
  );
}
