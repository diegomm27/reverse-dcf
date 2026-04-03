import React from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LoadingSpinnerProps {
  ticker: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ ticker }) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
      <div className="text-center">
        <div className="font-mono text-2xl font-bold text-gray-900 mb-1">{ticker}</div>
        <p className="text-gray-400 text-sm">{t.loading.fetchingData}</p>
        <div className="mt-3 flex gap-2 justify-center">
          {t.loading.tags.map((s, i) => (
            <span
              key={s}
              className="px-2 py-0.5 text-xs bg-gray-50 border border-gray-200 rounded text-gray-400"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
