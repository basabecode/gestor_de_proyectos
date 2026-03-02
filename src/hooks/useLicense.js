import useLicenseStore, { PLAN_LABELS } from '@/stores/licenseStore';

/**
 * Hook para verificar el estado de la licencia activa.
 *
 * Uso:
 *   const { isValid, isExpired, isExpiringSoon, daysLeft, canUseFeature } = useLicense();
 *
 *   // Bloquear funciones por plan
 *   if (!canUseFeature('api_access')) return <UpgradeBanner />;
 */
export function useLicense() {
  const {
    license,
    loading,
    isValid,
    daysLeft,
    isExpiringSoon,
    canUseFeature,
    plan,
    status,
    maxBoards,
    maxUsers,
  } = useLicenseStore();

  return {
    license,
    loading,

    // Estado
    isValid:        isValid(),
    isExpired:      !isValid() && status() === 'expired',
    isDisabled:     status() === 'disabled',
    isExpiringSoon: isExpiringSoon(),

    // Valores
    daysLeft:       daysLeft(),
    plan:           plan(),
    planLabel:      PLAN_LABELS[plan()] ?? plan(),
    status:         status(),
    maxBoards:      maxBoards(),
    maxUsers:       maxUsers(),

    // Feature gating
    canUseFeature,
  };
}
