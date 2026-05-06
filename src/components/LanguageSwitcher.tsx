import React from 'react';
import { useLanguage, Language } from '@/contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const languages: { code: Language; label: string }[] = [
    { code: 'he', label: 'עב' },
    { code: 'en', label: 'EN' },
    { code: 'ar', label: 'عر' },
    { code: 'ru', label: 'РУ' },
  ];

  return (
    <div className="flex items-center gap-1 bg-secondary rounded-full p-1">
      {languages.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLanguage(code)}
          className={`lang-button ${language === code ? 'active' : ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
