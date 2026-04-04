import React from 'react';
import { TrendingUp, BookOpen } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface HeaderProps {
  onHome: () => void;
}

const Header: React.FC<HeaderProps> = ({ onHome }) => {
  const { lang, setLang, t } = useLanguage();

  return (
    <header className="header-shell sticky top-0 z-50 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          onClick={onHome}
          className="group flex items-center gap-2.5 transition-opacity duration-200 hover:opacity-80"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-strong)] text-white shadow-[0_0_20px_var(--accent-glow)]">
            <TrendingUp className="h-4 w-4" />
          </div>

          <div className="text-left">
            <div className="text-[9px] font-bold uppercase tracking-[0.28em] text-[color:var(--accent)]">
              Expectation Radar
            </div>
            <div className="text-sm font-bold tracking-tight text-[color:var(--text)]">
              Reverse FCF
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[color:var(--muted)] sm:flex">
            <BookOpen className="h-3.5 w-3.5 shrink-0 text-[color:var(--accent)]" />
            <span>
              {t.header.basedOn}{' '}
              <a
                href="https://www.expectationsinvesting.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[color:var(--text)] underline decoration-[var(--accent)]/30 underline-offset-2 transition-colors duration-200 hover:text-[color:var(--accent)]"
              >
                {t.header.bookLink}
              </a>{' '}
              <span className="text-[color:var(--muted-soft)]">{t.header.bookSubtitle}</span>
            </span>
          </div>

          <div className="flex rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0.5">
            <button
              onClick={() => setLang('en')}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-all duration-150 ${
                lang === 'en'
                  ? 'bg-[var(--accent-strong)] text-white shadow-[0_0_12px_var(--accent-glow)]'
                  : 'text-[color:var(--muted)] hover:text-[color:var(--text)]'
              }`}
              title="Switch to English"
              type="button"
            >
              EN
            </button>
            <button
              onClick={() => setLang('es')}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-all duration-150 ${
                lang === 'es'
                  ? 'bg-[var(--accent-strong)] text-white shadow-[0_0_12px_var(--accent-glow)]'
                  : 'text-[color:var(--muted)] hover:text-[color:var(--text)]'
              }`}
              title="Cambiar a Español"
              type="button"
            >
              ES
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
