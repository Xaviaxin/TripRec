'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Language, translations, TranslationKeys } from '@/lib/i18n';

interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKeys) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('zh');

    useEffect(() => {
        const savedLang = localStorage.getItem('triprec_lang') as Language;
        if (savedLang && (savedLang === 'zh' || savedLang === 'en')) {
            setLanguage(savedLang);
        }
    }, []);

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('triprec_lang', lang);
    };

    const t = (key: TranslationKeys): string => {
        return translations[language][key] || translations['zh'][key] || key;
    };

    return (
        <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export const useI18n = () => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
};
