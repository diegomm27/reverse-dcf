import React from 'react';
import { TrendingUp, BookOpen } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Lang } from '../i18n/translations';

interface HeaderProps {
  onHome: () => void;
}

const Header: React.FC<HeaderProps> = ({ onHome }) => {
  const { lang, setLang, t } = useLanguage();

  const toggleLang = () => setLang(lang === 'en' ? 'es' : 'en');

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={onHome}
          className="flex items-center gap-2.5 hover:opacity-70 transition-opacity duration-150 cursor-pointer"
        >
          <TrendingUp className="w-5 h-5 text-gray-900" />
          <span className="font-semibold text-gray-900 text-base tracking-tight">
            Reverse FCF
          </span>
        </button>

        <div className="flex items-center gap-4">
          {/* Expectation Investing link */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <BookOpen className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">
              {t.header.basedOn}{' '}
              <a
                href="https://www.expectationsinvesting.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 font-medium hover:text-gray-900 transition-colors duration-150 underline underline-offset-2 decoration-gray-300 hover:decoration-gray-500"
              >
                {t.header.bookLink}
              </a>
              <span className="text-gray-400 ml-1">{t.header.bookSubtitle}</span>
            </span>
          </div>

          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200
                       text-xs font-medium text-gray-500 hover:text-gray-900 hover:border-gray-300
                       transition-colors duration-150"
            title={lang === 'en' ? 'Cambiar a Español' : 'Switch to English'}
          >
            <span className={lang === 'en' ? 'text-gray-900' : 'text-gray-400'}>EN</span>
            <span className="text-gray-300">/</span>
            <span className={lang === 'es' ? 'text-gray-900' : 'text-gray-400'}>ES</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
