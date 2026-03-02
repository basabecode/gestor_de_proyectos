import { useState } from 'react';
import { AlertTriangle, X, Clock } from 'lucide-react';
import { useLicense } from '@/hooks/useLicense';
import { cn } from '@/lib/utils';

/**
 * Banner que se muestra en la parte superior de la app cuando la licencia
 * está por vencer (≤ 14 días) o ya expiró.
 */
export default function LicenseBanner() {
  const { isValid, isExpired, isExpiringSoon, daysLeft } = useLicense();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (!isExpired && !isExpiringSoon) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2 text-white text-[12px] shrink-0',
        isExpired ? 'bg-status-red' : 'bg-status-orange'
      )}
    >
      {isExpired
        ? <AlertTriangle className="w-4 h-4 shrink-0" />
        : <Clock className="w-4 h-4 shrink-0" />
      }

      <p className="flex-1">
        {isExpired
          ? 'Tu licencia de prueba ha expirado. Contacta al soporte para renovarla y continuar usando Work OS.'
          : `Tu licencia de prueba vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}. Contacta soporte para extenderla.`
        }
      </p>

      <a
        href="mailto:soporte@workos.app?subject=Renovación%20de%20licencia"
        className="underline font-medium hover:opacity-80 transition-opacity whitespace-nowrap"
      >
        Contactar soporte
      </a>

      {!isExpired && (
        <button
          onClick={() => setDismissed(true)}
          className="p-0.5 hover:opacity-70 transition-opacity shrink-0"
          aria-label="Cerrar aviso"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
