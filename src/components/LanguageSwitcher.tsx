'use client';

import { useI18n } from './I18nContext';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
    const { language, setLanguage } = useI18n();

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-surface)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)' }}>
            <Languages size={16} color="var(--color-text-muted)" />
            <button
                onClick={() => setLanguage('zh')}
                style={{
                    fontSize: '0.75rem',
                    fontWeight: language === 'zh' ? 700 : 400,
                    color: language === 'zh' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    padding: '0.15rem 0.25rem'
                }}
            >
                中文
            </button>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-border)' }}>|</span>
            <button
                onClick={() => setLanguage('en')}
                style={{
                    fontSize: '0.75rem',
                    fontWeight: language === 'en' ? 700 : 400,
                    color: language === 'en' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    padding: '0.15rem 0.25rem'
                }}
            >
                EN
            </button>
        </div>
    );
}
