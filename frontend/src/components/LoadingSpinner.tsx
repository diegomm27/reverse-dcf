import React from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LoadingSpinnerProps {
  ticker: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ ticker }) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-20">
      <div className="card-section rounded-2xl p-5">
        <Loader2 className="h-8 w-8 animate-spin text-[color:var(--accent)]" />
      </div>
      <div className="text-center">
        <div className="font-mono text-2xl font-bold tracking-tight">{ticker}</div>
        <p className="mt-1.5 text-xs text-[color:var(--muted)]">{t.loading.fetchingData}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {t.loading.tags.map((tag) => (
            <span key={tag} className="accent-chip">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
