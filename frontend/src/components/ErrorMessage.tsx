import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-14">
      <div className="danger-panel">
        <AlertCircle className="status-negative h-7 w-7" />
      </div>

      <div className="max-w-md text-center">
        <h3 className="text-lg font-bold tracking-tight">{t.error.title}</h3>
        <p className="mt-1.5 text-xs leading-6 text-[color:var(--muted)]">{message}</p>
        <p className="mt-1.5 text-[11px] text-[color:var(--muted-soft)]">{t.error.hint}</p>
      </div>

      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-ghost">
          <RefreshCw className="h-3.5 w-3.5" />
          {t.error.retry}
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
