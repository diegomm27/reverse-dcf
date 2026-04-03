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
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
        <AlertCircle className="w-7 h-7 text-red-500" />
      </div>
      <div className="text-center max-w-md">
        <h3 className="text-gray-900 font-semibold text-lg mb-2">{t.error.title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{message}</p>
        <p className="text-gray-400 text-xs mt-2">{t.error.hint}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost flex items-center gap-2 mt-2">
          <RefreshCw className="w-4 h-4" />
          {t.error.retry}
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
